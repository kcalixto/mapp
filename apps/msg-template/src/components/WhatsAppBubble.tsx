import { renderToHtml } from '../utils/whatsappRenderer'

interface WhatsAppBubbleProps {
  message: string
}

export function WhatsAppBubble({ message }: WhatsAppBubbleProps) {
  const html = renderToHtml(message)

  return (
    <div className="wpp-bubble">
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <div className="wpp-bubble-time">14:32 ✓✓</div>
    </div>
  )
}
