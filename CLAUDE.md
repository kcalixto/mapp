# Apps

1. msg-template
2. journal-master
3. cca-form
4. card-generator
5. bilhete-unico

# 1. msg-template — Calendário de Lutas (WhatsApp)

Builder de calendário de tarefas para WhatsApp. Monta a mensagem semanal "🔥Calendário de Lutas da semana🔥" com datas, atividades (nome, hora, local) e listas de participantes, e copia o texto formatado (markdown do WhatsApp: `*negrito*`, `_itálico_`) para a área de transferência. Exemplo real do formato em `wpp_messages_example.txt`.

## Modelo de dados (`src/types.ts`)

Título → DateGroups → Activities → Participants.

- `Activity { id, name, time, location, participants: string[] }` — `name`/`time`/`location` vêm de chips (presets + histórico de uso) ou texto custom atrás do chip "+".
- `DateGroup.date` é string: ISO `"2026-05-27"` (date picker) ou texto legado ("27/5 Quarta-feira") que renderiza como está.
- Presets de atividade, local e hora em `src/constants.ts`.
- Histórico de chips em `src/utils/chipHistory.ts` (localStorage `wpp-chip-history`): gravado no "Copiar mensagem" via `recordStateUsage`; `getTopValues(kind, presets)` mescla presets + valores lembrados por frequência. Sugestões de participantes vêm daí.

## Formato da mensagem (`src/utils/messageFormatter.ts`)

```
🔥{título}🔥

_🗓️ 27/5 Quarta-feira_
*{atividade}*
📍 às {hora} na {local}
- {participante}
```

Regras: 1 linha em branco entre atividades, 2 entre datas; hora sem prefixo ganha "às " (se já começa com às/as/das, mantém); linha 📍 é omitida se hora e local vazios. Data ISO vira "d/M Dia-da-semana" (pt-BR, capitalizado) via `src/utils/dateFormat.ts`. A mensagem é ordenada por data (ISO ascendente; datas legadas/vazias depois, em ordem de inserção) — só na mensagem, a ordem do editor não muda. Atividades totalmente vazias, participantes em branco e grupos sem conteúdo renderizável são omitidos (atividade semeada pelo "+ Adicionar data" nunca vaza pro texto).

## Stack e comandos

React 19 + Vite + TypeScript. Testes Vitest + jsdom + @testing-library/react.

- `npm run dev` — dev server
- `npm run test` — testes (vitest run)
- `npm run build` — `tsc -b && vite build`
- `npm run lint` — eslint

## Estrutura

- `src/App.tsx` — estado central + handlers; `expandedActivityId` controla o accordion (só 1 atividade expandida por vez; adicionar/duplicar auto-expande); undo de 1 slot (`takeSnapshot` antes de toda ação destrutiva → toast "Desfazer" por 5s — por isso Limpar/Nova semana/remover são 1 tap, sem confirmação); "+ Adicionar data" pré-preenche maior data ISO +1 (ou hoje) e semeia 1 atividade expandida
- `src/components/` — `EditorTab` ("Nova semana (+7 dias, sem participantes)" no topo, 1 tap; rodapé **sticky** com `CharCounter` + Limpar + Copiar; aviso quando localStorage falha), `PreviewTab` + `WhatsAppBubble` (preview em bolha fake), `DateGroupCard` (header de 1 linha: date picker + dia da semana curto ("Quarta") + duplicar/remover), `ActivityCard` (linha-resumo colapsada ~46px `nome · hora · local 👥n`; expandida = 3 ChipSelects sem labels, hora/local com glifos 🕐/📍 + participantes + duplicar/remover), `ChipSelect` (chips + input custom atrás de "+"; prop `prefix` p/ glifo), `ParticipantList` (chips inline: selecionados em verde com ✕, sugestões do histórico em dashed; input de texto sempre visível — Enter e blur adicionam), `CharCounter` (avisa em 600, limite 700 = "Ver mais" no WhatsApp), `TabBar`
- `src/utils/` — `messageFormatter` (estado → texto), `whatsappRenderer` (texto → HTML do preview), `storage` (localStorage; `saveState` retorna false em falha), `dateFormat` (`formatDateDisplay`, `addDaysIso`, `todayIso`), `chipHistory` (buckets podados no top 30), `clipboard` (`copyText` com fallback `execCommand` — o deploy S3 é HTTP, sem `navigator.clipboard`; label mostra "Falha ao copiar" se tudo falhar)
- CSS puro em `src/App.css` (tema escuro, mobile-first, largura máx 430px)

## Persistência

localStorage, chave `wpp-template-state`, salva com debounce de 300ms em `App.tsx`. `loadState()` em `src/utils/storage.ts` migra estados legados (campo antigo `observation` → `time`/`location`).

## Deploy

Push na `main` tocando `apps/**` → GitHub Actions (`.github/workflows/deploy-apps.yml`): `npm test` → `npm run build` → `serverless deploy --stage prod` da stack unificada (`apps/serverless.yml`, serverless v3, S3 `wpp-template-prod`, região sa-east-1). **Os testes bloqueiam o deploy.** Não editar `dist/` à mão — é rebuildado no CI.

# 2. journal-master — Diário de bordo (web)
// todo

# 3. cca-form — Formulário de CCA (web)
// todo

# 4. card-generator — Gerador de cartões (web)
// todo

# 5. bilhete-unico — POC do app Bilhete Único (web)
// todo
