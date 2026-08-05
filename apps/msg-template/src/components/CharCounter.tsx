const LIMIT = 700
const WARN_AT = 600

interface CharCounterProps {
  count: number
}

export function CharCounter({ count }: CharCounterProps) {
  let cls = 'char-counter ok'
  let msg = `${count} caracteres — dentro do limite`

  if (count > LIMIT) {
    cls = 'char-counter over'
    msg = `${count} caracteres — WhatsApp vai exibir "Ver mais" (limite: ${LIMIT})`
  } else if (count >= WARN_AT) {
    cls = 'char-counter warn'
    msg = `${count} caracteres — atenção: próximo do limite (${LIMIT})`
  }

  return <div className={cls}>{msg}</div>
}
