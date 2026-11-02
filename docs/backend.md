# Backend: instalação, configuração e API

## Escopo desta etapa

API dos itens 1 a 6 do [enunciado](instrucoes-projeto.md). O frontend React e a funcionalidade adicional do Item 7 ficam para etapas posteriores.

Há dois apps de domínio: `usuarios` (pacientes e alergias) e `vacinacao` (vacinas e agendas). Os usuários são pacientes, sem contas de acesso ou autenticação nesta etapa. Não há Django Admin.

Os endpoints permitem inclusão, exclusão e consulta, conforme o CRUD obrigatório do enunciado. PUT e PATCH não estão habilitados; alteração é opcional no trabalho. A baixa é feita por um endpoint específico.

## Pré-requisitos

- Python 3.12 ou superior compatível com o Django 5.2.
- PostgreSQL 14 ou superior instalado e acessível.
- Banco e usuário PostgreSQL criados manualmente pelo responsável pelo projeto.

As versões exatas das dependências estão em `backend/requirements.txt`.

## Instalação

No terminal, a partir da raiz do repositório:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

Se a venv já existir, basta ativá-la. Os comandos deste manual usam Linux/macOS.

## Configuração do ambiente

Em uma cópia nova do projeto, crie o arquivo local de configuração:

```bash
cp -n .env.example .env
python -c 'import secrets; print(secrets.token_urlsafe(50))'
```

Copie a chave gerada para `DJANGO_SECRET_KEY` no `.env`. Se já houver um `.env`, edite-o preservando sua configuração.

| Variável | Configuração |
| --- | --- |
| `DJANGO_SECRET_KEY` | Chave gerada localmente. |
| `DJANGO_DEBUG` | `True` no desenvolvimento; `False` na implantação. |
| `DJANGO_ALLOWED_HOSTS` | Hosts separados por vírgula, sem protocolo, por exemplo `localhost,127.0.0.1`. |
| `DB_NAME` | Nome do banco PostgreSQL criado manualmente, por exemplo `vacinacao`. |
| `DB_USER` | Usuário PostgreSQL com permissão para criar as tabelas nesse banco. |
| `DB_PASSWORD` | Senha desse usuário. |
| `DB_HOST` | Endereço do servidor PostgreSQL, por exemplo `localhost`. |
| `DB_PORT` | Porta do PostgreSQL, normalmente `5432`. |
| `CORS_ALLOWED_ORIGINS` | Origens do frontend separadas por vírgula, com protocolo e porta, sem barra final. |

O exemplo de CORS permite `http://localhost:5173` e `http://127.0.0.1:5173`; ajuste para a porta usada pelo React. Isso não define a ferramenta de build do frontend.

O `.env` é lido de `backend/`, independentemente do diretório do terminal. Variáveis já definidas no ambiente têm prioridade. O arquivo local e a venv são ignorados pelo Git; apenas `.env.example` é versionado.

A configuração padrão sempre usa PostgreSQL. Não há substituição automática por SQLite na aplicação.

## Preparação das tabelas e execução

Depois de criar o banco manualmente e preencher o `.env`, execute em `backend/`, com a venv ativa:

```bash
python manage.py check
python manage.py migrate
python manage.py runserver
```

`migrate` cria as tabelas no banco existente; não cria o banco PostgreSQL. As migrations iniciais já estão versionadas. Durante a implementação desta etapa, nenhum banco PostgreSQL foi criado e nenhuma migration foi aplicada nele.

A API estará disponível em `http://127.0.0.1:8000/api/`. Esse prefixo não possui uma página inicial; utilize um dos endpoints abaixo. As respostas são JSON.

## Testes sem PostgreSQL

Em `backend/`, execute:

```bash
python manage.py test usuarios vacinacao --settings=config.test_settings
python manage.py makemigrations --check --dry-run --settings=config.test_settings
python -m pip check
```

Os testes usam exclusivamente SQLite em memória. O Django aplica as migrations nesse banco temporário e o descarta ao terminar. Esses comandos não conectam ao PostgreSQL do `.env` nem criam bancos nele. Não use `config.test_settings` para executar a aplicação real.

A suíte cobre cadastros, alergias dos pacientes, geração das doses em todas as periodicidades, fins de mês, anos bissextos, rollback em falha, filtros, ordenação do dia, baixa e exclusões em cascata. A integração com um PostgreSQL real deverá ser conferida depois que o responsável configurar o banco.

## Endpoints

Todas as rotas terminam com `/`. Não há paginação: as listagens retornam todos os registros correspondentes.

| Método | Endpoint | Operação |
| --- | --- | --- |
| GET / POST | `/api/alergias/` | Listar / cadastrar alergia. |
| GET / DELETE | `/api/alergias/{id}/` | Consultar / excluir alergia. |
| GET / POST | `/api/usuarios/` | Listar / cadastrar paciente. |
| GET / DELETE | `/api/usuarios/{id}/` | Consultar / excluir paciente e suas agendas. |
| GET | `/api/usuarios/{id}/agendas/` | Consultar agendas do paciente, em ordem de data e hora. |
| GET / POST | `/api/vacinas/` | Listar / cadastrar vacina. |
| GET / DELETE | `/api/vacinas/{id}/` | Consultar / excluir vacina e suas agendas. |
| GET / POST | `/api/agendas/` | Listar / gerar os agendamentos de todas as doses. |
| GET / DELETE | `/api/agendas/{id}/` | Consultar / excluir apenas a agenda indicada. |
| GET | `/api/agendas/hoje/` | Listar agendas da data atual. |
| POST | `/api/agendas/{id}/baixa/` | Marcar como realizada ou cancelada. |

Consultas retornam HTTP 200, inclusões 201 e exclusões 204 sem corpo. Dados inválidos retornam 400 com os erros; IDs inexistentes retornam 404. Métodos não habilitados retornam 405.

### Alergias

POST `/api/alergias/`:

```json
{"nome": "Alergia a ovo"}
```

`nome` é obrigatório, com até 40 caracteres.

### Pacientes

POST `/api/usuarios/`:

```json
{
  "nome": "Maria Silva",
  "data_nascimento": "2000-05-20",
  "sexo": "F",
  "logradouro": "Rua A",
  "numero": 10,
  "setor": "Centro",
  "cidade": "Goiânia",
  "uf": "GO",
  "alergias": [1, 2]
}
```

Os IDs de alergias devem existir. `alergias` pode ser omitido ou ser `[]`. Os demais campos do exemplo são obrigatórios. `sexo` aceita `M` ou `F`; `uf` aceita uma das 27 siglas oficiais. A data de nascimento não pode ser futura. `numero` é numérico, sem casas decimais, limitado a dez dígitos.

O frontend deverá oferecer combobox ou rádio para sexo e combobox para UF, conforme o enunciado. As opções de UF são: AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE e TO.

A resposta inclui `id`, todos os campos cadastrados e `alergias_detalhes`, com os IDs e nomes das alergias. O campo `numero` é serializado como texto numérico pelo DRF.

### Vacinas

POST `/api/vacinas/`:

```json
{
  "titulo": "Vacina de exemplo",
  "descricao": "Esquema de três doses",
  "doses": 3,
  "periodicidade": 3,
  "intervalo": 2
}
```

`titulo` é obrigatório, com até 60 caracteres. `descricao` é opcional, com até 200. `doses` deve ser um inteiro maior que zero.

| Periodicidade | Unidade |
| --- | --- |
| 1 | Dias |
| 2 | Semanas |
| 3 | Meses |
| 4 | Anos |

Para mais de uma dose, periodicidade válida e intervalo inteiro maior que zero são obrigatórios. Para dose única, periodicidade e intervalo podem ser omitidos ou nulos; não participam do cálculo.

### Agendamentos

POST `/api/agendas/`:

```json
{
  "usuario": 1,
  "vacina": 1,
  "data": "2026-11-10",
  "hora": "09:30:00",
  "observacoes": "Observação opcional"
}
```

Paciente, vacina, data e hora são obrigatórios. `observacoes` é opcional, com até 200 caracteres. Datas usam `AAAA-MM-DD` e horários usam `HH:MM:SS`.

O POST retorna uma **lista** com todas as agendas criadas, mesmo que a vacina tenha dose única. Exemplo para uma vacina com três doses, periodicidade mensal e intervalo de dois meses:

```json
[
  {
    "id": 1,
    "usuario": 1,
    "usuario_nome": "Maria Silva",
    "vacina": 1,
    "vacina_titulo": "Vacina de exemplo",
    "data": "2026-11-10",
    "hora": "09:30:00",
    "dose": 1,
    "situacao": "Agendado",
    "data_situacao": null,
    "observacoes": "Observação opcional"
  },
  {
    "id": 2,
    "usuario": 1,
    "usuario_nome": "Maria Silva",
    "vacina": 1,
    "vacina_titulo": "Vacina de exemplo",
    "data": "2027-01-10",
    "hora": "09:30:00",
    "dose": 2,
    "situacao": "Agendado",
    "data_situacao": null,
    "observacoes": "Observação opcional"
  },
  {
    "id": 3,
    "usuario": 1,
    "usuario_nome": "Maria Silva",
    "vacina": 1,
    "vacina_titulo": "Vacina de exemplo",
    "data": "2027-03-10",
    "hora": "09:30:00",
    "dose": 3,
    "situacao": "Agendado",
    "data_situacao": null,
    "observacoes": "Observação opcional"
  }
]
```

`dose`, `situacao` e `data_situacao` são controlados pelo backend; valores enviados nesses campos na criação são ignorados. Cada agenda começa em `Agendado`, com `data_situacao` nula. Hora e observações são copiadas para todas as doses.

O cálculo usa a data inicial para cada dose. Por exemplo, 31 de janeiro + um mês usa o último dia de fevereiro; + dois meses resulta em 31 de março. As doses são criadas em transação: se uma falhar, nenhuma é mantida.

### Filtros e agendas do dia

Exemplos de GET:

```text
/api/agendas/?situacao=Cancelado
/api/agendas/?situacao=Realizado
/api/agendas/?data=2026-11-10
/api/agendas/?usuario=1
/api/agendas/?usuario=1&situacao=Agendado&data=2026-11-10
/api/agendas/hoje/
```

Os filtros podem ser combinados. Valores de situação são sensíveis a maiúsculas: `Agendado`, `Realizado` e `Cancelado`. Datas e filtros inválidos retornam 400.

As listagens gerais e do dia exibem primeiro Agendado, depois Realizado e depois Cancelado; dentro de cada situação, ordenam por data, hora e ID. A rota do dia usa a data atual no fuso `America/Sao_Paulo`.

A consulta por paciente, `/api/usuarios/{id}/agendas/`, usa ordem cronológica e a mesma representação completa, com data, situação, vacina e dose, para facilitar a apresentação no frontend.

### Baixa

POST `/api/agendas/{id}/baixa/`:

```json
{"situacao": "Realizado"}
```

Ou:

```json
{"situacao": "Cancelado"}
```

O backend define `data_situacao` como a data atual em `America/Sao_Paulo`, independentemente da data agendada e de qualquer data enviada pelo cliente. A resposta contém a agenda atualizada. Uma nova baixa substitui a situação e registra a data dessa nova operação; não há retorno para Agendado por esse endpoint.

## Decisões sobre o modelo

Consulte [as adequações documentadas](modelo-dados.md). A exclusão de um paciente ou de uma vacina apaga suas agendas em cascata, conforme decisão do responsável. A exclusão de alergia remove suas associações, preservando os pacientes. Excluir uma agenda não exclui as outras doses.
