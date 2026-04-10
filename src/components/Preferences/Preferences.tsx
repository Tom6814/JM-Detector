import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { X, Plus, AlertTriangle, Heart } from 'lucide-react'

export function Preferences() {
  const { preferences, setPreferences } = useStore()
  const [avoidInput, setAvoidInput] = useState('')
  const [likeInput, setLikeInput] = useState('')

  const handleAddAvoid = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && avoidInput.trim()) {
      const items = avoidInput.split(',').map(i => i.trim()).filter(Boolean)
      const newItems = items.filter(i => !preferences.avoid.includes(i))
      if (newItems.length > 0) {
        setPreferences({ avoid: [...preferences.avoid, ...newItems] })
      }
      setAvoidInput('')
    }
  }

  const handleAddLike = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && likeInput.trim()) {
      const items = likeInput.split(',').map(i => i.trim()).filter(Boolean)
      const newItems = items.filter(i => !preferences.like.includes(i))
      if (newItems.length > 0) {
        setPreferences({ like: [...preferences.like, ...newItems] })
      }
      setLikeInput('')
    }
  }

  const removeAvoid = (item: string) => {
    setPreferences({ avoid: preferences.avoid.filter(i => i !== item) })
  }

  const removeLike = (item: string) => {
    setPreferences({ like: preferences.like.filter(i => i !== item) })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* 避雷清单 */}
      <div className="bg-zinc-900 border border-red-900/30 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-zinc-100">避雷清单 (Avoid)</h3>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {preferences.avoid.map(item => (
            <span key={item} className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-md text-sm">
              {item}
              <button onClick={() => removeAvoid(item)} className="hover:text-red-300 focus:outline-none">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="relative">
          <input
            type="text"
            value={avoidInput}
            onChange={(e) => setAvoidInput(e.target.value)}
            onKeyDown={handleAddAvoid}
            placeholder="输入避雷标签，英文逗号分隔，回车添加"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-red-500/50 transition-colors text-sm"
          />
        </div>
      </div>

      {/* 喜欢清单 */}
      <div className="bg-zinc-900 border border-green-900/30 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold text-zinc-100">喜欢清单 (Like)</h3>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {preferences.like.map(item => (
            <span key={item} className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-md text-sm">
              {item}
              <button onClick={() => removeLike(item)} className="hover:text-green-300 focus:outline-none">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="relative">
          <input
            type="text"
            value={likeInput}
            onChange={(e) => setLikeInput(e.target.value)}
            onKeyDown={handleAddLike}
            placeholder="输入喜欢标签，英文逗号分隔，回车添加"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-green-500/50 transition-colors text-sm"
          />
        </div>
      </div>
    </div>
  )
}
