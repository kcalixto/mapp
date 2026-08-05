# apps/ — stack unificada de deploy

Todos os apps desta pasta são deployados por **uma única stack CloudFormation** (Serverless Framework **v3**, [`serverless.yml`](serverless.yml), serviço `mapp-apps`, stage `prod`, região `sa-east-1`) através de **um único workflow** ([`.github/workflows/deploy-apps.yml`](../.github/workflows/deploy-apps.yml)).

| App              | O que é                                  | Destino                                              |
| ---------------- | ---------------------------------------- | ---------------------------------------------------- |
| `msg-template/`  | Vite + React (build + testes no CI)      | S3 `wpp-template-prod`                               |
| `bilhete-unico/` | HTML/JS estático                         | S3 `bilhete-unico-static-site-kcalixto`              |
| `card-generator/`| HTML estático                            | S3 `card-plenaria-up-webpage` (bucket pré-existente, fora do CloudFormation — só sync) |
| `cca-form/`      | 2 Lambdas + API Gateway + DynamoDB + frontend estático | S3 `cca-frei-tito-frontend-prod`, tabela `cca-reservations-prod` |
| `journal-master/`| vazio — nada é deployado                 | —                                                    |

## Como funciona o deploy

Push na `main` tocando `apps/**` dispara o workflow:

1. `npm ci` em `apps/` (instala `serverless@3` + `serverless-s3-sync`).
2. `npm ci` + `npm test` + `npm run build` em `apps/msg-template` — **os testes bloqueiam o deploy**.
3. `npx serverless deploy --stage prod` — sobe Lambdas/infra e o plugin `serverless-s3-sync` sincroniza os quatro sites estáticos.
4. Pós-deploy: captura o `ServiceEndpoint` do API Gateway, regrava `cca-form/frontend/config.js` com a URL real e faz `aws s3 cp` só desse arquivo.

Credenciais: secrets `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` do repositório.

Deploy manual:

```sh
cd apps
npm ci
(cd msg-template && npm ci && npm run build)
npx serverless deploy --stage prod
```

## Migração das stacks antigas (executar uma vez, antes do primeiro deploy)

Os nomes de bucket e da tabela foram preservados, mas eles pertencem às stacks CloudFormation antigas — o CloudFormation não cria recurso com nome já existente. Antes do primeiro deploy da stack unificada:

1. **Backup dos dados do cca-form** (se as reservas importarem — a tabela será recriada vazia):

   ```sh
   aws dynamodb create-backup --table-name cca-reservations-prod --backup-name pre-unificacao --region sa-east-1
   ```

2. **Esvaziar os buckets das stacks antigas** (CloudFormation não deleta bucket com objetos; o conteúdo estático é re-sincronizado pelo novo deploy):

   ```sh
   aws s3 rm s3://wpp-template-prod --recursive
   aws s3 rm s3://bilhete-unico-static-site-kcalixto --recursive
   aws s3 rm s3://cca-frei-tito-frontend-prod --recursive
   ```

3. **Remover as stacks antigas** (confira os nomes/stages exatos com `aws cloudformation list-stacks`; o deploy do bilhete-unico rodava sem `--stage`, então a stack pode ser `-dev`):

   ```sh
   aws cloudformation delete-stack --stack-name wpp-template-prod --region us-east-1
   aws cloudformation delete-stack --stack-name bilhete-unico-static-dev --region sa-east-1
   aws cloudformation delete-stack --stack-name cca-form-prod --region sa-east-1
   ```

4. **Aguardar as deleções concluírem** e deployar a stack unificada (push na `main` ou deploy manual acima).

Observações:

- `wpp-template-prod` muda de região (us-east-1 → sa-east-1). Após deletar o bucket, o nome pode levar de minutos até ~1h para ficar disponível na nova região; se o primeiro deploy falhar com "bucket already exists", aguarde e rode de novo.
- O hub apontava o bilhete-unico para um bucket legado (`kcalixto-sa-east-1-bilhete-unico-static-site`), anterior ao IaC; o link foi atualizado para o bucket da stack. O bucket legado pode ser deletado quando confirmar que nada mais o usa.
- O workflow antigo do card-generator tinha um bug de `working-directory` e sincronizava a pasta `hub/` para o bucket `card-plenaria-up-webpage` (com `--delete`, provavelmente removendo `card_plenaria.html`). O primeiro deploy da stack unificada corrige o conteúdo do bucket automaticamente.
