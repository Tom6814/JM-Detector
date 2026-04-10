import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { Settings, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export function AIConfig() {
  const { aiConfig, setAiConfig } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      // Very simple test, trying to list models or just hit the models endpoint
      let url = aiConfig.baseUrl.replace(/\/$/, '')
      if (url.includes('generativelanguage.googleapis.com')) {
        // Gemini API test
        const res = await fetch(`${url}/models?key=${aiConfig.apiKey}`)
        if (!res.ok) throw new Error('API request failed')
      } else {
        // OpenAI format test
        const res = await fetch(`${url}/models`, {
          headers: {
            Authorization: `Bearer ${aiConfig.apiKey}`,
          },
        })
        if (!res.ok) throw new Error('API request failed')
      }
      setTestResult('success')
      setAiConfig({ isValidated: true })
    } catch (err) {
      console.error(err)
      setTestResult('error')
      setAiConfig({ isValidated: false })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-zinc-100">AI 模型配置</h2>
        </div>
        <div className="flex items-center gap-2">
          {aiConfig.isValidated ? (
            <span className="flex items-center gap-1 text-sm text-green-400">
              <CheckCircle2 className="w-4 h-4" /> 已连接
            </span>
          ) : (
            <span className="flex items-center gap-1 text-sm text-red-400">
              <XCircle className="w-4 h-4" /> 未连接
            </span>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-zinc-800 space-y-4 bg-zinc-900/50">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              API Base URL
            </label>
            <input
              type="text"
              value={aiConfig.baseUrl}
              onChange={(e) => {
                setAiConfig({ baseUrl: e.target.value, isValidated: false })
                setTestResult(null)
              }}
              placeholder="https://api.openai.com/v1"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-zinc-500 mt-1">支持 OpenAI 格式或 Google Gemini 格式</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              模型名称 (Model)
            </label>
            <input
              type="text"
              value={aiConfig.model}
              onChange={(e) => setAiConfig({ model: e.target.value })}
              placeholder="gpt-4o"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              API Key
            </label>
            <input
              type="password"
              value={aiConfig.apiKey}
              onChange={(e) => {
                setAiConfig({ apiKey: e.target.value, isValidated: false })
                setTestResult(null)
              }}
              placeholder="sk-..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleTest}
              disabled={testing || !aiConfig.apiKey || !aiConfig.baseUrl}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-lg px-4 py-2 font-medium transition-colors"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> 测试中...
                </>
              ) : (
                '测试连通性并保存'
              )}
            </button>
            {testResult === 'error' && (
              <p className="text-sm text-red-400 mt-2 text-center">连接失败，请检查配置是否正确</p>
            )}
            {testResult === 'success' && (
              <p className="text-sm text-green-400 mt-2 text-center">连接成功！配置已保存</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
