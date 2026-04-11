import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  aiConfig: {
    baseUrl: string
    model: string
    apiKey: string
    isValidated: boolean
    isGeminiFormat: boolean
  }
  preferences: {
    avoid: string[]
    like: string[]
  }
  setAiConfig: (config: Partial<AppState['aiConfig']>) => void
  setPreferences: (prefs: Partial<AppState['preferences']>) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      aiConfig: {
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o',
        apiKey: '',
        isValidated: false,
        isGeminiFormat: false,
      },
      preferences: {
        avoid: ['NTR', '绿帽', '重口', '屎尿', '猎奇'],
        like: ['纯爱', '单女主', '甜', '处女'],
      },
      setAiConfig: (config) =>
        set((state) => ({
          aiConfig: { ...state.aiConfig, ...config },
        })),
      setPreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),
    }),
    {
      name: 'ai-jm-storage',
    }
  )
)
