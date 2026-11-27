# Frontend: instalação e uso

## Escopo

Interface React para os itens 1 a 6 do [enunciado](instrucoes-projeto.md). As telas Agendas, Pacientes, Vacinas e Alergias atendem a esses itens. Cada página abre na listagem, com a exclusão. A pedido do responsável pelo projeto, a inclusão e a consulta dos dados completos abrem uma tela própria, separada da listagem, com o botão **‹ Voltar** para retornar; um novo clique na página no menu também volta à listagem.

A página **Início**, com resumo e calendário, e o menu lateral foram solicitados pelo responsável pelo projeto. Não fazem parte do enunciado original nem substituem a funcionalidade adicional do Item 7.

A tela **Estoque** faz parte do controle de estoque por lotes (épico #9, issue #14), ainda em implementação. Por enquanto, ela gerencia os lotes; a disponibilidade por vacina, a recusa por falta de estoque e o lote utilizado na aplicação serão apresentados quando a API oferecer esses dados (issues #12 e #13).

A aplicação não inclui login nem edição, conforme as decisões do projeto.

## Tecnologias e organização

- React com JavaScript para as telas.
- Vite para desenvolvimento e build.
- CSS próprio e controles HTML para os formulários e tabelas.
- `fetch` para consumir a API Django já existente.
- Estado local do React para o menu e os formulários, sem biblioteca de rotas ou de estado global. A seleção do menu não altera a URL; recarregar a página retorna à tela inicial.

```text
frontend/
├── .env.example
├── Dockerfile             # build e publicação com Nginx (implantação)
├── nginx.conf.template    # Nginx: arquivos do React e encaminhamento de /api
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
        ├── Estoque.jsx
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

O menu lateral divide o sistema em Visão geral (Início), Atendimento (Agendas) e Cadastros (Pacientes, Vacinas, Estoque e Alergias). Em telas estreitas, ele passa para o topo da página.

### Início

- É a tela inicial e mostra o total de agendas de hoje, aguardando aplicação, realizadas e canceladas.
- O calendário mensal apresenta uma prévia dos agendamentos de cada dia: horário e paciente de até três agendas, com a cor da situação, e a quantidade restante.
- **‹** e **›** mudam o mês; **Hoje** volta ao mês atual. O dia atual fica destacado, considerando `America/Sao_Paulo`.
- Ao selecionar um dia, o calendário se recolhe em uma versão compacta à esquerda e abre a visão do dia, organizada por horário, a pedido do responsável pelo projeto. Ela mostra as faixas das 7h às 18h e inclui outras horas quando há agendas fora desse período. No dia atual, a hora corrente fica destacada.
- Cada agenda aparece na faixa da sua hora, com horário, paciente, vacina, dose, situação, data da situação e observações. As agendas com situação Agendado têm os botões **Realizar** e **Cancelar agenda**, que dão baixa após uma confirmação.
- Na visão do dia, **‹** e **›** mudam o dia, **Voltar ao mês** retorna ao calendário completo e **Gerenciar este dia** abre a tela Agendas filtrada pela data, onde também fica a exclusão.
- Os dados vêm de `GET /api/agendas/`; o backend não foi alterado.

### Agendas

- Ao ser aberta pelo menu, exibe as agendas de hoje, considerando `America/Sao_Paulo`.
- Filtros por data, situação e paciente são aplicados automaticamente quando alterados.
- **Hoje** aplica a data atual, preservando os outros filtros. **Limpar filtros** mostra todas as datas, pacientes e situações.
- A listagem mantém a ordem devolvida pelo backend: Agendado, Realizado e Cancelado, seguida de data e horário dentro de cada situação.
- **Novo agendamento** abre uma tela própria, que solicita paciente, vacina, data da primeira dose, horário e observações opcionais. É necessário ter pelo menos um paciente e uma vacina cadastrados.
- A quantidade de doses e o intervalo da vacina são apresentados no formulário. O backend gera todas as agendas; o frontend não recalcula o esquema vacinal.
- Depois da inclusão, a lista passa a mostrar todas as datas do paciente escolhido, permitindo conferir as doses geradas.
- **Consultar** mostra os dados completos, inclusive observações e data da situação.
- Agendas com situação Agendado oferecem **Realizar** e **Cancelar agenda**, com confirmação. A data da situação é definida pelo backend.
- **Excluir** remove somente a agenda selecionada, preservando as outras doses.

### Pacientes

- **Novo paciente** abre uma tela própria de cadastro, com todos os campos exigidos, sexo e UF em seletores e alergias em caixas de seleção opcionais.
- **Consultar** abre uma tela própria com todos os dados cadastrados e os nomes das alergias.
- **Ver agendamentos** abre a tela Agendas com o filtro `usuario`, sem restringir a data.
- A exclusão pede confirmação e informa que todas as agendas do paciente também serão removidas.

### Vacinas

- **Nova vacina** abre uma tela própria de cadastro de título, descrição opcional e quantidade de doses.
- Para mais de uma dose, periodicidade e intervalo são exibidos e obrigatórios.
- Para dose única, periodicidade e intervalo são enviados como nulos.
- **Consultar** abre uma tela própria com os dados completos. A exclusão avisa da cascata das agendas.

### Estoque

- Cada vacina aparece em um card com o total de doses dos lotes não vencidos, a quantidade de lotes e avisos de lotes que vencem em breve ou estão vencidos. A soma usa a classificação da validade devolvida pela API, sem considerar reservas, que ainda não existem (#12).
- Ao clicar no card, abre-se uma tela própria da vacina, separada dos cards, com o total de doses e todos os dados de cada lote: número, fabricante, validade, classificação e quantidade de doses. Os lotes seguem a ordem de validade devolvida pela API, e a classificação é calculada pelo backend: **Válido**, **Vence em breve** (até 30 dias) ou **Vencido** (RN20).
- **Novo lote** também abre uma tela própria, que solicita vacina, número do lote, fabricante, validade e quantidade de doses. Aberta a partir de uma vacina, ela já vem com essa vacina escolhida. É necessário ter pelo menos uma vacina cadastrada. Depois do cadastro, abre-se a tela da vacina do lote; **Cancelar** volta à tela anterior.
- **‹ Voltar ao estoque** ou um novo clique em Estoque no menu retornam aos cards.
- Os dados vêm de `GET /api/lotes/` e `GET /api/vacinas/`, agrupados por vacina na tela.
- A exclusão de um lote, na tela da vacina, pede confirmação. Um lote já utilizado em uma aplicação não pode ser excluído; nesse caso, a mensagem da API é exibida e o lote permanece na lista.
- Como a API não oferece edição, um lote cadastrado errado é corrigido por exclusão e novo cadastro, enquanto não tiver sido utilizado.

### Alergias

- **Nova alergia** abre uma tela própria de cadastro simples pelo nome.
- A listagem apresenta ID e nome, ou seja, todos os dados do cadastro.
- A exclusão informa que a alergia será removida dos pacientes associados; os pacientes são preservados.

## Validações e respostas

Os formulários usam campos obrigatórios, limites de tamanho e tipos adequados, além das validações da API. Em caso de falha de inclusão, a tela de cadastro permanece aberta com os valores preenchidos; em caso de sucesso, volta para a listagem (no Estoque, para a tela da vacina do lote). Falhas de exclusão ou baixa fecham a confirmação e mostram a mensagem de erro na tela.

Há estados de carregamento, lista vazia, sucesso e erro. Os botões de envio ficam desabilitados durante a operação. As requisições de consulta são canceladas quando a tela ou os filtros mudam, para evitar respostas antigas sobrepondo os novos filtros.

Datas são enviadas como `AAAA-MM-DD` e apresentadas nas tabelas como `DD/MM/AAAA`. Horários são enviados sem conversão de fuso. O POST de agendamento é tratado como uma lista de agendas, inclusive quando houver dose única.

## Verificação e build

Em `frontend/`:

```bash
npm test
npm run build
```

Os 18 testes de frontend usam Vitest e React Testing Library com respostas controladas da API. Eles verificam os cadastros, as telas próprias de cadastro e consulta, os cards de vacina com as doses por lote, a classificação da validade, a recusa ao excluir lote utilizado, zero ou várias alergias, consulta por paciente, criação das doses, baixa, filtros, confirmações, exclusão, calendário, falhas de conexão e mensagens de validação. Não precisam de banco ou backend em execução e não substituem os testes das regras de negócio do Django.

O build gera os arquivos em `frontend/dist/`, ignorados pelo Git. Para inspecionar o build localmente:

```bash
npm run preview
```

O preview usa `http://127.0.0.1:4173/`. Para consumir a API nessa origem, acrescente `http://127.0.0.1:4173` a `CORS_ALLOWED_ORIGINS` do backend e reinicie-o. O preview serve os arquivos compilados; a API Django continua sendo executada separadamente. O endereço da API usado pelo build é definido durante `npm run build`.

## Implantação

Na implantação, o build é gerado dentro da imagem Docker definida em `frontend/Dockerfile` e servido pelo Nginx. Nessa imagem, `VITE_API_URL` vale `/api`: o navegador chama a API no mesmo endereço do frontend, e o Nginx encaminha essas requisições ao backend indicado por `API_UPSTREAM`. Assim, não é preciso configurar CORS. Os detalhes estão no [guia de implantação](implantacao.md).
