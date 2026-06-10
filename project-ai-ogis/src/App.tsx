import { useState, useEffect, useRef } from "react"
import { IoArrowUp } from "react-icons/io5"

type Message = {
  id: number
  role: "user" | "ai"
  content: string
}

// ✅ Mock API (JSON)
const sampleData: Message[] = [
  { id: 1, role: "user", content: "How do I run a Vite project?" },
  { id: 2, role: "ai", content: "Use npm run dev to start the server." },
  { id: 3, role: "user", content: "Is TypeScript supported?" },
  { id: 4, role: "ai", content: "Yes, just choose the TypeScript template." },
]

const imageOgis = "https://ogisphilippines.com/wp-content/uploads/2025/05/OGIS-logo-v2.png"

type Source = {
  id: number
  name: string
  status: "connected" | "offline"
}

// ✅ Dummy data (like API)
const sources: Source[] = [
  { id: 1, name: "PostgreSQL - Production", status: "connected" },
  { id: 2, name: "MongoDB - Analytics", status: "connected" },
  { id: 3, name: "MySQL - Legacy DB", status: "offline" },
  { id: 4, name: "Firebase - Realtime", status: "connected" },
]

function App() {
  const [messages, setMessages] = useState<Message[]>(sampleData)
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement | null>(null)

  // ✅ auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: input,
    }

    const aiMsg: Message = {
      id: Date.now() + 1,
      role: "ai",
      content: "Sample AI response.",
    }

    setMessages((prev) => [...prev, userMsg, aiMsg])
    setInput("")
  }

  return (
    <div className="flex min-h-screen bg-white text-black">
      
      {/* SIDEBAR */}
      <div className="hidden md:block w-1/4 border-r p-6">
        <h2 className="text-lg font-semibold mb-6">Sources</h2>

        <div className="space-y-3">
          {sources.map((src) => (
            <div
              key={src.id}
              className="flex items-center justify-between border rounded-lg p-3 hover:bg-slate-100 transition"
            >
              <span className="text-sm">{src.name}</span>

              {/* STATUS INDICATOR */}
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    src.status === "connected" ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                <span className="text-xs text-slate-500">
                  {src.status === "connected" ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 p-3 md:p-6">
        <div className="flex flex-col h-[90vh] border rounded-2xl">
          
          {/* HEADER */}
          <div className="border-b p-4 md:p-6">
            <h1 className="text-xl md:text-2xl font-bold">OGIS AI</h1>
          </div>

          {/* CHAT (SCROLLABLE + LIMITED HEIGHT) */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] md:max-w-xl p-3 md:p-4 rounded-xl ${
                  msg.role === "user"
                    ? "ml-auto bg-black text-white"
                    : "mr-auto border"
                }`}
              >
                {msg.content}
              </div>
            ))}

            {/* 👇 auto scroll target */}
            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div className="border-t p-3 md:p-4">
            <div className="relative">
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={2}
                placeholder="Ask something..."
                className="w-full resize-none rounded-xl border p-3 md:p-4 pr-14 text-sm md:text-base focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />

              {/* ARROW BUTTON */}
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="absolute bottom-2 right-2 md:bottom-3 md:right-3 flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full bg-black text-white disabled:opacity-30"
              >
                <IoArrowUp size={18} />
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default App