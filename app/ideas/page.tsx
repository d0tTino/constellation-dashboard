'use client'
import useSWR from 'swr'
import { fetcher } from '../../lib/swr'
import { useState } from 'react'

type IdeaSeed = {
  id: string
  text: string
}

export default function IdeasPage() {
  const { data: ideaSeeds = [], mutate } = useSWR<IdeaSeed[]>('/api/ume/idea-seeds', fetcher)
  const [newIdeaText, setNewIdeaText] = useState('')

  const createIdea = async () => {
    if (!newIdeaText.trim()) return
    await fetch('/api/ume/idea-seeds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newIdeaText })
    })
    setNewIdeaText('')
    mutate()
  }

  const updateIdea = async (id: string, text: string) => {
    await fetch(`/api/ume/idea-seeds/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    })
    mutate()
  }

  const deleteIdea = async (id: string) => {
    await fetch(`/api/ume/idea-seeds/${id}`, { method: 'DELETE' })
    mutate()
  }

  const handleEdit = async (seed: IdeaSeed) => {
    const text = prompt('Edit idea', seed.text)
    if (text && text !== seed.text) {
      await updateIdea(seed.id, text)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Idea Seeds</h1>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          className="border rounded px-2 py-1 flex-grow"
          value={newIdeaText}
          onChange={e => setNewIdeaText(e.target.value)}
        />
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded"
          onClick={createIdea}
        >
          Add
        </button>
      </div>
      <ul className="space-y-2">
        {ideaSeeds.map(seed => (
          <li key={seed.id} className="border p-2 rounded flex justify-between items-center">
            <span>{seed.text}</span>
            <div className="flex gap-2">
              <button className="text-blue-500" onClick={() => handleEdit(seed)}>
                Edit
              </button>
              <button className="text-red-500" onClick={() => deleteIdea(seed.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
