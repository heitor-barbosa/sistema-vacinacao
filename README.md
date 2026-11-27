# SIGV — Sistema Inteligente de Gestão da Vacinação

O SIGV é um sistema de agendamento de vacinas com cadastro de pacientes e alergias, geração automática dos agendamentos de cada dose e acompanhamento das aplicações.

Projeto acadêmico desenvolvido para as disciplinas de Software para Persistência de Dados, Manutenção de Software e Implantação e Entrega de Software.

## Documentação

- [Enunciado completo e regras do projeto](docs/instrucoes-projeto.md)
- [Modelo de entidade e relacionamento (MER)](docs/mer-vacinacao.png)
- [Instalação, configuração e contrato da API](docs/backend.md)
- [Instalação e uso do frontend](docs/frontend.md)
- [Modelo de dados e adequações ao MER](docs/modelo-dados.md)
- [Planejamento da evolução para o SIGV](docs/planejamento.md)
- [Estoque de vacinas e regras de agendamento (proposta)](docs/estoque-e-regras-agendamento.md)
- [Implantação e CI/CD](docs/implantacao.md)
- [Orientações para agentes](AGENTS.md)

## Tecnologias escolhidas

| Tecnologia | Responsabilidade |
| --- | --- |
| Python 3.12+ | Linguagem do backend. |
| Django 5.2 | Estrutura da aplicação backend. |
| Django ORM | Persistência, relacionamentos e migrations do banco de dados. |
| Django REST Framework (DRF) | API para comunicação com o frontend. |
| PostgreSQL | Banco de dados da aplicação, configurado pelo `.env`. |
| React + JavaScript | Interface com formulários, listagens e consulta dos agendamentos. |
| Vite | Servidor de desenvolvimento e build do frontend. |
| Docker + Docker Compose | Empacotamento de backend, frontend e banco em containers, para executar o sistema da mesma forma em qualquer hospedagem. |
| Gunicorn | Servidor da API Django na implantação. |
| Nginx | Publicação do frontend e encaminhamento de `/api` ao backend na implantação. |
| GitHub Actions | CI/CD: testes, build, publicação das imagens no GitHub Container Registry e deploy. |

As versões exatas das dependências do backend estão em `backend/requirements.txt`. A conexão PostgreSQL é configurada em `backend/.env`, a partir de `.env.example`. As dependências do frontend são registradas em `frontend/package.json` e fixadas no `package-lock.json`. O sistema será hospedado depois de pronto; a implantação e o CI/CD já estão preparados para qualquer hospedagem com Docker, conforme o [guia de implantação](docs/implantacao.md).

## Decisões do projeto

- **Monorepo:** backend, frontend e documentação ficarão no mesmo repositório, facilitando o acompanhamento de mudanças relacionadas.
- **Pastas separadas:** o código Django ficará em `backend/` e o React em `frontend/`. Cada aplicação terá suas próprias dependências e comandos de execução.
- **Organização simples:** a estrutura de pastas será suficiente, sem ferramentas adicionais de gerenciamento de monorepo.
- **Views e rotas explícitas:** a API usa views genéricas do DRF e URLs declaradas com `path()`, sem ViewSets nem routers.
- **Regras no backend:** geração das doses, cálculo das datas, validações e mudanças de situação das agendas serão tratados no backend. O React consumirá a API e apresentará os dados.
- **Situação como enumeração:** serão utilizados os recursos de enumeração do Django, como `TextChoices`, para representar Agendado, Realizado e Cancelado, adaptando à stack Python o requisito de ENUM citado para Java.
- **Fidelidade ao enunciado:** a implementação seguirá os requisitos e o MER fornecidos. Adequações no modelo serão justificadas e documentadas.
- **Código simples:** serão priorizadas soluções fáceis de entender, manter e explicar na apresentação acadêmica. Funcionalidades extras e complexidade sem necessidade ficam fora do escopo.

## Organização do repositório

```text
sistema-vacinacao/
├── .github/
│   ├── pull_request_template.md
│   └── workflows/ci-cd.yml   # pipeline de CI/CD
├── .env.example              # variáveis do docker-compose
├── AGENTS.md
├── README.md
├── docker-compose.yml        # banco, backend e frontend em containers
├── docs/
├── backend/     # Django + DRF: apps usuarios e vacinacao; Dockerfile da API
└── frontend/    # React + Vite: Início, Agendas, Pacientes, Vacinas, Estoque e Alergias; Dockerfile com Nginx
```

## Funcionalidades da API

- Inclusão, exclusão, consulta e listagem de vacinas, alergias, pacientes e agendas; alteração é opcional no enunciado.
- Associação de zero ou várias alergias a cada paciente.
- Geração automática de todos os agendamentos de uma vacina conforme doses, periodicidade e intervalo.
- Consulta de agendas realizadas e canceladas.
- Consulta das agendas do dia, ordenadas por situação: agendadas, realizadas e canceladas.
- Baixa de uma agenda como realizada ou cancelada, registrando a data do dia em `data_situacao`.
- Visualização dos agendamentos de cada paciente com data, situação, vacina e dose.
- Cadastro, consulta, listagem e exclusão de lotes de vacinas, com a classificação da validade.
- Reserva de estoque no agendamento: cada dose agendada reserva uma unidade, e sem estoque disponível o agendamento é recusado com uma mensagem de indisponibilidade, sem criar nenhuma dose.

A API implementa os itens 1 a 6. O estoque de vacinas está [especificado](docs/estoque-e-regras-agendamento.md) e em implementação: controle por lotes e validade, reserva no agendamento e escolha automática do lote na aplicação. Já estão disponíveis o cadastro de lotes, pela API e pela tela Estoque, e a reserva no agendamento, com o estoque informado nas respostas de vacina. Falta o consumo do lote na aplicação. A proposta permanece candidata à funcionalidade adicional do Item 7, conforme decisão pendente D01.

**Escopo atual (23/11/2026):** por decisão do responsável, os próximos passos são o estoque por lotes com validade e reservas e a integração com o Telegram para o próprio paciente agendar vacinação. Foram retiradas da proposta a regra adicional de reaplicação e a lista de espera. A geração automática de doses continua usando os campos existentes `doses`, `periodicidade` e `intervalo`. As demais funcionalidades do SIGV, listadas no [planejamento](docs/planejamento.md), ficam como referência e não serão iniciadas sem nova decisão. O frontend oferece as quatro telas essenciais, com a listagem na página e o cadastro e a consulta em telas próprias, sem login ou edição, além de menu lateral e uma página Início com resumo e calendário, solicitados pelo responsável.

Os detalhes e as regras completas estão no [enunciado](docs/instrucoes-projeto.md).

## Instalação e execução

Siga o [manual do backend](docs/backend.md) para criar a venv, instalar as dependências, preencher o `.env` e executar a API. O banco PostgreSQL deve ser criado manualmente antes de aplicar as migrations.

Depois da instalação e configuração, em `backend/`, com a venv ativa:

```bash
python manage.py migrate
python manage.py runserver
```

Para testar sem criar ou acessar bancos PostgreSQL:

```bash
python manage.py test usuarios vacinacao --settings=config.test_settings
```

Os testes usam SQLite em memória. O pipeline de CI executa os mesmos testes também em um PostgreSQL real.

### Frontend

Com o backend em execução, em outro terminal:

```bash
cd frontend
npm ci
npm run dev
```

Abra `http://127.0.0.1:5173/`. O endereço padrão da API é `http://127.0.0.1:8000/api`, configurável por `VITE_API_URL` em `frontend/.env`. O exemplo de CORS do backend já permite essa origem. Consulte o [manual do frontend](docs/frontend.md) para configuração, uso e preview do build.

Para verificar o frontend, em `frontend/`:

```bash
npm test
npm run build
```

### Sistema completo com Docker

Para executar banco, API e frontend juntos, como na implantação, na raiz do repositório:

```bash
cp .env.example .env    # preencha DJANGO_SECRET_KEY e DB_PASSWORD
docker compose up -d --build
```

Abra `http://localhost:8080`. Detalhes, variáveis e o passo a passo do deploy estão no [guia de implantação](docs/implantacao.md).

## CI/CD

A cada pull request e push nas branches `main` e `develop`, o GitHub Actions executa os testes do backend (SQLite e PostgreSQL), os testes e o build do frontend e a construção das imagens Docker. Na `main`, também publica as imagens no GitHub Container Registry e aciona o deploy, quando a hospedagem estiver configurada. Veja o [guia de implantação](docs/implantacao.md#2-pipeline-de-cicd).

## Entregáveis acadêmicos

- Código-fonte do projeto.
- Vídeo de até cinco minutos explicando o funcionamento, com o nome dos participantes; o link poderá ser registrado em `video.txt`.
- PDF separado com a descrição e o impacto da funcionalidade adicional.
- Explicação das tecnologias utilizadas e manual de instalação, configuração e execução, exigidos pela escolha de outra tecnologia.
- PDF de aproximadamente cinco páginas sobre o Django ORM, utilizado para persistência.
- Justificativa documentada de eventuais adequações do modelo de dados.

## Contribuições

Antes de implementar, leia o [enunciado](docs/instrucoes-projeto.md) e as [orientações para agentes](AGENTS.md). Mantenha as mudanças limitadas à tarefa e descreva sua verificação usando o [template de pull request](.github/pull_request_template.md).

Use Conventional Commits nas mensagens de commit e nos títulos das PRs, no formato `tipo(escopo opcional): descrição curta`. Exemplo: `docs: documenta os requisitos do projeto`.
