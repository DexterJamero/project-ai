import { useState, useEffect, useRef } from "react"
import { IoArrowUp } from "react-icons/io5"
import { IoFlashOutline } from "react-icons/io5"
import { IoCloseCircle } from "react-icons/io5"

// ─── Types ───────────────────────────────────────────────────────────────────

type MessageContent =
  | { type: "text"; text: string }
  | { type: "image"; src: string }
  | { type: "analysis"; data: AnalysisResult }

type Message = {
  id: number
  role: "user" | "ai"
  contents: MessageContent[]
}

type AnalysisResult = {
  description: string
  detected: string[]
  confidence: number
  suggestion: string
  raw: string
}

type Source = {
  id: number
  name: string
  status: "connected" | "offline"
  icon: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
// ✅ All constants at top-level so they're accessible everywhere

const imageOgis =
  "https://ogisphilippines.com/wp-content/uploads/2025/05/OGIS-logo-v2.png"

const sources: Source[] = [
  { id: 1, name: "PostgreSQL - Production", status: "connected", icon: "🐘" },
  { id: 2, name: "MongoDB - Analytics",     status: "connected", icon: "🍃" },
  { id: 3, name: "MySQL - Legacy DB",       status: "offline",   icon: "🐬" },
  { id: 4, name: "Firebase - Realtime",     status: "connected", icon: "🔥" },
]

// ✅ API Gateway URL at top-level — accessible by analyzeImageWithClaude outside App()
const API_GATEWAY_URL = "https://46a3b2d25i.execute-api.ap-southeast-1.amazonaws.com/DEV"

// ✅ Only needed if your Lambda reads model from request body.
//    If your Lambda hardcodes the Bedrock model ID, you can remove this.
const ANTHROPIC_MODEL = "claude-sonnet-4-20250514"

// ─── Splash Screen ────────────────────────────────────────────────────────────

function SplashScreen({ onDone }: { onDone: () => void }) {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 1800)
    const t2 = setTimeout(() => onDone(), 2300)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#ffffff",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", zIndex: 9999,
      opacity: fadeOut ? 0 : 1, transition: "opacity 0.5s ease", gap: "20px",
    }}>
      <img
        src={imageOgis} alt="OGIS Logo"
        style={{ height: "72px", objectFit: "contain", animation: "splashPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
      />
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: "6px", height: "6px", borderRadius: "50%", background: "#111",
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`, display: "inline-block",
          }} />
        ))}
      </div>
      <style>{`
        @keyframes splashPop { 0%{opacity:0;transform:scale(0.85)} 100%{opacity:1;transform:scale(1)} }
        @keyframes pulse { 0%,100%{opacity:0.2;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  )
}

// ─── Analysis Block ───────────────────────────────────────────────────────────

function AnalysisBlock({ data }: { data: AnalysisResult }) {
  const [showRaw, setShowRaw] = useState(false)

  return (
    <div style={{ marginTop: "6px" }}>
      {/* API badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        fontSize: "11px", padding: "2px 8px", borderRadius: "20px",
        background: "#1a1a1a", color: "#6ee7b7", border: "0.5px solid #2d6a4f",
        marginBottom: "8px",
      }}>
        <IoFlashOutline size={11} />
        AWS Bedrock · Claude
      </div>

      {/* Description */}
      <p style={{ fontSize: "13px", lineHeight: 1.6, marginBottom: "8px", margin: "0 0 8px" }}>
        {data.description}
      </p>

      {/* Confidence */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <span style={{ fontSize: "11px", color: "#888" }}>Confidence</span>
        <div style={{ flex: 1, height: "4px", background: "#e8e8e4", borderRadius: "2px" }}>
          <div style={{
            height: "100%", borderRadius: "2px", background: "#22c55e",
            width: `${data.confidence * 100}%`, transition: "width 0.6s ease",
          }} />
        </div>
        <span style={{ fontSize: "11px", fontWeight: 600 }}>{Math.round(data.confidence * 100)}%</span>
      </div>

      {/* Detected tags */}
      {data.detected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "10px" }}>
          {data.detected.map((tag) => (
            <span key={tag} style={{
              fontSize: "11px", padding: "2px 8px", borderRadius: "20px",
              background: "#f0f0ee", color: "#555", border: "1px solid #e0e0dc",
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Suggestion */}
      {data.suggestion && (
        <div style={{
          padding: "8px 12px", borderRadius: "10px", background: "#f0faf5",
          border: "1px solid #bbf0d9", fontSize: "12px", color: "#0f6e56",
          marginBottom: "8px",
        }}>
          💡 {data.suggestion}
        </div>
      )}

      {/* Toggle raw JSON */}
      <button
        onClick={() => setShowRaw((v) => !v)}
        style={{
          fontSize: "11px", color: "#888", background: "none",
          border: "none", cursor: "pointer", padding: 0, marginBottom: "4px",
          display: "block",
        }}
      >
        {showRaw ? "▾ Hide" : "▸ Show"} raw API response
      </button>
      {showRaw && (
        <pre style={{
          fontSize: "11px", background: "#f5f5f3", borderRadius: "8px",
          padding: "10px 12px", overflow: "auto", maxHeight: "180px",
          border: "1px solid #e8e8e4", color: "#333", lineHeight: 1.5,
          fontFamily: "monospace", margin: 0,
        }}>
          {data.raw}
        </pre>
      )}
    </div>
  )
}

// ─── Image Analysis API call ──────────────────────────────────────────────────
// ✅ Uses API_GATEWAY_URL from top-level constants — no scope issue
// ✅ Prompt instructs Claude to return JSON so parsing works
// ✅ Content-Type: application/json is correct — image is base64 inside JSON,
//    NOT multipart/form-data (that's only for raw file uploads)

async function analyzeImageWithClaude(
  base64: string,
  mediaType: string,
  userText: string
): Promise<AnalysisResult> {
  const userPrompt = userText.trim() ||
    "Please analyze this image thoroughly. Describe what you see and identify key elements."

  const response = await fetch(API_GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Uncomment if your API Gateway requires an API key:
      // "x-api-key": "your-api-gateway-key",
    },
    body: JSON.stringify({
      // ✅ Include model only if your Lambda reads it from the request body.
      //    If your Lambda hardcodes the Bedrock model ID, remove this line.
      // model: ANTHROPIC_MODEL,
      // max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType, // e.g. "image/png"
                data: base64,          // pure base64, no "data:image/...;base64," prefix
              },
            },
            {
              type: "text",
              // ✅ JSON instruction so the response can be parsed into AnalysisResult
              text: `${userPrompt}\n\nRespond ONLY with a valid JSON object — no markdown fences, no extra text. Use exactly this shape:\n{"description":"...","detected":["tag1","tag2","tag3"],"confidence":0.95,"suggestion":"..."}`,
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gateway error ${response.status}: ${errText}`)
  }

  const data = await response.json()

  // Extract text block from Bedrock/Claude response
  const rawText: string = (data.content ?? [])
    .map((block: { type: string; text?: string }) =>
      block.type === "text" ? (block.text ?? "") : ""
    )
    .join("")

  // Strip accidental markdown fences, then parse JSON
  const clean = rawText.replace(/```json|```/g, "").trim()
  let parsed: Partial<AnalysisResult> = {}
  try {
    parsed = JSON.parse(clean)
  } catch {
    // If Claude didn't return JSON (e.g. plain text answer), use raw text as description
    parsed = {
      description: rawText || "No description returned.",
      detected: [],
      confidence: 0.5,
      suggestion: "",
    }
  }

  return {
    description: parsed.description ?? "No description returned.",
    detected:    parsed.detected    ?? [],
    confidence:  parsed.confidence  ?? 0,
    suggestion:  parsed.suggestion  ?? "",
    raw: JSON.stringify(data, null, 2),
  }
}

// ─── Main App ─────────────────────────────────────────────────────────────────

function App() {
  const [showSplash, setShowSplash]   = useState(true)
  const [messages, setMessages]       = useState<Message[]>([
    {
      id: 1,
      role: "ai",
      contents: [{ type: "text", text: "Hello! Ask me anything about your connected databases — or paste an image (Ctrl+V / Cmd+V) to have it analyzed." }],
    },
  ])
  const [input, setInput]             = useState("")
  const [isTyping, setIsTyping]       = useState(false)
  const [pendingImages, setPendingImages] = useState<{ src: string; mediaType: string }[]>([])
  const bottomRef   = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // ── Global paste handler ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault()
          const file = item.getAsFile()
          if (!file) continue
          const mediaType = item.type
          const reader = new FileReader()
          reader.onload = (ev) => {
            const result = ev.target?.result as string
            // result = "data:image/png;base64,XXXX..."
            setPendingImages((prev) => [...prev, { src: result, mediaType }])
          }
          reader.readAsDataURL(file)
        }
      }
    }
    document.addEventListener("paste", handler)
    return () => document.removeEventListener("paste", handler)
  }, [])

  // ── Auto-resize textarea ──────────────────────────────────────────────────
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 200) + "px"
  }

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() && pendingImages.length === 0) return

    const capturedImages = [...pendingImages]
    const capturedText   = input.trim()

    // Build user message bubble
    const userContents: MessageContent[] = []
    capturedImages.forEach(({ src }) => userContents.push({ type: "image", src }))
    if (capturedText) userContents.push({ type: "text", text: capturedText })

    setMessages((prev) => [...prev, { id: Date.now(), role: "user", contents: userContents }])
    setInput("")
    setPendingImages([])
    if (textareaRef.current) textareaRef.current.style.height = "auto"
    setIsTyping(true)

    if (capturedImages.length > 0) {
      // ── Image flow ────────────────────────────────────────────────────────
      try {
        const { src, mediaType } = capturedImages[0]
        const base64 = src.split(",")[1] // strip "data:image/png;base64," prefix

        const analysis = await analyzeImageWithClaude(base64, mediaType, capturedText)

        setMessages((prev) => [...prev, {
          id: Date.now() + 1,
          role: "ai",
          contents: [{ type: "analysis", data: analysis }],
        }])
      } catch (err) {
        setMessages((prev) => [...prev, {
          id: Date.now() + 1,
          role: "ai",
          contents: [{ type: "text", text: `Error analyzing image: ${(err as Error).message}` }],
        }])
      } finally {
        setIsTyping(false)
      }

    } else {
      // ── Text-only flow ────────────────────────────────────────────────────
      try {
        const response = await fetch(API_GATEWAY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // "x-api-key": "your-api-gateway-key",
          },
          body: JSON.stringify({
            // ✅ Include model only if your Lambda reads it from request body
            // model: ANTHROPIC_MODEL,
            // max_tokens: 1000,
            system: "You are OGIS AI, an intelligent assistant for querying and reasoning about databases. Connected sources: PostgreSQL (Production), MongoDB (Analytics), Firebase (Realtime). MySQL (Legacy DB) is currently offline. Be concise and helpful.",
            message: capturedText,
          }),
        })

        if (!response.ok) {
          const errText = await response.text()
          throw new Error(`Gateway error ${response.status}: ${errText}`)
        }

        const data = await response.json()
        const text: string =  data.reply || "No response received."

          console.log("data", data)

        setMessages((prev) => [...prev, {
          id: Date.now() + 1,
          role: "ai",
          contents: [{ type: "text", text }],
        }])
      } catch (err) {
        setMessages((prev) => [...prev, {
          id: Date.now() + 1,
          role: "ai",
          contents: [{ type: "text", text: `Error: ${(err as Error).message}` }],
        }])
      } finally {
        setIsTyping(false)
      }
    }
  }

  const connectedCount = sources.filter((s) => s.status === "connected").length
  const hasContent     = input.trim().length > 0 || pendingImages.length > 0

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      <div className="flex min-h-screen" style={{ background: "#f5f5f3", color: "#111" }}>

        {/* ── SIDEBAR ── */}
        <div
          className="hidden md:flex flex-col w-72"
          style={{ background: "#ffffff", borderRight: "1px solid #e8e8e4", padding: "24px 20px", gap: "24px" }}
        >
          <div style={{ paddingBottom: "16px", borderBottom: "1px solid #e8e8e4" }}>
            <img
              src={imageOgis} alt="OGIS"
              style={{ height: "36px", objectFit: "contain" }}
              onError={(e) => {
                const el = e.target as HTMLImageElement
                el.style.display = "none"
                const fallback = el.nextSibling as HTMLElement
                if (fallback) fallback.style.display = "block"
              }}
            />
            <span style={{ display: "none", fontWeight: 600, fontSize: "18px" }}>OGIS AI</span>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#888" }}>
                Data Sources
              </span>
              <span style={{ fontSize: "11px", background: "#f0faf5", color: "#16a364", border: "1px solid #bbf0d9", borderRadius: "20px", padding: "2px 8px", fontWeight: 500 }}>
                {connectedCount} online
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {sources.map((src) => (
                <div
                  key={src.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "10px 12px", borderRadius: "10px", border: "1px solid transparent",
                    cursor: "default", transition: "background 0.15s, border-color 0.15s",
                    background: src.status === "connected" ? "#fafaf9" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.background = "#f5f5f3"
                    el.style.borderColor = "#e8e8e4"
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.background = src.status === "connected" ? "#fafaf9" : "transparent"
                    el.style.borderColor = "transparent"
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{src.icon}</span>
                  <span style={{ fontSize: "13px", flex: 1, color: "#333" }}>{src.name}</span>
                  <span style={{
                    width: "7px", height: "7px", borderRadius: "50%",
                    background: src.status === "connected" ? "#22c55e" : "#d1d5db", flexShrink: 0,
                  }} />
                </div>
              ))}
            </div>
          </div>

          {/* Paste hint */}
          <div style={{ background: "#f5f5f3", borderRadius: "10px", padding: "12px 14px" }}>
            <p style={{ fontSize: "12px", color: "#888", lineHeight: 1.5, margin: 0 }}>
              <strong style={{ color: "#555" }}>💡 Tip:</strong> Paste any image (Ctrl+V) into the chat to analyze it with AI.
            </p>
          </div>

          <div style={{ marginTop: "auto" }}>
            <div style={{ background: "#f5f5f3", borderRadius: "10px", padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <IoFlashOutline size={16} style={{ color: "#888", marginTop: "1px", flexShrink: 0 }} />
              <p style={{ fontSize: "12px", color: "#888", lineHeight: 1.5, margin: 0 }}>
                Ask anything about your connected databases. OGIS AI will query intelligently.
              </p>
            </div>
          </div>
        </div>

        {/* ── MAIN ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

          {/* HEADER */}
          <div style={{ background: "#ffffff", borderBottom: "1px solid #e8e8e4", padding: "16px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <IoFlashOutline size={17} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: "15px", fontWeight: 600, margin: 0 }}>OGIS AI Assistant</h1>
              <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>{connectedCount} sources connected · AWS Bedrock</p>
            </div>
          </div>

          {/* CHAT MESSAGES */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                {msg.role === "ai" && (
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "8px", background: "#111",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginRight: "8px", flexShrink: 0, alignSelf: "flex-end",
                  }}>
                    <IoFlashOutline size={14} color="#fff" />
                  </div>
                )}
                <div style={{
                  maxWidth: "75%",
                  padding: "12px 16px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.role === "user" ? "#111" : "#ffffff",
                  color: msg.role === "user" ? "#ffffff" : "#111",
                  border: msg.role === "ai" ? "1px solid #e8e8e4" : "none",
                  fontSize: "14px", lineHeight: 1.6,
                  wordBreak: "break-word", overflowWrap: "break-word", minWidth: 0,
                }}>
                  {msg.contents.map((content, i) => {
                    if (content.type === "text") {
                      return <span key={i} style={{ whiteSpace: "pre-wrap" }}>{content.text}</span>
                    }
                    if (content.type === "image") {
                      return (
                        <img
                          key={i}
                          src={content.src}
                          alt="Pasted image"
                          style={{
                            maxWidth: "220px", maxHeight: "180px", borderRadius: "10px",
                            display: "block", marginBottom: "6px", objectFit: "cover",
                            border: "0.5px solid rgba(255,255,255,0.15)",
                          }}
                        />
                      )
                    }
                    if (content.type === "analysis") {
                      return <AnalysisBlock key={i} data={content.data} />
                    }
                    return null
                  })}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <IoFlashOutline size={14} color="#fff" />
                </div>
                <div style={{ padding: "12px 16px", borderRadius: "18px 18px 18px 4px", background: "#ffffff", border: "1px solid #e8e8e4", display: "flex", gap: "4px", alignItems: "center" }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#999", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`, display: "inline-block" }} />
                  ))}
                </div>
                <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.85)}50%{opacity:1;transform:scale(1)}}`}</style>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* INPUT AREA */}
          <div style={{ background: "#ffffff", borderTop: "1px solid #e8e8e4", padding: "16px 24px" }}>

            {/* Image thumbnail strip */}
            {pendingImages.length > 0 && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                {pendingImages.map((img, idx) => (
                  <div key={idx} style={{ position: "relative", width: "60px", height: "60px", borderRadius: "10px", overflow: "hidden", border: "1px solid #e8e8e4", flexShrink: 0 }}>
                    <img src={img.src} alt="Pending" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      onClick={() => setPendingImages((prev) => prev.filter((_, i) => i !== idx))}
                      style={{
                        position: "absolute", top: "3px", right: "3px",
                        background: "rgba(0,0,0,0.55)", border: "none", cursor: "pointer",
                        borderRadius: "50%", padding: 0, display: "flex", color: "#fff",
                      }}
                      aria-label="Remove image"
                    >
                      <IoCloseCircle size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                position: "relative", background: "#f5f5f3",
                borderRadius: "16px", border: "1px solid #e8e8e4", transition: "border-color 0.15s",
              }}
              onFocusCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#111" }}
              onBlurCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#e8e8e4" }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                rows={1}
                placeholder={pendingImages.length > 0 ? "Add a message or send image as-is…" : "Ask something or paste an image (Ctrl+V)…"}
                style={{
                  width: "100%", resize: "none", borderRadius: "16px", border: "none",
                  background: "transparent", padding: "14px 52px 14px 16px",
                  fontSize: "14px", outline: "none", color: "#111",
                  lineHeight: 1.5, boxSizing: "border-box",
                  overflow: "hidden", maxHeight: "200px", display: "block",
                  fontFamily: "inherit",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
                }}
              />
              <button
                onClick={handleSend}
                disabled={!hasContent || isTyping}
                style={{
                  position: "absolute", bottom: "10px", right: "10px",
                  width: "34px", height: "34px", borderRadius: "10px",
                  background: hasContent && !isTyping ? "#111" : "#e8e8e4",
                  border: "none", cursor: hasContent && !isTyping ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s, transform 0.1s",
                }}
                onMouseDown={(e) => { if (hasContent) (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.92)" }}
                onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)" }}
              >
                <IoArrowUp size={16} color={hasContent && !isTyping ? "#fff" : "#aaa"} />
              </button>
            </div>

            <p style={{ fontSize: "11px", color: "#bbb", textAlign: "center", margin: "8px 0 0" }}>
              Enter to send · Shift+Enter for new line · Ctrl+V / Cmd+V to paste image
            </p>
          </div>

        </div>
      </div>
    </>
  )
}

export default App