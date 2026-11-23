# Planejamento — evolução para o SIGV

Este documento compara o que já está implementado com o **Documento de Análise de Requisitos do Sistema Inteligente de Gestão da Vacinação (SIGV)**, atualizado em 02/10/2026, e organiza as atividades necessárias para atendê-lo.

O documento do SIGV foi fornecido pelo responsável pelo projeto **depois** do enunciado original ([instrucoes-projeto.md](instrucoes-projeto.md)). Ele amplia o escopo e não substitui os itens 1 a 6 do enunciado nem o MER fornecido pelo professor, que continuam valendo para a entrega acadêmica. As tabelas do MER (`usuarios`, `alergias`, `vacinas` e `agendas`) devem ser preservadas; as novas necessidades entram como campos ou tabelas adicionais, justificados em [modelo-dados.md](modelo-dados.md).

Em 17/11/2026, o professor sugeriu criar um **estoque de vacinas**, que impede o agendamento quando não há a vacina disponível, e uma **regra de intervalo entre aplicações**, que impede agendar a mesma vacina antes do tempo limite. O responsável complementou a sugestão: cada dose agendada reserva uma dose do estoque e, quando a vacina estiver indisponível, o paciente pode entrar em uma **lista de espera**. A sugestão está especificada em [estoque-e-regras-agendamento.md](estoque-e-regras-agendamento.md) e resumida na [seção 2](#2-sugestão-do-professor-estoque-e-intervalo-entre-aplicações). Por vir do professor e não depender das demais fases, ela passa a ser a **Fase 1** das atividades.

> **Escopo atual (decisão do responsável de 17/11/2026):** para que o projeto não se amplie de forma descontrolada, o trabalho fica limitado às Fases 0 e 1, que tratam do estoque com reserva, do controle de validade, da lista de espera e da regra de reaplicação, e à Fase 12, que reúne a implantação com CI/CD e os entregáveis acadêmicos. Depois de pronto, o sistema será hospedado; a implantação já foi preparada de forma portátil, conforme [implantacao.md](implantacao.md). As Fases 2 a 11 continuam registradas apenas como referência do documento do SIGV. Elas **não devem ser iniciadas** sem nova decisão do responsável, nem usadas como justificativa para acrescentar elementos à Fase 1.

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
- O agendamento não verifica disponibilidade da vacina nem o tempo desde a última aplicação. O mesmo paciente pode agendar a mesma vacina várias vezes.
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
| RF05 | Agendamento | 🟡 | Há escolha de data e horário e cancelamento pela baixa. Faltam unidade e remarcação. A Fase 1 acrescenta as recusas por falta de estoque e por intervalo e a lista de espera. |
| RF06 | Protocolo e QR Code | ❌ | — |
| RF07 | Notificações | ❌ | — |
| RF08 | Identificação do paciente | 🟡 | Busca apenas pelo ID do paciente. Faltam QR Code, CPF, CNS e protocolo. |
| RF09 | Check-in | ❌ | — |
| RF10 | Recomendação de vacinas | ❌ | — |
| RF11 | Explicação das recomendações | ❌ | — |
| RF12 | Doses pendentes | 🟡 | Cada agenda guarda o número da dose. Não há identificação de reforço nem de doses atrasadas. |
| RF13 | Incompatibilidades | ❌ | A Fase 1 cobre o intervalo insuficiente entre aplicações da mesma vacina. |
| RF14 | Atualização das regras | ❌ | — |
| RF15 | Registro da vacinação | 🟡 | A baixa marca como Realizada. Faltam lote, fabricante, validade, local anatômico, profissional e horário da aplicação. A Fase 1 registra o lote. |
| RF16 | Comprovante | ❌ | — |
| RF17 | Carteira de vacinação | 🟡 | A tela Agendas filtrada por paciente funciona como histórico básico (Item 6). Não há carteira consolidada. |
| RF18 | Painel de chamadas | ❌ | — |
| RF19 | Gestão de filas | ❌ | — |
| RF20 | Controle de estoque | ❌ | A Fase 1 cria lotes, validade e consumo na aplicação. A Fase 6 acrescenta unidades, perdas e alertas. |
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

## 2. Sugestão do professor: estoque e intervalo entre aplicações

A especificação completa, com exemplos, impacto no banco, na API e nas telas, e testes previstos, está em [estoque-e-regras-agendamento.md](estoque-e-regras-agendamento.md). Resumo das regras de negócio:

**Estoque**

- **RN01–RN03** O estoque é controlado por lote (vacina, número, fabricante, validade e quantidade). Só contam os lotes dentro da validade.
- **RN04** Cada agenda Agendado reserva uma dose. Estoque disponível = estoque em lotes − doses reservadas. Com 100 doses em estoque, podem ser feitos 100 agendamentos de dose; o 101º é recusado. Decisão do responsável de 17/11/2026.
- **RN05** Sem estoque disponível para as doses do agendamento, nenhuma dose é criada, o sistema informa que a vacina está indisponível e pergunta se o paciente deseja entrar na lista de espera.
- **RN06** A reserva não diminui o estoque. Só a baixa como Realizado, que confirma a aplicação, desconta uma unidade do lote escolhido pelo sistema (o válido que vence primeiro) e o registra na agenda; a reserva vira consumo. Sem lote válido, a baixa é recusada. Decisão do responsável de 17/11/2026.
- **RN07–RN08** Cancelar ou excluir uma agenda Agendado libera a reserva, e um lote já utilizado não pode ser excluído.
- **RN20** Controle de validade: lotes vencidos não são usados nem contam no estoque, e a tela Estoque classifica os lotes em válido, vence em breve (próximos 30 dias) e vencido.

**Intervalo entre aplicações**

- **RN09** O cadastro de cada vacina exige a regra de reaplicação: **após prazo mínimo**, informando o prazo em dias, semanas, meses ou anos, ou **uma vez na vida**. Decisão do responsável de 17/11/2026.
- **RN10–RN11** Com prazo mínimo, se o paciente recebeu a vacina (agenda Realizado) antes de passar o prazo, o novo agendamento é recusado e o aviso informa a partir de qual data ele é permitido.
- **RN12** Com uma vez na vida, o paciente que já recebeu a vacina não pode agendá-la novamente, mesmo que tenha recebido só parte do esquema.
- **RN13** Se o paciente já tem doses Agendado da mesma vacina, o novo agendamento também é recusado. Assim, não é possível ter mais de uma dose agendada de uma vacina de dose única nem agendar mais de uma vez uma vacina "uma vez na vida".
- **RN14** As doses seguintes geradas no mesmo agendamento continuam seguindo a regra do enunciado e não são bloqueadas.

**Lista de espera**

- **RN15–RN16** Se o paciente aceitar, entra na lista de espera da vacina, com situação Aguardando, e é informado da sua posição. A lista é atendida por ordem de entrada.
- **RN17** Só entra na lista quem atende às regras de reaplicação e de esquema em andamento, e uma única vez por vacina.
- **RN18** Quando a vacina volta a ter estoque, o atendente agenda os pacientes pela tela Lista de espera, na ordem; ao agendar, a entrada passa para Atendido.
- **RN19** O paciente pode sair da lista a pedido.

Impacto no banco: novas tabelas `lotes` e `lista_espera`, campos `reaplicacao`, `prazo_reaplicacao` e `periodicidade_reaplicacao` em `vacinas` e campo `lote_id` em `agendas`. As tabelas do MER são preservadas.

## 3. Decisões pendentes

Estas questões não estão definidas no documento do SIGV nem na sugestão do professor e precisam de resposta do responsável antes ou durante as fases indicadas. Não devem ser resolvidas por suposição. As recomendações para D14 a D23 estão na [especificação do estoque](estoque-e-regras-agendamento.md#9-decisões-e-recomendações).

| # | Questão | Afeta |
| --- | --- | --- |
| D01 | O estoque e o intervalo entre aplicações sugeridos pelo professor serão a funcionalidade adicional do **Item 7** do enunciado? O restante do SIGV entra no PDF exigido pelo item? | Escopo e entrega |
| D02 | Quais requisitos são obrigatórios para a entrega e qual é o prazo? O documento não define prioridades. | Ordem das fases |
| D03 | Nomenclatura: a tabela `usuarios` do MER representa pacientes. Os usuários do sistema (RF24) serão o `User` do Django com outro nome na interface, como "Profissionais"? | Fase 2 |
| D04 | Como funciona a autenticação do frontend (sessão ou token)? | Fase 2 |
| D05 | Quais unidades de saúde existem e como são cadastradas? Há capacidade de atendimento por horário? | Fase 4 |
| D06 | Remarcar uma dose altera as datas das doses seguintes do mesmo esquema? | Fase 4 |
| D07 | Qual é a ordem e o peso das prioridades da fila (gestantes, idosos, PCD, crianças, emergências)? Como se calcula a previsão de atendimento? | Fase 5 |
| D08 | A baixa "Realizada" passa a exigir o registro completo da aplicação (local anatômico, profissional etc.)? | Fase 7 |
| D09 | Qual é a fonte das regras do PNI e das contraindicações? O sistema terá um conjunto inicial de regras ou elas serão cadastradas manualmente? | Fase 8 |
| D10 | Hospedagem do bot do Telegram: polling ou webhook? Quem cria o bot e guarda o token? | Fase 9 |
| D11 | Como o envio de lembretes será agendado (comando periódico, cron, outro)? | Fase 9 |
| D12 | Qual técnica de "inteligência artificial" é aceitável para a predição de demanda (média móvel, regressão, outro) e com quais dados históricos? | Fase 11 |
| D13 | Onde o sistema será hospedado? **Parcialmente decidida em 17/11/2026:** todo o sistema será hospedado depois de pronto. A implantação foi preparada com Docker e CI/CD para funcionar em qualquer hospedagem com Docker; falta escolher a hospedagem ([implantacao.md](implantacao.md)). | Fase 12 |
| D14 | Em uma vacina de várias doses, o agendamento reserva estoque para todas as doses do esquema ou só para a primeira? | Fase 1 |
| D15 | ~~O agendamento reserva estoque ou o estoque só diminui na aplicação?~~ **Decidida em 17/11/2026:** reserva. Cada agendamento consome uma dose do estoque disponível; sem estoque, é oferecida a lista de espera. | Fase 1 |
| D16 | ~~Como se define o tempo limite entre aplicações?~~ **Decidida em 17/11/2026:** campo obrigatório no cadastro da vacina, com prazo mínimo (quantidade e unidade) ou uma vez na vida. | Fase 1 |
| D17 | Um novo agendamento é bloqueado quando o paciente já tem doses Agendado da mesma vacina? **Decidida em 17/11/2026 para vacinas de dose única e "uma vez na vida": sim.** Falta confirmar para vacinas de várias doses com prazo mínimo. | Fase 1 |
| D18 | ~~Na baixa Realizado, o lote é escolhido pelo sistema (vencimento mais próximo) ou pelo profissional?~~ **Decidida em 17/11/2026:** pelo sistema, escolhendo o lote válido que vence primeiro, o que permite controlar a validade. O estoque só diminui na confirmação da aplicação. | Fase 1 e Fase 7 |
| D19 | A baixa Realizado pode ser recusada por falta de estoque, alterando o comportamento atual do Item 5? | Fase 1 |
| D20 | ~~Em uma vacina "uma vez na vida" com várias doses, o paciente que recebeu só parte do esquema e teve as demais doses canceladas pode agendar de novo?~~ **Decidida em 17/11/2026:** não; basta uma dose Realizado para bloquear. | Fase 1 |
| D21 | ~~Quais valores de reaplicação recebem as vacinas já cadastradas quando o campo obrigatório for criado?~~ **Decidida em 17/11/2026:** as vacinas existentes são fictícias; a migration atribui o valor provisório `Unica` e elas podem ser excluídas ou recadastradas. | Fase 1 |
| D22 | Quando a vacina volta a ter estoque, o paciente da lista de espera é agendado pelo atendente, na ordem da lista, ou automaticamente? | Fase 1 e Fase 9 |
| D23 | As doses que voltam ao estoque ficam reservadas para a lista de espera, impedindo que um paciente fora da lista agende antes? | Fase 1 |

## 4. Atividades

As fases estão em ordem de dependência: cada uma usa o que as anteriores criam. Dentro de uma fase, as atividades podem ser divididas entre a dupla. Toda atividade inclui backend, frontend, testes e atualização da documentação correspondente, salvo indicação.

### Fase 0 — Preparação

- [ ] **A01** Obter as respostas das decisões do escopo atual: D01, D02, D13 (hospedagem), D14, D17 (vacinas de várias doses com prazo mínimo), D19, D22 e D23.
- [x] **A02** Registrar no README e em [modelo-dados.md](modelo-dados.md) as ampliações do escopo, distinguindo-as do enunciado original.
- [x] **A03** Desenhar o modelo de dados necessário à Fase 1 a partir do MER, sem remover nada dele, e documentar a justificativa de cada adequação em [modelo-dados.md](modelo-dados.md).

### Fase 1 — Estoque de vacinas, lista de espera e regras de agendamento (sugestão do professor; RF05, RF13 e RF20 parciais)

Vem primeiro porque foi sugerida pelo professor, é candidata ao Item 7 (D01) e não depende de autenticação, unidades ou cadastro completo do paciente. Especificação: [estoque-e-regras-agendamento.md](estoque-e-regras-agendamento.md).

- [ ] **A04** Criar o modelo `Lote` (tabela `lotes`) com vacina, número, fabricante, validade e quantidade, com restrição de quantidade não negativa e número único por vacina, e os endpoints de listagem, cadastro, consulta e exclusão (RN01 a RN03, RN08).
- [ ] **A05** Acrescentar à vacina a regra de reaplicação obrigatória (`reaplicacao`, `prazo_reaplicacao` e `periodicidade_reaplicacao`, com restrição de coerência no banco) e os campos somente leitura de estoque em lotes, doses reservadas, estoque disponível e pacientes na lista de espera às respostas de vacina (RN03, RN04, RN09), conforme D21.
- [ ] **A06** No agendamento, recusar quando o paciente já tiver doses Agendado da mesma vacina, quando não tiver passado o prazo mínimo desde a última aplicação, informando a data liberada, ou quando a vacina for "uma vez na vida" e já tiver sido aplicada (RN10 a RN14), conforme D17 e D20.
- [ ] **A07** No agendamento, calcular o estoque disponível descontando as doses reservadas pelas agendas Agendado e recusar com HTTP 409 ("vacina indisponível") quando ele não cobrir as doses do agendamento, sem criar nenhuma agenda e bloqueando os lotes durante a transação (RN04, RN05), conforme D14.
- [ ] **A08** Na baixa Realizado, o sistema escolhe o lote válido que vence primeiro, desconta uma unidade e o registra em `Agenda.lote`, na mesma transação, informando o lote na resposta e recusando a baixa sem lote válido (RN06, RN07). Classificar os lotes por validade (RN20), conforme D19.
- [ ] **A09** Criar o modelo `ListaEspera` (tabela `lista_espera`) e os endpoints de listagem com posição, inclusão e exclusão; validar RN11 a RN13 na inclusão e marcar a entrada como Atendido ao agendar (RN15 a RN19), conforme D22 e D23.
- [ ] **A10** Criar as telas Estoque (resumo por vacina e lotes classificados por validade) e Lista de espera (Agendar e Remover); acrescentar à tela Vacinas o seletor de reaplicação (após prazo mínimo, com prazo e unidade, ou uma vez na vida) e o estoque disponível; no novo agendamento, mostrar o estoque disponível e, após o 409, perguntar se o paciente deseja entrar na lista de espera; informar o lote escolhido na confirmação da aplicação e mostrá-lo na consulta da agenda.
- [ ] **A11** Escrever os testes previstos na especificação e atualizar [backend.md](backend.md), [frontend.md](frontend.md) e [modelo-dados.md](modelo-dados.md). Se D01 confirmar, redigir o PDF do Item 7 a partir da especificação.

### Fora do escopo atual — Fases 2 a 11

> As fases abaixo registram o restante do documento do SIGV para consulta futura. Não fazem parte do escopo atual e não devem ser iniciadas sem nova decisão do responsável. A Fase 12 (Entrega) continua no escopo.

### Fase 2 — Usuários do sistema, permissões e auditoria (RF24, RF25, RF26)

Vem antes do restante do SIGV porque check-in, registro da vacinação e auditoria precisam saber **qual profissional** realizou cada ação.

- [ ] **A12** Instalar `django.contrib.auth` e `contenttypes` e criar os grupos Administrador, Gestor, Enfermeiro e Recepcionista.
- [ ] **A13** Implementar login e logout na API e no frontend, conforme D04.
- [ ] **A14** Restringir os endpoints existentes e futuros por perfil, incluindo os de estoque.
- [ ] **A15** Criar a tela de usuários do sistema: cadastrar, editar, excluir e atribuir perfil (somente Administrador).
- [ ] **A16** Criar o modelo `RegistroAuditoria` (usuário, ação, objeto, data e hora) e registrar logins, alterações, vacinações e consultas.
- [ ] **A17** Criar a tela de consulta da auditoria, com filtros por usuário, ação e período (Administrador e Gestor).

### Fase 3 — Cadastro completo do paciente (RF01, RF02 presencial, RF08 parcial)

- [ ] **A18** Acrescentar ao paciente: CPF (único e validado), CNS (único e validado), peso, altura, telefone, e-mail, comorbidades, gestante e PCD.
- [ ] **A19** Habilitar a edição do paciente (PATCH) e criar o formulário de edição na tela Pacientes.
- [ ] **A20** Permitir buscar o paciente por CPF ou CNS na API e nas telas.

### Fase 4 — Unidades, agendamento e protocolo (RF05, RF06)

- [ ] **A21** Criar o cadastro de unidades de saúde (nome, endereço e, conforme D05, capacidade).
- [ ] **A22** Incluir a unidade no agendamento.
- [ ] **A23** Implementar a remarcação de agenda, conforme D06, aplicando as regras de estoque, reserva e intervalo da Fase 1 à nova data.
- [ ] **A24** Gerar um número de protocolo único por agendamento.
- [ ] **A25** Gerar o QR Code do protocolo e exibi-lo na confirmação do agendamento.

### Fase 5 — Check-in, fila e painel de chamadas (RF08, RF09, RF18, RF19)

- [ ] **A26** Criar a tela de identificação do paciente por QR Code, CPF, CNS ou protocolo.
- [ ] **A27** Criar o modelo `Atendimento` (check-in): paciente, agenda, unidade, horário do check-in e profissional responsável.
- [ ] **A28** Inserir o paciente na fila no check-in, gerando uma senha.
- [ ] **A29** Ordenar a fila pelas prioridades configuradas (D07) e reordenar quando a prioridade mudar.
- [ ] **A30** Calcular e exibir a previsão de atendimento.
- [ ] **A31** Criar a ação de chamar o próximo paciente, informando guichê ou sala.
- [ ] **A32** Criar o painel de chamadas em tela cheia (senha atual, próxima senha e guichê/sala), com aviso sonoro, para exibição em televisão.

### Fase 6 — Ampliação do estoque (RF20)

Amplia o estoque criado na Fase 1 com as unidades da Fase 4. Vem antes do registro completo da vacinação porque a aplicação consome um lote da unidade.

- [ ] **A33** Acrescentar a unidade ao lote e criar o modelo `MovimentacaoEstoque` (entrada, saída ou perda, quantidade, data e usuário), registrando também as saídas feitas na baixa Realizado. O estoque disponível passa a ser calculado por unidade.
- [ ] **A34** Ampliar a tela Estoque com saldo por vacina, lote e unidade e o registro de entradas e perdas.
- [ ] **A35** Emitir alertas de estoque baixo, de vacina vencida e de lote próximo do vencimento, ampliando a classificação de validade da Fase 1. O limite de estoque baixo e a antecedência do vencimento, hoje fixa em 30 dias, devem ser configuráveis.

### Fase 7 — Registro da vacinação, carteira e comprovante (RF15, RF16, RF17)

- [ ] **A36** Ampliar o registro da aplicação com local anatômico, profissional e horário, conforme D08. O lote já é escolhido pelo sistema e registrado desde a Fase 1 (D18); o fabricante e a validade vêm dele.
- [ ] **A37** Manter em uma única transação a baixa Realizada, a saída do lote e a movimentação de estoque.
- [ ] **A38** Criar a tela de carteira de vacinação do paciente, com todas as aplicações registradas.
- [ ] **A39** Emitir o comprovante digital da vacinação (página para impressão ou PDF).

### Fase 8 — Regras de vacinação e recomendações (RF10 a RF14, RF29)

- [ ] **A40** Criar o cadastro de regras de vacinação (faixa etária, sexo, gestação, contraindicações, intervalos mínimos entre vacinas diferentes, incompatibilidades) e de campanhas vigentes, editável pelo Gestor (RF14). A regra de reaplicação da mesma vacina já existe desde a Fase 1.
- [ ] **A41** Implementar o serviço de recomendação que cruza o perfil do paciente, a triagem, as alergias e a carteira com as regras (RF10).
- [ ] **A42** Exibir a justificativa de cada recomendação (RF11).
- [ ] **A43** Classificar as doses do paciente em primeira dose, segunda dose, reforço e atrasadas (RF12).
- [ ] **A44** Alertar sobre incompatibilidades, contraindicação e idade inadequada no agendamento e no registro da aplicação, junto com as recusas da Fase 1 (RF13).
- [ ] **A45** Listar os pacientes com esquema vacinal incompleto (RF29).

### Fase 9 — Telegram e notificações (RF02, RF03, RF04, RF07, RF30)

- [ ] **A46** Criar o bot do Telegram e o vínculo entre o chat e o paciente, identificado pelo CPF (RF03).
- [ ] **A47** Implementar a atualização cadastral pelo bot (RF02).
- [ ] **A48** Implementar a triagem pelo bot: sintomas, febre, gravidez, alergias, medicamentos, imunossupressão, doenças recentes, peso e viagens internacionais. As respostas ficam salvas no modelo `Triagem` (RF04).
- [ ] **A49** Mostrar as recomendações no bot e permitir agendar, cancelar e remarcar, devolvendo o protocolo e o QR Code. As recusas por estoque e intervalo são informadas pelo bot com as mesmas mensagens.
- [ ] **A50** Enviar confirmação de agendamento, lembrete de atendimento, lembrete de segunda dose e reforço, informações de campanhas e aviso aos pacientes da lista de espera quando a vacina voltar a ter estoque (RF07, D22).
- [ ] **A51** Enviar convites automáticos para pacientes com doses pendentes ou atrasadas (RF30).

### Fase 10 — Relatórios, indicadores e exportação (RF21, RF22, RF23)

- [ ] **A52** Criar os relatórios de pacientes atendidos, vacinas aplicadas, tempo médio de atendimento e filas, com filtros por período e unidade (RF21).
- [ ] **A53** Criar o painel de indicadores: cobertura vacinal, doses aplicadas, campanhas, estoque e pacientes faltosos (RF22).
- [ ] **A54** Exportar os relatórios em PDF, Excel e CSV (RF23).

### Fase 11 — Predição de demanda e otimização do estoque (RF27, RF28)

- [ ] **A55** Implementar a estimativa de demanda diária, considerando campanhas e sazonalidade, conforme D12 (RF27).
- [ ] **A56** Sugerir a quantidade de vacinas necessária a partir da demanda estimada e do estoque atual (RF28).

### Fase 12 — Implantação e entrega (no escopo atual)

Com o escopo atual, o manual e os entregáveis cobrem os itens 1 a 6 e a Fase 1, sem o bot do Telegram. A preparação da implantação (A58) não depende da Fase 1 e já foi feita, para que hospedar o sistema no fim seja apenas configuração.

- [ ] **A57** Revisar o manual de instalação, configuração e execução (backend, frontend e Docker).
- [x] **A58** Preparar a implantação portátil e o CI/CD: imagens Docker do backend (Gunicorn) e do frontend (Nginx), `docker-compose.yml` com PostgreSQL e pipeline no GitHub Actions com testes (inclusive em PostgreSQL real), build, publicação das imagens no GHCR e job de deploy acionado por segredos. Documentado em [implantacao.md](implantacao.md).
- [ ] **A59** Escolher a hospedagem (D13), proteger as branches `main` e `develop` e executar o checklist de deploy de [implantacao.md](implantacao.md#6-checklist-do-deploy).
- [ ] **A60** Preparar os entregáveis acadêmicos: vídeo de até 5 minutos, `video.txt` e o PDF do Item 7, conforme D01.

## 5. Dependências entre fases

```text
Fase 0 ─► Fase 1 ──────────────────────────────┐
  │                                            │
  └─────► Fase 2 ─► Fase 3 ─► Fase 4 ─► Fase 5 │
                      │         │              ▼
                      │         └────────────► Fase 6 ─► Fase 7 ─► Fase 8 ─► Fase 9
                      │                                              │
                      └──────────────────────────────────────────────┴──► Fase 10 ─► Fase 11 ─► Fase 12
```

- A Fase 1 depende apenas das decisões da Fase 0 e pode ser desenvolvida em paralelo com a Fase 2.
- A Fase 6 amplia o estoque da Fase 1 e precisa das unidades da Fase 4.
- A Fase 9 (Telegram) reutiliza o cadastro, o agendamento, o protocolo e as recomendações. Por isso vem depois das Fases 3, 4 e 8.
- A Fase 11 precisa do estoque (Fases 1 e 6) e de dados históricos de aplicações (Fase 7).
- A Fase 10 pode começar assim que houver dados de atendimento e estoque, e ser ampliada depois.

## 6. Novas dependências previstas

Conforme as orientações do projeto, cada dependência só deve ser adicionada quando a fase correspondente começar e se for realmente necessária. A escolha final cabe ao responsável. A Fase 1 não exige novas dependências. Para a implantação (Fase 12), foram acrescentados o Gunicorn ao `requirements.txt` e as imagens base do Docker (Python, Node, Nginx e PostgreSQL); o GitHub Actions não exige instalação.

| Necessidade | Fase | Observação |
| --- | --- | --- |
| Geração de QR Code | 4 | Biblioteca de QR Code no backend ou no frontend. |
| Leitura de QR Code pela câmera | 5 | Pode ser substituída pela digitação do protocolo. |
| Integração com o Telegram | 9 | Biblioteca de bot ou chamadas diretas à API HTTP do Telegram. |
| Exportação para PDF e Excel | 7 e 10 | O CSV pode ser gerado com a biblioteca padrão do Python. |
| Predição de demanda | 11 | Depende da técnica escolhida em D12. |
