import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { message, chat_id } = await request.json()

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const sessionId = (chat_id && uuidRegex.test(chat_id)) ? chat_id : crypto.randomUUID()

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatInput: message,
        sessionId,
      }),
    })

    const rawText = await res.text()
    console.log('[chat-api] n8n status:', res.status)
    console.log('[chat-api] n8n response:', rawText)
    console.log('[chat-api] sessionId sent:', sessionId)

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Webhook request failed', detail: rawText },
        { status: res.status }
      )
    }

    const data = JSON.parse(rawText)
    return NextResponse.json({
      content: data.content || data.output,
      chat_id: data.chat_id || sessionId,
      response_type: data.response_type,
    })
  } catch (err) {
    console.error('[chat-api] catch error:', err)
    return NextResponse.json(
      { error: 'Failed to reach assistant' },
      { status: 502 }
    )
  }
}
