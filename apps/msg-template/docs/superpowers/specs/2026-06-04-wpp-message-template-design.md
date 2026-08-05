# WhatsApp Message Template Tool — Design Spec

**Date:** 2026-06-04

## Context

Manually composing weekly activity messages for a WhatsApp group is slow and error-prone, mainly because WhatsApp's own message editor has poor UX. Messages follow a fixed format: a title, date groups, and activities under each date (with name, observation, and participant list). This tool provides a mobile-first form to compose these messages, renders a live WhatsApp-style preview, warns about the character cut threshold, and outputs the final formatted text ready to paste.

Hosted as a static site on AWS S3. Deployed via GitHub Actions using Serverless Framework v3.

---

## Architecture

- **Framework:** React 18 + Vite
- **Hosting:** AWS S3 static site (no CloudFront required initially)
- **Persistence:** `localStorage` — form state is serialized on every change and rehydrated on load
- **Deployment:** Serverless Framework v3 (`serverless.yml`) + GitHub Actions CI/CD
- **Language:** Portuguese (UI labels, placeholders, button text)
- **No backend.** Pure static.

---

## Message Format

Generated output uses WhatsApp markdown:

```
🔥*{título}*🔥

_🗓️ {data}_
🆙 *{nome da atividade}*
📍 {observação}
- {participante 1}
- {participante 2}

_🗓️ {próxima data}_
*{nome da atividade}*
📍 {observação}
- {participante}
```

Rules:
- Title is always wrapped in `*bold*` flanked by 🔥
- Each date group is `_italic_` with 🗓️
- First activity under a date gets the 🆙 prefix; subsequent ones do not
- Every activity line starts with 📍 for the observation line
- Participants are each prefixed with `- ` on their own line
- Blank line between each activity; double blank line between date groups

---

## Data Model

```ts
interface AppState {
  title: string;
  dateGroups: DateGroup[];
}

interface DateGroup {
  id: string;       // uuid
  date: string;     // free text, e.g. "27/5 Quarta-feira"
  activities: Activity[];
}

interface Activity {
  id: string;       // uuid
  name: string;
  observation: string;   // time + location + anything else, required
  participants: string[];
}
```

State is stored in `localStorage` under the key `wpp-template-state` and loaded on app mount.

---

## UI Structure

### Shell

- Max-width: `430px`, centered on desktop with a subtle phone-frame shadow
- Background: dark WhatsApp-ish theme (`#111827`)
- Two tabs pinned at the top: **Editar** | **Preview**
- No emoji in button labels; emoji only in the generated message

### Tab: Editar

Top to bottom:

1. **Campo "Título"** — single text input
2. **Lista de grupos de data** — each group is a card containing:
   - Date text input (free text — user types "27/5 Quarta-feira")
   - List of activities, each containing:
     - Nome (text input)
     - Observação (text input, required — covers time, location, address, any detail)
     - Participantes: vertical list of rows, each row shows the name and a large tappable ✕ button. Below the list: inline text input + "Adicionar" button to add a new participant
   - "Adicionar atividade" dashed button at the bottom of the group
   - "Remover data" link in the group header
3. **"Adicionar data"** dashed button below all groups
4. **Footer** with two buttons:
   - "Limpar tudo" (destructive, requires a confirmation step — e.g. "Tem certeza?" replaces the button text for 3 seconds)
   - "Copiar mensagem" (primary, copies the formatted text to clipboard, shows "Copiado!" feedback)

### Tab: Preview

1. **WhatsApp group chat simulation:**
   - Dark green chat background (`#0b141a`)
   - Message bubble aligned to the right, green background (`#005c4b`), white text, with timestamp and double-check marks
   - Font matches WhatsApp's sans-serif rendering
   - Text rendered with actual bold/italic HTML equivalents of `*text*` and `_text_`
2. **Character counter bar** below the bubble:
   - Green + "X chars — dentro do limite" if ≤ 700 chars
   - Yellow warning if 600–700 chars ("atenção: próximo do limite")
   - Red warning if > 700 chars: "mensagem longa — WhatsApp vai exibir 'Ver mais'"
3. **"Copiar mensagem"** button at the bottom

---

## WhatsApp Cut Threshold

700 characters. This is the empirically observed point at which WhatsApp collapses messages in group chats with a "Ver mais" button. The counter is always visible in the Preview tab.

---

## LocalStorage Persistence

- State is serialized to JSON and written to `localStorage` on every state change (debounced 300ms)
- On app load, state is read from `localStorage`; if absent or invalid, defaults to empty form
- "Limpar tudo" clears both React state and `localStorage`

---

## Deployment

### Serverless Framework v3 (`serverless.yml`)

```yaml
service: wpp-template

provider:
  name: aws
  region: us-east-1

plugins:
  - serverless-s3-sync

custom:
  s3Sync:
    - bucketName: wpp-template-${sls:stage}
      localDir: dist
      deleteRemoved: true

resources:
  Resources:
    StaticSite:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: wpp-template-${sls:stage}
        WebsiteConfiguration:
          IndexDocument: index.html
          ErrorDocument: index.html
        PublicAccessBlockConfiguration:
          BlockPublicAcls: false
          BlockPublicPolicy: false
          IgnorePublicAcls: false
          RestrictPublicBuckets: false
    BucketPolicy:
      Type: AWS::S3::BucketPolicy
      Properties:
        Bucket: !Ref StaticSite
        PolicyDocument:
          Statement:
            - Effect: Allow
              Principal: "*"
              Action: s3:GetObject
              Resource: !Sub "${StaticSite.Arn}/*"

  Outputs:
    WebsiteURL:
      Value: !GetAtt StaticSite.WebsiteURL
```

### GitHub Actions (`.github/workflows/deploy.yml`)

Trigger: push to `main`.

Steps:
1. Checkout
2. Setup Node 20
3. `npm ci`
4. `npm run build` (Vite outputs to `dist/`)
5. `npx serverless deploy --stage prod`

Environment variables consumed:
- `AWS_ACCESS_KEY_ID` (from `AWS_ACCESS_ID` secret)
- `AWS_SECRET_ACCESS_KEY` (from `AWS_SECRET_ID` secret)

---

## File Structure

```
msg-template/
  src/
    App.tsx               # root, tab state, localStorage sync
    components/
      TabBar.tsx
      EditorTab.tsx
      DateGroupCard.tsx
      ActivityCard.tsx
      ParticipantList.tsx
      PreviewTab.tsx
      WhatsAppBubble.tsx
      CharCounter.tsx
    utils/
      messageFormatter.ts  # AppState → formatted string
      storage.ts           # localStorage read/write
    types.ts               # AppState, DateGroup, Activity interfaces
  index.html
  vite.config.ts
  serverless.yml
  .github/
    workflows/
      deploy.yml
```

---

## Verification

1. Run `npm run dev` — form renders, tabs switch, adding/removing dates and activities works
2. Type in the form → switch to Preview tab → bubble shows correct bold/italic formatting
3. Add enough text to exceed 700 chars → red warning appears
4. Refresh page → form state is restored from localStorage
5. Click "Limpar tudo" → confirm step → state and localStorage cleared
6. Click "Copiar mensagem" → paste into any text editor → verify formatting matches the example in `wpp_messages_example.txt`
7. Run `npm run build` → `dist/` is generated → `npx serverless deploy` uploads to S3 → S3 website URL serves the app correctly
8. Push to `main` on GitHub → Actions workflow runs → deploys to S3 without manual intervention
