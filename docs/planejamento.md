# Planejamento — evolução para o SIGV

Este documento compara o que já está implementado com o **Documento de Análise de Requisitos do Sistema Inteligente de Gestão da Vacinação (SIGV)**, atualizado em 02/10/2026, e organiza as atividades necessárias para atendê-lo.

O documento do SIGV foi fornecido pelo responsável pelo projeto **depois** do enunciado original ([instrucoes-projeto.md](instrucoes-projeto.md)). Ele amplia o escopo e não substitui os itens 1 a 6 do enunciado nem o MER fornecido pelo professor, que continuam valendo para a entrega acadêmica. As tabelas do MER (`usuarios`, `alergias`, `vacinas` e `agendas`) devem ser preservadas; as novas necessidades entram como campos ou tabelas adicionais, justificados em [modelo-dados.md](modelo-dados.md).

Legenda de situação: ✅ implementado · 🟡 parcial · ❌ não implementado.

## 1. Situação atual

### O que já existe

- **Backend** Django 5.2 + DRF + PostgreSQL, com os apps `usuarios` (pacientes e alergias) e `vacinacao` (vacinas e agendas).
- **CRUD** de pacientes, alergias, vacinas e agendas, com inclusão, consulta, listagem e exclusão. Edição (PUT/PATCH) não está habilitada.
- **Geração automática das doses** ao agendar, conforme doses, periodicidade e intervalo da vacina.
- **Baixa** da agenda como Realizada ou Cancelada, com `data_situacao` igual à data do dia.
- **Filtros** de agendas por data, situação e paciente, e lista do dia ordenada por situação.
- **Frontend** React + Vite com as telas Início (resumo, calendário e visão do dia por horário), Agendas, Pacientes, Vacinas e Alergias.
- **Testes** automatizados no backend (Django, SQLite em memória) e no frontend (Vitest).

### O que não existe

- Não há autenticação, perfis de acesso nem auditoria. Os apps `django.contrib.auth` e `contenttypes` não estão instalados, e a API usa `AllowAny`.
- Não há unidades de saúde, estoque, fila, check-in, protocolo nem QR Code.
- Não há integração com o Telegram nem envio de notificações.
- Não há regras de recomendação vacinal, campanhas nem módulo de IA.
- A implantação ainda não foi definida.

### Cobertura dos requisitos funcionais

| RF | Nome | Situação | Observação sobre o que existe hoje |
| --- | --- | --- | --- |
| RF01 | Cadastro do paciente | 🟡 | Há nome, data de nascimento, sexo, endereço e alergias. Faltam CPF, CNS, peso, altura, telefone, e-mail, comorbidades, gestação e PCD. |
| RF02 | Atualização cadastral | 🟡 | Não há edição presencial (PUT/PATCH desabilitados) nem pelo Telegram. |
| RF03 | Atendimento pelo Telegram | ❌ | — |
| RF04 | Triagem | ❌ | — |
| RF05 | Agendamento | 🟡 | Há escolha de data e horário e cancelamento pela baixa. Faltam unidade e remarcação. |
| RF06 | Protocolo e QR Code | ❌ | — |
| RF07 | Notificações | ❌ | — |
| RF08 | Identificação do paciente | 🟡 | Busca apenas pelo ID do paciente. Faltam QR Code, CPF, CNS e protocolo. |
| RF09 | Check-in | ❌ | — |
| RF10 | Recomendação de vacinas | ❌ | — |
| RF11 | Explicação das recomendações | ❌ | — |
| RF12 | Doses pendentes | 🟡 | Cada agenda guarda o número da dose. Não há identificação de reforço nem de doses atrasadas. |
| RF13 | Incompatibilidades | ❌ | — |
| RF14 | Atualização das regras | ❌ | — |
| RF15 | Registro da vacinação | 🟡 | A baixa marca como Realizada. Faltam lote, fabricante, validade, local anatômico, profissional e horário da aplicação. |
| RF16 | Comprovante | ❌ | — |
| RF17 | Carteira de vacinação | 🟡 | A tela Agendas filtrada por paciente funciona como histórico básico (Item 6). Não há carteira consolidada. |
| RF18 | Painel de chamadas | ❌ | — |
| RF19 | Gestão de filas | ❌ | — |
| RF20 | Controle de estoque | ❌ | — |
| RF21 | Relatórios operacionais | ❌ | — |
| RF22 | Indicadores | 🟡 | A tela Início mostra totais de agendas de hoje, aguardando, realizadas e canceladas. Faltam cobertura, campanhas, estoque e faltosos. |
| RF23 | Exportação | ❌ | — |
| RF24 | Controle de usuários | ❌ | Hoje "usuário" significa paciente (tabela `usuarios` do MER). |
| RF25 | Permissões | ❌ | — |
| RF26 | Auditoria | ❌ | — |
| RF27 | Predição de demanda | ❌ | — |
| RF28 | Otimização do estoque | ❌ | Depende do RF20 e do RF27. |
| RF29 | Esquemas incompletos | ❌ | Os dados de doses agendadas já permitem uma primeira versão. |
| RF30 | Convocação pelo Telegram | ❌ | Depende do RF07 e do RF12/RF29. |

**Resumo:** 0 de 30 requisitos completos, 8 parciais e 22 não implementados.

## 2. Decisões pendentes

Estas questões não estão definidas no documento do SIGV e precisam de resposta do responsável antes ou durante as fases indicadas. Não devem ser resolvidas por suposição.

| # | Questão | Afeta |
| --- | --- | --- |
| D01 | O SIGV será a funcionalidade adicional do **Item 7** do enunciado? Em caso afirmativo, qual parte entra no PDF exigido pelo item? | Escopo e entrega |
| D02 | Quais requisitos são obrigatórios para a entrega e qual é o prazo? O documento não define prioridades. | Ordem das fases |
| D03 | Nomenclatura: a tabela `usuarios` do MER representa pacientes. Os usuários do sistema (RF24) serão o `User` do Django com outro nome na interface, como "Profissionais"? | Fase 1 |
| D04 | Como funciona a autenticação do frontend (sessão ou token)? | Fase 1 |
| D05 | Quais unidades de saúde existem e como são cadastradas? Há capacidade de atendimento por horário? | Fase 3 |
| D06 | Remarcar uma dose altera as datas das doses seguintes do mesmo esquema? | Fase 3 |
| D07 | Qual é a ordem e o peso das prioridades da fila (gestantes, idosos, PCD, crianças, emergências)? Como se calcula a previsão de atendimento? | Fase 4 |
| D08 | A baixa "Realizada" atual passa a exigir o registro completo da aplicação (lote, local anatômico etc.)? | Fase 6 |
| D09 | Qual é a fonte das regras do PNI e das contraindicações? O sistema terá um conjunto inicial de regras ou elas serão cadastradas manualmente? | Fase 7 |
| D10 | Hospedagem do bot do Telegram: polling ou webhook? Quem cria o bot e guarda o token? | Fase 8 |
| D11 | Como o envio de lembretes será agendado (comando periódico, cron, outro)? | Fase 8 |
| D12 | Qual técnica de "inteligência artificial" é aceitável para a predição de demanda (média móvel, regressão, outro) e com quais dados históricos? | Fase 10 |
| D13 | Onde e como o sistema será implantado? | Fase 11 |

## 3. Atividades

As fases estão em ordem de dependência: cada uma usa o que as anteriores criam. Dentro de uma fase, as atividades podem ser divididas entre a dupla. Toda atividade inclui backend, frontend, testes e atualização da documentação correspondente, salvo indicação.

### Fase 0 — Preparação

- [ ] **A01** Obter as respostas das decisões D01 a D04.
- [ ] **A02** Registrar no README e em [modelo-dados.md](modelo-dados.md) que o SIGV é uma ampliação do escopo, distinguindo-a do enunciado original.
- [ ] **A03** Desenhar o modelo de dados estendido (novas tabelas e campos) a partir do MER, sem remover nada dele, e documentar a justificativa de cada adequação.

### Fase 1 — Usuários do sistema, permissões e auditoria (RF24, RF25, RF26)

Vem primeiro porque check-in, registro da vacinação e auditoria precisam saber **qual profissional** realizou cada ação.

- [ ] **A04** Instalar `django.contrib.auth` e `contenttypes` e criar os grupos Administrador, Gestor, Enfermeiro e Recepcionista.
- [ ] **A05** Implementar login e logout na API e no frontend, conforme D04.
- [ ] **A06** Restringir os endpoints existentes e futuros por perfil.
- [ ] **A07** Criar a tela de usuários do sistema: cadastrar, editar, excluir e atribuir perfil (somente Administrador).
- [ ] **A08** Criar o modelo `RegistroAuditoria` (usuário, ação, objeto, data e hora) e registrar logins, alterações, vacinações e consultas.
- [ ] **A09** Criar a tela de consulta da auditoria, com filtros por usuário, ação e período (Administrador e Gestor).

### Fase 2 — Cadastro completo do paciente (RF01, RF02 presencial, RF08 parcial)

- [ ] **A10** Acrescentar ao paciente: CPF (único e validado), CNS (único e validado), peso, altura, telefone, e-mail, comorbidades, gestante e PCD.
- [ ] **A11** Habilitar a edição do paciente (PATCH) e criar o formulário de edição na tela Pacientes.
- [ ] **A12** Permitir buscar o paciente por CPF ou CNS na API e nas telas.

### Fase 3 — Unidades, agendamento e protocolo (RF05, RF06)

- [ ] **A13** Criar o cadastro de unidades de saúde (nome, endereço e, conforme D05, capacidade).
- [ ] **A14** Incluir a unidade no agendamento.
- [ ] **A15** Implementar a remarcação de agenda, conforme D06.
- [ ] **A16** Gerar um número de protocolo único por agendamento.
- [ ] **A17** Gerar o QR Code do protocolo e exibi-lo na confirmação do agendamento.

### Fase 4 — Check-in, fila e painel de chamadas (RF08, RF09, RF18, RF19)

- [ ] **A18** Criar a tela de identificação do paciente por QR Code, CPF, CNS ou protocolo.
- [ ] **A19** Criar o modelo `Atendimento` (check-in): paciente, agenda, unidade, horário do check-in e profissional responsável.
- [ ] **A20** Inserir o paciente na fila no check-in, gerando uma senha.
- [ ] **A21** Ordenar a fila pelas prioridades configuradas (D07) e reordenar quando a prioridade mudar.
- [ ] **A22** Calcular e exibir a previsão de atendimento.
- [ ] **A23** Criar a ação de chamar o próximo paciente, informando guichê ou sala.
- [ ] **A24** Criar o painel de chamadas em tela cheia (senha atual, próxima senha e guichê/sala), com aviso sonoro, para exibição em televisão.

### Fase 5 — Estoque (RF20)

Vem antes do registro da vacinação porque a aplicação consome um lote do estoque.

- [ ] **A25** Criar os modelos `Lote` (vacina, número, fabricante, validade, unidade) e `MovimentacaoEstoque` (entrada, saída ou perda, quantidade, data e usuário).
- [ ] **A26** Criar a tela de estoque, com saldo por vacina, lote e unidade, e o registro de entradas e perdas.
- [ ] **A27** Emitir alertas de estoque baixo, de vacina vencida e de lote próximo do vencimento. O limite de estoque baixo e a antecedência do vencimento devem ser configuráveis.

### Fase 6 — Registro da vacinação, carteira e comprovante (RF15, RF16, RF17)

- [ ] **A28** Criar o registro da aplicação: vacina, lote, dose, local anatômico, profissional e horário. O fabricante e a validade vêm do lote.
- [ ] **A29** Ao registrar, marcar a agenda como Realizada e dar saída automática do lote no estoque, em uma única transação.
- [ ] **A30** Criar a tela de carteira de vacinação do paciente, com todas as aplicações registradas.
- [ ] **A31** Emitir o comprovante digital da vacinação (página para impressão ou PDF).

### Fase 7 — Regras de vacinação e recomendações (RF10 a RF14, RF29)

- [ ] **A32** Criar o cadastro de regras de vacinação (faixa etária, sexo, gestação, contraindicações, intervalos mínimos, incompatibilidades) e de campanhas vigentes, editável pelo Gestor (RF14).
- [ ] **A33** Implementar o serviço de recomendação que cruza o perfil do paciente, a triagem, as alergias e a carteira com as regras (RF10).
- [ ] **A34** Exibir a justificativa de cada recomendação (RF11).
- [ ] **A35** Classificar as doses do paciente em primeira dose, segunda dose, reforço e atrasadas (RF12).
- [ ] **A36** Alertar sobre incompatibilidades, intervalo insuficiente, contraindicação e idade inadequada no agendamento e no registro da aplicação (RF13).
- [ ] **A37** Listar os pacientes com esquema vacinal incompleto (RF29).

### Fase 8 — Telegram e notificações (RF02, RF03, RF04, RF07, RF30)

- [ ] **A38** Criar o bot do Telegram e o vínculo entre o chat e o paciente, identificado pelo CPF (RF03).
- [ ] **A39** Implementar a atualização cadastral pelo bot (RF02).
- [ ] **A40** Implementar a triagem pelo bot: sintomas, febre, gravidez, alergias, medicamentos, imunossupressão, doenças recentes, peso e viagens internacionais. As respostas ficam salvas no modelo `Triagem` (RF04).
- [ ] **A41** Mostrar as recomendações no bot e permitir agendar, cancelar e remarcar, devolvendo o protocolo e o QR Code.
- [ ] **A42** Enviar confirmação de agendamento, lembrete de atendimento, lembrete de segunda dose e reforço e informações de campanhas (RF07).
- [ ] **A43** Enviar convites automáticos para pacientes com doses pendentes ou atrasadas (RF30).

### Fase 9 — Relatórios, indicadores e exportação (RF21, RF22, RF23)

- [ ] **A44** Criar os relatórios de pacientes atendidos, vacinas aplicadas, tempo médio de atendimento e filas, com filtros por período e unidade (RF21).
- [ ] **A45** Criar o painel de indicadores: cobertura vacinal, doses aplicadas, campanhas, estoque e pacientes faltosos (RF22).
- [ ] **A46** Exportar os relatórios em PDF, Excel e CSV (RF23).

### Fase 10 — Predição de demanda e otimização do estoque (RF27, RF28)

- [ ] **A47** Implementar a estimativa de demanda diária, considerando campanhas e sazonalidade, conforme D12 (RF27).
- [ ] **A48** Sugerir a quantidade de vacinas necessária a partir da demanda estimada e do estoque atual (RF28).

### Fase 11 — Entrega

- [ ] **A49** Revisar o manual de instalação, configuração e execução (backend, frontend e bot).
- [ ] **A50** Definir e documentar a implantação, conforme D13.
- [ ] **A51** Preparar os entregáveis acadêmicos: vídeo de até 5 minutos, `video.txt` e o PDF do Item 7, conforme D01.

## 4. Dependências entre fases

```text
Fase 0 ─► Fase 1 ─► Fase 2 ─► Fase 3 ─► Fase 4
                       │         │
                       │         └──► Fase 5 ─► Fase 6 ─► Fase 7 ─► Fase 8
                       │                                    │
                       └────────────────────────────────────┴──► Fase 9 ─► Fase 10 ─► Fase 11
```

- A Fase 8 (Telegram) reutiliza o cadastro, o agendamento, o protocolo e as recomendações. Por isso vem depois das Fases 2, 3 e 7.
- A Fase 10 precisa do estoque (Fase 5) e de dados históricos de aplicações (Fase 6).
- A Fase 9 pode começar assim que houver dados de atendimento e estoque, e ser ampliada depois.

## 5. Novas dependências previstas

Conforme as orientações do projeto, cada dependência só deve ser adicionada quando a fase correspondente começar e se for realmente necessária. A escolha final cabe ao responsável.

| Necessidade | Fase | Observação |
| --- | --- | --- |
| Geração de QR Code | 3 | Biblioteca de QR Code no backend ou no frontend. |
| Leitura de QR Code pela câmera | 4 | Pode ser substituída pela digitação do protocolo. |
| Integração com o Telegram | 8 | Biblioteca de bot ou chamadas diretas à API HTTP do Telegram. |
| Exportação para PDF e Excel | 6 e 9 | O CSV pode ser gerado com a biblioteca padrão do Python. |
| Predição de demanda | 10 | Depende da técnica escolhida em D12. |
