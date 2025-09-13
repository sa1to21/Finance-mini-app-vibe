'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/api'

export default function TestApiPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testHealth = async () => {
    try {
      setLoading(true)
      const response = await apiClient.health()
      setResult({ type: 'health', data: response })
    } catch (error) {
      setResult({ type: 'error', data: error })
    } finally {
      setLoading(false)
    }
  }

  const testMockAuth = async () => {
    try {
      setLoading(true)
      const response = await apiClient.authMock()
      setResult({ type: 'mockAuth', data: response })
    } catch (error) {
      setResult({ type: 'error', data: error })
    } finally {
      setLoading(false)
    }
  }

  const testTelegramAuth = async () => {
    try {
      setLoading(true)
      const mockInitData = "user=%7B%22id%22%3A12345%2C%22first_name%22%3A%22Test+User%22%2C%22username%22%3A%22testuser%22%7D&auth_date=1757621003&query_id=mock_query_id&hash=4f718601d9418e9188487342c771ac6c68fca02fb8c8f1598016dbeaaaf0ddf7"
      const response = await apiClient.authTelegram(mockInitData)
      setResult({ type: 'telegramAuth', data: response })
    } catch (error) {
      setResult({ type: 'error', data: error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Test Page</h1>
      
      <div className="space-y-4">
        <button
          onClick={testHealth}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Health Endpoint
        </button>
        
        <button
          onClick={testMockAuth}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test Mock Auth
        </button>
        
        <button
          onClick={testTelegramAuth}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Test Telegram Auth
        </button>
      </div>

      {loading && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          Loading...
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">Result ({result.type}):</h3>
          <pre className="overflow-auto text-sm">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}