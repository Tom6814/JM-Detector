import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AlertTriangle, CheckCircle2, HelpCircle, MinusCircle } from 'lucide-react'

export interface IdentificationResult {
  avoid: Record<string, boolean>
  like: Record<string, boolean>
  reasoning: string
}

interface Props {
  result: IdentificationResult | null
  loading: boolean
}

export function IdentificationReport({ result, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center animate-pulse">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-400 font-medium">AI 正在深度分析中...</p>
        <p className="text-sm text-zinc-500 mt-2">（思考过程已隐藏，请耐心等待结果）</p>
      </div>
    )
  }

  if (!result) return null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="bg-zinc-800/50 p-4 border-b border-zinc-800">
        <h2 className="text-xl font-bold text-zinc-100">鉴定报告</h2>
      </div>
      
      <div className="p-6 space-y-8">
        {/* 避雷鉴定 */}
        <div>
          <h3 className="flex items-center gap-2 text-lg font-medium text-zinc-200 mb-4 border-b border-zinc-800 pb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            避雷判定
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(result.avoid).map(([key, value]) => (
              <div
                key={key}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                  value
                    ? 'bg-red-500/10 border-red-500/50 text-red-400'
                    : 'bg-zinc-800/30 border-zinc-700 text-zinc-400'
                }`}
              >
                {value ? <AlertTriangle className="w-4 h-4" /> : <MinusCircle className="w-4 h-4 opacity-50" />}
                <span className="font-medium">{key}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 喜欢鉴定 */}
        <div>
          <h3 className="flex items-center gap-2 text-lg font-medium text-zinc-200 mb-4 border-b border-zinc-800 pb-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            喜好判定
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(result.like).map(([key, value]) => (
              <div
                key={key}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                  value
                    ? 'bg-green-500/10 border-green-500/50 text-green-400'
                    : 'bg-zinc-800/30 border-zinc-700 text-zinc-400'
                }`}
              >
                {value ? <CheckCircle2 className="w-4 h-4" /> : <HelpCircle className="w-4 h-4 opacity-50" />}
                <span className="font-medium">{key}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 判定依据 */}
        <div>
          <h3 className="text-lg font-medium text-zinc-200 mb-4 border-b border-zinc-800 pb-2">
            判定依据 (Reasoning)
          </h3>
          <div className="bg-zinc-950 rounded-lg p-5 border border-zinc-800 text-zinc-300 prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-900">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {result.reasoning}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
