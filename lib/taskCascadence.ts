'use client'

type TaskStatusEvent = {
  type?: string
  [key: string]: any
}

type Callback = (event: TaskStatusEvent) => void

let ws: WebSocket | null = null
const callbacks = new Set<Callback>()

function ensureConnection() {
  if (ws || typeof window === 'undefined') return
  const url = process.env.NEXT_PUBLIC_TASK_CASCADENCE_WS_URL
  if (!url) {
    console.error('TaskCascadence WebSocket URL is not defined')
    return
  }
  ws = new WebSocket(url)
  ws.onmessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'task.status') {
        callbacks.forEach(cb => cb(data))
      }
    } catch (err) {
      console.error('Error parsing TaskCascadence message', err)
    }
  }
  ws.onclose = () => {
    ws = null
  }
}

export function subscribeToTaskStatus(callback: Callback) {
  callbacks.add(callback)
  ensureConnection()
  return () => {
    callbacks.delete(callback)
    if (!callbacks.size && ws) {
      ws.close()
      ws = null
    }
  }
}

