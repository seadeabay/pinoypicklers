'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function CreateTournamentButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: '', location: '', date: '', description: '', numCourts: 1,
  })

  async function create() {
    if (!form.name.trim()) { toast.error('Name required'); return }
    startTransition(async () => {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status: 'active' }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed'); return }
      toast.success(`"${form.name}" created! 🏆`)
      setOpen(false)
      setForm({ name: '', location: '', date: '', description: '', numCourts: 1 })
      router.push(`/dashboard/tournaments/${data.id}`)
    })
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary px-3 py-2 text-sm">
        + New
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d2e1a] border border-white/12 rounded-2xl p-5 w-full max-w-sm max-h-[90dvh] overflow-y-auto">
            <div className="text-lg font-bold text-white text-center mb-5">🏆 New Tournament</div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/50 block mb-1">Tournament Name *</label>
                <input type="text" className="input-field" placeholder="e.g. Cebu Open 2025"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-white/50 block mb-1">Location</label>
                <input type="text" className="input-field" placeholder="e.g. Cebu Sports Complex"
                  value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-white/50 block mb-1">Date</label>
                <input type="date" className="input-field"
                  value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-white/50 block mb-1">Description</label>
                <textarea className="input-field resize-none h-16" placeholder="Any notes..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-white/50 block mb-2">Number of Courts</label>
                <div className="flex items-center gap-4 justify-center">
                  <button onClick={() => setForm(f => ({ ...f, numCourts: Math.max(1, f.numCourts - 1) }))}
                    className="w-10 h-10 rounded-full bg-white/10 border border-white/15 text-white text-lg font-bold">−</button>
                  <span className="text-3xl font-bold text-white w-8 text-center">{form.numCourts}</span>
                  <button onClick={() => setForm(f => ({ ...f, numCourts: Math.min(8, f.numCourts + 1) }))}
                    className="w-10 h-10 rounded-full bg-white/10 border border-white/15 text-white text-lg font-bold">+</button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={create} disabled={isPending} className="btn-primary flex-[2]">
                {isPending ? 'Creating...' : 'Create Tournament'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
