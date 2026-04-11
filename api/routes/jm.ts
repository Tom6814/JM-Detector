import express from 'express'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pythonScriptPath = path.join(__dirname, '..', 'jm_proxy.py')

const runPythonScript = (inputData: object, timeoutMs: number = 25000): Promise<any> => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [pythonScriptPath])

    const timeoutId = setTimeout(() => {
      pythonProcess.kill('SIGKILL')
      reject(new Error(`请求超时 (${timeoutMs}ms)，可能是 JMComic 服务器不稳定或被屏蔽`))
    }, timeoutMs)

    let outputData = ''
    let errorData = ''

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString()
    })

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString()
    })

    pythonProcess.on('close', (code) => {
      clearTimeout(timeoutId)
      if (code !== 0 && !outputData) {
        return reject(new Error(`Python script exited with code ${code}. Error: ${errorData}`))
      }
      try {
        const firstBrace = outputData.indexOf('{')
        const lastBrace = outputData.lastIndexOf('}')
        
        if (firstBrace !== -1 && lastBrace !== -1) {
          const jsonStr = outputData.slice(firstBrace, lastBrace + 1)
          const result = JSON.parse(jsonStr)
          resolve(result)
        } else {
          reject(new Error('No valid JSON output found. Python Output: ' + outputData.slice(0, 100) + '...'))
        }
      } catch (err) {
        reject(new Error('Failed to parse Python script output: ' + outputData.slice(0, 100) + '...'))
      }
    })

    pythonProcess.stdin.write(JSON.stringify(inputData))
    pythonProcess.stdin.end()
  })
}

router.get('/search', async (req, res) => {
  try {
    const keyword = req.query.keyword as string
    if (!keyword) {
      return res.status(400).json({ success: false, error: 'Keyword is required' })
    }

    const result = await runPythonScript({ action: 'search', query: keyword })
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/details/:id', async (req, res) => {
  try {
    const id = req.params.id
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID is required' })
    }
    
    const skip_search = req.query.skip_search === 'true'

    const result = await runPythonScript({ action: 'detail', id, skip_search })
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
