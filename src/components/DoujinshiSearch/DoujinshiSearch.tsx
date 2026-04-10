import { useState } from 'react'
import { Search, Loader2, BookOpen } from 'lucide-react'

export interface Doujinshi {
  id: string
  title: string
  image?: string
}

interface Props {
  onSelect: (item: Doujinshi) => void
}

export function DoujinshiSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Doujinshi[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      // 检查是否为纯数字，如果是数字可能直接查询详情
      const isId = /^\d+$/.test(query.trim())

      if (isId) {
        // 直接通过ID获取信息
        const res = await fetch(`/api/jm/details/${query.trim()}`)
        const data = await res.json()
        if (data.success && data.data && data.data.title) {
          setResults([
            {
              id: data.data.id,
              title: data.data.title,
            },
          ])
        } else {
          setResults([])
        }
      } else {
        // 名称搜索
        const res = await fetch(`/api/jm/search?keyword=${encodeURIComponent(query)}`)
        const data = await res.json()
        if (data.success && Array.isArray(data.data)) {
          setResults(data.data)
        } else {
          setResults([])
        }
      }
    } catch (err: any) {
      setError(err.message || '搜索失败')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-zinc-800 rounded-lg leading-5 bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors sm:text-sm"
            placeholder="输入本子名称 或 JM号..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-100 px-6 py-3 rounded-lg font-medium transition-colors md:w-auto w-full"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '搜索'}
        </button>
      </div>

      {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}

      {searched && !loading && results.length === 0 && !error && (
        <div className="mt-6 text-center text-zinc-500 py-8 border border-dashed border-zinc-800 rounded-lg">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p>没有找到相关本子</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className="flex items-center gap-4 p-3 rounded-lg border border-zinc-800 bg-zinc-950 hover:border-blue-500 cursor-pointer transition-all hover:bg-zinc-800 group"
            >
              {item.image ? (
                <div className="w-16 h-20 bg-zinc-800 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%233f3f46"/></svg>'
                    }}
                  />
                </div>
              ) : (
                <div className="w-16 h-20 bg-zinc-800 rounded flex items-center justify-center flex-shrink-0 text-zinc-600">
                  <BookOpen className="w-6 h-6" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-zinc-100 truncate mb-1" title={item.title}>
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-500 font-mono">JM {item.id}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
