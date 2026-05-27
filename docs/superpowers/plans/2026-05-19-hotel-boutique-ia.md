# Azul Horizonte Boutique Hotel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a hotel boutique website with AI chat agent (Claude + RAG), embedded booking form, Zapier webhook integration, and n8n Docker container for automated reminders.

**Architecture:** TanStack Start handles SSR pages and REST API routes (`/api/chat`, `/api/book`). Claude API (with tool use) powers the chat agent; the `show_booking_form` tool triggers an HTML form embedded in the chat widget. Zapier (Custom Response webhook) checks Google Calendar availability and handles post-booking actions. N8n runs as a Docker container for scheduled reminder emails. All external calls have mock fallbacks so the app runs fully without API keys.

**Tech Stack:** TanStack Start 1.x, React 19, TypeScript 5, Tailwind CSS 4, Vitest 2, @anthropic-ai/sdk, Docker + docker-compose, n8n

---

## Nota de Scope

Este proyecto tiene dos subsistemas que se construyen juntos de forma incremental:
1. **Foundation** (Tasks 1–3): Scaffold, Tailwind, knowledge base
2. **AI + Booking** (Tasks 4–11): RAG, Claude, Zapier, Chat widget, BookingForm
3. **Pages + Deploy** (Tasks 12–20): Páginas estáticas, Docker, n8n

---

## File Map

```
/
├── app/
│   ├── routes/
│   │   ├── __root.tsx              # Root layout — monta ChatWidget
│   │   ├── index.tsx               # Home page
│   │   ├── habitaciones.tsx        # Rooms page
│   │   ├── servicios.tsx           # Services page
│   │   ├── faq.tsx                 # FAQ page
│   │   └── api/
│   │       ├── chat.ts             # POST /api/chat → Claude
│   │       └── book.ts             # POST /api/book → Zapier
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatWidget.tsx      # Floating button + sliding panel
│   │   │   ├── ChatMessage.tsx     # Text messages + tool call rendering
│   │   │   └── BookingForm.tsx     # Form embedded inside chat
│   │   └── layout/
│   │       ├── Header.tsx
│   │       └── Footer.tsx
│   ├── lib/
│   │   ├── claude.ts               # buildSystemPrompt(), chat(), mock mode
│   │   ├── rag.ts                  # retrieveContext() — keyword retrieval
│   │   ├── zapier.ts               # sendToZapier() — webhook client, mock mode
│   │   └── knowledge/
│   │       ├── rooms.md
│   │       ├── policies.md
│   │       ├── services.md
│   │       └── faq.md
│   ├── router.tsx
│   ├── client.tsx
│   └── ssr.tsx
├── tests/
│   ├── lib/
│   │   ├── rag.test.ts
│   │   ├── claude.test.ts
│   │   └── zapier.test.ts
│   └── components/
│       └── BookingForm.test.tsx
├── n8n-workflows/
│   ├── reminder-24h.json
│   └── reminder-2h.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── vitest.config.ts
└── app.config.ts                   # TanStack Start + Tailwind vite plugin
```

---

## Task 1: Scaffold TanStack Start project

**Files:**
- Create: `package.json`, `app.config.ts`, `app/router.tsx`, `app/client.tsx`, `app/ssr.tsx`, `app/routes/__root.tsx`, `app/routes/index.tsx`

- [ ] **Step 1: Run scaffolding CLI**

```bash
npx create-tsrouter-app@latest . --template start --framework react --package-manager npm
```

Si el CLI dice que el directorio no está vacío (existe CLAUDE.md), mueve CLAUDE.md temporalmente, ejecuta el comando, y vuelve a moverlo.

Expected: Estructura de proyecto TanStack Start generada, `node_modules/` instalado.

- [ ] **Step 2: Verificar que el servidor de desarrollo inicia**

```bash
npm run dev
```

Expected: servidor corriendo en `http://localhost:3000` con una página de bienvenida de TanStack Start.

- [ ] **Step 3: Instalar dependencias adicionales**

```bash
npm install @anthropic-ai/sdk
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @tailwindcss/vite tailwindcss vite-tsconfig-paths
```

Expected: `package.json` actualizado, sin errores de instalación.

- [ ] **Step 4: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold TanStack Start project"
```

---

## Task 2: Configurar Tailwind CSS v4 + Vitest

**Files:**
- Modify: `app.config.ts`
- Create: `app/styles/globals.css`, `vitest.config.ts`
- Modify: `app/routes/__root.tsx` (importar CSS global)

- [ ] **Step 1: Actualizar `app.config.ts` para incluir el plugin de Tailwind**

```typescript
// app.config.ts
import { defineConfig } from '@tanstack/start/config'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  vite: {
    plugins: [tailwindcss(), tsconfigPaths()]
  }
})
```

- [ ] **Step 2: Crear `app/styles/globals.css`**

```css
/* app/styles/globals.css */
@import "tailwindcss";

@layer base {
  * {
    box-sizing: border-box;
  }
  html {
    scroll-behavior: smooth;
  }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    color: #1a1a2e;
    background-color: #f8fafc;
  }
}
```

- [ ] **Step 3: Importar globals.css en `__root.tsx`**

Encuentra la función `RootDocument` (o el componente raíz) en `app/routes/__root.tsx` y agrega el import del CSS. El archivo varía según la versión generada, pero el patrón es:

```typescript
// Al inicio de app/routes/__root.tsx, agrega:
import '../styles/globals.css'
```

- [ ] **Step 4: Crear `vitest.config.ts`**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}']
  }
})
```

- [ ] **Step 5: Verificar que Tailwind funciona**

En `app/routes/index.tsx` agrega temporalmente una clase de prueba: `<h1 className="text-blue-600 text-3xl font-bold">Test</h1>`. Visita `http://localhost:3000` — el texto debe aparecer azul y grande.

- [ ] **Step 6: Commit**

```bash
git add app.config.ts app/styles/globals.css app/routes/__root.tsx vitest.config.ts
git commit -m "feat: configure Tailwind CSS v4 and Vitest"
```

---

## Task 3: Crear knowledge base del hotel

**Files:**
- Create: `app/lib/knowledge/rooms.md`, `app/lib/knowledge/policies.md`, `app/lib/knowledge/services.md`, `app/lib/knowledge/faq.md`

- [ ] **Step 1: Crear `app/lib/knowledge/rooms.md`**

```markdown
# Habitaciones — Azul Horizonte Boutique Hotel

## Suite Vista Mar
- Precio: Q950 por noche (~$120 USD)
- Capacidad: 1 a 2 personas
- Descripción: Suite íntima con ventanales que enmarcan el horizonte del Pacífico. Cama king size, terraza privada, baño con ducha de lluvia. Perfecta para parejas.
- ID de reserva: suite-vista-mar

## Suite Frente al Mar
- Precio: Q1,450 por noche (~$180 USD)
- Capacidad: 2 a 3 personas
- Descripción: Suite espaciosa con acceso directo a la playa de arena negra. Sala de estar, cama king size, cama individual adicional, jacuzzi privado exterior.
- ID de reserva: suite-frente-mar

## Suite Presidencial
- Precio: Q2,200 por noche (~$280 USD)
- Capacidad: 2 a 6 personas
- Descripción: La experiencia definitiva frente al Pacífico. Dos habitaciones, sala comedor, cocina equipada, terraza panorámica de 180°, servicio de mayordomo incluido.
- ID de reserva: suite-presidencial

## Incluido en todas las suites
- Desayuno buffet chapín: huevos al gusto, tamales, frutas tropicales, jugo de naranja natural
- WiFi de alta velocidad
- Aire acondicionado y ventiladores de techo
- Amenidades de baño premium
- Servicio de limpieza diario
- Estacionamiento privado y seguro
```

- [ ] **Step 2: Crear `app/lib/knowledge/policies.md`**

```markdown
# Políticas — Azul Horizonte Boutique Hotel

## Check-in y Check-out
- Check-in: 3:00 PM (15:00 hrs)
- Check-out: 12:00 PM (mediodía)
- Early check-in sujeto a disponibilidad (Q200 adicional)
- Late check-out hasta 2:00 PM sujeto a disponibilidad (Q200 adicional)

## Cancelación y Modificación
- Cancelación gratuita hasta 48 horas antes del check-in
- Cancelaciones con menos de 48 horas: se cobra el 50% del costo total
- No-show (no presentarse): se cobra el 100% de la primera noche
- Modificaciones de fecha sujetas a disponibilidad, sin costo si se notifica con 72h de antelación

## Políticas Generales
- Estancia mínima: 2 noches
- No se permiten mascotas
- El hotel es para uso exclusivo de adultos y familias; no se permiten eventos o fiestas sin autorización
- Capacidad máxima: 3 suites activas simultáneamente
- Se requiere tarjeta de crédito o depósito del 50% para confirmar reservación
- El hotel no se responsabiliza por objetos de valor no depositados en la caja fuerte

## Pago
- Aceptamos: efectivo (Quetzales y Dólares), Visa, Mastercard
- No se aceptan cheques
- El saldo restante se cancela al momento del check-in
```

- [ ] **Step 3: Crear `app/lib/knowledge/services.md`**

```markdown
# Servicios y Experiencias — Azul Horizonte Boutique Hotel

## Gastronomía
### Cena Romántica en la Orilla
- Precio: Q600 por pareja
- Mesa privada a la orilla del Pacífico, con antorchas y decoración floral
- Menú de 4 tiempos con mariscos frescos del día y vinos selectos
- Reservación con 24 horas de anticipación

### Desayuno en la Terraza
- Incluido con todas las suites
- Buffet chapín y continental de 7:00 AM a 11:00 AM

## Tours Acuáticos
### Pesca Artesanal Tradicional
- Precio: Q350 por persona
- Salida a las 5:30 AM con pescadores locales de Champerico
- Duración: 4 horas en el Pacífico
- Incluye: equipo de pesca, chaleco, snacks a bordo

### Kayak y Snorkel en el Pacífico
- Precio: Q250 por persona
- Duración: 2.5 horas
- Equipo incluido: kayak doble, máscara, aletas
- Apto para principiantes; guía certificado incluido

### Avistamiento de Tortugas (temporada Jul–Nov)
- Precio: Q180 por persona
- Salida nocturna para ver el desove de tortugas golfinas
- Guía naturalista certificado, máximo 8 personas por grupo

## Bienestar
### Masaje Terapéutico Frente al Mar
- Precio: Q450 por sesión (60 min)
- Masaje sueco o de tejido profundo en la terraza con vista al Pacífico
- Reservación con 4 horas de anticipación

## Reservaciones Premium
- Decoración especial de habitación (flores, velas, pétalos): Q300
- Traslado desde/hacia Ciudad de Guatemala o Retalhuleu: Q400 por viaje
- Picnic privado en la playa: Q500 por pareja
```

- [ ] **Step 4: Crear `app/lib/knowledge/faq.md`**

```markdown
# Preguntas Frecuentes — Azul Horizonte Boutique Hotel

## ¿Dónde está ubicado el hotel?
Estamos en Playa Champerico, Retalhuleu, Guatemala, en la costa del Océano Pacífico. Champerico es conocida por su arena negra volcánica, única en el mundo, y sus espectaculares atardeceres sobre el Pacífico. Estamos a 3 horas de Ciudad de Guatemala y 45 minutos de Retalhuleu.

## ¿Cómo llego al hotel?
- Desde Ciudad de Guatemala: tomar la ruta al Pacífico hacia Mazatenango, luego a Retalhuleu, y seguir hacia Champerico. Total: ~3 horas en carro.
- Ofrecemos servicio de traslado privado desde Ciudad de Guatemala o Retalhuleu (Q400 por viaje).

## ¿El desayuno está incluido?
Sí, todas nuestras suites incluyen desayuno buffet todos los días de 7:00 AM a 11:00 AM. Ofrecemos opciones chapinas y continentales.

## ¿Tienen piscina?
Sí, contamos con una piscina infinita con vista directa al Pacífico, disponible de 7:00 AM a 9:00 PM. El acceso a la playa de arena negra también es gratuito para los huéspedes.

## ¿El WiFi es gratuito?
Sí, WiFi de alta velocidad en todas las áreas del hotel, incluidas las habitaciones y la piscina.

## ¿Puedo hacer una reservación para el mismo día?
Sujeto a disponibilidad. Te recomendamos reservar con al menos 2-3 días de anticipación para garantizar tu suite preferida.

## ¿Qué pasa si necesito cancelar?
Cancela gratis hasta 48 horas antes de tu check-in. Después de ese plazo se cobra el 50% del total. Ver políticas completas de cancelación.

## ¿El hotel es apropiado para familias con niños?
Sí, la Suite Presidencial es ideal para familias, con capacidad para hasta 6 personas y cocina equipada. Ofrecemos cuna sin costo adicional (sujeto a disponibilidad).

## ¿Hay estacionamiento?
Sí, estacionamiento privado y vigilado sin costo para huéspedes.

## ¿Cómo funciona la reservación con el agente de IA?
Chatea con Azul, nuestro asistente virtual. Cuando estés listo para reservar, te mostrará un formulario. Completa tus datos, y recibirás confirmación por correo electrónico en minutos.
```

- [ ] **Step 5: Commit**

```bash
git add app/lib/knowledge/
git commit -m "feat: add hotel knowledge base for RAG"
```

---

## Task 4: Implementar módulo RAG + tests

**Files:**
- Create: `app/lib/rag.ts`, `tests/lib/rag.test.ts`

- [ ] **Step 1: Escribir los tests primero**

```typescript
// tests/lib/rag.test.ts
import { describe, it, expect } from 'vitest'
import { retrieveContext } from '../../app/lib/rag'

describe('retrieveContext', () => {
  it('returns a non-empty string for any query', () => {
    const result = retrieveContext('hola')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns room info when queried about habitaciones', () => {
    const result = retrieveContext('cuánto cuesta la habitación suite precio')
    expect(result.toLowerCase()).toContain('suite')
  })

  it('returns policy info when queried about cancelación', () => {
    const result = retrieveContext('cancelación política reembolso')
    expect(result.toLowerCase()).toContain('cancelaci')
  })

  it('returns services info when queried about tours', () => {
    const result = retrieveContext('tour kayak pesca actividades')
    expect(result.toLowerCase()).toContain('tour')
  })

  it('returns all knowledge when no keywords match (at least 200 chars)', () => {
    const result = retrieveContext('xyzxyzxyz')
    expect(result.length).toBeGreaterThan(200)
  })

  it('does not exceed 4000 characters to stay within token limits', () => {
    const result = retrieveContext('hotel información general todo')
    expect(result.length).toBeLessThan(4000)
  })
})
```

- [ ] **Step 2: Ejecutar tests y verificar que FALLAN**

```bash
npx vitest run tests/lib/rag.test.ts
```

Expected: FAIL — `Cannot find module '../../app/lib/rag'`

- [ ] **Step 3: Implementar `app/lib/rag.ts`**

```typescript
// app/lib/rag.ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

interface KnowledgeChunk {
  source: string
  content: string
}

function loadKnowledge(): KnowledgeChunk[] {
  const knowledgeDir = join(process.cwd(), 'app/lib/knowledge')
  const files = ['rooms.md', 'policies.md', 'services.md', 'faq.md']

  return files.map((file) => ({
    source: file.replace('.md', ''),
    content: readFileSync(join(knowledgeDir, file), 'utf-8'),
  }))
}

const CHUNKS: KnowledgeChunk[] = loadKnowledge()
const MAX_CONTEXT_CHARS = 3800

export function retrieveContext(query: string): string {
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)

  if (queryWords.length === 0) {
    return CHUNKS.map((c) => c.content)
      .join('\n\n---\n\n')
      .slice(0, MAX_CONTEXT_CHARS)
  }

  const scored = CHUNKS.map((chunk) => {
    const contentLower = chunk.content.toLowerCase()
    const score = queryWords.reduce(
      (acc, word) => acc + (contentLower.includes(word) ? 1 : 0),
      0,
    )
    return { ...chunk, score }
  })

  const relevant = scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)

  const source = relevant.length > 0 ? relevant : CHUNKS
  return source
    .map((c) => c.content)
    .join('\n\n---\n\n')
    .slice(0, MAX_CONTEXT_CHARS)
}
```

- [ ] **Step 4: Ejecutar tests y verificar que PASAN**

```bash
npx vitest run tests/lib/rag.test.ts
```

Expected: 6 tests passing.

- [ ] **Step 5: Commit**

```bash
git add app/lib/rag.ts tests/lib/rag.test.ts
git commit -m "feat: add RAG keyword retrieval module with tests"
```

---

## Task 5: Implementar cliente de Claude + mock mode + tests

**Files:**
- Create: `app/lib/claude.ts`, `tests/lib/claude.test.ts`

- [ ] **Step 1: Escribir los tests**

```typescript
// tests/lib/claude.test.ts
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, getMockResponse } from '../../app/lib/claude'

describe('buildSystemPrompt', () => {
  it('includes the hotel name', () => {
    const result = buildSystemPrompt('contexto de prueba')
    expect(result).toContain('Azul Horizonte')
  })

  it('includes Champerico location', () => {
    const result = buildSystemPrompt('')
    expect(result).toContain('Champerico')
  })

  it('includes the provided context', () => {
    const context = 'Suite Vista Mar Q950 por noche'
    const result = buildSystemPrompt(context)
    expect(result).toContain(context)
  })
})

describe('getMockResponse', () => {
  it('returns showBookingForm=true for booking intent', () => {
    const result = getMockResponse('quiero hacer una reserva')
    expect(result.showBookingForm).toBe(true)
    expect(result.text.length).toBeGreaterThan(0)
  })

  it('returns room info for habitaciones query', () => {
    const result = getMockResponse('qué habitaciones tienen disponibles')
    expect(result.showBookingForm).toBe(false)
    expect(result.text.toLowerCase()).toContain('suite')
  })

  it('returns greeting for hola', () => {
    const result = getMockResponse('hola')
    expect(result.showBookingForm).toBe(false)
    expect(result.text).toContain('Bienvenido')
  })

  it('always returns an object with text and showBookingForm', () => {
    const result = getMockResponse('pregunta aleatoria xyz')
    expect(result).toHaveProperty('text')
    expect(result).toHaveProperty('showBookingForm')
    expect(typeof result.text).toBe('string')
    expect(typeof result.showBookingForm).toBe('boolean')
  })
})
```

- [ ] **Step 2: Ejecutar tests — verificar que FALLAN**

```bash
npx vitest run tests/lib/claude.test.ts
```

Expected: FAIL — `Cannot find module '../../app/lib/claude'`

- [ ] **Step 3: Implementar `app/lib/claude.ts`**

```typescript
// app/lib/claude.ts
import Anthropic from '@anthropic-ai/sdk'
import { retrieveContext } from './rag'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  text: string
  showBookingForm: boolean
}

const SHOW_BOOKING_FORM_TOOL: Anthropic.Tool = {
  name: 'show_booking_form',
  description:
    'Muestra el formulario de reservación al cliente. Úsalo ÚNICAMENTE cuando el cliente haya expresado claramente que desea hacer una reservación y esté listo para proporcionar sus datos personales.',
  input_schema: {
    type: 'object' as const,
    properties: {},
    required: [],
  },
}

export function buildSystemPrompt(context: string): string {
  return `Eres Azul, el asistente virtual del Azul Horizonte Boutique Hotel en Playa Champerico, Retalhuleu, Guatemala. Eres amable, profesional y conoces todos los detalles del hotel.

INFORMACIÓN DEL HOTEL:
${context}

INSTRUCCIONES:
- Saluda calurosamente usando "¡Bienvenido al Azul Horizonte Boutique Hotel!"
- Responde preguntas sobre habitaciones, servicios, ubicación y políticas usando la información anterior
- Cuando el cliente confirme que desea hacer una reservación, usa el tool show_booking_form
- No inventes información que no esté en el contexto
- Responde siempre en el idioma del cliente (español o inglés)
- Sé conciso: máximo 4 párrafos por respuesta
- No menciones que eres una IA a menos que te lo pregunten directamente`
}

export async function chat(
  messages: ChatMessage[],
  userMessage: string,
): Promise<ChatResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return getMockResponse(userMessage)
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const context = retrieveContext(userMessage)
  const systemPrompt = buildSystemPrompt(context)

  const allMessages: Anthropic.MessageParam[] = [
    ...messages.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ]

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    tools: [SHOW_BOOKING_FORM_TOOL],
    messages: allMessages,
  })

  let text = ''
  let showBookingForm = false

  for (const block of response.content) {
    if (block.type === 'text') text += block.text
    if (block.type === 'tool_use' && block.name === 'show_booking_form') {
      showBookingForm = true
    }
  }

  return { text, showBookingForm }
}

export function getMockResponse(userMessage: string): ChatResponse {
  const lower = userMessage.toLowerCase()

  if (
    lower.includes('reserva') ||
    lower.includes('reservar') ||
    lower.includes('book') ||
    lower.includes('quiero una habitación') ||
    lower.includes('me gustaría hospedarme')
  ) {
    return {
      text: '¡Con mucho gusto te ayudo con tu reservación! Por favor completa el siguiente formulario con tus datos y verificaremos la disponibilidad de inmediato. 🌊',
      showBookingForm: true,
    }
  }

  if (
    lower.includes('habitac') ||
    lower.includes('suite') ||
    lower.includes('cuarto') ||
    lower.includes('room')
  ) {
    return {
      text: 'Contamos con tres suites frente al Pacífico:\n\n🌊 **Suite Vista Mar** — Q950/noche · hasta 2 personas\n🌅 **Suite Frente al Mar** — Q1,450/noche · hasta 3 personas\n👑 **Suite Presidencial** — Q2,200/noche · hasta 6 personas\n\nTodas incluyen desayuno buffet y WiFi. ¿Te gustaría más detalles o hacer una reservación?',
      showBookingForm: false,
    }
  }

  if (
    lower.includes('precio') ||
    lower.includes('costo') ||
    lower.includes('cuánto') ||
    lower.includes('tarifa')
  ) {
    return {
      text: 'Nuestras tarifas por noche incluyen desayuno:\n• Suite Vista Mar: **Q950** (~$120)\n• Suite Frente al Mar: **Q1,450** (~$180)\n• Suite Presidencial: **Q2,200** (~$280)\n\n¿Deseas hacer una reservación?',
      showBookingForm: false,
    }
  }

  if (lower.includes('servicio') || lower.includes('tour') || lower.includes('actividad')) {
    return {
      text: 'Ofrecemos experiencias únicas en Champerico:\n\n🎣 Tour de pesca artesanal — Q350/persona\n🚣 Kayak y snorkel — Q250/persona\n🐢 Avistamiento de tortugas (jul–nov) — Q180/persona\n💆 Masaje frente al mar — Q450/sesión\n🍽️ Cena romántica en la orilla — Q600/pareja\n\n¿Te interesa alguna experiencia en particular?',
      showBookingForm: false,
    }
  }

  if (
    lower.includes('ubicac') ||
    lower.includes('dónde') ||
    lower.includes('champerico') ||
    lower.includes('llegar') ||
    lower.includes('dirección')
  ) {
    return {
      text: 'Estamos en **Playa Champerico, Retalhuleu, Guatemala** — costa del Océano Pacífico, famosa por su arena negra volcánica y sus atardeceres únicos.\n\nNos encontramos a 3 horas de Ciudad de Guatemala y 45 minutos de Retalhuleu. Ofrecemos traslado privado desde ambas ciudades (Q400 por viaje).',
      showBookingForm: false,
    }
  }

  if (
    lower.includes('cancelar') ||
    lower.includes('política') ||
    lower.includes('política') ||
    lower.includes('check') ||
    lower.includes('reembolso')
  ) {
    return {
      text: '**Nuestras políticas principales:**\n\n• Check-in: 3:00 PM | Check-out: 12:00 PM\n• Estancia mínima: 2 noches\n• Cancelación gratuita hasta **48 horas** antes del check-in\n• Cancelaciones con menos de 48h: se cobra el 50%\n\n¿Tienes alguna pregunta específica?',
      showBookingForm: false,
    }
  }

  if (lower.includes('hola') || lower.includes('buenos') || lower.includes('buenas') || lower.includes('hello') || lower.includes('hi')) {
    return {
      text: '¡Bienvenido al Azul Horizonte Boutique Hotel! 🌊 Soy Azul, tu asistente virtual.\n\nEstamos ubicados en la hermosa **Playa Champerico, Guatemala**, con vista directa al Océano Pacífico y su característica arena negra volcánica.\n\n¿En qué puedo ayudarte? Puedo informarte sobre nuestras suites, servicios, o ayudarte con una reservación.',
      showBookingForm: false,
    }
  }

  return {
    text: 'Gracias por contactar al **Azul Horizonte Boutique Hotel** en Playa Champerico, Guatemala. 🌊\n\nEstoy aquí para ayudarte con información sobre nuestras suites frente al Pacífico, servicios y experiencias, o para gestionar tu reservación. ¿En qué puedo asistirte?',
    showBookingForm: false,
  }
}
```

- [ ] **Step 4: Ejecutar tests — verificar que PASAN**

```bash
npx vitest run tests/lib/claude.test.ts
```

Expected: 7 tests passing.

- [ ] **Step 5: Commit**

```bash
git add app/lib/claude.ts tests/lib/claude.test.ts
git commit -m "feat: add Claude client with mock mode and system prompt builder"
```

---

## Task 6: Implementar cliente de Zapier + mock mode + tests

**Files:**
- Create: `app/lib/zapier.ts`, `tests/lib/zapier.test.ts`

- [ ] **Step 1: Escribir los tests**

```typescript
// tests/lib/zapier.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { sendToZapier, type BookingData } from '../../app/lib/zapier'

const BASE_DATA: BookingData = {
  name: 'Ana López',
  email: 'ana@example.com',
  phone: '50299887766',
  checkIn: '2026-06-10',   // miércoles — debe confirmar
  checkOut: '2026-06-12',
  roomType: 'suite-vista-mar',
  guests: 2,
}

describe('sendToZapier — mock mode (sin ZAPIER_WEBHOOK_URL)', () => {
  it('returns confirmed for a Wednesday check-in', async () => {
    const result = await sendToZapier(BASE_DATA)
    expect(result.status).toBe('confirmed')
    expect(result.bookingId).toMatch(/^AH-\d+$/)
  })

  it('returns unavailable for a Friday check-in (demo scenario)', async () => {
    // 2026-06-12 is a Friday
    const result = await sendToZapier({ ...BASE_DATA, checkIn: '2026-06-12', checkOut: '2026-06-14' })
    expect(result.status).toBe('unavailable')
    expect(result.message).toBeDefined()
  })

  it('includes a message in confirmed response', async () => {
    const result = await sendToZapier(BASE_DATA)
    expect(result.message).toContain('ana@example.com')
  })
})

describe('sendToZapier — live mode (con ZAPIER_WEBHOOK_URL)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.ZAPIER_WEBHOOK_URL
  })

  it('POSTs to the webhook URL with JSON body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'confirmed', bookingId: 'AH-TEST-001' }),
    })
    vi.stubGlobal('fetch', mockFetch)
    process.env.ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/test/123/'

    const result = await sendToZapier(BASE_DATA)

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://hooks.zapier.com/hooks/catch/test/123/')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toMatchObject({ name: 'Ana López', roomType: 'suite-vista-mar' })
    expect(result.status).toBe('confirmed')
  })

  it('throws when webhook returns non-ok status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    process.env.ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/test'

    await expect(sendToZapier(BASE_DATA)).rejects.toThrow('Zapier returned 500')
  })
})
```

- [ ] **Step 2: Ejecutar tests — verificar que FALLAN**

```bash
npx vitest run tests/lib/zapier.test.ts
```

Expected: FAIL — `Cannot find module '../../app/lib/zapier'`

- [ ] **Step 3: Implementar `app/lib/zapier.ts`**

```typescript
// app/lib/zapier.ts

export interface BookingData {
  name: string
  email: string
  phone: string
  checkIn: string   // YYYY-MM-DD
  checkOut: string  // YYYY-MM-DD
  roomType: 'suite-vista-mar' | 'suite-frente-mar' | 'suite-presidencial'
  guests: number
}

export interface BookingResult {
  status: 'confirmed' | 'unavailable'
  bookingId?: string
  message?: string
}

export async function sendToZapier(data: BookingData): Promise<BookingResult> {
  if (!process.env.ZAPIER_WEBHOOK_URL) {
    return getMockBookingResult(data)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30_000)

  try {
    const response = await fetch(process.env.ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Zapier returned ${response.status}`)
    }

    return (await response.json()) as BookingResult
  } finally {
    clearTimeout(timeoutId)
  }
}

function getMockBookingResult(data: BookingData): BookingResult {
  // Los viernes simulan no disponibilidad (para demo)
  const checkIn = new Date(data.checkIn)
  if (checkIn.getDay() === 5) {
    return {
      status: 'unavailable',
      message:
        'Las fechas seleccionadas no están disponibles para esa habitación. Por favor elige otras fechas o un tipo de suite diferente.',
    }
  }

  return {
    status: 'confirmed',
    bookingId: `AH-${Date.now()}`,
    message: `¡Reservación confirmada! Recibirás un correo de confirmación en ${data.email} en los próximos minutos.`,
  }
}
```

- [ ] **Step 4: Ejecutar tests — verificar que PASAN**

```bash
npx vitest run tests/lib/zapier.test.ts
```

Expected: 5 tests passing.

- [ ] **Step 5: Ejecutar todos los tests acumulados**

```bash
npx vitest run
```

Expected: Todos los tests de rag, claude y zapier pasan.

- [ ] **Step 6: Commit**

```bash
git add app/lib/zapier.ts tests/lib/zapier.test.ts
git commit -m "feat: add Zapier webhook client with mock mode and tests"
```

---

## Task 7: Crear rutas API `/api/chat` y `/api/book`

**Files:**
- Create: `app/routes/api/chat.ts`, `app/routes/api/book.ts`

- [ ] **Step 1: Crear `app/routes/api/chat.ts`**

```typescript
// app/routes/api/chat.ts
import { createAPIFileRoute } from '@tanstack/start/api'
import { chat, type ChatMessage } from '../../lib/claude'

export const APIRoute = createAPIFileRoute('/api/chat')({
  POST: async ({ request }) => {
    const body = await request.json() as {
      messages: ChatMessage[]
      userMessage: string
    }

    if (!body.userMessage || typeof body.userMessage !== 'string') {
      return Response.json(
        { error: 'userMessage is required' },
        { status: 400 },
      )
    }

    try {
      const result = await chat(body.messages ?? [], body.userMessage.trim())
      return Response.json(result)
    } catch (error) {
      console.error('[/api/chat]', error)
      return Response.json(
        {
          text: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
          showBookingForm: false,
        },
        { status: 500 },
      )
    }
  },
})
```

- [ ] **Step 2: Crear `app/routes/api/book.ts`**

```typescript
// app/routes/api/book.ts
import { createAPIFileRoute } from '@tanstack/start/api'
import { sendToZapier, type BookingData } from '../../lib/zapier'

const REQUIRED_FIELDS: (keyof BookingData)[] = [
  'name', 'email', 'phone', 'checkIn', 'checkOut', 'roomType', 'guests',
]

export const APIRoute = createAPIFileRoute('/api/book')({
  POST: async ({ request }) => {
    const body = await request.json() as BookingData

    const missing = REQUIRED_FIELDS.filter((f) => !body[f])
    if (missing.length > 0) {
      return Response.json(
        { error: `Missing fields: ${missing.join(', ')}` },
        { status: 400 },
      )
    }

    try {
      const result = await sendToZapier(body)
      return Response.json(result)
    } catch (error) {
      console.error('[/api/book]', error)
      return Response.json(
        {
          status: 'error',
          message:
            'Error al procesar la reservación. Por favor intenta de nuevo en unos minutos.',
        },
        { status: 500 },
      )
    }
  },
})
```

- [ ] **Step 3: Verificar rutas con `curl` (o Postman)**

Con `npm run dev` corriendo:

```bash
# Test /api/chat — mock mode
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[],"userMessage":"hola"}'
```

Expected: `{"text":"¡Bienvenido al Azul Horizonte...","showBookingForm":false}`

```bash
# Test /api/book — mock mode
curl -X POST http://localhost:3000/api/book \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"t@t.com","phone":"12345","checkIn":"2026-06-10","checkOut":"2026-06-12","roomType":"suite-vista-mar","guests":2}'
```

Expected: `{"status":"confirmed","bookingId":"AH-...","message":"..."}`

- [ ] **Step 4: Commit**

```bash
git add app/routes/api/
git commit -m "feat: add /api/chat and /api/book API routes"
```

---

## Task 8: Construir componente BookingForm + tests

**Files:**
- Create: `app/components/chat/BookingForm.tsx`, `tests/components/BookingForm.test.tsx`

- [ ] **Step 1: Actualizar `vitest.config.ts` para soportar JSX y jsdom**

```typescript
// vitest.config.ts  (reemplazar contenido completo)
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      ['tests/components/**', 'jsdom'],
    ],
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
})
```

Instalar `@vitejs/plugin-react` si no está:

```bash
npm install -D @vitejs/plugin-react
```

- [ ] **Step 2: Crear `tests/setup.ts`**

```typescript
// tests/setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 3: Escribir tests de BookingForm**

```typescript
// tests/components/BookingForm.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BookingForm } from '../../app/components/chat/BookingForm'

const mockOnSubmit = vi.fn()
const mockOnCancel = vi.fn()

function fillForm() {
  fireEvent.change(screen.getByLabelText(/nombre completo/i), {
    target: { value: 'María García' },
  })
  fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
    target: { value: 'maria@test.com' },
  })
  fireEvent.change(screen.getByLabelText(/teléfono/i), {
    target: { value: '50299887766' },
  })
  fireEvent.change(screen.getByLabelText(/fecha de entrada/i), {
    target: { value: '2026-06-10' },
  })
  fireEvent.change(screen.getByLabelText(/fecha de salida/i), {
    target: { value: '2026-06-12' },
  })
  fireEvent.change(screen.getByLabelText(/tipo de habitación/i), {
    target: { value: 'suite-vista-mar' },
  })
  fireEvent.change(screen.getByLabelText(/número de huéspedes/i), {
    target: { value: '2' },
  })
}

describe('BookingForm', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear()
    mockOnCancel.mockClear()
  })

  it('renders all 7 required fields', () => {
    render(<BookingForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isLoading={false} />)
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/fecha de entrada/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/fecha de salida/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tipo de habitación/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/número de huéspedes/i)).toBeInTheDocument()
  })

  it('calls onSubmit with correct data when form is valid', async () => {
    render(<BookingForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isLoading={false} />)
    fillForm()
    fireEvent.submit(screen.getByRole('form'))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'María García',
        email: 'maria@test.com',
        phone: '50299887766',
        checkIn: '2026-06-10',
        checkOut: '2026-06-12',
        roomType: 'suite-vista-mar',
        guests: 2,
      })
    })
  })

  it('does not call onSubmit when required fields are empty', () => {
    render(<BookingForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isLoading={false} />)
    fireEvent.submit(screen.getByRole('form'))
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('disables submit button when isLoading=true', () => {
    render(<BookingForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isLoading={true} />)
    expect(screen.getByRole('button', { name: /verificando/i })).toBeDisabled()
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(<BookingForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isLoading={false} />)
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(mockOnCancel).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 4: Ejecutar tests — verificar que FALLAN**

```bash
npx vitest run tests/components/BookingForm.test.tsx
```

Expected: FAIL — `Cannot find module '../../app/components/chat/BookingForm'`

- [ ] **Step 5: Crear `app/components/chat/BookingForm.tsx`**

```tsx
// app/components/chat/BookingForm.tsx
import { useState, type FormEvent } from 'react'
import type { BookingData } from '../../lib/zapier'

interface Props {
  onSubmit: (data: BookingData) => void
  onCancel: () => void
  isLoading: boolean
}

const ROOM_OPTIONS = [
  { value: 'suite-vista-mar', label: 'Suite Vista Mar — Q950/noche (máx. 2 personas)' },
  { value: 'suite-frente-mar', label: 'Suite Frente al Mar — Q1,450/noche (máx. 3 personas)' },
  { value: 'suite-presidencial', label: 'Suite Presidencial — Q2,200/noche (máx. 6 personas)' },
] as const

export function BookingForm({ onSubmit, onCancel, isLoading }: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    roomType: '' as BookingData['roomType'] | '',
    guests: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.roomType) return

    onSubmit({
      name: form.name,
      email: form.email,
      phone: form.phone,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      roomType: form.roomType,
      guests: parseInt(form.guests, 10),
    })
  }

  const inputClass =
    'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
  const labelClass = 'block text-xs font-medium text-slate-600 mb-1'

  return (
    <form
      aria-label="Formulario de reservación"
      role="form"
      onSubmit={handleSubmit}
      className="bg-slate-50 border border-blue-100 rounded-xl p-4 mt-2 space-y-3"
    >
      <p className="text-sm font-semibold text-slate-700 mb-1">📋 Datos de Reservación</p>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label htmlFor="name" className={labelClass}>Nombre completo *</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            placeholder="Ej. María García"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>Correo electrónico *</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="correo@ejemplo.com"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>Teléfono *</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            value={form.phone}
            onChange={handleChange}
            placeholder="502 XXXX XXXX"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="checkIn" className={labelClass}>Fecha de entrada *</label>
            <input
              id="checkIn"
              name="checkIn"
              type="date"
              required
              value={form.checkIn}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="checkOut" className={labelClass}>Fecha de salida *</label>
            <input
              id="checkOut"
              name="checkOut"
              type="date"
              required
              value={form.checkOut}
              onChange={handleChange}
              min={form.checkIn || new Date().toISOString().split('T')[0]}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="roomType" className={labelClass}>Tipo de habitación *</label>
          <select
            id="roomType"
            name="roomType"
            required
            value={form.roomType}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">Seleccionar suite...</option>
            {ROOM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="guests" className={labelClass}>Número de huéspedes *</label>
          <select
            id="guests"
            name="guests"
            required
            value={form.guests}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">Seleccionar...</option>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? 'persona' : 'personas'}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {isLoading ? 'Verificando disponibilidad...' : 'Confirmar reservación'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 6: Ejecutar tests — verificar que PASAN**

```bash
npx vitest run tests/components/BookingForm.test.tsx
```

Expected: 5 tests passing.

- [ ] **Step 7: Ejecutar todos los tests**

```bash
npx vitest run
```

Expected: Todos pasan.

- [ ] **Step 8: Commit**

```bash
git add app/components/chat/BookingForm.tsx tests/components/BookingForm.test.tsx tests/setup.ts vitest.config.ts
git commit -m "feat: add BookingForm component with validation and tests"
```

---

## Task 9: Construir ChatMessage + ChatWidget

**Files:**
- Create: `app/components/chat/ChatMessage.tsx`, `app/components/chat/ChatWidget.tsx`

- [ ] **Step 1: Crear `app/components/chat/ChatMessage.tsx`**

```tsx
// app/components/chat/ChatMessage.tsx
import type { BookingData } from '../../lib/zapier'
import { BookingForm } from './BookingForm'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  showBookingForm?: boolean
  bookingResult?: {
    status: 'confirmed' | 'unavailable' | 'error'
    message?: string
    bookingId?: string
  }
}

interface Props {
  message: Message
  onBookingSubmit: (data: BookingData) => void
  onBookingCancel: () => void
  isBookingLoading: boolean
}

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />')
}

export function ChatMessage({ message, onBookingSubmit, onBookingCancel, isBookingLoading }: Props) {
  const isUser = message.role === 'user'

  if (message.bookingResult) {
    const { status, message: msg, bookingId } = message.bookingResult
    const isConfirmed = status === 'confirmed'

    return (
      <div className={`flex ${isConfirmed ? 'justify-start' : 'justify-start'} mb-3`}>
        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
          isConfirmed
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <p className="font-semibold mb-1">
            {isConfirmed ? '✅ ¡Reservación Confirmada!' : '❌ No Disponible'}
          </p>
          {bookingId && <p className="text-xs opacity-75 mb-1">ID: {bookingId}</p>}
          <p>{msg}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
            <span className="text-xs text-slate-400 font-medium">Azul</span>
          </div>
        )}
        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm'
        }`}>
          <span
            dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
          />
        </div>
        {message.showBookingForm && (
          <BookingForm
            onSubmit={onBookingSubmit}
            onCancel={onBookingCancel}
            isLoading={isBookingLoading}
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Crear `app/components/chat/ChatWidget.tsx`**

```tsx
// app/components/chat/ChatWidget.tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import type { BookingData } from '../../lib/zapier'
import { ChatMessage, type Message } from './ChatMessage'

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    '¡Bienvenido al **Azul Horizonte Boutique Hotel**! 🌊 Soy Azul, tu asistente virtual.\n\nEstamos en Playa Champerico, Guatemala, frente al Océano Pacífico. ¿En qué puedo ayudarte hoy?',
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isBookingLoading, setIsBookingLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const conversationHistory = messages
    .filter((m) => !m.showBookingForm && !m.bookingResult)
    .map((m) => ({ role: m.role, content: m.content }))

  async function sendMessage() {
    const trimmed = input.trim()
    if (!trimmed || isChatLoading) return

    setInput('')
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setIsChatLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory, userMessage: trimmed }),
      })
      const data = await res.json()

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data.text || '',
          showBookingForm: data.showBookingForm ?? false,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Lo siento, hubo un problema de conexión. Por favor intenta de nuevo. 🙏',
        },
      ])
    } finally {
      setIsChatLoading(false)
    }
  }

  async function handleBookingSubmit(formData: BookingData) {
    setIsBookingLoading(true)

    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const result = await res.json()

      // Eliminar el showBookingForm del último mensaje de asistente
      setMessages((prev) =>
        prev.map((m) =>
          m.showBookingForm ? { ...m, showBookingForm: false } : m,
        ),
      )

      // Agregar resultado de la reservación
      setMessages((prev) => [
        ...prev,
        {
          id: `booking-${Date.now()}`,
          role: 'assistant',
          content: '',
          bookingResult: result,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev.map((m) => (m.showBookingForm ? { ...m, showBookingForm: false } : m)),
        {
          id: `err-booking-${Date.now()}`,
          role: 'assistant',
          content: 'Hubo un error al procesar tu reservación. Por favor intenta de nuevo.',
        },
      ])
    } finally {
      setIsBookingLoading(false)
    }
  }

  function handleBookingCancel() {
    setMessages((prev) =>
      prev.map((m) =>
        m.showBookingForm ? { ...m, showBookingForm: false } : m,
      ),
    )
  }

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
          aria-label="Abrir asistente virtual"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* Panel del chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[600px] bg-white rounded-3xl shadow-2xl flex flex-col border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Azul — Asistente Virtual</p>
                <p className="text-white/70 text-xs">Azul Horizonte Boutique Hotel</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Cerrar chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-slate-50">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onBookingSubmit={handleBookingSubmit}
                onBookingCancel={handleBookingCancel}
                isBookingLoading={isBookingLoading}
              />
            ))}
            {isChatLoading && (
              <div className="flex justify-start mb-3">
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 bg-white border-t border-slate-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Escribe tu mensaje..."
                disabled={isChatLoading}
                className="flex-1 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={isChatLoading || !input.trim()}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 rounded-full flex items-center justify-center transition-colors"
                aria-label="Enviar mensaje"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3: Verificar manualmente en el browser**

Con `npm run dev`: abre `http://localhost:3000`, el botón azul flotante debe aparecer abajo a la derecha. Al hacer click debe abrirse el panel del chat. Escribe "hola" y verifica respuesta. Escribe "quiero reservar" y verifica que aparece el formulario.

- [ ] **Step 4: Commit**

```bash
git add app/components/chat/
git commit -m "feat: add ChatMessage and ChatWidget components"
```

---

## Task 10: Montar ChatWidget en el root layout + componentes de layout

**Files:**
- Modify: `app/routes/__root.tsx`
- Create: `app/components/layout/Header.tsx`, `app/components/layout/Footer.tsx`

- [ ] **Step 1: Crear `app/components/layout/Header.tsx`**

```tsx
// app/components/layout/Header.tsx
import { Link } from '@tanstack/react-router'

const NAV_LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/habitaciones', label: 'Habitaciones' },
  { to: '/servicios', label: 'Servicios' },
  { to: '/faq', label: 'FAQ' },
]

export function Header() {
  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🌊</span>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-none">Azul Horizonte</p>
            <p className="text-xs text-slate-500 leading-none">Boutique Hotel</p>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm text-slate-600 hover:text-blue-600 font-medium transition-colors"
              activeProps={{ className: 'text-blue-600' }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <a
          href="#reservar"
          className="hidden md:inline-flex bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-full transition-colors"
        >
          Reservar Ahora
        </a>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Crear `app/components/layout/Footer.tsx`**

```tsx
// app/components/layout/Footer.tsx
export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🌊</span>
            <div>
              <p className="text-white font-bold leading-none">Azul Horizonte</p>
              <p className="text-xs leading-none mt-0.5">Boutique Hotel</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed">
            Donde el Pacífico te abraza.<br />
            Playa Champerico, Retalhuleu, Guatemala.
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Contacto</h4>
          <ul className="space-y-1 text-sm">
            <li>📧 reservas@azulhorizonte.gt</li>
            <li>📞 +502 7700 0000</li>
            <li>📍 Champerico, Retalhuleu</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Legal</h4>
          <ul className="space-y-1 text-sm">
            <li>Check-in: 3:00 PM | Check-out: 12:00 PM</li>
            <li>Estancia mínima: 2 noches</li>
            <li>Cancelación gratuita hasta 48h antes</li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 pt-8 mt-8 border-t border-slate-800 text-center text-xs">
        © {new Date().getFullYear()} Azul Horizonte Boutique Hotel. Todos los derechos reservados.
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Actualizar `app/routes/__root.tsx`**

Localiza la función que renderiza el HTML base (usualmente `RootDocument` o `Root`). Agrega Header, Footer y ChatWidget. El patrón exacto depende del scaffold, pero el resultado debe ser:

```tsx
// app/routes/__root.tsx — agregar imports al inicio
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { ChatWidget } from '../components/chat/ChatWidget'
import '../styles/globals.css'

// Dentro del componente de layout que wrappea <Outlet />, añadir:
// <Header />
// <main className="pt-16"><Outlet /></main>
// <Footer />
// <ChatWidget />
```

El archivo generado varía, pero el cuerpo del componente raíz quedará similar a:

```tsx
function RootComponent() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </>
  )
}
```

- [ ] **Step 4: Verificar en el browser**

`http://localhost:3000` debe mostrar el Header fijo, Footer y el botón del chat.

- [ ] **Step 5: Commit**

```bash
git add app/routes/__root.tsx app/components/layout/
git commit -m "feat: add Header, Footer and mount ChatWidget in root layout"
```

---

## Task 11: Construir páginas del sitio web

**Files:**
- Modify: `app/routes/index.tsx`
- Create: `app/routes/habitaciones.tsx`, `app/routes/servicios.tsx`, `app/routes/faq.tsx`

- [ ] **Step 1: Home page (`app/routes/index.tsx`)**

```tsx
// app/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 via-blue-800 to-cyan-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/champerico-beach.jpg')] bg-cover bg-center opacity-30" />
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p className="text-cyan-300 text-sm font-semibold uppercase tracking-widest mb-4">
            Playa Champerico, Guatemala
          </p>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Donde el Pacífico<br />
            <span className="text-cyan-300">te abraza</span>
          </h1>
          <p className="text-xl text-white/80 mb-10 leading-relaxed">
            Hotel boutique frente a la arena negra volcánica de Champerico.
            Suites de lujo, experiencias únicas y el atardecer más hermoso del Pacífico guatemalteco.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/habitaciones"
              className="bg-white text-blue-700 font-semibold px-8 py-4 rounded-full hover:bg-cyan-50 transition-colors text-lg"
            >
              Ver Habitaciones
            </a>
            <button
              onClick={() => document.querySelector('[aria-label="Abrir asistente virtual"]')?.dispatchEvent(new MouseEvent('click'))}
              className="border-2 border-white text-white font-semibold px-8 py-4 rounded-full hover:bg-white/10 transition-colors text-lg"
            >
              🤖 Reservar con IA
            </button>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">
            Una experiencia única en Guatemala
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { emoji: '🌊', title: 'Frente al Pacífico', desc: 'Despierta con el sonido de las olas. Todas nuestras suites tienen acceso directo a la playa de arena negra volcánica.' },
              { emoji: '🍳', title: 'Desayuno incluido', desc: 'Buffet chapín y continental cada mañana: huevos al gusto, tamales, frutas tropicales y café de exportación.' },
              { emoji: '🤖', title: 'Reserva con IA', desc: 'Nuestro asistente virtual Azul te ayuda a reservar en minutos, responde preguntas y confirma tu disponibilidad al instante.' },
            ].map((f) => (
              <div key={f.title} className="text-center p-8 rounded-2xl bg-slate-50 hover:bg-blue-50 transition-colors">
                <div className="text-5xl mb-4">{f.emoji}</div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="reservar" className="py-20 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-4">¿Listo para escapar al Pacífico?</h2>
          <p className="text-white/80 text-lg mb-8">
            Habla con Azul, nuestro asistente virtual, y confirma tu reservación en minutos.
          </p>
          <button
            onClick={() => document.querySelector('[aria-label="Abrir asistente virtual"]')?.dispatchEvent(new MouseEvent('click'))}
            className="bg-white text-blue-600 font-bold px-10 py-4 rounded-full text-lg hover:bg-cyan-50 transition-colors shadow-lg"
          >
            Chatear con Azul 🌊
          </button>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Habitaciones page (`app/routes/habitaciones.tsx`)**

```tsx
// app/routes/habitaciones.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/habitaciones')({
  component: HabitacionesPage,
})

const ROOMS = [
  {
    id: 'suite-vista-mar',
    name: 'Suite Vista Mar',
    price: 'Q950',
    usd: '$120',
    capacity: '1–2 personas',
    emoji: '🌊',
    color: 'from-blue-500 to-cyan-400',
    features: ['Cama king size', 'Terraza privada', 'Ducha de lluvia', 'Minibar', 'Desayuno incluido'],
    desc: 'Suite íntima con ventanales que enmarcan el horizonte del Pacífico. Ideal para parejas en escapada romántica.',
  },
  {
    id: 'suite-frente-mar',
    name: 'Suite Frente al Mar',
    price: 'Q1,450',
    usd: '$180',
    capacity: '2–3 personas',
    emoji: '🌅',
    color: 'from-cyan-500 to-teal-400',
    features: ['Acceso directo a la playa', 'Jacuzzi exterior privado', 'Cama king + cama individual', 'Sala de estar', 'Desayuno incluido'],
    desc: 'Suite espaciosa con acceso directo a la arena negra de Champerico. Jacuzzi exterior con vista al Pacífico.',
  },
  {
    id: 'suite-presidencial',
    name: 'Suite Presidencial',
    price: 'Q2,200',
    usd: '$280',
    capacity: '2–6 personas',
    emoji: '👑',
    color: 'from-purple-500 to-blue-500',
    features: ['2 habitaciones', 'Terraza panorámica 180°', 'Cocina equipada', 'Mayordomo incluido', 'Sala comedor', 'Desayuno incluido'],
    desc: 'La experiencia definitiva en Champerico. Dos habitaciones, terraza panorámica y servicio de mayordomo personalizado.',
  },
]

function HabitacionesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-b from-blue-800 to-blue-600 text-white py-24 text-center">
        <h1 className="text-5xl font-bold mb-4">Nuestras Suites</h1>
        <p className="text-white/80 text-lg max-w-xl mx-auto">
          Tres experiencias frente al Océano Pacífico. Todas incluyen desayuno buffet y WiFi gratuito.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-10">
        {ROOMS.map((room) => (
          <div key={room.id} className="bg-white rounded-3xl shadow-md overflow-hidden flex flex-col md:flex-row">
            <div className={`bg-gradient-to-br ${room.color} md:w-64 flex-shrink-0 flex items-center justify-center py-16 md:py-0`}>
              <span className="text-8xl">{room.emoji}</span>
            </div>
            <div className="p-8 flex-1">
              <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{room.name}</h2>
                  <p className="text-slate-500 text-sm mt-1">👥 {room.capacity}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">{room.price}</p>
                  <p className="text-slate-400 text-sm">por noche ({room.usd})</p>
                </div>
              </div>
              <p className="text-slate-600 mb-5 leading-relaxed">{room.desc}</p>
              <ul className="flex flex-wrap gap-2">
                {room.features.map((f) => (
                  <li key={f} className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
                    ✓ {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Servicios page (`app/routes/servicios.tsx`)**

```tsx
// app/routes/servicios.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/servicios')({
  component: ServiciosPage,
})

const SERVICES = [
  {
    category: 'Gastronomía',
    emoji: '🍽️',
    items: [
      { name: 'Cena Romántica en la Orilla', price: 'Q600/pareja', desc: 'Mesa privada a la orilla del Pacífico con antorchas, decoración floral y menú de 4 tiempos con mariscos frescos.' },
      { name: 'Desayuno Buffet en Terraza', price: 'Incluido', desc: 'Buffet chapín y continental de 7:00 AM a 11:00 AM con productos locales.' },
    ],
  },
  {
    category: 'Tours Acuáticos',
    emoji: '🌊',
    items: [
      { name: 'Pesca Artesanal Tradicional', price: 'Q350/persona', desc: 'Salida a las 5:30 AM con pescadores locales. 4 horas en el Pacífico guatemalteco.' },
      { name: 'Kayak y Snorkel', price: 'Q250/persona', desc: '2.5 horas con equipo incluido. Guía certificado. Apto para principiantes.' },
      { name: 'Avistamiento de Tortugas', price: 'Q180/persona', desc: 'Tour nocturno para ver el desove de tortugas golfinas (temporada jul–nov). Máx. 8 personas.' },
    ],
  },
  {
    category: 'Bienestar',
    emoji: '💆',
    items: [
      { name: 'Masaje Terapéutico Frente al Mar', price: 'Q450/sesión', desc: 'Masaje de 60 min en terraza con vista al Pacífico. Sueco o tejido profundo.' },
    ],
  },
  {
    category: 'Reservaciones Premium',
    emoji: '✨',
    items: [
      { name: 'Decoración Especial de Habitación', price: 'Q300', desc: 'Flores, velas y pétalos para una llegada sorpresa.' },
      { name: 'Traslado Privado', price: 'Q400/viaje', desc: 'Servicio puerta a puerta desde Ciudad de Guatemala o Retalhuleu.' },
      { name: 'Picnic Privado en la Playa', price: 'Q500/pareja', desc: 'Canasta gourmet y área privada en la orilla del mar.' },
    ],
  },
]

function ServiciosPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-b from-cyan-700 to-teal-600 text-white py-24 text-center">
        <h1 className="text-5xl font-bold mb-4">Servicios y Experiencias</h1>
        <p className="text-white/80 text-lg max-w-xl mx-auto">
          Más allá de la habitación. Vive el Pacífico guatemalteco de una forma que no olvidarás.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-12">
        {SERVICES.map((cat) => (
          <div key={cat.category}>
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <span className="text-3xl">{cat.emoji}</span> {cat.category}
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              {cat.items.map((item) => (
                <div key={item.name} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-blue-200 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-800">{item.name}</h3>
                    <span className="text-blue-600 font-bold text-sm ml-4 whitespace-nowrap">{item.price}</span>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: FAQ page (`app/routes/faq.tsx`)**

```tsx
// app/routes/faq.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/faq')({
  component: FAQPage,
})

const FAQS = [
  { q: '¿Dónde está ubicado el hotel?', a: 'Estamos en Playa Champerico, Retalhuleu, Guatemala, en la costa del Océano Pacífico. Champerico es famosa por su arena negra volcánica y sus atardeceres únicos. Nos encontramos a 3 horas de Ciudad de Guatemala y 45 minutos de Retalhuleu.' },
  { q: '¿El desayuno está incluido en todas las habitaciones?', a: 'Sí, todas nuestras suites incluyen desayuno buffet (chapín y continental) de 7:00 AM a 11:00 AM, sin costo adicional.' },
  { q: '¿Cuáles son las políticas de check-in y check-out?', a: 'Check-in a partir de las 3:00 PM y check-out a las 12:00 PM (mediodía). Early check-in y late check-out están sujetos a disponibilidad con un costo de Q200.' },
  { q: '¿Puedo cancelar mi reservación?', a: 'Sí. Ofrecemos cancelación gratuita hasta 48 horas antes del check-in. Si cancelas con menos de 48 horas, se cobra el 50% del total. En caso de no presentarse (no-show), se cobra el 100% de la primera noche.' },
  { q: '¿El hotel acepta mascotas?', a: 'Lo sentimos, el hotel no acepta mascotas. Queremos garantizar la comodidad de todos nuestros huéspedes.' },
  { q: '¿Cómo funciona el asistente de IA para reservaciones?', a: 'Haz click en el ícono de chat azul en la esquina inferior derecha. Azul, nuestro asistente virtual, te guiará para hacer tu reservación, responderá preguntas sobre el hotel y verificará disponibilidad en tiempo real. Una vez confirmado, recibirás un correo de confirmación.' },
  { q: '¿Tienen WiFi y estacionamiento?', a: 'Sí a ambos. WiFi de alta velocidad en todo el hotel sin costo adicional. Estacionamiento privado vigilado también sin costo para todos los huéspedes.' },
  { q: '¿Cuáles formas de pago aceptan?', a: 'Aceptamos efectivo (Quetzales y Dólares), Visa y Mastercard. No se aceptan cheques. Se requiere el 50% de depósito para confirmar la reservación; el saldo se cancela al check-in.' },
  { q: '¿El hotel es apto para familias?', a: 'Sí. La Suite Presidencial es ideal para familias, con capacidad para hasta 6 personas y cocina equipada. Ofrecemos cuna sin costo adicional (sujeto a disponibilidad). Consulta con Azul para opciones familiares.' },
  { q: '¿Qué es la arena negra de Champerico?', a: 'La playa de Champerico tiene arena de origen volcánico, de color negro intenso, característica única del Pacífico guatemalteco y centroamericano. Es cálida, suave y visualmente espectacular, especialmente durante los atardeceres.' },
]

function FAQPage() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-b from-slate-800 to-slate-700 text-white py-24 text-center">
        <h1 className="text-5xl font-bold mb-4">Preguntas Frecuentes</h1>
        <p className="text-white/70 text-lg">Todo lo que necesitas saber antes de tu visita.</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-3">
        {FAQS.map((faq, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <button
              className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="font-semibold text-slate-800">{faq.q}</span>
              <svg
                className={`w-5 h-5 text-blue-500 flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {open === i && (
              <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-50 pt-4">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-16 text-center">
        <p className="text-slate-500 text-sm">
          ¿Tienes otra pregunta? Usa el chat con{' '}
          <button
            onClick={() => document.querySelector('[aria-label="Abrir asistente virtual"]')?.dispatchEvent(new MouseEvent('click'))}
            className="text-blue-600 font-semibold hover:underline"
          >
            Azul, nuestro asistente virtual
          </button>
          .
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Registrar rutas en el router**

En TanStack Start con file-based routing, las rutas se detectan automáticamente. Verifica que las rutas se detecten:

```bash
npm run dev
```

Visita `http://localhost:3000/habitaciones`, `/servicios`, `/faq` — deben renderizar correctamente.

- [ ] **Step 6: Commit**

```bash
git add app/routes/index.tsx app/routes/habitaciones.tsx app/routes/servicios.tsx app/routes/faq.tsx
git commit -m "feat: add all static pages (Home, Habitaciones, Servicios, FAQ)"
```

---

## Task 12: Crear Dockerfile

**Files:**
- Create: `Dockerfile`, `.dockerignore`

- [ ] **Step 1: Crear `Dockerfile`**

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
COPY --from=builder /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

- [ ] **Step 2: Crear `.dockerignore`**

```
node_modules
.output
.env
*.env
.git
docs
n8n-workflows
tests
README.md
```

- [ ] **Step 3: Verificar el build**

```bash
docker build -t azul-horizonte-app .
```

Expected: imagen construida sin errores. El build puede tardar 2–4 minutos.

- [ ] **Step 4: Verificar que el contenedor corre**

```bash
docker run -p 3000:3000 --env-file .env azul-horizonte-app
```

Visita `http://localhost:3000` — debe funcionar igual que en desarrollo.

```bash
# Detener el contenedor
docker stop $(docker ps -q --filter ancestor=azul-horizonte-app)
```

- [ ] **Step 5: Commit**

```bash
git add Dockerfile .dockerignore
git commit -m "feat: add multi-stage Dockerfile"
```

---

## Task 13: Crear docker-compose + .env.example

**Files:**
- Create: `docker-compose.yml`, `.env.example`, `.env`

- [ ] **Step 1: Crear `docker-compose.yml`**

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
    depends_on:
      - n8n

  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - GENERIC_TIMEZONE=America/Guatemala
      - TZ=America/Guatemala
    restart: unless-stopped

volumes:
  n8n_data:
```

- [ ] **Step 2: Crear `.env.example`**

```bash
# .env.example — copia este archivo a .env y llena los valores

# ── Claude API ─────────────────────────────────────────────
# Obtener en: https://console.anthropic.com/
# Sin este valor, el agente usa respuestas mock (modo demo)
ANTHROPIC_API_KEY=

# ── Zapier Webhook ─────────────────────────────────────────
# URL del "Catch Hook" en Zapier (trigger del Zap de reservaciones)
# Sin este valor, las reservas usan mock (viernes = no disponible)
ZAPIER_WEBHOOK_URL=

# ── n8n ────────────────────────────────────────────────────
# Contraseña para acceder al panel de n8n (localhost:5678)
N8N_PASSWORD=cambiar-en-produccion

# ── Aplicación ─────────────────────────────────────────────
NODE_ENV=production
```

- [ ] **Step 3: Crear `.env` real (NO commitear)**

```bash
copy .env.example .env
```

Edita `.env` y agrega al menos `N8N_PASSWORD=mipassword123`. Las claves de Claude y Zapier se dejan vacías por ahora (modo mock).

Agrega `.env` al `.gitignore`:

```bash
echo ".env" >> .gitignore
```

- [ ] **Step 4: Levantar con docker-compose**

```bash
docker-compose up --build
```

Expected:
- App corriendo en `http://localhost:3000`
- n8n corriendo en `http://localhost:5678` (login: admin / tu-password)

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml .env.example .gitignore
git commit -m "feat: add docker-compose with app and n8n services"
```

---

## Task 14: Crear workflows de n8n (JSON para importar)

**Files:**
- Create: `n8n-workflows/reminder-24h.json`, `n8n-workflows/reminder-2h.json`, `n8n-workflows/README.md`

- [ ] **Step 1: Crear `n8n-workflows/reminder-24h.json`**

```json
{
  "name": "Recordatorio Check-In 24h — Azul Horizonte",
  "nodes": [
    {
      "id": "schedule-trigger",
      "name": "Diario 8 AM Guatemala",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.1,
      "position": [0, 0],
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 14 * * *"
            }
          ]
        }
      }
    },
    {
      "id": "get-reservations",
      "name": "Leer Reservaciones",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4,
      "position": [200, 0],
      "parameters": {
        "operation": "getAll",
        "documentId": "={{ $env.GOOGLE_SHEETS_ID }}",
        "sheetName": "Reservaciones",
        "options": {}
      }
    },
    {
      "id": "filter-tomorrow",
      "name": "Filtrar check-in mañana",
      "type": "n8n-nodes-base.filter",
      "typeVersion": 2,
      "position": [400, 0],
      "parameters": {
        "conditions": {
          "options": { "caseSensitive": false },
          "conditions": [
            {
              "leftValue": "={{ $json.status }}",
              "rightValue": "confirmed",
              "operator": { "type": "string", "operation": "equals" }
            },
            {
              "leftValue": "={{ $json.reminder_24h }}",
              "rightValue": "false",
              "operator": { "type": "string", "operation": "equals" }
            },
            {
              "leftValue": "={{ $json.check_in }}",
              "rightValue": "={{ $today.plus({days:1}).toFormat('yyyy-MM-dd') }}",
              "operator": { "type": "string", "operation": "equals" }
            }
          ],
          "combinator": "and"
        }
      }
    },
    {
      "id": "send-email",
      "name": "Enviar Recordatorio 24h",
      "type": "n8n-nodes-base.gmail",
      "typeVersion": 2,
      "position": [600, 0],
      "parameters": {
        "sendTo": "={{ $json.email }}",
        "subject": "🌊 Recordatorio: Tu check-in en Azul Horizonte es mañana",
        "emailType": "html",
        "message": "<h2>¡Te esperamos mañana en Azul Horizonte! 🌊</h2><p>Hola <strong>{{ $json.name }}</strong>,</p><p>Te recordamos que tu check-in es <strong>mañana {{ $json.check_in }}</strong> a partir de las <strong>3:00 PM</strong>.</p><p><strong>Tu reservación:</strong><br>🏨 {{ $json.room_type }}<br>👥 {{ $json.guests }} persona(s)<br>📅 {{ $json.check_in }} → {{ $json.check_out }}<br>📋 ID: {{ $json.booking_id }}</p><p>Si tienes alguna pregunta, responde este correo o usa el chat en nuestro sitio web.</p><p>¡Hasta mañana!</p><p>— Equipo Azul Horizonte Boutique Hotel<br>Playa Champerico, Guatemala</p>"
      }
    },
    {
      "id": "update-sheet",
      "name": "Marcar reminder_24h = true",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4,
      "position": [800, 0],
      "parameters": {
        "operation": "update",
        "documentId": "={{ $env.GOOGLE_SHEETS_ID }}",
        "sheetName": "Reservaciones",
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "booking_id": "={{ $json.booking_id }}",
            "reminder_24h": "true"
          }
        },
        "options": { "locationDefine": "specifyWithName", "nameOfColumn": "booking_id" }
      }
    }
  ],
  "connections": {
    "Diario 8 AM Guatemala": { "main": [[{ "node": "Leer Reservaciones", "type": "main", "index": 0 }]] },
    "Leer Reservaciones": { "main": [[{ "node": "Filtrar check-in mañana", "type": "main", "index": 0 }]] },
    "Filtrar check-in mañana": { "main": [[{ "node": "Enviar Recordatorio 24h", "type": "main", "index": 0 }]] },
    "Enviar Recordatorio 24h": { "main": [[{ "node": "Marcar reminder_24h = true", "type": "main", "index": 0 }]] }
  }
}
```

- [ ] **Step 2: Crear `n8n-workflows/reminder-2h.json`**

```json
{
  "name": "Recordatorio Check-In 2h — Azul Horizonte",
  "nodes": [
    {
      "id": "schedule-hourly",
      "name": "Cada Hora",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.1,
      "position": [0, 0],
      "parameters": {
        "rule": {
          "interval": [{ "field": "hours", "hoursInterval": 1 }]
        }
      }
    },
    {
      "id": "get-reservations",
      "name": "Leer Reservaciones",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4,
      "position": [200, 0],
      "parameters": {
        "operation": "getAll",
        "documentId": "={{ $env.GOOGLE_SHEETS_ID }}",
        "sheetName": "Reservaciones",
        "options": {}
      }
    },
    {
      "id": "filter-2h",
      "name": "Filtrar check-in en 2h",
      "type": "n8n-nodes-base.filter",
      "typeVersion": 2,
      "position": [400, 0],
      "parameters": {
        "conditions": {
          "conditions": [
            {
              "leftValue": "={{ $json.status }}",
              "rightValue": "confirmed",
              "operator": { "type": "string", "operation": "equals" }
            },
            {
              "leftValue": "={{ $json.reminder_24h }}",
              "rightValue": "true",
              "operator": { "type": "string", "operation": "equals" }
            },
            {
              "leftValue": "={{ $json.reminder_2h }}",
              "rightValue": "false",
              "operator": { "type": "string", "operation": "equals" }
            },
            {
              "leftValue": "={{ $json.check_in }}",
              "rightValue": "={{ $today.toFormat('yyyy-MM-dd') }}",
              "operator": { "type": "string", "operation": "equals" }
            }
          ],
          "combinator": "and"
        }
      }
    },
    {
      "id": "send-email-2h",
      "name": "Enviar Recordatorio 2h",
      "type": "n8n-nodes-base.gmail",
      "typeVersion": 2,
      "position": [600, 0],
      "parameters": {
        "sendTo": "={{ $json.email }}",
        "subject": "🌊 ¡Tu check-in en Azul Horizonte es hoy!",
        "emailType": "html",
        "message": "<h2>¡Hoy es el día! 🌊</h2><p>Hola <strong>{{ $json.name }}</strong>,</p><p>Tu check-in en Azul Horizonte Boutique Hotel es <strong>hoy</strong> a partir de las <strong>3:00 PM</strong>.</p><p><strong>Tu reservación:</strong><br>🏨 {{ $json.room_type }}<br>👥 {{ $json.guests }} persona(s)<br>📋 ID: {{ $json.booking_id }}</p><p>📍 Playa Champerico, Retalhuleu, Guatemala<br>🅿️ Estacionamiento privado disponible<br>🍳 Desayuno buffet incluido mañana de 7–11 AM</p><p>¡Te esperamos!</p><p>— Equipo Azul Horizonte Boutique Hotel</p>"
      }
    },
    {
      "id": "update-sheet-2h",
      "name": "Marcar reminder_2h = true",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4,
      "position": [800, 0],
      "parameters": {
        "operation": "update",
        "documentId": "={{ $env.GOOGLE_SHEETS_ID }}",
        "sheetName": "Reservaciones",
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "booking_id": "={{ $json.booking_id }}",
            "reminder_2h": "true"
          }
        },
        "options": { "locationDefine": "specifyWithName", "nameOfColumn": "booking_id" }
      }
    }
  ],
  "connections": {
    "Cada Hora": { "main": [[{ "node": "Leer Reservaciones", "type": "main", "index": 0 }]] },
    "Leer Reservaciones": { "main": [[{ "node": "Filtrar check-in en 2h", "type": "main", "index": 0 }]] },
    "Filtrar check-in en 2h": { "main": [[{ "node": "Enviar Recordatorio 2h", "type": "main", "index": 0 }]] },
    "Enviar Recordatorio 2h": { "main": [[{ "node": "Marcar reminder_2h = true", "type": "main", "index": 0 }]] }
  }
}
```

- [ ] **Step 3: Crear `n8n-workflows/README.md`**

```markdown
# Workflows de n8n — Azul Horizonte

## Cómo importar

1. Levanta n8n con `docker-compose up n8n`
2. Abre `http://localhost:5678` y haz login (admin / tu N8N_PASSWORD)
3. Click en **"+ New Workflow"** → **"Import from file"**
4. Importa `reminder-24h.json` y luego `reminder-2h.json`

## Configuración requerida

En cada workflow importado:

### 1. Credenciales de Google Sheets
- Abre el nodo "Leer Reservaciones"
- En **Credentials** → **Add new** → autenticar con la cuenta de Google que tiene el Sheets

### 2. Credenciales de Gmail
- Abre el nodo "Enviar Recordatorio"
- En **Credentials** → **Add new** → autenticar con Gmail

### 3. Variable de entorno GOOGLE_SHEETS_ID
- En n8n, ir a **Settings → Variables**
- Agregar: `GOOGLE_SHEETS_ID` = el ID del Google Sheet (parte de la URL: `.../spreadsheets/d/ID_AQUI/...`)

### 4. Activar los workflows
- Una vez configurados, click en el toggle **"Active"** en cada workflow

## Notas sobre el timezone
Los triggers usan `America/Guatemala` (UTC-6). El trigger de 24h está configurado a las 14:00 UTC = 8:00 AM Guatemala.
```

- [ ] **Step 4: Commit**

```bash
git add n8n-workflows/
git commit -m "feat: add n8n workflow JSON files for 24h and 2h reminders"
```

---

## Task 15: Verificación final end-to-end

- [ ] **Step 1: Correr todos los tests**

```bash
npx vitest run
```

Expected: Todos los tests pasan (rag.test.ts, claude.test.ts, zapier.test.ts, BookingForm.test.tsx).

- [ ] **Step 2: Probar flujo completo en modo mock**

Con `npm run dev`:

1. Abre `http://localhost:3000`
2. Haz click en el botón azul flotante
3. Escribe "hola" → debe responder con bienvenida
4. Escribe "quiero hacer una reservación" → debe aparecer el formulario
5. Llena el formulario con fecha de check-in un **miércoles** → click "Confirmar" → debe mostrar `✅ ¡Reservación Confirmada!`
6. Repite con fecha de check-in un **viernes** → debe mostrar `❌ No Disponible`
7. Navega a `/habitaciones`, `/servicios`, `/faq` — todas deben cargar correctamente

- [ ] **Step 3: Probar con Docker Compose**

```bash
docker-compose up --build
```

Repite las pruebas en `http://localhost:3000`. Verifica n8n en `http://localhost:5678`.

- [ ] **Step 4: Commit final**

```bash
git add .
git commit -m "chore: project complete in mock mode — ready for API key integration"
```

---

## Verificación Post-API Keys

Cuando tengas las credenciales reales, edita `.env`:

```bash
ANTHROPIC_API_KEY=sk-ant-xxxx
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/xxx/yyy/
```

Reinicia con `npm run dev` o `docker-compose up`. El agente usará Claude real y Zapier real automáticamente.

---

## Self-Review

**Spec coverage:**
- ✅ Sitio web responsive con 4 secciones
- ✅ Chat widget con agente IA
- ✅ Formulario embebido en el chat
- ✅ RAG con knowledge base del hotel
- ✅ Mock mode sin API keys
- ✅ Integración Zapier (confirmed/unavailable)
- ✅ n8n Docker container con workflows
- ✅ Dockerfile + docker-compose
- ✅ .env.example documentado
- ✅ TDD para todos los módulos críticos (RAG, Claude, Zapier, BookingForm)

**Placeholder scan:** Ningún TBD o TODO en el código del plan.

**Type consistency:** `BookingData` definida en `zapier.ts` y usada consistentemente en `BookingForm`, `/api/book`, y tests. `ChatMessage`/`ChatResponse` definidas en `claude.ts` y usadas en `/api/chat` y `ChatWidget`.
```
