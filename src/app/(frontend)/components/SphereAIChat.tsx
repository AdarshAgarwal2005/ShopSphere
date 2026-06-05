'use client'

import { FormEvent, useRef, useState } from 'react'
import Link from 'next/link'

type ChatProduct = {
  href?: string
  id: string
  name: string
  price?: number
}

type ChatMessage = {
  content: string
  products?: ChatProduct[]
  role: 'assistant' | 'user'
}

const starterMessages: ChatMessage[] = [
  {
    content: 'Hi, I am SphereAI. Ask me for outfit ideas, budget picks, or product comparisons.',
    role: 'assistant',
  },
]

export function SphereAIChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages)
  const [question, setQuestion] = useState('')
  const [isSending, setIsSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const openChat = () => {
    setIsOpen(true)
    window.setTimeout(() => inputRef.current?.focus(), 50)
  }

  const askSphereAI = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextQuestion = question.trim()

    if (!nextQuestion || isSending) {
      return
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        content: nextQuestion,
        role: 'user',
      },
    ])
    setQuestion('')
    setIsSending(true)

    try {
      const response = await fetch('/api/chat', {
        body: JSON.stringify({ question: nextQuestion }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      const data = (await response.json().catch(() => null)) as {
        message?: string
        products?: ChatProduct[]
        reply?: string
      } | null

      if (!response.ok) {
        throw new Error(data?.message || 'SphereAI is unavailable right now.')
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          content: data?.reply || 'I could not find a recommendation right now.',
          products: data?.products,
          role: 'assistant',
        },
      ])
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          content: error instanceof Error ? error.message : 'SphereAI is unavailable right now.',
          role: 'assistant',
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <aside className={isOpen ? 'sphere-ai open' : 'sphere-ai'} aria-label="SphereAI chatbot">
      {isOpen && (
        <div className="sphere-ai-panel">
          <div className="sphere-ai-header">
            <div>
              <span>SphereAI</span>
              <strong>Shopping assistant</strong>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close SphereAI">
              X
            </button>
          </div>

          <div className="sphere-ai-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div className={`sphere-ai-message ${message.role}`} key={`${message.role}-${index}`}>
                {message.content}
                {message.role === 'assistant' && message.products && message.products.length > 0 && (
                  <div className="sphere-ai-product-links" aria-label="Recommended products">
                    {message.products.map((product) => (
                      <Link href={product.href || `/products/${product.id}`} key={product.id}>
                        <span>{product.name}</span>
                        {typeof product.price === 'number' && <strong>Rs. {product.price}</strong>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isSending && <div className="sphere-ai-message assistant">Checking the catalog...</div>}
          </div>

          <form className="sphere-ai-form" onSubmit={askSphereAI}>
            <input
              ref={inputRef}
              type="text"
              maxLength={600}
              placeholder="Ask what to buy..."
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
            <button type="submit" disabled={isSending || !question.trim()}>
              Send
            </button>
          </form>
        </div>
      )}

      {!isOpen && (
        <button className="sphere-ai-launcher" type="button" onClick={openChat}>
          <span>SphereAI</span>
          <strong>Ask</strong>
        </button>
      )}
    </aside>
  )
}
