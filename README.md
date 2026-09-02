# Rasoio

Rasoio é a plataforma Peter Tecnet para gestão e agendamento de barbearias, profissionais e clientes.

## Arquitetura

- Frontend: React 18 + React Router + Axios.
- API: `https://api.petertecnet.com.br/api`.
- Identidade da aplicação: `app_id=1`, `app_slug=rasoio`.
- Autenticação: JWT da API Peter Tecnet e Google OAuth.
- Login convencional: e-mail, nome de usuário, CPF ou telefone.
- Telemetria: integração com `/interactions/batch`.

## Ambiente local

Copie `.env.example` para `.env` e informe o Client ID do Google autorizado para o ambiente:

```bash
cp .env.example .env
npm install
npm start
```

O arquivo `.env` é local e não deve ser versionado.

## Validação obrigatória

Antes de qualquer deploy:

```bash
npm install
npm audit --audit-level=critical
npm run lint
CI=true npm run test:ci
CI=true npm run build
```

O workflow `.github/workflows/validate.yml` executa os mesmos gates em pull requests e no `main`.

## Build de produção

```bash
REACT_APP_API_URL=https://api.petertecnet.com.br/api \
REACT_APP_GOOGLE_CLIENT_ID=<google-client-id> \
CI=true npm run build
```

O diretório `build/` é artefato gerado e não deve ser commitado.

## Fluxo funcional de produção

O fluxo crítico que deve permanecer íntegro é:

1. cadastro ou login;
2. verificação de e-mail quando aplicável;
3. criação/gestão de estabelecimento;
4. cadastro e vínculo de profissionais;
5. cadastro de serviços/produtos;
6. definição de disponibilidade;
7. consulta de estabelecimento, serviço e profissional;
8. criação de agendamento;
9. confirmação, cancelamento, redirecionamento e conclusão do atendimento;
10. consulta dos agendamentos por cliente, profissional e estabelecimento.

## Segurança

- Não versionar `.env`, keystores (`*.jks`, `*.keystore`) ou credenciais.
- Todas as chamadas autenticadas usam Bearer Token.
- O frontend envia o contexto `X-Peter-App: rasoio`.
- Autorizações e isolamento entre aplicações devem ser garantidos na API, nunca apenas pela interface.
- Mudanças de produção só devem ser integradas com CI verde.

## Deploy na VPS

O deploy deve ser feito somente depois do merge do PR validado:

```bash
cd /var/www/rasoio.petertecnet.com.br
git pull --ff-only origin main
npm install --no-audit --no-fund
CI=true npm run build
```

A API possui repositório e pipeline próprios; mudanças que afetam contratos do Rasoio precisam estar publicadas nela antes do build do frontend depender dessas mudanças.
