# Sistema de Vacinação

Sistema de agendamento de vacinas com cadastro de pacientes e alergias, geração automática dos agendamentos de cada dose e acompanhamento das aplicações.

Projeto acadêmico desenvolvido para as disciplinas de Software para Persistência de Dados, Manutenção de Software e Implantação e Entrega de Software.

## Documentação

- [Enunciado completo e regras do projeto](docs/instrucoes-projeto.md)
- [Modelo de entidade e relacionamento (MER)](docs/mer-vacinacao.png)
- [Anexo original do MER em PDF](docs/ProjetoVacinas2023.png.pdf)
- [Instalação, configuração e contrato da API](docs/backend.md)
- [Instalação e uso do frontend](docs/frontend.md)
- [Modelo de dados e adequações ao MER](docs/modelo-dados.md)
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

As versões exatas das dependências do backend estão em `backend/requirements.txt`. A conexão PostgreSQL é configurada em `backend/.env`, a partir de `.env.example`. As dependências do frontend são registradas em `frontend/package.json` e fixadas no `package-lock.json`. A implantação ainda será definida.

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
│   └── pull_request_template.md
├── AGENTS.md
├── README.md
├── docs/
├── backend/     # Django + DRF: apps usuarios e vacinacao
└── frontend/    # React + Vite: Agendas, Pacientes, Vacinas e Alergias
```

## Funcionalidades da API

- Inclusão, exclusão, consulta e listagem de vacinas, alergias, pacientes e agendas; alteração é opcional no enunciado.
- Associação de zero ou várias alergias a cada paciente.
- Geração automática de todos os agendamentos de uma vacina conforme doses, periodicidade e intervalo.
- Consulta de agendas realizadas e canceladas.
- Consulta das agendas do dia, ordenadas por situação: agendadas, realizadas e canceladas.
- Baixa de uma agenda como realizada ou cancelada, registrando a data do dia em `data_situacao`.
- Visualização dos agendamentos de cada paciente com data, situação, vacina e dose.

A API implementa os itens 1 a 6. A funcionalidade adicional do Item 7 foi adiada pelo responsável e será escolhida e documentada em PDF em uma etapa posterior. O frontend oferece as quatro telas essenciais, com cadastro e listagem na mesma tela, sem login ou edição.

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

Os testes usam SQLite em memória. A conexão com PostgreSQL real ainda depende da configuração do banco pelo responsável.

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
