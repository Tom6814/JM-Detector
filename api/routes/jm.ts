import express from 'express'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pythonScriptPath = path.join(__dirname, '..', 'jm_proxy.py')

const runPythonScript = (inputData: object): Promise<any> => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [pythonScriptPath])

    let outputData = ''
    let errorData = ''

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString()
    })

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString()
    })

    pythonProcess.on('close', (code) => {
      if (code !== 0 && !outputData) {
        return reject(new Error(`Python script exited with code ${code}. Error: ${errorData}`))
      }
      try {
        // Try to extract JSON from the output, in case there are other logs printed
        const match = outputData.match(/\{[\s\S]*\}/)
        if (match) {
          const jsonStr = match[0]
          const result = JSON.parse(jsonStr)
          resolve(result)
        } else {
          reject(new Error('No valid JSON output found: ' + outputData))
        }
      } catch (err) {
        reject(new Error('Failed to parse Python script output: ' + outputData))
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

    const result = await runPythonScript({ action: 'detail', id })
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
