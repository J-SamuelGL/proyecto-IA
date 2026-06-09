# Azul Horizonte Boutique Hotel

> *"Donde el Pacífico te abraza"*

Proyecto final universitario (Universidad Mariano Gálvez) — integración de un sitio web de hotel boutique con un agente de IA (Claude), Zapier y n8n para gestión automatizada de reservaciones.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend/Backend | TanStack Start (React SSR, file-based routing) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS |
| Contenedores | Docker + docker-compose |
| Agente IA | Claude API (`claude-sonnet-4-6`) con tool use |
| RAG | Keyword matching sobre `/app/lib/knowledge/*.md` |
| Automatización 1 | Zapier (webhook → Calendar + Gmail + Sheets) |
| Automatización 2 | n8n (workflows programados) |
| Calendario | Google Calendar API (Service Account) |
| Base de datos | Google Sheets |

---

## Arquitectura

```
Browser
  └─ Chat Widget
       └─ POST /api/chat ──► Claude API
                                 ↓ tool call: show_booking_form
                         <BookingForm /> dentro del chat
                                 ↓ submit
                         bookServerFn (server-side)
                                 ↓
                         google-calendar.ts → isRoomAvailable()
                         ┌──────────────────────┐
                      Disponible           No disponible
                         ↓                      ↓
                    sendToZapier()        {status:"unavailable"}
                         ↓
                    Zapier Webhook
                    (Calendar + Gmail + Sheets)
                    {status:"confirmed", bookingId}

n8n
  ├─ Reminder 24h  → email con link de cancelación
  ├─ Reminder 2h   → email de check-in próximo
  ├─ Cancelación   → webhook GET → borra evento + actualiza Sheets
  ├─ Modificación  → form web → actualiza fechas en Calendar y Sheets
  └─ Reporte mes   → estadísticas → email al admin
```

---

## Variables de Entorno

Copia `.env.example` a `.env` y completa los valores:

```bash
ANTHROPIC_API_KEY=          # Claude API key
ZAPIER_WEBHOOK_URL=         # URL del Catch Hook de Zapier

# Google Calendar — Service Account (JSON en una sola línea)
GOOGLE_SERVICE_ACCOUNT_KEY= # {"type":"service_account",...}
GOOGLE_CALENDAR_HOTEL=      # ID del calendario "hotel"

# n8n
N8N_PASSWORD=               # Contraseña para la UI de n8n
```

---

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Tests
npm run test
```

## Docker Compose

```bash
# Levantar app (puerto 3000) + n8n (puerto 5678)
docker-compose up --build

# Solo la app
docker-compose up app
```

Acceder a n8n: `http://localhost:5678` (usuario: `admin`, contraseña: valor de `N8N_PASSWORD`)

---

## Importar Workflows de n8n

Los workflows están en `n8n-workflows/`. Desde la UI de n8n:

1. **Settings → Import** → seleccionar cada archivo `.json`
2. Configurar en **Settings → Environment Variables**:

| Variable | Descripción |
|---|---|
| `GOOGLE_CALENDAR_ID` | Mismo valor que `GOOGLE_CALENDAR_HOTEL` |
| `GOOGLE_SHEETS_ID` | ID del spreadsheet de reservaciones |
| `ADMIN_EMAIL` | Correo del administrador |
| `N8N_HOST` | URL pública de n8n |

---

## Estructura del Proyecto

```
src/
├── routes/
│   ├── __root.tsx          # Layout global con ChatWidget
│   ├── index.tsx           # Home
│   ├── habitaciones.tsx    # Tipos y precios
│   ├── servicios.tsx       # Servicios del hotel
│   └── faq.tsx
├── components/
│   ├── chat/
│   │   ├── ChatWidget.tsx
│   │   ├── ChatMessage.tsx
│   │   └── BookingForm.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Footer.tsx
└── lib/
    ├── claude.ts           # System prompt y tools
    ├── rag.ts              # retrieveContext() — keyword matching
    ├── zapier.ts           # sendToZapier()
    ├── google-calendar.ts  # isRoomAvailable()
    ├── server/
    │   ├── bookFn.ts       # Verifica disponibilidad → llama Zapier
    │   └── chatFn.ts       # Llama Claude API
    └── knowledge/          # Base de conocimiento para RAG
        ├── rooms.md
        ├── policies.md
        ├── services.md
        └── faq.md
```

---

## Habitaciones

| Tipo | Abrev. | Precio/noche | Capacidad |
|---|---|---|---|
| Suite Vista Mar | `SVM` | Q950 | 1–2 personas |
| Suite Frente al Mar | `SFM` | Q1,450 | 2–3 personas |
| Suite Presidencial | `SP` | Q2,200 | 2–6 personas |

---

## Despliegue en Azure Container Apps

```bash
# Build y push a Azure Container Registry
docker build -t azul-horizonte-app .
az acr build ...

# Deploy (puerto 3000 público, n8n interno)
az containerapp create ...
```
