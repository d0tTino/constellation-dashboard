'use client'

import { useEffect, useState } from 'react'

export type TaskStatusEvent = {
  type?: string
  [key: string]: any
}

type Callback = (event: TaskStatusEvent) => void

let ws: WebSocket | null = null
const callbacks = new Set<Callback>()
let latestStatus: TaskStatusEvent | null = null
let reconnectAttempts = 0
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
let shouldReconnect = true

function ensureConnection() {
  if (ws || typeof window === 'undefined') return
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }
  const url = process.env.NEXT_PUBLIC_TASK_CASCADENCE_WS_URL
  if (!url) {
    console.error('TaskCascadence WebSocket URL is not defined')
    return
  }
  shouldReconnect = true
  ws = new WebSocket(url)
  ws.onopen = () => {
    reconnectAttempts = 0
  }
  ws.onmessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'task.status') {
        latestStatus = data
        callbacks.forEach(cb => cb(data))
      }
    } catch (err) {
      console.error('Error parsing TaskCascadence message', err)
    }
  }
  ws.onclose = () => {
    ws = null
    if (!shouldReconnect) return
    const delay = Math.min(10000, 1000 * 2 ** reconnectAttempts)
    reconnectAttempts += 1
    reconnectTimeout = setTimeout(ensureConnection, delay)
  }
}

export function subscribeToTaskStatus(callback: Callback) {
  callbacks.add(callback)
  if (latestStatus) {
    callback(latestStatus)
  }
  ensureConnection()
  return () => {
    callbacks.delete(callback)
    if (!callbacks.size) {
      shouldReconnect = false
      if (ws) {
        ws.close()
        ws = null
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
      }
      reconnectAttempts = 0
    }
  }
}

export function getLatestTaskStatus() {
  return latestStatus
}

export function useTaskStatus() {
  const [status, setStatus] = useState<TaskStatusEvent | null>(latestStatus)
  useEffect(() => subscribeToTaskStatus(setStatus), [])
  return status
}

