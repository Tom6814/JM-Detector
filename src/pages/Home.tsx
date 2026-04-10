import { useState } from 'react'
import { AIConfig } from '../components/AIConfig/AIConfig'
import { DoujinshiSearch, type Doujinshi } from '../components/DoujinshiSearch/DoujinshiSearch'
import { Preferences } from '../components/Preferences/Preferences'
import { IdentificationReport, type IdentificationResult } from '../components/IdentificationReport/IdentificationReport'
import { useStore } from '../store/useStore'
import { FileSearch } from 'lucide-react'

export default function Home() {
  const { aiConfig, preferences } = useStore()
  const [selectedDoujinshi, setSelectedDoujinshi] = useState<Doujinshi | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IdentificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleIdentify = async () => {
    if (!selectedDoujinshi) return
    if (!aiConfig.isValidated) {
      setError('请先配置并测试通过 AI API')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // 获取本子详情
      const res = await fetch(`/api/jm/details/${selectedDoujinshi.id}`)
      
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`获取详情失败 (${res.status}): ${text.slice(0, 50)}`)
      }
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text()
        throw new Error(`非预期的响应格式: ${text.slice(0, 50)}`)
      }

      const data = await res.json()

      if (!data.success) {
        throw new Error('获取本子详情失败: ' + data.error)
      }

      const detail = data.data

      const prompt = `
# Role
你是一位极其严谨且经验丰富的“专业漫画及同人志成分鉴定师”。你的核心任务是保护读者的阅读体验，精准分析并预测作品中是否含有读者无法接受的“避雷”内容，同时标记出读者期待的“喜好”内容。

# Task Workflow
1. **信息审视**：仔细分析提供的漫画标题、简介和所有标签。
2. **深度挖掘（联网/知识库）**：如果仅凭当前信息存在歧义，或者该漫画是已有一定知名度的作品，请务必利用网络搜索或你的内部知识库，获取更详尽的剧情走向、同人设定或读者排雷反馈。
3. **精准匹配**：将漫画的实际内容与用户提供的【避雷清单】和【喜欢清单】进行逐一、严格的比对。
4. **格式化输出**：严格按照规定的 JSON 格式输出最终结论，确保能够被后端程序直接解析，不要输出任何 JSON 之外的问候语或解释性纯文本。

# Input Data
- 漫画标题：${detail.title}
- 漫画简介：${detail.description || '无'}
- 漫画标签：${detail.tags.join(', ')}
- 漫画相关评论如下：
${detail.comments && detail.comments.length > 0 ? detail.comments.slice(0, 20).join('\n') : '无相关评论'}

# User Preferences
- 避雷清单（极度讨厌，绝对不能接受）：${preferences.avoid.join(', ')}
- 喜欢清单（非常喜欢，重点关注）：${preferences.like.join(', ')}

# Output Format
请严格输出合法的 JSON 对象。包含 \`avoid\`（避雷判定）和 \`like\`（喜欢判定）两个子对象。键名为清单中的具体元素，键值为布尔值（true 代表判定包含，false 代表判定不包含）。为了方便排查，请在 \`reasoning\` 字段给出判定依据。

{
  "avoid": {
    "避雷元素1": true,
    "避雷元素2": false
  },
  "like": {
    "喜欢元素1": true,
    "喜欢元素2": false
  },
  "reasoning": "一句话点名你的主观观点（完美结合用户喜好），然后分点说明判定理由，例如：标签中包含XX，且简介暗示了XX发展，因此判定包含避雷元素1...，可以带有一点情感色彩，Markdown格式"
}
`

      // 准备发送到 AI 的请求
      const baseUrl = aiConfig.baseUrl.replace(/\/$/, '')
      let aiRes

      if (baseUrl.includes('generativelanguage.googleapis.com')) {
        // Gemini API
        aiRes = await fetch(`${baseUrl}/models/${aiConfig.model}:generateContent?key=${aiConfig.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          }),
        })
      } else {
        // OpenAI format
        aiRes = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${aiConfig.apiKey}`,
          },
          body: JSON.stringify({
            model: aiConfig.model,
            messages: [
              { role: 'system', content: 'You are a helpful assistant that only outputs valid JSON.' },
              { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7
          }),
        })
      }

      if (!aiRes.ok) {
        const text = await aiRes.text()
        throw new Error(`AI API 请求失败 (${aiRes.status}): ${text.slice(0, 50)}`)
      }

      const aiContentType = aiRes.headers.get('content-type')
      if (!aiContentType || !aiContentType.includes('application/json')) {
        const text = await aiRes.text()
        throw new Error(`AI API 返回了非 JSON 格式数据: ${text.slice(0, 50)}`)
      }

      const aiData = await aiRes.json()
      let jsonResultStr = ''

      if (baseUrl.includes('generativelanguage.googleapis.com')) {
        jsonResultStr = aiData.candidates[0].content.parts[0].text
      } else {
        jsonResultStr = aiData.choices[0].message.content
      }

      try {
        // 处理可能存在的思考过程 (DeepSeek 可能会有 reasoning_content)
        // jsonObject 提取
        const jsonMatch = jsonResultStr.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          jsonResultStr = jsonMatch[0]
        }
        
        const resultObj = JSON.parse(jsonResultStr)
        setResult(resultObj as IdentificationResult)
      } catch (e) {
        throw new Error('无法解析 AI 返回的 JSON 数据')
      }

    } catch (err: any) {
      setError(err.message || '鉴定过程出错')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-blue-500/10 rounded-2xl mb-2">
            <FileSearch className="w-12 h-12 text-blue-500" />
          </div>
          <h1 className="text-4xl font-extrabold text-zinc-100 tracking-tight">AI JM本子成分鉴定</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            基于大语言模型的精准鉴定，帮你提前发现雷区，保护你的阅读体验。
          </p>
        </header>

        <AIConfig />
        
        <DoujinshiSearch onSelect={setSelectedDoujinshi} />

        {selectedDoujinshi && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {selectedDoujinshi.image && (
                <img src={selectedDoujinshi.image} alt="cover" className="w-16 h-20 object-cover rounded-md" />
              )}
              <div>
                <h3 className="text-lg font-medium text-zinc-100">{selectedDoujinshi.title}</h3>
                <p className="text-sm text-zinc-500">JM号: {selectedDoujinshi.id}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedDoujinshi(null)}
              className="text-sm text-zinc-500 hover:text-zinc-300"
            >
              取消选择
            </button>
          </div>
        )}

        <Preferences />

        <div className="flex flex-col items-center gap-4 py-6 border-t border-zinc-800">
          <button
            onClick={handleIdentify}
            disabled={loading || !selectedDoujinshi || !aiConfig.isValidated}
            className="w-full md:w-auto px-12 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? '正在进行成分鉴定...' : '开始鉴定'}
          </button>
          {error && <p className="text-red-400 text-sm font-medium">{error}</p>}
          {!aiConfig.isValidated && <p className="text-zinc-500 text-sm">请先配置并测试 AI API</p>}
          {!selectedDoujinshi && aiConfig.isValidated && <p className="text-zinc-500 text-sm">请先搜索并选择要鉴定的本子</p>}
        </div>

        <IdentificationReport result={result} loading={loading} />
      </div>
    </div>
  )
}