import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'

// Store connected clients
const clients = new Map<string, ReadableStreamDefaultController>()

export function notifyTicketUpdate(ticketId: string, data: any) {
  const message = `data: ${JSON.stringify({ type: 'ticket_update', ticketId, ...data })}\n\n`
  
  clients.forEach((controller, clientId) => {
    try {
      controller.enqueue(new TextEncoder().encode(message))
    } catch {
      // Client disconnected, remove it
      clients.delete(clientId)
    }
  })
}

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const clientId = `${session.userId}-${Date.now()}`

  const stream = new ReadableStream({
    start(controller) {
      clients.set(clientId, controller)

      // Send initial connection message
      controller.enqueue(new TextEncoder().encode(
        `data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`
      ))

      // Heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`: heartbeat\n\n`))
        } catch {
          clearInterval(heartbeat)
          clients.delete(clientId)
        }
      }, 30000)

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        clients.delete(clientId)
      })
    },
    cancel() {
      clients.delete(clientId)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
