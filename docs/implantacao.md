# Implantação e CI/CD

O sistema será hospedado depois de pronto. A hospedagem ainda não foi escolhida (decisão D13 do [planejamento](planejamento.md#3-decisões-pendentes)), por isso a implantação foi preparada de forma **portátil**: o sistema roda em containers Docker, que funcionam em qualquer servidor ou plataforma que aceite Docker, e o pipeline do GitHub Actions já testa, gera e publica as imagens. Quando a hospedagem for escolhida, basta configurá-la e cadastrar os segredos indicados na [seção 5](#5-deploy-quando-a-hospedagem-for-escolhida).

## 1. Arquitetura implantada

```text
Navegador ──► frontend (Nginx) ──── /api/... ────► backend (Gunicorn + Django) ──► PostgreSQL
              • arquivos do React                   • API REST
              • encaminha /api ao backend           • aplica as migrations ao iniciar
```

- **Frontend:** o build do React é servido pelo Nginx, que também encaminha as requisições `/api/...` para o backend. O navegador acessa um único endereço, sem necessidade de CORS.
- **Backend:** a API Django é executada pelo Gunicorn. A cada inicialização, o container aplica as migrations pendentes antes de atender às requisições.
- **Banco:** PostgreSQL, em container (docker-compose) ou oferecido pela hospedagem.

| Arquivo | Função |
| --- | --- |
| [backend/Dockerfile](../backend/Dockerfile) | Imagem da API: Python 3.12, dependências do `requirements.txt` e Gunicorn. |
| [frontend/Dockerfile](../frontend/Dockerfile) | Imagem do frontend: build com Node 24 e publicação com Nginx. |
| [frontend/nginx.conf.template](../frontend/nginx.conf.template) | Configuração do Nginx, com a porta e o endereço do backend vindos de variáveis de ambiente. |
| [docker-compose.yml](../docker-compose.yml) | Sobe banco, backend e frontend juntos. |
| [.env.example](../.env.example) | Variáveis do docker-compose. |
| [.github/workflows/ci-cd.yml](../.github/workflows/ci-cd.yml) | Pipeline de CI/CD. |

## 2. Pipeline de CI/CD

O pipeline fica em [.github/workflows/ci-cd.yml](../.github/workflows/ci-cd.yml) e é executado pelo GitHub Actions.

| Evento | O que é executado |
| --- | --- |
| Pull request para `main` ou `develop` | Testes do backend e do frontend, build do frontend e construção das imagens Docker, sem publicá-las. |
| Push na `develop` | O mesmo que no pull request. |
| Push na `main` (merge de PR) | Tudo o que é executado no pull request, mais a publicação das imagens no GitHub Container Registry (GHCR) e o job de deploy. |
| Manual (aba Actions, **Run workflow**) | O mesmo que no evento correspondente à branch escolhida. |

Jobs:

1. **Backend — testes:** instala as dependências e executa `pip check`, `manage.py check`, a verificação de migrations pendentes, os testes com SQLite em memória e os mesmos testes em um **PostgreSQL real**, criado pelo próprio GitHub Actions. Assim, a integração com o PostgreSQL passa a ser conferida a cada mudança.
2. **Frontend — testes e build:** `npm ci`, `npm test` e `npm run build`.
3. **Imagem Docker:** constrói as imagens do backend e do frontend. Na `main`, publica-as como `ghcr.io/heitor-barbosa/sistema-vacinacao-backend` e `ghcr.io/heitor-barbosa/sistema-vacinacao-frontend`, com as tags `latest` e `sha-<commit>`.
4. **Deploy:** somente na `main`. Chama as URLs de deploy cadastradas nos segredos `DEPLOY_HOOK_BACKEND` e `DEPLOY_HOOK_FRONTEND`. Enquanto elas não existirem, o job termina com sucesso e apenas avisa que a hospedagem ainda não foi configurada.

Se os testes falharem, as imagens não são construídas e nada é implantado.

**Recomendação para o repositório:** em *Settings → Branches*, proteger `main` e `develop`, exigindo pull request e a aprovação dos jobs *Backend — testes* e *Frontend — testes e build* antes do merge. Essa configuração é feita pelo dono do repositório no GitHub.

## 3. Executar o sistema completo com Docker

Serve para testar localmente o ambiente de produção e também para implantar em um servidor com Docker. Requer Docker com o Compose.

Na raiz do repositório:

```bash
cp .env.example .env
```

Edite o `.env` e preencha ao menos `DJANGO_SECRET_KEY` e `DB_PASSWORD`. Para gerar a chave:

```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

Depois:

```bash
docker compose up -d --build
```

Abra `http://localhost:8080`. A API também responde nesse endereço, em `http://localhost:8080/api/`.

| Ação | Comando |
| --- | --- |
| Ver os logs | `docker compose logs -f` |
| Parar | `docker compose down` |
| Parar e apagar os dados do banco | `docker compose down -v` |
| Atualizar depois de mudar o código | `docker compose up -d --build` |

Os dados do PostgreSQL ficam no volume `dados-postgres` e são preservados entre reinicializações. O `.env` da raiz é usado apenas pelo docker-compose; o desenvolvimento sem Docker continua usando `backend/.env` e `frontend/.env`, conforme os manuais do [backend](backend.md) e do [frontend](frontend.md).

## 4. Variáveis de ambiente

**Container do backend:**

| Variável | Descrição |
| --- | --- |
| `DJANGO_SECRET_KEY` | Obrigatória. Chave secreta gerada para o ambiente. |
| `DJANGO_DEBUG` | `False` em produção. |
| `DJANGO_ALLOWED_HOSTS` | Domínios pelos quais a API é acessada, separados por vírgula. No docker-compose, `backend` é incluído automaticamente. |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | Conexão com o PostgreSQL. |
| `PGSSLMODE` | Opcional. Use `require` se o PostgreSQL da hospedagem exigir SSL. É lida diretamente pelo driver do PostgreSQL. |
| `CORS_ALLOWED_ORIGINS` | Necessária somente se o frontend acessar a API por outro domínio (ver [seção 5](#frontend-como-site-estático)). |
| `PORT` | Porta do Gunicorn. Padrão `8000`. Muitas hospedagens a definem automaticamente. |
| `GUNICORN_WORKERS` | Quantidade de processos. Padrão `2`. |

**Container do frontend:**

| Variável | Descrição |
| --- | --- |
| `API_UPSTREAM` | Endereço do backend, sem barra final. Padrão `http://backend:8000`; em uma hospedagem, por exemplo `https://api.exemplo.com`. |
| `PORT` | Porta do Nginx. Padrão `80`. |
| `VITE_API_URL` | Argumento de **build**, não de execução. Padrão `/api`, que usa o encaminhamento do Nginx. |

## 5. Deploy quando a hospedagem for escolhida

Qualquer hospedagem escolhida precisa oferecer um PostgreSQL e executar os dois containers. Há dois caminhos preparados.

### Opção A — servidor com Docker

Para uma VPS, uma máquina da instituição ou outro servidor com Docker:

1. Instalar o Docker e copiar para o servidor o `docker-compose.yml` e um `.env` preenchido a partir do `.env.example`.
2. No `.env`, definir `BACKEND_IMAGE` e `FRONTEND_IMAGE` com as imagens publicadas no GHCR e acrescentar o domínio do servidor a `DJANGO_ALLOWED_HOSTS`.
3. Se as imagens forem privadas, executar `docker login ghcr.io` com um token do GitHub com permissão `read:packages`.
4. Executar `docker compose pull` e `docker compose up -d --no-build`.
5. Para atualizar depois de um novo merge na `main`, repetir o passo 4. Esse passo pode ser automatizado por uma ferramenta de webhook no servidor, cadastrada em `DEPLOY_HOOK_BACKEND`.

O HTTPS pode ser oferecido por um proxy na frente da porta `APP_PORT`, conforme o servidor.

### Opção B — plataforma de containers

Para plataformas que executam imagens Docker e oferecem uma URL de deploy (*deploy hook*):

1. Criar o PostgreSQL na plataforma.
2. Criar o serviço do backend a partir da imagem `ghcr.io/heitor-barbosa/sistema-vacinacao-backend:latest`, com as variáveis da [seção 4](#4-variáveis-de-ambiente). `DJANGO_ALLOWED_HOSTS` deve conter o domínio público do backend.
3. Criar o serviço do frontend a partir da imagem `ghcr.io/heitor-barbosa/sistema-vacinacao-frontend:latest`, com `API_UPSTREAM` apontando para o endereço público do backend.
4. No GitHub, em *Settings → Environments → producao*, cadastrar as URLs de deploy da plataforma nos segredos `DEPLOY_HOOK_BACKEND` e `DEPLOY_HOOK_FRONTEND`.

A partir daí, cada merge na `main` testa, publica as imagens e atualiza o sistema hospedado.

### Frontend como site estático

Se a hospedagem servir o frontend como site estático, sem o container do Nginx, gere o build com o endereço completo da API (`VITE_API_URL=https://api.exemplo.com/api npm run build`) e acrescente o domínio do frontend a `CORS_ALLOWED_ORIGINS` no backend.

### Visibilidade das imagens

Pacotes publicados no GHCR começam **privados**. Para que a hospedagem baixe as imagens, torne-os públicos nas configurações do pacote no GitHub ou informe à hospedagem um token com permissão `read:packages`.

## 6. Checklist do deploy

- [ ] Escolher a hospedagem (D13).
- [ ] Proteger as branches `main` e `develop` no GitHub.
- [ ] Criar o PostgreSQL e configurar as variáveis dos containers.
- [ ] Tornar as imagens acessíveis à hospedagem.
- [ ] Cadastrar `DEPLOY_HOOK_BACKEND` e `DEPLOY_HOOK_FRONTEND` no ambiente `producao`.
- [ ] Fazer um merge na `main` e conferir o job **Deploy**.
- [ ] Verificar no endereço público: a tela Início carrega e `/api/vacinas/` responde.
- [ ] Registrar o endereço público no README e nos entregáveis.

Ficam a cargo da hospedagem escolhida: certificado HTTPS, domínio, backup do banco e monitoramento.
