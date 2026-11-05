import { useState, useEffect, useRef } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { 
  Sparkles, 
  X, 
  Send, 
  RotateCcw, 
  Bot, 
  User as UserIcon, 
  Minimize2, 
  Maximize2,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Cpu
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { sendChatMessage, getAiSuggestions } from '../../services/ai.service'
import clsx from 'clsx'

// Helper to render inline tokens (bold, code, plain text)
function renderInlineText(text) {
  if (!text) return null
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`)/g
  const tokens = text.split(tokenRegex)
  return tokens.map((part, pIdx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={pIdx} className="font-semibold text-emerald-300">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={pIdx} className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

// Markdown Renderer for rich text, tables, headings, bolding, code tags, and lists
function FormattedMessage({ content }) {
  if (!content) return null

  const lines = content.split('\n')
  const blocks = []
  let currentTable = null

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    // Detect markdown table rows: starts and ends with '|'
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      // Is separator row like |---|---|
      const isSeparator = /^\|[\s\-:|]+\|$/.test(trimmed)
      if (!isSeparator) {
        const cells = trimmed
          .slice(1, -1)
          .split('|')
          .map(c => c.trim())
        if (!currentTable) {
          currentTable = { headers: cells, rows: [] }
        } else {
          currentTable.rows.push(cells)
        }
      }
      continue
    } else if (currentTable) {
      // End of table
      blocks.push({ type: 'table', data: currentTable })
      currentTable = null
    }

    if (!trimmed) {
      blocks.push({ type: 'spacer' })
      continue
    }

    if (trimmed === '---' || trimmed === '***') {
      blocks.push({ type: 'divider' })
      continue
    }

    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'heading3', text: trimmed.slice(4) })
      continue
    }
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'heading2', text: trimmed.slice(3) })
      continue
    }
    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'heading1', text: trimmed.slice(2) })
      continue
    }

    if (trimmed.startsWith('> ')) {
      blocks.push({ type: 'quote', text: trimmed.slice(2) })
      continue
    }

    // Numbered list: e.g. "1. " or "1) "
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/)
    if (numMatch) {
      blocks.push({ type: 'numbered', num: numMatch[1], text: numMatch[2] })
      continue
    }

    // Bullet points: e.g. "- ", "* ", "• "
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      blocks.push({ type: 'bullet', text: trimmed.replace(/^(\*|-|•)\s+/, '') })
      continue
    }

    blocks.push({ type: 'paragraph', text: trimmed })
  }

  if (currentTable) {
    blocks.push({ type: 'table', data: currentTable })
  }

  return (
    <div className="space-y-1.5 text-sm leading-relaxed text-white/90 break-words">
      {blocks.map((block, idx) => {
        if (block.type === 'spacer') {
          return <div key={idx} className="h-1" />
        }
        if (block.type === 'divider') {
          return <hr key={idx} className="border-emerald-500/20 my-2" />
        }
        if (block.type === 'heading1' || block.type === 'heading2' || block.type === 'heading3') {
          return (
            <h4 key={idx} className="text-emerald-300 font-semibold text-sm pt-1.5 pb-0.5 border-b border-emerald-500/20 flex items-center gap-1.5">
              <span>{renderInlineText(block.text)}</span>
            </h4>
          )
        }
        if (block.type === 'quote') {
          return (
            <div key={idx} className="border-l-2 border-emerald-400 bg-emerald-950/40 px-2.5 py-1.5 rounded-r text-xs text-emerald-200/90 italic">
              {renderInlineText(block.text)}
            </div>
          )
        }
        if (block.type === 'numbered') {
          return (
            <div key={idx} className="flex items-start gap-2 text-white/85">
              <span className="inline-flex items-center justify-center bg-emerald-800/70 border border-emerald-500/30 text-emerald-200 rounded-full w-4 h-4 text-[10px] font-bold mt-0.5 shrink-0">
                {block.num}
              </span>
              <div className="flex-1">{renderInlineText(block.text)}</div>
            </div>
          )
        }
        if (block.type === 'bullet') {
          return (
            <div key={idx} className="flex items-start gap-2 text-white/85">
              <span className="text-emerald-400 mt-1 font-bold text-xs">•</span>
              <div className="flex-1">{renderInlineText(block.text)}</div>
            </div>
          )
        }
        if (block.type === 'table') {
          const { headers, rows } = block.data
          return (
            <div key={idx} className="my-2 overflow-x-auto rounded-lg border border-emerald-500/30 bg-emerald-950/40 shadow-sm">
              <table className="min-w-full divide-y divide-emerald-500/20 text-xs">
                {headers && headers.length > 0 && (
                  <thead className="bg-emerald-900/60">
                    <tr>
                      {headers.map((h, hIdx) => (
                        <th key={hIdx} className="px-2.5 py-1.5 text-left font-semibold text-emerald-200 whitespace-nowrap">
                          {renderInlineText(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody className="divide-y divide-emerald-500/10">
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-emerald-900/20 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-2.5 py-1.5 text-white/90 whitespace-normal">
                          {renderInlineText(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        return <p key={idx}>{renderInlineText(block.text)}</p>
      })}
    </div>
  )
}

export default function FarmBotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [modelBadge, setModelBadge] = useState('Groq LPU')
  
  const { user } = useAuth()
  const location = useLocation()
  const params = useParams()

  // Detect active context from location and route
  const currentRole = user?.role || 'consumer'
  
  // Extract batchId from URL if present (e.g. /trace/:id or /farmer/batches/:id or /purchaser/purchase/:id)
  const urlBatchId = location.pathname.includes('/trace/') 
    ? location.pathname.split('/trace/')[1]?.split('/')[0]
    : location.pathname.includes('/batches/') 
      ? location.pathname.split('/batches/')[1]?.split('/')[0]
      : location.pathname.includes('/purchase/')
        ? location.pathname.split('/purchase/')[1]?.split('/')[0]
        : null

  // Initial greeting
  const getInitialMessage = () => {
    if (urlBatchId) {
      return `Hello${user?.name ? ' ' + user.name : ''}! I am **FarmBot**, powered by **Groq AI**. I see you are inspecting batch \`${urlBatchId}\`. Ask me about its organic score, fertilizer dosages, or blockchain provenance!`
    }
    switch (currentRole) {
      case 'farmer':
        return `Hello ${user?.name || 'Farmer'}! 🌾 I am **FarmBot** on Groq AI. Need advice on organic fertilizers, improving your trust score, or preparing batch documentation? Ask away!`
      case 'purchaser':
        return `Welcome ${user?.name || 'Partner'}! 🛒 I can assist you with batch provenance, evaluating farmer trust scores, or finding verified organic crops.`
      case 'admin':
        return `Admin Copilot active. 🛡️ I can help analyze ML anomaly indicators, verify batch parameters, or review dispute claims.`
      case 'consumer':
      default:
        return `Welcome to **Farm to Plate**! 🌿 I am your AI food traceability guide. Ask me how food is tracked from seed to plate, or how our blockchain ensures authentic organic produce.`
    }
  }

  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      role: 'assistant',
      content: getInitialMessage()
    }
  ])

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading, isOpen, isMinimized])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen, isMinimized])

  // Fetch contextual suggestions when route or role changes
  useEffect(() => {
    let isMounted = true
    getAiSuggestions(currentRole, urlBatchId)
      .then(res => {
        if (isMounted && res?.suggestions) {
          setSuggestions(res.suggestions)
        }
      })
      .catch(() => {
        // Fallback default suggestions
        if (isMounted) {
          setSuggestions([
            'How is the organic score calculated?',
            'How does blockchain guarantee provenance?',
            'What makes a batch verified?'
          ])
        }
      })
    return () => { isMounted = false }
  }, [currentRole, urlBatchId])

  // Handle sending a message
  const handleSend = async (textToSend) => {
    const text = (typeof textToSend === 'string' ? textToSend : inputMessage).trim()
    if (!text || loading) return

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInputMessage('')
    setLoading(true)

    try {
      const payloadMessages = updatedMessages
        .filter(m => m.id !== 'init-1' || updatedMessages.length === 2)
        .map(m => ({ role: m.role, content: m.content }))

      const response = await sendChatMessage(payloadMessages, {
        role: currentRole,
        batchId: urlBatchId,
        page: location.pathname,
        userId: user?._id || user?.id,
        userName: user?.name,
        userEmail: user?.email
      })

      if (response?.reply) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.reply
          }
        ])
        if (response.model) {
          setModelBadge(response.model.replace('groq/', '').replace('qwen/', ''))
        }
        if (response.suggestions?.length) {
          setSuggestions(response.suggestions)
        }
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '⚠️ *Sorry, I could not process your request at the moment. Please ensure your Groq API key is valid or try again shortly.*'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Clear conversation
  const handleReset = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: getInitialMessage()
      }
    ])
  }

  return (
    <aside aria-label="FarmBot AI Assistant" className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Trigger Button (When Closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-950/40 hover:shadow-emerald-500/25 hover:scale-105 transition-all duration-300 border border-emerald-300/30"
          title="Open FarmBot AI Assistant"
        >
          <div className="relative">
            <Bot size={22} className="text-white drop-shadow group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
          </div>
          <span className="font-semibold text-sm tracking-wide">Ask FarmBot</span>
          <span className="bg-emerald-900/60 border border-emerald-400/30 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded text-emerald-200">
            Groq AI
          </span>
        </button>
      )}

      {/* Chat Window (When Open) */}
      {isOpen && (
        <div 
          className={clsx(
            "w-[390px] sm:w-[430px] max-w-[calc(100vw-32px)] bg-[#07160e]/95 backdrop-blur-2xl border border-emerald-500/30 rounded-2xl shadow-2xl shadow-black/80 flex flex-col transition-all duration-300 overflow-hidden",
            isMinimized ? "h-14" : "h-[580px] max-h-[85vh]"
          )}
        >
          {/* Header */}
          <header className="px-4 py-3 bg-gradient-to-r from-[#0d2a1c] to-[#0a1f15] border-b border-emerald-500/20 flex items-center justify-between flex-shrink-0 select-none">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md border border-emerald-300/30">
                <Bot size={20} />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0d2a1c]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm tracking-wide">FarmBot AI</h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono font-medium flex items-center gap-1">
                    <Cpu size={10} />
                    {modelBadge}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400/80">
                  <span className="capitalize">{currentRole} mode</span>
                  {urlBatchId && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-300 font-mono text-[11px] truncate max-w-[110px]" title={urlBatchId}>
                        #{urlBatchId}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                title="Clear conversation"
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={() => setIsMinimized(v => !v)}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-red-500/20 hover:text-red-300 transition-colors"
                title="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </header>

          {/* Active Context Banner (When on batch page) */}
          {!isMinimized && urlBatchId && (
            <div className="bg-emerald-950/60 border-b border-emerald-500/20 px-3.5 py-1.5 flex items-center justify-between text-xs text-emerald-200">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400 flex-shrink-0" />
                <span className="truncate">Active context: Batch <code className="text-emerald-300 font-mono font-semibold">{urlBatchId}</code></span>
              </div>
              <span className="text-[10px] text-emerald-400/70 uppercase tracking-wider font-semibold">Live Data</span>
            </div>
          )}

          {/* Messages Area */}
          {!isMinimized && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent">
              {messages.map((m) => {
                const isAssistant = m.role === 'assistant'
                return (
                  <div
                    key={m.id}
                    className={clsx(
                      "flex gap-2.5",
                      isAssistant ? "justify-start" : "justify-end"
                    )}
                  >
                    {isAssistant && (
                      <div className="w-7 h-7 rounded-lg bg-emerald-900/60 border border-emerald-500/30 flex items-center justify-center text-emerald-300 flex-shrink-0 mt-0.5">
                        <Bot size={15} />
                      </div>
                    )}
                    <div
                      className={clsx(
                        "max-w-[82%] px-3.5 py-2.5 rounded-2xl",
                        isAssistant
                          ? "bg-white/[0.06] border border-white/10 rounded-tl-none text-white shadow-sm"
                          : "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-tr-none shadow-md shadow-emerald-950/50"
                      )}
                    >
                      {isAssistant ? (
                        <FormattedMessage content={m.content} />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Loading indicator */}
              {loading && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-7 h-7 rounded-lg bg-emerald-900/60 border border-emerald-500/30 flex items-center justify-center text-emerald-300 flex-shrink-0 mt-0.5 animate-pulse">
                    <Sparkles size={15} />
                  </div>
                  <div className="bg-white/[0.06] border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-white/50 italic ml-1">Groq AI is analyzing...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Quick Suggestions Chips */}
          {!isMinimized && suggestions.length > 0 && !loading && (
            <div className="px-3 py-2 border-t border-white/5 bg-black/20 flex gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
              {suggestions.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="text-xs text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-600/30 hover:border-emerald-500/60 px-2.5 py-1 rounded-full whitespace-nowrap transition-all duration-200 flex-shrink-0 text-left"
                >
                  💡 {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          {!isMinimized && (
            <footer className="p-3 border-t border-emerald-500/20 bg-[#06120b] flex-shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend()
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about crops, organic scores, blockchain..."
                  disabled={loading}
                  className="flex-1 bg-white/[0.06] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || loading}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white flex items-center justify-center shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0"
                  title="Send message"
                >
                  <Send size={16} />
                </button>
              </form>
              <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-white/40">
                <span>Powered by Groq LPUs</span>
                <span>Press Enter ↵ to send</span>
              </div>
            </footer>
          )}
        </div>
      )}
    </aside>
  )
}
