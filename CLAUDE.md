# Azul Horizonte Boutique Hotel — Proyecto Final IA

Proyecto universitario (Universidad Mariano Gálvez) que integra un sitio web de hotel boutique con un agente de IA (Claude), Zapier y n8n para gestión de reservaciones.

## El Hotel (Dominio Ficticio)

**Nombre:** Azul Horizonte Boutique Hotel  
**Ubicación:** Playa Champerico, Retalhuleu, Guatemala — costa del Pacífico  
**Tagline:** *"Donde el Pacífico te abraza"*  
**Descripción:** Hotel boutique frente al mar de arena negra volcánica de Champerico. Ofrece experiencias premium íntimas para parejas y familias pequeñas.

### Habitaciones
| ID de habitación | Abreviación (payload) | Tipo | Precio/noche | Capacidad |
|---|---|---|---|---|
| `suite-vista-mar` | `SVM` | Suite Vista Mar | Q950 (~$120) | 1–2 personas |
| `suite-frente-mar` | `SFM` | Suite Frente al Mar | Q1,450 (~$180) | 2–3 personas |
| `suite-presidencial` | `SP` | Suite Presidencial | Q2,200 (~$280) | 2–6 personas |

### Servicios
- Cena romántica en la orilla (Q600/pareja)
- Tour de pesca artesanal (Q350/persona)
- Kayak y snorkel en el Pacífico (Q250/persona)
- Masajes y spa frente al mar (Q450/sesión)
- Reservaciones premium (transfers, decoración especial)

### Políticas
- Check-in: 3:00 PM | Check-out: 12:00 PM
- Cancelación gratuita hasta 48 horas antes del check-in
- Estancia mínima: 2 noches
- Desayuno buffet incluido en todas las suites
- No se permiten mascotas
- Capacidad máxima del hotel: 3 suites activas simultáneamente

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend/Backend | TanStack Start (React SSR, file-based routing) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS |
| Contenedores | Docker + docker-compose |
| Despliegue | Azure Container Apps |
| Agente IA | Claude API (`claude-sonnet-4-6`) con tool use |
| RAG | Retrieval por keywords sobre `/app/lib/knowledge/*.md` |
| Automatización 1 | Zapier (Custom Response webhook, plan de pago/trial) |
| Automatización 2 | n8n (contenedor Docker, workflows programados) |
| Calendario | Google Calendar API (vía `googleapis` en el backend + vía Zapier para crear eventos) |
| Correo | Gmail (vía Zapier y n8n) |
| Base de datos reservas | Google Sheets (vía Zapier) |

---

## Arquitectura del Sistema

```
Browser
  │
  ├─ Páginas estáticas (Home, Habitaciones, Servicios, FAQ)
  │
  └─ Chat Widget (React, estado local)
       │
       ├─ POST /api/chat ──────► Claude API
       │    ↑ chunks RAG del              ↓ texto + posible tool call
       │    knowledge/ relevantes    show_booking_form
       │                                  ↓
       │                        Frontend renderiza <BookingForm />
       │                        dentro del panel del chat
       │                                  ↓ submit del form
       └─ bookServerFn (server-side)
               │
               ▼
       google-calendar.ts
       isRoomAvailable(roomType, checkIn, checkOut)
       → Google Calendar API (Service Account)
       → busca eventos en calendario de esa habitación
               │
       ┌───────┴───────┐
    Disponible      No disponible
       │                │
  sendToZapier()   return {status:"unavailable"}
       │
       ▼
  Zapier Webhook
  (solo crea evento + Gmail + Sheets)
  return {status:"confirmed", bookingId}

n8n (contenedor)
  ├─ Workflow A: diario 8 AM    → Sheets → check-in mañana → email 24h + link cancelación
  ├─ Workflow B: cada 15 min    → Calendar → check-in en ~2h → email 2h
  ├─ Workflow C: webhook GET    → Sheets + Calendar → cancelar reserva → email + HTML
  ├─ Workflow D: form web       → Sheets + Calendar → modificar fechas → email
  └─ Workflow E: día 1 del mes  → Sheets → estadísticas → reporte email al admin
```

---

## Flujo del Agente de IA

1. Usuario abre el chat widget → Claude saluda y ofrece información del hotel
2. Claude responde preguntas usando contexto RAG (habitaciones, políticas, servicios)
3. Cuando el usuario expresa intención de reservar → Claude llama el tool `show_booking_form`
4. El frontend detecta la tool call y renderiza el formulario HTML dentro del chat
5. Usuario llena: nombre, correo, teléfono, fecha entrada, fecha salida, tipo habitación, huéspedes
6. Form llama `bookServerFn` → verifica disponibilidad con Google Calendar API (Service Account) → si está libre, llama Zapier
7. **Disponible** → Zapier crea evento en Calendar, envía correo, registra en Sheets → frontend muestra confirmación
8. **No disponible** → backend responde `{status:"unavailable"}` sin llamar Zapier → frontend muestra mensaje de rechazo

### Tool definitions (Claude)
```typescript
// El único tool que tiene el agente
{
  name: "show_booking_form",
  description: "Muestra el formulario de reservación al cliente cuando está listo para reservar",
  input_schema: { type: "object", properties: {}, required: [] }
}
```

---

## Estructura de Archivos

```
/
├── src/
│   ├── routes/
│   │   ├── __root.tsx              # Layout global; monta <ChatWidget />
│   │   ├── index.tsx               # Home — propuesta de valor
│   │   ├── habitaciones.tsx        # Tipos, precios, capacidad
│   │   ├── servicios.tsx           # Servicios y experiencias
│   │   └── faq.tsx                 # Preguntas frecuentes
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatWidget.tsx      # Botón flotante + panel deslizante
│   │   │   ├── ChatMessage.tsx     # Renderiza texto y BookingForm
│   │   │   └── BookingForm.tsx     # Formulario HTML embebido en el chat
│   │   └── layout/
│   │       ├── Header.tsx
│   │       └── Footer.tsx
│   └── lib/
│       ├── claude.ts               # buildSystemPrompt(), definición de tools
│       ├── rag.ts                  # retrieveContext(query) — keyword matching
│       ├── zapier.ts               # sendToZapier(data) — BookingData/BookingResult types
│       ├── google-calendar.ts      # isRoomAvailable() via Google Calendar API + Service Account
│       ├── server/
│       │   ├── bookFn.ts           # Server fn: verifica Calendar → llama Zapier
│       │   └── chatFn.ts           # Server fn: llama Claude API
│       └── knowledge/
│           ├── rooms.md            # Descripciones y precios de habitaciones
│           ├── policies.md         # Políticas del hotel
│           ├── services.md         # Servicios y experiencias
│           └── faq.md              # Preguntas frecuentes
├── Dockerfile
├── docker-compose.yml              # Servicios: app (3000) + n8n (5678)
├── .env.example
└── package.json
```

---

## Variables de Entorno

```bash
# .env
ANTHROPIC_API_KEY=                  # Claude API key
ZAPIER_WEBHOOK_URL=                 # URL del Catch Hook de Zapier

# Google Calendar — Service Account (JSON en una sola línea)
GOOGLE_SERVICE_ACCOUNT_KEY=         # {"type":"service_account","project_id":"...",...}
GOOGLE_CALENDAR_HOTEL=              # ID del calendario "hotel" (único calendario para todas las suites)
```

### n8n (docker-compose)
```bash
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=     # Definir en .env
```

---

## Docker Compose

```yaml
services:
  app:
    build: .
    ports: ["3000:3000"]
    env_file: .env

  n8n:
    image: n8nio/n8n
    ports: ["5678:5678"]
    volumes:
      - n8n_data:/home/node/.n8n
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}

volumes:
  n8n_data:
```

---

## Zapier — Configuración del Zap

**Trigger:** Webhooks by Zapier → Catch Hook (con "Custom Response" habilitado)

**Nota:** La verificación de disponibilidad ya NO ocurre en Zapier — la hace el backend con Google Calendar API. Zapier solo se llama cuando la habitación está disponible.

**Pasos del Zap (flujo lineal, termina en Sheets):**
1. Trigger: recibe JSON `{ name, email, phone, checkIn, checkOut, roomType, guests, bookingId }` donde `checkIn`/`checkOut` son ISO 8601 con offset Guatemala (`2026-06-10T15:00:00-06:00`) y `roomType` usa abreviaciones (`SVM` / `SFM` / `SP`). El `bookingId` es un UUID generado por el backend antes de llamar Zapier.
2. Formatter by Zapier → "Utilities" → "Lookup Table": mapea `roomType` a nombre completo
   - SVM → Suite Vista Mar | SFM → Suite Frente al Mar | SP → Suite Presidencial
3. Formatter by Zapier → "Date/Time" → "Format": formatea `checkIn` → `DD/MM/YYYY`
4. Formatter by Zapier → "Date/Time" → "Format": formatea `checkOut` → `DD/MM/YYYY`
5. Google Calendar → "Create Detailed Event" en el calendario **"hotel"**
   - Title: `Reservación - {{roomType}} - {{name}}`
   - Start: `{{checkIn}}` | End: `{{checkOut}}` | Timezone: `America/Guatemala`
6. Gmail → "Send Email" al `{{email}}` del huésped con confirmación (usa nombre completo de habitación y fechas formateadas)
7. Google Sheets → "Create Spreadsheet Row" en la hoja "Reservaciones" ← **fin del flujo**

**Notas:**
- No se usa Custom Response — el backend genera su propio `bookingId` (UUID) y lo devuelve al frontend sin esperar respuesta de Zapier
- La confirmación al huésped llega por correo (Gmail); la confirmación en pantalla la maneja el backend directamente

---

## n8n — Workflows

Todos los workflows están en `n8n-workflows/` e importables desde la UI de n8n.

### Variables de entorno requeridas por n8n
Configurar en **Settings → Environment Variables** dentro de n8n:

| Variable | Descripción |
|---|---|
| `GOOGLE_CALENDAR_ID` | Mismo valor que `GOOGLE_CALENDAR_HOTEL` del backend |
| `GOOGLE_SHEETS_ID` | ID del spreadsheet (visible en la URL de Google Sheets) |
| `ADMIN_EMAIL` | Correo del administrador para recibir reportes mensuales |
| `N8N_HOST` | URL pública de n8n (`http://localhost:5678` local / URL Azure en producción) |

### Workflow A — Recordatorio 24 horas antes (`reminder-24h.json`)
- Trigger: Schedule → cron `0 14 * * *` (8:00 AM Guatemala, UTC-6)
- Node 1: Google Sheets → leer todas las filas de "Reservaciones"
- Node 2: Code → filtrar `check_in == mañana AND status == confirmed AND reminder_24h != TRUE`
- Node 3: Gmail → enviar recordatorio con link de cancelación (`N8N_HOST/webhook/cancel-booking?id=...`)
- Node 4: Google Sheets → actualizar `reminder_24h = TRUE`

### Workflow B — Recordatorio 2 horas antes (`reminder-2h.json`)
- Trigger: Schedule → cada 15 minutos
- Node 1: Google Sheets → leer todas las filas de "Reservaciones"
- Node 2: Code → filtrar `status == confirmed AND reminder_2h != TRUE AND check_in ∈ [ahora, ahora+2h]`
- Node 3: Gmail → enviar recordatorio "Tu check-in es en 2 horas"
- Node 4: Google Sheets → actualizar `reminder_2h = TRUE`
- **Nota:** usa el flag `reminder_2h` en Sheets (no Google Calendar) para garantizar exactamente un email por reservación, sin importar cuántas veces corra el trigger en la ventana de 2h.

### Workflow C — Cancelación de reserva (`cancelacion.json`)
- Trigger: Webhook GET `/webhook/cancel-booking?id={booking_id}`
  - El link se incluye en el email de recordatorio 24h
- Node 1: Google Sheets → leer todas las filas
- Node 2: Code → buscar por `booking_id`; si no existe retorna `{ found: false }`
- Node 3: IF → `found == true AND status == confirmed`
  - **true**: Google Calendar (delete event) → Sheets (status=cancelled) → Gmail → HTML "Cancelación exitosa"
  - **false**: HTML "Enlace no válido"

### Workflow D — Modificación de reserva (`modificacion.json`)
- Trigger: Form Trigger en `/form/modify-booking`
  - Campos: ID de Reservación, nueva fecha check-in, nueva fecha check-out
- Node 1: Code → validar formato de fechas e ISO 8601 con offset Guatemala
- Node 2: Google Sheets → buscar la reservación por `booking_id`
- Node 3: IF → `found == true AND status == confirmed`
  - **true**: Google Calendar (delete old event) → Google Calendar (create new event) → Sheets (actualizar fechas, `calendar_event_id`, `status=modified`, resetear flags de recordatorio) → Gmail
  - **false**: termina sin acción

### Workflow E — Reporte mensual (`reporte-mensual.json`)
- Trigger: Schedule → cron `0 13 1 * *` (7:00 AM Guatemala el día 1 de cada mes)
- Node 1: Google Sheets → leer todas las filas
- Node 2: Code → filtrar reservas del mes anterior; calcular totales por tipo de suite, noches, ingresos estimados (Q)
- Node 3: Gmail → enviar HTML con tabla de estadísticas a `ADMIN_EMAIL`

---

## Google Sheets — Esquema de la Hoja "Reservaciones"

| Columna | Tipo | Notas |
|---|---|---|
| booking_id | string | UUID generado por el backend y enviado a Zapier en el payload |
| name | string | |
| email | string | |
| phone | string | |
| check_in | date | YYYY-MM-DD |
| check_out | date | YYYY-MM-DD |
| room_type | string | `SVM` / `SFM` / `SP` |
| guests | number | |
| status | string | `confirmed` / `cancelled` / `modified` |
| calendar_event_id | string | ID del evento en Google Calendar; guardado por Zapier al crear el evento |
| reminder_24h | boolean | |
| reminder_2h | boolean | |
| created_at | datetime | |

---

## RAG — Base de Conocimiento

El RAG es simple: `retrieveContext(query)` en `app/lib/rag.ts` hace keyword matching sobre los archivos `.md` del directorio `knowledge/`, selecciona los chunks más relevantes y los inyecta en el system prompt de Claude antes de cada llamada. No se usa base de datos vectorial externa.

Los archivos `.md` son la fuente de verdad para todo lo que el agente sabe del hotel. Si se cambia una política o precio, solo se actualiza el `.md` correspondiente.

---

## Convenciones de Desarrollo

- Todos los API keys y URLs externas van en `.env`, nunca hardcodeados
- Los API routes (`/api/*`) son server-only: las variables de entorno sensibles no llegan al browser
- El historial de conversación del chat se mantiene en estado React del cliente (`useState`)
- El `roomType` usa abreviaciones en todo el sistema: `SVM` / `SFM` / `SP`
- `checkIn` y `checkOut` viajan como ISO 8601 con offset Guatemala: `2026-06-10T15:00:00-06:00`
- La verificación de disponibilidad ocurre en `google-calendar.ts` (backend) **antes** de llamar Zapier; Zapier nunca recibe una reservación no disponible
- Se usa **un único calendario** llamado "hotel"; el backend lo referencia con la var `GOOGLE_CALENDAR_HOTEL`
- Los títulos de eventos en Calendar siguen el formato `Reservación - {{roomType}} - {{name}}`

---

## Comandos Útiles

```bash
# Desarrollo local (sin Docker)
npm run dev

# Construir y levantar con Docker Compose
docker-compose up --build

# Solo la app
docker-compose up app

# Acceder a n8n
# http://localhost:5678
```

---

## Despliegue en Azure Container Apps

1. Construir imagen: `docker build -t azul-horizonte-app .`
2. Push a Azure Container Registry: `az acr build ...`
3. Crear Container App Environment
4. Deploy app container (ingress público, puerto 3000)
5. Deploy n8n container (ingress interno, puerto 5678)
6. Configurar variables de entorno en Azure Portal o con `az containerapp update --set-env-vars`
