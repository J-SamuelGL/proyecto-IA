# n8n Workflows — Azul Horizonte Boutique Hotel

Estos dos workflows envían recordatorios automáticos por Gmail a los huéspedes
antes de su check-in. Se ejecutan dentro del contenedor n8n definido en
`docker-compose.yml`.

## Cómo importar los workflows

1. Levanta el stack: `docker-compose up -d`
2. Abre n8n en http://localhost:5678 (usuario/contraseña del `.env`)
3. En el menú lateral elige **Workflows → Import from File**
4. Importa `reminder-24h.json` y luego `reminder-2h.json`
5. Configura las credenciales (ver sección siguiente)
6. Activa cada workflow con el toggle **Active**

## Credenciales necesarias en n8n

### Google Calendar
- Tipo: **Google Calendar (Service Account)**
- Variable de entorno en el nodo: `GOOGLE_CALENDAR_ID` con el ID del calendario
  de reservaciones (p. ej. `reservaciones@azulhorizonte.com`)

### Gmail
- Tipo: **Gmail (OAuth2)**
- Cuenta: `reservaciones@azulhorizonte.com`
- Scopes requeridos: `https://mail.google.com/`

## Formato de los eventos de Google Calendar

El Zap de Zapier crea eventos con este formato en la descripción:

```
nombre: Juan García
email: juan@email.com
telefono: +502 5555-1234
habitacion: Suite Vista Mar
huespedes: 2
reservaId: AH-1716120000000
```

Los workflows extraen cada campo usando `split()` sobre saltos de línea.

## Lógica de cada workflow

| Workflow | Trigger | Ventana de búsqueda | Acción |
|---|---|---|---|
| `reminder-24h.json` | Cada 1 hora | check-in entre +23h y +25h | Email recordatorio 24h |
| `reminder-2h.json` | Cada 15 min | check-in entre +1h45m y +2h15m | Email recordatorio 2h |

## Zona horaria

Los contenedores usan `GENERIC_TIMEZONE=America/Guatemala` (UTC-6, sin DST).
