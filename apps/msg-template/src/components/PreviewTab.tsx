import type { AppState } from '../types'
import { formatMessage } from '../utils/messageFormatter'
import { WhatsAppBubble } from './WhatsAppBubble'
import { CharCounter } from './CharCounter'

interface PreviewTabProps {
  state: AppState
  onCopy: () => void
  copyLabel: string
}

export function PreviewTab({ state, onCopy, copyLabel }: PreviewTabProps) {
  const message = formatMessage(state)

  return (
    <div className="preview-tab">
      <div className="wpp-chat">
        <WhatsAppBubble message={message} />
      </div>
      <div className="preview-footer">
        <CharCounter count={message.length} />
        <button className="btn btn-copy" style={{ width: '100%' }} onClick={onCopy}>
          {copyLabel}
        </button>
      </div>
    </div>
  )
}
