# Rasoio

Rasoio é a aplicação da Peter Tecnet voltada para barbearias, barbeiros e clientes. O frontend é uma SPA React que consome a API central da Peter Tecnet e usa o identificador da aplicação Rasoio para manter estabelecimentos, profissionais, itens e demais recursos isolados dos outros produtos da plataforma.

## Requisitos

- Node.js 20
- npm
- acesso à API Peter Tecnet

## Configuração

Copie `.env.example` para `.env` e configure as variáveis locais necessárias:

```env
REACT_APP_API_URL=https://api.petertecnet.com.br/api
REACT_APP_GOOGLE_CLIENT_ID=
```

Nunca versione credenciais, tokens ou segredos. O Client ID do Google usado em produção deve ser fornecido pelo ambiente de deploy/CI.

## Desenvolvimento

```bash
npm install
npm start
```

## Validação

Antes de publicar uma alteração, execute:

```bash
npm run lint
npm test -- --runInBand
npm run build
```

O pull request para `main` executa essas verificações automaticamente no GitHub Actions.

## Produção

No servidor, instale as dependências e gere o build a partir do código-fonte:

```bash
git pull origin main
npm install --no-audit --no-fund
npm run build
```

A pasta `build/` é artefato gerado e não deve ser versionada.

## Regras arquiteturais importantes

- A API é a fonte de verdade para autorização, validação e regras de negócio.
- Requisições HTTP novas devem usar `src/services/api.js`, que centraliza URL base, token, timeout, `FormData` e tratamento de sessão expirada.
- Recursos de negócio devem respeitar o `appId` da Rasoio. Um estabelecimento cadastrado em outro aplicativo da Peter Tecnet não deve aparecer na Rasoio apenas por pertencer ao mesmo usuário.
- Fluxos assíncronos devem encerrar loading também em erro, timeout e cancelamento.
- Não renderize texto vindo da API como HTML sem escape ou sanitização.

## Estrutura principal

- `src/pages`: telas e rotas da aplicação.
- `src/components`: componentes reutilizáveis de interface.
- `src/hooks`: integração de estado e fluxos das páginas.
- `src/services`: cliente HTTP e serviços compartilhados.
- `src/contexts`: estados globais mínimos, como loading.
- `src/utils`: utilitários puros e testáveis.
- `android`: projeto Capacitor/Android da aplicação móvel.
