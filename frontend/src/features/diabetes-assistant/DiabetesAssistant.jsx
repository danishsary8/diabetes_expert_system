import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Apple,
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  Check,
  ChevronRight,
  Copy,
  GripHorizontal,
  HeartPulse,
  Languages,
  Layers,
  Microscope,
  RotateCcw,
  ShieldCheck,
  Siren,
  Sparkles,
  Thermometer,
  X,
} from 'lucide-react'
import { ASSISTANT_COPY, DIABETES_QUESTIONS } from './diabetesQuestions'
import { FormattedMessage } from './FormattedMessage'
import { DrBot3D } from './DrBot3D'
import { useLanguage } from '@/contexts/LanguageContext'
import './DiabetesAssistant.css'

const STORAGE_KEY = 'diabetes-assistant-conversation:v4'
const PANEL_PLACEMENT_STORAGE_KEY = 'diabetes-assistant-placement:v1'
const TRIGGER_PLACEMENT_STORAGE_KEY = 'diabetes-assistant-trigger-placement:v1'
const DESKTOP_MEDIA_QUERY = '(min-width: 768px)'
const DESKTOP_EDGE_GAP = 24
const DESKTOP_TRIGGER_GAP = 124
const MASCOT_GREETINGS = ['Hello! 👋', 'How can I help you?']

const CONVERSATION_STAGES = {
  INTRO: 'intro',
  TOPICS: 'topics',
  FOLLOW_UP: 'follow-up',
  COMPLETE: 'complete',
  ANSWERING: 'answering',
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

function readStoredPlacement(storageKey) {
  if (typeof window === 'undefined') return null

  try {
    const placement = JSON.parse(window.localStorage.getItem(storageKey))
    if (['left', 'right'].includes(placement?.side) && Number.isFinite(placement?.y)) {
      return placement
    }
  } catch {
    // Default placement is used when local storage is unavailable or malformed.
  }

  return null
}

function createMessage(sender, text, options = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sender,
    text,
    translation: options.translation || null,
    isStreaming: Boolean(options.isStreaming),
  }
}

function createInitialConversation() {
  return {
    stage: CONVERSATION_STAGES.INTRO,
    messages: [
      createMessage('bot', ASSISTANT_COPY.welcome.en, {
        translation: ASSISTANT_COPY.welcome.km,
        isStreaming: false,
      }),
    ],
  }
}

function readStoredConversation() {
  if (typeof window === 'undefined') return createInitialConversation()

  try {
    const stored = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY))
    const validStage = Object.values(CONVERSATION_STAGES).includes(stored?.stage)
    const validMessages =
      Array.isArray(stored?.messages) &&
      stored.messages.length > 0 &&
      stored.messages.every(
        (message) =>
          typeof message?.id === 'string' &&
          ['bot', 'user'].includes(message?.sender) &&
          typeof message?.text === 'string'
      )

    if (validStage && validMessages) {
      return {
        stage: stored.stage === CONVERSATION_STAGES.ANSWERING ? CONVERSATION_STAGES.TOPICS : stored.stage,
        messages: stored.messages.map((m) => {
          let translation = m.translation || null
          if (!translation && m.sender === 'bot') {
            const qMatch = DIABETES_QUESTIONS.find((q) => q.answer === m.text)
            if (qMatch) translation = qMatch.answerKm
            else if (m.text === ASSISTANT_COPY.welcome.en) translation = ASSISTANT_COPY.welcome.km
            else if (m.text === ASSISTANT_COPY.topicPrompt.en) translation = ASSISTANT_COPY.topicPrompt.km
            else if (m.text === ASSISTANT_COPY.followUp.en) translation = ASSISTANT_COPY.followUp.km
            else if (m.text === ASSISTANT_COPY.initialDecline.en) translation = ASSISTANT_COPY.initialDecline.km
            else if (m.text === ASSISTANT_COPY.finished.en) translation = ASSISTANT_COPY.finished.km
          }
          return { ...m, isStreaming: false, translation }
        }),
      }
    }
  } catch {
    // Malformed session store does not prevent opening.
  }

  return createInitialConversation()
}

/**
 * Typewriter writing animation for bot messages. Completion fires exactly
 * once per message, even if the parent re-renders mid-stream.
 */
function StreamingMessageContent({ text, isStreaming, onStreamingComplete, onScrollToBottom }) {
  const [displayedLength, setDisplayedLength] = useState(isStreaming ? 0 : text.length)
  const isDone = displayedLength >= text.length
  const completeRef = useRef(onStreamingComplete)
  const scrollRef = useRef(onScrollToBottom)
  const firedRef = useRef(!isStreaming)
  completeRef.current = onStreamingComplete
  scrollRef.current = onScrollToBottom

  const finish = useCallback(() => {
    if (firedRef.current) return
    firedRef.current = true
    completeRef.current?.()
  }, [])

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedLength(text.length)
      return undefined
    }

    // Snappy, natural pacing without being slow
    const stepSize = Math.max(1, Math.floor(text.length / 85))
    let shown = 0
    const interval = setInterval(() => {
      shown = Math.min(text.length, shown + stepSize)
      setDisplayedLength(shown)
      scrollRef.current?.()
      if (shown >= text.length) {
        clearInterval(interval)
        finish()
      }
    }, 16)

    return () => clearInterval(interval)
  }, [text, isStreaming, finish])

  const handleClickToSkip = () => {
    if (!isDone) {
      setDisplayedLength(text.length)
      finish()
    }
  }

  const visibleText = text.slice(0, displayedLength)

  return (
    <div
      onClick={handleClickToSkip}
      className={!isDone ? 'cursor-pointer select-none' : ''}
      title={!isDone ? 'Click to show full response' : undefined}
    >
      <FormattedMessage content={visibleText} />
      {!isDone && <span className="assistant-cursor" />}
    </div>
  )
}

/** Round bot avatar with a gradient ring. */
function BotAvatar({ size = 'sm' }) {
  return (
    <span
      className={[
        'assistant-avatar relative flex shrink-0 items-center justify-center rounded-full',
        size === 'lg' ? 'h-11 w-11 p-[2px]' : 'h-8 w-8 p-[2px]',
      ].join(' ')}
      aria-hidden="true"
    >
      <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white p-0.5 dark:bg-slate-900">
        <img src="/images/dr-bot.png" alt="" className="h-full w-full object-contain" />
      </span>
    </span>
  )
}

/**
 * Message bubbles with Copy and Translate actions.
 */
function ChatMessage({ message, onStreamingComplete, onScrollToBottom }) {
  const isUser = message.sender === 'user'
  const [copied, setCopied] = useState(false)
  const [isTranslated, setIsTranslated] = useState(false)

  const hasTranslation = Boolean(message.translation)
  const currentText = isTranslated && hasTranslation ? message.translation : message.text

  const handleCopy = (e) => {
    e.stopPropagation()
    const plain = currentText.replace(/\*\*/g, '').replace(/^[•\-]\s*/gm, '• ')
    navigator.clipboard.writeText(plain)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const handleToggleTranslate = (e) => {
    e.stopPropagation()
    setIsTranslated((prev) => !prev)
  }

  return (
    <div className={`assistant-msg-in flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <BotAvatar />}

      <div className={isUser ? 'max-w-[80%]' : 'max-w-[86%]'}>
        <div
          className={[
            'relative px-4 py-2.5 text-left text-[13px] leading-relaxed sm:text-sm',
            isUser
              ? 'assistant-bubble-user rounded-[20px] rounded-br-md font-medium text-white'
              : 'rounded-[20px] rounded-bl-md border border-slate-200/70 bg-white text-slate-800 shadow-[0_6px_20px_-12px_rgba(15,23,42,0.25)] dark:border-slate-700/70 dark:bg-slate-800 dark:text-slate-100',
          ].join(' ')}
        >
          {isUser ? (
            <div className="whitespace-pre-line text-white">{message.text}</div>
          ) : (
            <>
              <StreamingMessageContent
                text={currentText}
                isStreaming={message.isStreaming}
                onStreamingComplete={onStreamingComplete}
                onScrollToBottom={onScrollToBottom}
              />

              {!message.isStreaming && (
                <div className="-mb-1 mt-2 flex select-none items-center justify-end gap-1 border-t border-slate-100 pt-1.5 dark:border-slate-700/60">
                  {hasTranslation && (
                    <button
                      type="button"
                      onClick={handleToggleTranslate}
                      className={[
                        'inline-flex h-7 items-center gap-1 rounded-full px-2 text-[11px] font-semibold transition-colors',
                        isTranslated
                          ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300'
                          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-200',
                      ].join(' ')}
                      title={isTranslated ? 'Show English' : 'បកប្រែជាភាសាខ្មែរ (Translate to Khmer)'}
                      aria-label="Translate message"
                      aria-pressed={isTranslated}
                    >
                      <Languages className="h-3.5 w-3.5" />
                      <span>{isTranslated ? 'EN' : 'ខ្មែរ'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-200"
                    title={copied ? 'Copied' : 'Copy message'}
                    aria-label="Copy message"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** Three-dot typing bubble. */
function AiTypingIndicator() {
  return (
    <div className="assistant-msg-in flex items-end justify-start gap-2" aria-label="Assistant is typing">
      <BotAvatar />
      <div className="flex items-center gap-1.5 rounded-[20px] rounded-bl-md border border-slate-200/70 bg-white px-4 py-3 shadow-[0_6px_20px_-12px_rgba(15,23,42,0.25)] dark:border-slate-700/70 dark:bg-slate-800">
        <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400" />
      </div>
    </div>
  )
}

// Icon and colour for each suggested topic.
const TOPIC_STYLE = {
  'what-is-diabetes': { icon: BookOpen, tone: 'bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300' },
  symptoms: { icon: Thermometer, tone: 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300' },
  'diabetes-types': { icon: Layers, tone: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300' },
  diagnosis: { icon: Microscope, tone: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300' },
  prevention: { icon: ShieldCheck, tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300' },
  'healthy-eating': { icon: Apple, tone: 'bg-lime-100 text-lime-700 dark:bg-lime-950/60 dark:text-lime-300' },
  'daily-management': { icon: CalendarCheck, tone: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
  'urgent-help': { icon: Siren, tone: 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300' },
}

/**
 * Quick replies (Yes / No) and the suggested-topic grid.
 */
function ChatOptions({ stage, onChooseIntro, onChooseQuestion, onChooseFollowUp, onBack, disabled = false }) {
  const { language } = useLanguage()
  const isKhmer = language === 'km'

  if (stage === CONVERSATION_STAGES.INTRO || stage === CONVERSATION_STAGES.FOLLOW_UP) {
    const isIntro = stage === CONVERSATION_STAGES.INTRO
    const onSelect = isIntro ? onChooseIntro : onChooseFollowUp

    return (
      <div className="assistant-msg-in flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelect(true)}
          className="assistant-bubble-user inline-flex h-10 min-w-[96px] items-center justify-center gap-1.5 rounded-full px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300/50"
        >
          <Check className="h-4 w-4" />
          <span>Yes</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelect(false)}
          className="inline-flex h-10 min-w-[96px] items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600"
        >
          <X className="h-4 w-4 text-slate-400" />
          <span>No</span>
        </button>
      </div>
    )
  }

  if (stage === CONVERSATION_STAGES.TOPICS) {
    return (
      <div className="assistant-msg-in rounded-3xl border border-slate-200/70 bg-white/90 p-3 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.3)] backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/90">
        <div className="mb-2 flex items-center justify-between px-1.5 pt-0.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
            <Sparkles className="h-3.5 w-3.5 text-teal-500" />
            {isKhmer ? 'ប្រធានបទដែលបានណែនាំ' : 'Suggested topics'}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {DIABETES_QUESTIONS.length} {isKhmer ? 'ប្រធានបទ' : 'topics'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-1.5 min-[420px]:grid-cols-2">
          {DIABETES_QUESTIONS.map((item) => {
            const isUrgent = item.id === 'urgent-help'
            const style = TOPIC_STYLE[item.id] || { icon: HeartPulse, tone: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300' }
            const TopicIcon = style.icon
            const questionTitle = isKhmer ? item.displayQuestionKm || item.displayQuestion : item.displayQuestion || item.question

            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => onChooseQuestion(item)}
                className={[
                  'group flex min-h-[52px] w-full items-center gap-2.5 rounded-2xl border px-2.5 py-2 text-left text-xs font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300/50',
                  isUrgent
                    ? 'border-red-200 bg-red-50/70 text-red-800 hover:border-red-300 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200'
                    : 'border-slate-200/70 bg-white text-slate-700 hover:border-teal-300 dark:border-slate-700/70 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-teal-700',
                ].join(' ')}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${style.tone}`}>
                  <TopicIcon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 leading-snug">{questionTitle}</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500 dark:text-slate-600" />
              </button>
            )
          })}
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={onBack}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{isKhmer ? 'ត្រឡប់ក្រោយ' : 'Back'}</span>
        </button>
      </div>
    )
  }

  return null
}

export function DiabetesAssistant() {
  const { language } = useLanguage()
  const isKhmer = language === 'km'
  const isDesktopViewport = typeof window !== 'undefined' && window.matchMedia(DESKTOP_MEDIA_QUERY).matches
  const [isOpen, setIsOpen] = useState(false)
  const [conversation, setConversation] = useState(readStoredConversation)
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [panelPosition, setPanelPosition] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [triggerPosition, setTriggerPosition] = useState(null)
  const [isTriggerDragging, setIsTriggerDragging] = useState(false)
  const [greetingIndex, setGreetingIndex] = useState(0)

  const messageEndRef = useRef(null)
  const panelRef = useRef(null)
  const triggerRef = useRef(null)
  const dragStateRef = useRef(null)
  const triggerDragStateRef = useRef(null)
  const lastTriggerDragAtRef = useRef(0)
  const pendingTimeoutsRef = useRef([])

  const scheduleTimeout = useCallback((fn, delay) => {
    const id = setTimeout(fn, delay)
    pendingTimeoutsRef.current.push(id)
    return id
  }, [])

  const clearAllTimeouts = useCallback(() => {
    pendingTimeoutsRef.current.forEach(clearTimeout)
    pendingTimeoutsRef.current = []
  }, [])

  useEffect(() => {
    return () => clearAllTimeouts()
  }, [clearAllTimeouts])

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(conversation))
    } catch {
      // Session storage persistence is best-effort.
    }
  }, [conversation])

  const scrollToBottom = useCallback(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [conversation, isOpen, isAiTyping, scrollToBottom])

  useEffect(() => {
    if (!isOpen) return undefined

    function closeOnEscape(event) {
      if (event.key === 'Escape') closeAssistant()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  useEffect(() => {
    let frameId

    function placePanel() {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(() => {
        if (!window.matchMedia(DESKTOP_MEDIA_QUERY).matches) {
          dragStateRef.current = null
          setIsDragging(false)
          setPanelPosition(null)
          return
        }

        const panel = panelRef.current
        if (!panel) return

        const rect = panel.getBoundingClientRect()
        const storedPlacement = readStoredPlacement(PANEL_PLACEMENT_STORAGE_KEY)
        const side = storedPlacement?.side || 'right'
        const defaultY = window.innerHeight - rect.height - DESKTOP_TRIGGER_GAP
        const y = clamp(
          storedPlacement?.y ?? defaultY,
          DESKTOP_EDGE_GAP,
          window.innerHeight - rect.height - DESKTOP_EDGE_GAP
        )
        const x = side === 'left' ? DESKTOP_EDGE_GAP : window.innerWidth - rect.width - DESKTOP_EDGE_GAP

        setPanelPosition({ x, y })
      })
    }

    placePanel()
    window.addEventListener('resize', placePanel)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', placePanel)
    }
  }, [isOpen])

  useEffect(() => {
    let frameId

    function placeTrigger() {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(() => {
        if (!window.matchMedia(DESKTOP_MEDIA_QUERY).matches) {
          triggerDragStateRef.current = null
          setIsTriggerDragging(false)
          setTriggerPosition(null)
          return
        }

        const trigger = triggerRef.current
        if (!trigger) return

        const rect = trigger.getBoundingClientRect()
        const storedPlacement = readStoredPlacement(TRIGGER_PLACEMENT_STORAGE_KEY)
        const side = storedPlacement?.side || 'right'
        const defaultY = window.innerHeight - rect.height - DESKTOP_EDGE_GAP
        const y = clamp(
          storedPlacement?.y ?? defaultY,
          DESKTOP_EDGE_GAP,
          window.innerHeight - rect.height - DESKTOP_EDGE_GAP
        )
        const x = side === 'left' ? DESKTOP_EDGE_GAP : window.innerWidth - rect.width - DESKTOP_EDGE_GAP

        setTriggerPosition({ x, y })
      })
    }

    placeTrigger()
    window.addEventListener('resize', placeTrigger)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', placeTrigger)
    }
  }, [])

  useEffect(() => {
    if (isOpen) return undefined

    const interval = setInterval(() => {
      setGreetingIndex((prev) => (prev + 1) % MASCOT_GREETINGS.length)
    }, 4500)

    return () => clearInterval(interval)
  }, [isOpen])

  function appendSingleMessage(msg) {
    setConversation((prev) => ({
      ...prev,
      messages: [...prev.messages, msg],
    }))
  }

  function handleIntroChoice(hasQuestion) {
    clearAllTimeouts()
    if (hasQuestion) {
      appendSingleMessage(createMessage('user', 'Yes'))
      setConversation((prev) => ({ ...prev, stage: CONVERSATION_STAGES.ANSWERING }))
      setIsAiTyping(true)

      scheduleTimeout(() => {
        setIsAiTyping(false)
        appendSingleMessage(
          createMessage('bot', ASSISTANT_COPY.topicPrompt.en, {
            translation: ASSISTANT_COPY.topicPrompt.km,
            isStreaming: true,
          })
        )
      }, 500)
      return
    }

    appendSingleMessage(createMessage('user', 'No'))
    setConversation((prev) => ({ ...prev, stage: CONVERSATION_STAGES.ANSWERING }))
    setIsAiTyping(true)

    scheduleTimeout(() => {
      setIsAiTyping(false)
      appendSingleMessage(
        createMessage('bot', ASSISTANT_COPY.initialDecline.en, {
          translation: ASSISTANT_COPY.initialDecline.km,
          isStreaming: true,
        })
      )
    }, 500)
  }

  function handleQuestion(question) {
    clearAllTimeouts()
    appendSingleMessage(createMessage('user', question.question))
    setConversation((prev) => ({ ...prev, stage: CONVERSATION_STAGES.ANSWERING }))
    setIsAiTyping(true)

    scheduleTimeout(() => {
      setIsAiTyping(false)
      appendSingleMessage(
        createMessage('bot', question.answer, {
          translation: question.answerKm,
          isStreaming: true,
        })
      )
    }, 550)
  }

  function handleFollowUp(wantsAnotherQuestion) {
    clearAllTimeouts()
    if (wantsAnotherQuestion) {
      appendSingleMessage(createMessage('user', 'Yes'))
      setConversation((prev) => ({ ...prev, stage: CONVERSATION_STAGES.ANSWERING }))
      setIsAiTyping(true)

      scheduleTimeout(() => {
        setIsAiTyping(false)
        appendSingleMessage(
          createMessage('bot', ASSISTANT_COPY.topicPrompt.en, {
            translation: ASSISTANT_COPY.topicPrompt.km,
            isStreaming: true,
          })
        )
      }, 500)
      return
    }

    appendSingleMessage(createMessage('user', 'No'))
    setConversation((prev) => ({ ...prev, stage: CONVERSATION_STAGES.ANSWERING }))
    setIsAiTyping(true)

    scheduleTimeout(() => {
      setIsAiTyping(false)
      appendSingleMessage(
        createMessage('bot', ASSISTANT_COPY.finished.en, {
          translation: ASSISTANT_COPY.finished.km,
          isStreaming: true,
        })
      )
    }, 500)
  }

  function handleBack() {
    clearAllTimeouts()
    appendSingleMessage(createMessage('user', 'Back'))
    setConversation((prev) => ({ ...prev, stage: CONVERSATION_STAGES.ANSWERING }))
    setIsAiTyping(true)

    scheduleTimeout(() => {
      setIsAiTyping(false)
      appendSingleMessage(
        createMessage('bot', ASSISTANT_COPY.welcome.en, {
          translation: ASSISTANT_COPY.welcome.km,
          isStreaming: true,
        })
      )
    }, 400)
  }

  // Mirror of the conversation for callbacks that must not run inside a
  // state updater (React may call updaters more than once).
  const conversationRef = useRef(conversation)
  conversationRef.current = conversation
  const completedIdsRef = useRef(new Set())

  const handleStreamingComplete = useCallback(
    (messageId) => {
      if (completedIdsRef.current.has(messageId)) return
      completedIdsRef.current.add(messageId)

      const currentMsg = conversationRef.current.messages.find((m) => m.id === messageId)
      const text = currentMsg?.text
      const isTopicAnswer =
        currentMsg?.sender === 'bot' && DIABETES_QUESTIONS.some((q) => q.answer === text || q.answerKm === text)

      let nextStage = null
      if (isTopicAnswer) nextStage = CONVERSATION_STAGES.ANSWERING
      else if (text === ASSISTANT_COPY.followUp.en || text === ASSISTANT_COPY.followUp.km) nextStage = CONVERSATION_STAGES.FOLLOW_UP
      else if (text === ASSISTANT_COPY.topicPrompt.en || text === ASSISTANT_COPY.topicPrompt.km) nextStage = CONVERSATION_STAGES.TOPICS
      else if (
        text === ASSISTANT_COPY.initialDecline.en ||
        text === ASSISTANT_COPY.initialDecline.km ||
        text === ASSISTANT_COPY.finished.en ||
        text === ASSISTANT_COPY.finished.km
      ) nextStage = CONVERSATION_STAGES.COMPLETE
      else if (text === ASSISTANT_COPY.welcome.en || text === ASSISTANT_COPY.welcome.km) nextStage = CONVERSATION_STAGES.INTRO

      setConversation((prev) => ({
        ...prev,
        stage: nextStage || prev.stage,
        messages: prev.messages.map((m) => (m.id === messageId ? { ...m, isStreaming: false } : m)),
      }))

      // After a topic answer, ask whether they have another question.
      if (isTopicAnswer) {
        scheduleTimeout(() => {
          setIsAiTyping(true)
          scheduleTimeout(() => {
            setIsAiTyping(false)
            appendSingleMessage(
              createMessage('bot', ASSISTANT_COPY.followUp.en, {
                translation: ASSISTANT_COPY.followUp.km,
                isStreaming: true,
              })
            )
          }, 450)
        }, 300)
      }
    },
    [scheduleTimeout]
  )

  function restartConversation() {
    clearAllTimeouts()
    setIsAiTyping(false)
    setConversation(createInitialConversation())
  }

  function closeAssistant() {
    clearAllTimeouts()
    setIsAiTyping(false)
    dragStateRef.current = null
    setIsDragging(false)
    setIsOpen(false)
    window.requestAnimationFrame(() => triggerRef.current?.focus())
  }

  function handleDragStart(event) {
    if (!window.matchMedia(DESKTOP_MEDIA_QUERY).matches) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (event.target.closest('button')) return

    const panel = panelRef.current
    if (!panel) return

    const rect = panel.getBoundingClientRect()
    const position = { x: rect.left, y: rect.top }
    dragStateRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      latestPosition: position,
    }
    setPanelPosition(position)
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  function handleDragMove(event) {
    const dragState = dragStateRef.current
    const panel = panelRef.current
    if (!dragState || !panel || dragState.pointerId !== event.pointerId) return

    const rect = panel.getBoundingClientRect()
    const position = {
      x: clamp(
        event.clientX - dragState.offsetX,
        DESKTOP_EDGE_GAP,
        window.innerWidth - rect.width - DESKTOP_EDGE_GAP
      ),
      y: clamp(
        event.clientY - dragState.offsetY,
        DESKTOP_EDGE_GAP,
        window.innerHeight - rect.height - DESKTOP_EDGE_GAP
      ),
    }

    dragState.latestPosition = position
    setPanelPosition(position)
  }

  function finishDrag(event) {
    const dragState = dragStateRef.current
    const panel = panelRef.current
    if (!dragState || !panel || dragState.pointerId !== event.pointerId) return

    const rect = panel.getBoundingClientRect()
    const latestPosition = dragState.latestPosition || { x: rect.left, y: rect.top }
    const side = latestPosition.x + rect.width / 2 < window.innerWidth / 2 ? 'left' : 'right'
    const snappedPosition = {
      x: side === 'left' ? DESKTOP_EDGE_GAP : window.innerWidth - rect.width - DESKTOP_EDGE_GAP,
      y: clamp(
        latestPosition.y,
        DESKTOP_EDGE_GAP,
        window.innerHeight - rect.height - DESKTOP_EDGE_GAP
      ),
    }

    dragStateRef.current = null
    setIsDragging(false)
    setPanelPosition(snappedPosition)

    try {
      window.localStorage.setItem(
        PANEL_PLACEMENT_STORAGE_KEY,
        JSON.stringify({ side, y: snappedPosition.y })
      )
    } catch {
      // Local storage persistence is best-effort.
    }

    const trigger = triggerRef.current
    if (trigger) {
      const triggerRect = trigger.getBoundingClientRect()
      const storedTriggerPlacement = readStoredPlacement(TRIGGER_PLACEMENT_STORAGE_KEY)
      const triggerY = clamp(
        triggerPosition?.y ??
          storedTriggerPlacement?.y ??
          window.innerHeight - triggerRect.height - DESKTOP_EDGE_GAP,
        DESKTOP_EDGE_GAP,
        window.innerHeight - triggerRect.height - DESKTOP_EDGE_GAP
      )
      const syncedTriggerPosition = {
        x: side === 'left' ? DESKTOP_EDGE_GAP : window.innerWidth - triggerRect.width - DESKTOP_EDGE_GAP,
        y: triggerY,
      }
      setTriggerPosition(syncedTriggerPosition)

      try {
        window.localStorage.setItem(
          TRIGGER_PLACEMENT_STORAGE_KEY,
          JSON.stringify({ side, y: syncedTriggerPosition.y })
        )
      } catch {
        // Placement persistence is optional.
      }
    }

    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // Pointer capture release is best-effort.
    }
  }

  function handleTriggerPointerDown(event) {
    if (!window.matchMedia(DESKTOP_MEDIA_QUERY).matches) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    triggerDragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      latestPosition: { x: rect.left, y: rect.top },
      hasMoved: false,
    }
    setTriggerPosition({ x: rect.left, y: rect.top })
    setIsTriggerDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleTriggerPointerMove(event) {
    const dragState = triggerDragStateRef.current
    const trigger = triggerRef.current
    if (!dragState || !trigger || dragState.pointerId !== event.pointerId) return

    const moveDistance = Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY)
    if (moveDistance > 6) {
      dragState.hasMoved = true
    }

    const rect = trigger.getBoundingClientRect()
    const position = {
      x: clamp(
        event.clientX - dragState.offsetX,
        DESKTOP_EDGE_GAP,
        window.innerWidth - rect.width - DESKTOP_EDGE_GAP
      ),
      y: clamp(
        event.clientY - dragState.offsetY,
        DESKTOP_EDGE_GAP,
        window.innerHeight - rect.height - DESKTOP_EDGE_GAP
      ),
    }

    dragState.latestPosition = position
    setTriggerPosition(position)
  }

  function finishTriggerDrag(event) {
    const dragState = triggerDragStateRef.current
    const trigger = triggerRef.current
    if (!dragState || !trigger || dragState.pointerId !== event.pointerId) return

    const rect = trigger.getBoundingClientRect()
    const latestPosition = dragState.latestPosition || { x: rect.left, y: rect.top }
    const side = latestPosition.x + rect.width / 2 < window.innerWidth / 2 ? 'left' : 'right'
    const snappedPosition = {
      x: side === 'left' ? DESKTOP_EDGE_GAP : window.innerWidth - rect.width - DESKTOP_EDGE_GAP,
      y: clamp(
        latestPosition.y,
        DESKTOP_EDGE_GAP,
        window.innerHeight - rect.height - DESKTOP_EDGE_GAP
      ),
    }

    if (dragState.hasMoved) {
      lastTriggerDragAtRef.current = Date.now()
    }

    triggerDragStateRef.current = null
    setIsTriggerDragging(false)
    setTriggerPosition(snappedPosition)

    try {
      window.localStorage.setItem(
        TRIGGER_PLACEMENT_STORAGE_KEY,
        JSON.stringify({ side, y: snappedPosition.y })
      )
    } catch {
      // Local storage persistence is best-effort.
    }

    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // Pointer capture release is best-effort.
    }
  }

  function handleTriggerClick() {
    if (Date.now() - lastTriggerDragAtRef.current < 200) {
      return
    }

    if (!isOpen && isDesktopViewport) {
      const panel = panelRef.current
      const trigger = triggerRef.current

      if (panel && trigger) {
        const panelRect = panel.getBoundingClientRect()
        const triggerRect = trigger.getBoundingClientRect()
        const side = triggerRect.left + triggerRect.width / 2 < window.innerWidth / 2 ? 'left' : 'right'
        const defaultY = window.innerHeight - panelRect.height - DESKTOP_TRIGGER_GAP
        const storedPlacement = readStoredPlacement(PANEL_PLACEMENT_STORAGE_KEY)
        const y = clamp(
          storedPlacement?.y ?? defaultY,
          DESKTOP_EDGE_GAP,
          window.innerHeight - panelRect.height - DESKTOP_EDGE_GAP
        )
        const x = side === 'left' ? DESKTOP_EDGE_GAP : window.innerWidth - panelRect.width - DESKTOP_EDGE_GAP
        setPanelPosition({ x, y })
      }
    }

    setIsOpen((prev) => !prev)
  }

  const triggerIsOnLeft = Boolean(
    isDesktopViewport && triggerPosition && triggerPosition.x < window.innerWidth / 2
  )

  return (
    <div
      style={isDesktopViewport && triggerPosition ? { left: triggerPosition.x, top: triggerPosition.y } : undefined}
      className={[
        'fixed bottom-4 right-3 z-[70] transition-[left,top] ease-out sm:bottom-6 sm:right-6',
        triggerPosition ? 'md:bottom-auto md:right-auto' : '',
        isTriggerDragging ? 'duration-0' : 'duration-200',
      ].join(' ')}
    >
      <section
        ref={panelRef}
        id="diabetes-assistant-panel"
        role="dialog"
        aria-label={ASSISTANT_COPY.title}
        aria-hidden={!isOpen}
        style={isDesktopViewport && panelPosition ? { left: panelPosition.x, top: panelPosition.y } : undefined}
        className={[
          'assistant-panel fixed bottom-[7.75rem] right-3 flex h-[min(44rem,calc(100dvh-8.5rem))] max-h-[86dvh] w-[calc(100vw-1.5rem)] origin-bottom-right flex-col overflow-hidden rounded-[28px] border border-white/60 bg-white transition-[opacity,transform,left,top] ease-out sm:w-[27rem] sm:max-w-[calc(100vw-3rem)] md:bottom-[7.75rem] md:right-6 dark:border-slate-700/60 dark:bg-slate-900',
          panelPosition ? 'md:bottom-auto md:right-auto' : '',
          isDragging ? 'duration-0' : 'duration-200',
          isOpen
            ? 'visible translate-y-0 scale-100 opacity-100'
            : 'invisible pointer-events-none translate-y-2 scale-[0.98] opacity-0',
        ].join(' ')}
      >
        {/* Header: colourful gradient with avatar, status and actions */}
        <header
          className="assistant-header relative shrink-0 select-none overflow-hidden px-4 pb-4 pt-3.5 text-white md:cursor-grab md:active:cursor-grabbing"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          title="Drag to move the assistant"
        >
          <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/10" />
          <span aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-10 h-32 w-32 rounded-full bg-emerald-300/20 blur-2xl" />
          <GripHorizontal className="pointer-events-none absolute left-1/2 top-1 hidden h-3.5 w-3.5 -translate-x-1/2 text-white/40 md:block" aria-hidden="true" />

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative">
                <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/95 p-1 shadow-lg shadow-teal-950/20">
                  <img src="/images/dr-bot.png" alt="" className="h-full w-full object-contain" />
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-teal-600 bg-emerald-400" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-display text-base font-bold text-white">
                  {isKhmer ? 'ជំនួយការជំងឺទឹកនោមផ្អែម' : ASSISTANT_COPY.title}
                </h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-white/85">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70 motion-reduce:animate-none" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                  </span>
                  {isKhmer ? 'អនឡាញ · ការអប់រំអ្នកជំងឺ' : 'Online · Patient education'}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={restartConversation}
                onPointerDown={(event) => event.stopPropagation()}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Restart conversation"
                title="Restart conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={closeAssistant}
                onPointerDown={(event) => event.stopPropagation()}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Close Diabetes Assistant"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Conversation */}
        <div
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          className="assistant-chat-scroll assistant-chat-bg -mt-3 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain rounded-t-[24px] px-3.5 pb-4 pt-5 sm:px-4"
        >
          {/* Intro card */}
          <div className="mb-4 flex flex-col items-center text-center">
            <BotAvatar size="lg" />
            <p className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-100">
              {isKhmer ? 'វេជ្ជបណ្ឌិតបូត' : 'Dr. Bot'}
            </p>
            <p className="mt-0.5 max-w-[16rem] text-xs leading-5 text-slate-500 dark:text-slate-400">
              {isKhmer
                ? 'ចម្លើយសាមញ្ញអំពីជំងឺទឹកនោមផ្អែម ជាភាសាអង់គ្លេស និងខ្មែរ។'
                : 'Simple, trusted answers about diabetes — in English and Khmer.'}
            </p>
            <span className="mt-3 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-400 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-800/80 dark:ring-slate-700">
              {isKhmer ? 'ថ្ងៃនេះ' : 'Today'}
            </span>
          </div>

          <div className="space-y-3.5">
            {conversation.messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onStreamingComplete={() => handleStreamingComplete(message.id)}
                onScrollToBottom={scrollToBottom}
              />
            ))}

            {isAiTyping && <AiTypingIndicator />}
          </div>

          {/* Quick choices / Questions */}
          {conversation.stage !== CONVERSATION_STAGES.COMPLETE && (
            <div className="mt-4">
              <ChatOptions
                stage={conversation.stage}
                disabled={isAiTyping}
                onChooseIntro={handleIntroChoice}
                onChooseQuestion={handleQuestion}
                onChooseFollowUp={handleFollowUp}
                onBack={handleBack}
              />
            </div>
          )}

          {conversation.stage === CONVERSATION_STAGES.COMPLETE && (
            <div className="assistant-msg-in mt-4 flex justify-center">
              <button
                type="button"
                onClick={restartConversation}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-teal-200 bg-white px-4 text-sm font-semibold text-teal-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-teal-800 dark:bg-slate-800 dark:text-teal-300"
              >
                <RotateCcw className="h-4 w-4" />
                {isKhmer ? 'ចាប់ផ្តើមការសន្ទនាថ្មី' : 'Start a new chat'}
              </button>
            </div>
          )}

          <div ref={messageEndRef} />
        </div>

        {/* Disclaimer */}
        <footer className="flex shrink-0 items-center justify-center gap-1.5 border-t border-slate-100 bg-white px-4 py-2.5 text-center text-[11px] font-medium text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
          <span>
            {isKhmer
              ? 'សម្រាប់ការអប់រំប៉ុណ្ណោះ។ មិនជំនួសដំបូន្មានវេជ្ជសាស្ត្រទេ។'
              : 'Educational purposes only. Does not replace medical advice.'}
          </span>
        </footer>
      </section>

      {/* Floating Mascot Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        onPointerDown={handleTriggerPointerDown}
        onPointerMove={handleTriggerPointerMove}
        onPointerUp={finishTriggerDrag}
        onPointerCancel={finishTriggerDrag}
        tabIndex={isOpen ? -1 : 0}
        className={[
          'assistant-mascot-button relative ml-auto flex h-[88px] w-[78px] touch-manipulation items-end justify-center border-0 bg-transparent p-0 transition-[opacity,transform] duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 dark:focus-visible:ring-blue-900 md:cursor-grab md:touch-none md:active:cursor-grabbing',
          isOpen ? 'invisible pointer-events-none scale-90 opacity-0' : 'visible scale-100 opacity-100',
          isTriggerDragging ? 'assistant-mascot-button--dragging' : '',
        ].join(' ')}
        aria-label={isOpen ? 'Close Diabetes Assistant' : 'Open Diabetes Assistant'}
        aria-expanded={isOpen}
        aria-controls="diabetes-assistant-panel"
        title={isOpen ? 'Close Diabetes Assistant' : 'Open Diabetes Assistant'}
      >
        {!isOpen && !isTriggerDragging && (
          <span
            key={greetingIndex}
            className={`assistant-mascot-bubble ${
              triggerIsOnLeft ? 'assistant-mascot-bubble--right' : 'assistant-mascot-bubble--left'
            }`}
            aria-hidden="true"
          >
            {MASCOT_GREETINGS[greetingIndex]}
          </span>
        )}

        <div className="relative flex h-[88px] w-[78px] items-center justify-center pointer-events-none">
          <DrBot3D className="h-full w-full" modelUrl="/3d/dr-bot.glb" />
        </div>
      </button>
    </div>
  )
}
