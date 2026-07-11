# mapp

Monorepo com dois projetos:

| Pasta     | O que é                                                              |
| --------- | -------------------------------------------------------------------- |
| `mobile/` | App Android (bare React Native) que exibe um site em webview         |
| `hub/`    | Web app (Vite + React + TS) mobile-first: hub de sites, deploy no S3 |

Requisito: Node >= 20.

## `mobile/` — app Android (webview)

```sh
cd mobile
npm install
npx react-native run-android
```

- A URL exibida fica na constante `WEB_URL` em [`mobile/App.tsx`](mobile/App.tsx) (placeholder `https://example.com` — trocar pela URL final).
- O botão voltar do Android navega o histórico da webview antes de sair do app.

## `hub/` — hub de sites (Vite + React)

```sh
cd hub
npm install
npm run dev      # desenvolvimento
npm run build    # gera dist/
```

### Adicionar um site ao hub

1. Adicione uma entrada em [`hub/src/sites.ts`](hub/src/sites.ts): `{ slug, url, title }`.
2. Coloque o cover em `hub/public/<slug>.jpg` (ex.: `bilhete-unico-app.jpg`).
3. A config é importada no build — é preciso rebuild + deploy para refletir mudanças.

Tocar num card navega na própria página (`<a href>`); dentro da webview do app isso troca a página exibida, e o voltar do Android retorna ao hub.

## Deploy do hub (GitHub Actions → S3)

Workflow: [`.github/workflows/deploy-hub.yml`](.github/workflows/deploy-hub.yml)

- Dispara em push na `main` que toque `hub/**` (ou manualmente via *Run workflow*).
- Builda e sincroniza `dist/` para o bucket **`mapp-hub-ui-sa-east-1`** (região `sa-east-1`).
- Assets versionados com cache longo; `index.html` com `no-cache`.
- Credenciais: **variáveis de repositório** (Settings → Secrets and variables → Actions → Variables) `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY`.
- O provisionamento do bucket (static website hosting ou CloudFront) fica fora deste repo.
