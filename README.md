# Sistema de Vacinação

Sistema de agendamento de vacinas com cadastro de pacientes e alergias, geração automática dos agendamentos de cada dose e acompanhamento das aplicações.

Projeto acadêmico desenvolvido para as disciplinas de Software para Persistência de Dados, Manutenção de Software e Implantação e Entrega de Software.

## Documentação

- [Enunciado completo e regras do projeto](docs/instrucoes-projeto.md)
- [Modelo de entidade e relacionamento (MER)](docs/mer-vacinacao.png)
- [Anexo original do MER em PDF](docs/ProjetoVacinas2023.png.pdf)
- [Orientações para agentes](AGENTS.md)

## Tecnologias escolhidas

| Tecnologia | Responsabilidade |
| --- | --- |
| Python | Linguagem do backend. |
| Django | Estrutura da aplicação backend. |
| Django ORM | Persistência, relacionamentos e migrations do banco de dados. |
| Django REST Framework (DRF) | API para comunicação com o frontend. |
| React | Interface com formulários, listagens e consulta dos agendamentos. |

O banco de dados, as versões das dependências e as ferramentas de build e implantação ainda serão definidos.

## Decisões do projeto

- **Monorepo:** backend, frontend e documentação ficarão no mesmo repositório, facilitando o acompanhamento de mudanças relacionadas.
- **Pastas separadas:** o código Django ficará em `backend/` e o React em `frontend/`. Cada aplicação terá suas próprias dependências e comandos de execução.
- **Organização simples:** a estrutura de pastas será suficiente, sem ferramentas adicionais de gerenciamento de monorepo.
- **Regras no backend:** geração das doses, cálculo das datas, validações e mudanças de situação das agendas serão tratados no backend. O React consumirá a API e apresentará os dados.
- **Situação como enumeração:** serão utilizados os recursos de enumeração do Django, como `TextChoices`, para representar Agendado, Realizado e Cancelado, adaptando à stack Python o requisito de ENUM citado para Java.
- **Fidelidade ao enunciado:** a implementação seguirá os requisitos e o MER fornecidos. Adequações no modelo serão justificadas e documentadas.
- **Código simples:** serão priorizadas soluções fáceis de entender, manter e explicar na apresentação acadêmica. Funcionalidades extras e complexidade sem necessidade ficam fora do escopo.

## Organização planejada

```text
sistema-vacinacao/
├── .github/
│   └── pull_request_template.md
├── AGENTS.md
├── README.md
├── docs/
├── backend/     # Django + DRF (a criar)
└── frontend/    # React (a criar)
```

## Funcionalidades previstas

- Inclusão, exclusão, consulta e listagem de vacinas, alergias, pacientes e agendas; alteração é opcional no enunciado.
- Associação de zero ou várias alergias a cada paciente.
- Geração automática de todos os agendamentos de uma vacina conforme doses, periodicidade e intervalo.
- Consulta de agendas realizadas e canceladas.
- Consulta das agendas do dia, ordenadas por situação: agendadas, realizadas e canceladas.
- Baixa de uma agenda como realizada ou cancelada, registrando a data do dia em `data_situacao`.
- Visualização dos agendamentos de cada paciente com data, situação, vacina e dose.
- Uma funcionalidade adicional, conforme o Item 7, ainda a ser escolhida com o responsável pelo projeto e documentada em PDF separado.

Os detalhes e as regras completas estão no [enunciado](docs/instrucoes-projeto.md).

## Instalação e execução

O repositório está na etapa de documentação inicial. Backend e frontend ainda não foram implementados; por isso, ainda não há comandos de instalação ou execução disponíveis.

O passo a passo de instalação, configuração e execução será documentado conforme a estrutura executável for criada.

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
