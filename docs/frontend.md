# Frontend: instalação e uso

## Escopo

Interface React para os itens 1 a 6 do [enunciado](instrucoes-projeto.md). As telas Agendas, Pacientes, Vacinas e Alergias atendem a esses itens. Cada cadastro reúne listagem, inclusão, consulta dos dados completos e exclusão na própria tela.

A página **Início**, com resumo e calendário, e o menu lateral foram solicitados pelo responsável pelo projeto. Não fazem parte do enunciado original nem substituem a funcionalidade adicional do Item 7.

A aplicação não inclui login, edição ou a funcionalidade adicional do Item 7, conforme as decisões do projeto.

## Tecnologias e organização

- React com JavaScript para as telas.
- Vite para desenvolvimento e build.
- CSS próprio e controles HTML para os formulários e tabelas.
- `fetch` para consumir a API Django já existente.
- Estado local do React para o menu e os formulários, sem biblioteca de rotas ou de estado global. A seleção do menu não altera a URL; recarregar a página retorna à tela inicial.

```text
frontend/
├── .env.example
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── api.js
    ├── utils.js
    ├── styles.css
    ├── components/
    │   ├── Confirmacao.jsx
    │   ├── Detalhes.jsx
    │   └── Mensagens.jsx
    └── pages/
        ├── Inicio.jsx
        ├── Agendas.jsx
        ├── Pacientes.jsx
        ├── Vacinas.jsx
        └── Alergias.jsx
```

Os três componentes compartilhados cuidam apenas de confirmações, consulta dos dados completos e mensagens. Cada tela possui seu formulário explícito. As regras de geração das doses e mudança de situação permanecem no backend.

## Pré-requisitos

- Node.js 22.12 ou superior e npm. Desenvolvimento verificado com Node.js 24.
- Backend configurado, banco PostgreSQL existente e migrations aplicadas conforme o [manual do backend](backend.md).

## Instalação e configuração

A partir da raiz do repositório:

```bash
cd frontend
npm ci
cp -n .env.example .env
```

O arquivo local `.env` contém o endereço da API:

```dotenv
VITE_API_URL=http://127.0.0.1:8000/api
```

O endereço acima já é o padrão caso o arquivo não exista. Se a API estiver em outro endereço, altere a variável. `VITE_API_URL` é incluída no build do navegador; credenciais do banco pertencem exclusivamente ao `.env` do backend.

No `.env` do backend, `CORS_ALLOWED_ORIGINS` deve permitir a origem usada pelo frontend. O exemplo fornecido já permite:

```dotenv
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Reinicie o servidor correspondente depois de alterar um `.env`. O `.env` local não é versionado.

## Execução

Use dois terminais.

No primeiro, a partir da raiz, com o banco já configurado:

```bash
cd backend
source .venv/bin/activate
python manage.py runserver
```

No segundo:

```bash
cd frontend
npm run dev
```

Abra `http://127.0.0.1:5173/`. A porta é fixa para corresponder à configuração de CORS; se estiver ocupada, o comando informa o erro em vez de escolher outra porta silenciosamente.

## As telas

O menu lateral divide o sistema em Visão geral (Início), Atendimento (Agendas) e Cadastros (Pacientes, Vacinas e Alergias). Em telas estreitas, ele passa para o topo da página.

### Início

- É a tela inicial e mostra o total de agendas de hoje, aguardando aplicação, realizadas e canceladas.
- O calendário mensal apresenta uma prévia dos agendamentos de cada dia: horário e paciente de até três agendas, com a cor da situação, e a quantidade restante.
- **‹** e **›** mudam o mês; **Hoje** volta ao mês atual. O dia atual fica destacado, considerando `America/Sao_Paulo`.
- Ao selecionar um dia, o painel ao lado lista horário, paciente, vacina, dose e situação de cada agenda.
- **Gerenciar este dia** abre a tela Agendas filtrada pela data, onde ficam as ações de baixa e exclusão.
- Os dados vêm de `GET /api/agendas/`; o backend não foi alterado.

### Agendas

- Ao ser aberta pelo menu, exibe as agendas de hoje, considerando `America/Sao_Paulo`.
- Filtros por data, situação e paciente são aplicados automaticamente quando alterados.
- **Hoje** aplica a data atual, preservando os outros filtros. **Limpar filtros** mostra todas as datas, pacientes e situações.
- A listagem mantém a ordem devolvida pelo backend: Agendado, Realizado e Cancelado, seguida de data e horário dentro de cada situação.
- **Novo agendamento** solicita paciente, vacina, data da primeira dose, horário e observações opcionais. É necessário ter pelo menos um paciente e uma vacina cadastrados.
- A quantidade de doses e o intervalo da vacina são apresentados no formulário. O backend gera todas as agendas; o frontend não recalcula o esquema vacinal.
- Depois da inclusão, a lista passa a mostrar todas as datas do paciente escolhido, permitindo conferir as doses geradas.
- **Consultar** mostra os dados completos, inclusive observações e data da situação.
- Agendas com situação Agendado oferecem **Realizar** e **Cancelar agenda**, com confirmação. A data da situação é definida pelo backend.
- **Excluir** remove somente a agenda selecionada, preservando as outras doses.

### Pacientes

- Cadastro com todos os campos exigidos, sexo e UF em seletores e alergias em caixas de seleção opcionais.
- A consulta apresenta todos os dados cadastrados e os nomes das alergias.
- **Ver agendamentos** abre a tela Agendas com o filtro `usuario`, sem restringir a data.
- A exclusão pede confirmação e informa que todas as agendas do paciente também serão removidas.

### Vacinas

- Cadastro de título, descrição opcional e quantidade de doses.
- Para mais de uma dose, periodicidade e intervalo são exibidos e obrigatórios.
- Para dose única, periodicidade e intervalo são enviados como nulos.
- Consulta dos dados completos e exclusão com aviso da cascata das agendas.

### Alergias

- Cadastro simples pelo nome.
- A listagem apresenta ID e nome, ou seja, todos os dados do cadastro.
- A exclusão informa que a alergia será removida dos pacientes associados; os pacientes são preservados.

## Validações e respostas

Os formulários usam campos obrigatórios, limites de tamanho e tipos adequados, além das validações da API. Em caso de falha de inclusão, o formulário permanece aberto com os valores preenchidos. Falhas de exclusão ou baixa fecham a confirmação e mostram a mensagem de erro na tela.

Há estados de carregamento, lista vazia, sucesso e erro. Os botões de envio ficam desabilitados durante a operação. As requisições de consulta são canceladas quando a tela ou os filtros mudam, para evitar respostas antigas sobrepondo os novos filtros.

Datas são enviadas como `AAAA-MM-DD` e apresentadas nas tabelas como `DD/MM/AAAA`. Horários são enviados sem conversão de fuso. O POST de agendamento é tratado como uma lista de agendas, inclusive quando houver dose única.

## Verificação e build

Em `frontend/`:

```bash
npm test
npm run build
```

Os 14 testes de frontend usam Vitest e React Testing Library com respostas controladas da API. Eles verificam os cadastros, zero ou várias alergias, consulta por paciente, criação das doses, baixa, filtros, confirmações, exclusão, calendário, falhas de conexão e mensagens de validação. Não precisam de banco ou backend em execução e não substituem os testes das regras de negócio do Django.

O build gera os arquivos em `frontend/dist/`, ignorados pelo Git. Para inspecionar o build localmente:

```bash
npm run preview
```

O preview usa `http://127.0.0.1:4173/`. Para consumir a API nessa origem, acrescente `http://127.0.0.1:4173` a `CORS_ALLOWED_ORIGINS` do backend e reinicie-o. O preview serve os arquivos compilados; a API Django continua sendo executada separadamente. O endereço da API usado pelo build é definido durante `npm run build`.
