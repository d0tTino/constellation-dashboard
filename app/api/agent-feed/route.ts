// Placeholder feed route using SSE instead of WebSocket

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        const data = JSON.stringify({ value: Math.random() })
        controller.enqueue(`data: ${data}\n\n`)
      }
      send()
      const interval = setInterval(send, 1000)
      controller.onCancel = () => clearInterval(interval)
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
