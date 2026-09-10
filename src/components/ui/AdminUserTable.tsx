'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getRoleBadge } from '@/lib/utils'

const ROLES = ['admin', 'player', 'spectator']
const ROLE_COLORS: Record<string, string> = {
  admin: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  player: 'text-brand-green border-brand-green/30 bg-brand-green/10',
  spectator: 'text-white/40 border-white/15 bg-white/5',
}

export function AdminUserTable({ users }: { users: any[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)

  async function updateRole(userId: string, role: string) {
    startTransition(async () => {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      })
      if (!res.ok) { toast.error('Failed to update role'); return }
      toast.success('Role updated!')
      setEditingId(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      {users.map(user => (
        <div key={user.id} className="glass-card p-4 rounded-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-white truncate">{user.name || 'No name'}</div>
              <div className="text-white/40 text-xs truncate">{user.email}</div>
              <div className="text-white/30 text-[10px] mt-1">
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {editingId === user.id ? (
                <div className="flex flex-col gap-1">
                  {ROLES.map(r => (
                    <button
                      key={r}
                      onClick={() => updateRole(user.id, r)}
                      disabled={isPending}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${
                        user.role === r ? ROLE_COLORS[r] : 'text-white/40 border-white/10 bg-white/5'
                      }`}
                    >
                      {getRoleBadge(r)}
                    </button>
                  ))}
                  <button onClick={() => setEditingId(null)} className="text-xs text-white/30 mt-1 text-right">Cancel</button>
                </div>
              ) : (
                <>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${ROLE_COLORS[user.role]}`}>
                    {getRoleBadge(user.role)}
                  </span>
                  <button
                    onClick={() => setEditingId(user.id)}
                    className="text-xs text-white/30 hover:text-white/60 border border-white/10 rounded-lg px-2 py-1"
                  >
                    Change Role
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
