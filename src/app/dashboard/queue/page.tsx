import Link from 'next/link'
import { QueueApp } from '@/components/queue/QueueApp'

export default function QueuePage() {
  return (
    <div className="page-gradient min-h-screen pb-20">
      <div className="bg-black/25 backdrop-blur-md border-b border-white/8 px-4 py-5">
        <Link href="/dashboard" className="text-xs text-white/40 hover:text-white/60 mb-1 block">← Dashboard</Link>
        <div className="text-xl font-bold text-white">🏟️ Queue Play</div>
        <div className="text-xs text-white/40 mt-1">Paddle stacking & court rotation</div>
      </div>
      <QueueApp />
    </div>
  )
}
