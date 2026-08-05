/**
 * Converts WhatsApp markdown (*bold*, _italic_) to HTML.
 * Input is always a string produced by formatMessage — not user-supplied HTML.
 */
export function renderToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*(.*?)\*/gs, '<strong>$1</strong>')
    .replace(/_(.*?)_/gs, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}
