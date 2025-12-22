import { useState } from 'react'

function App() {
  const [fileLoaded, _setFileLoaded] = useState(false)

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="border-b border-gray-700 px-4 py-3">
        <h1 className="text-xl font-semibold">Zed Theme Editor</h1>
      </header>

      <main className="flex h-[calc(100vh-57px)]">
        {!fileLoaded ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="rounded-lg border-2 border-dashed border-gray-600 p-12 text-center">
              <p className="text-lg text-gray-400">
                Drop a Zed theme file here or click to open
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Supports .json and .json5 files
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-1">
            <div className="flex-1 border-r border-gray-700 p-4">
              {/* JSON Editor Panel */}
              <p className="text-gray-400">JSON Editor will go here</p>
            </div>
            <div className="w-80 p-4">
              {/* Color Editor Panel */}
              <p className="text-gray-400">Color Editor will go here</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
