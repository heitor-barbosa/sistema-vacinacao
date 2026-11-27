# Planejamento — evolução para o SIGV

Este documento compara o que já está implementado com o **Documento de Análise de Requisitos do Sistema Inteligente de Gestão da Vacinação (SIGV)**, atualizado em 02/10/2026, e organiza as atividades necessárias para atendê-lo.

O documento do SIGV foi fornecido pelo responsável pelo projeto **depois** do enunciado original ([instrucoes-projeto.md](instrucoes-projeto.md)). Ele amplia o escopo e não substitui os itens 1 a 6 do enunciado nem o MER fornecido pelo professor, que continuam valendo para a entrega acadêmica. As tabelas do MER (`usuarios`, `alergias`, `vacinas` e `agendas`) devem ser preservadas; as novas necessidades entram como campos ou tabelas adicionais, justificados em [modelo-dados.md](modelo-dados.md).

A proposta de estoque sugerida pelo professor em 17/11/2026 está especificada em [estoque-e-regras-agendamento.md](estoque-e-regras-agendamento.md) e resumida na seção 2. Em **23/11/2026**, o responsável confirmou o controle por **lotes, validade e reservas**, retirou as regras adicionais de reaplicação e a lista de espera, e solicitou a integração com o Telegram para o próprio paciente agendar vacinação. A indisponibilidade da vacina apenas impede o agendamento; os campos existentes `doses`, `periodicidade` e `intervalo` continuam definindo a geração das doses.

> **Escopo atual (23/11/2026):** itens 1 a 6, estoque da Fase 1, agendamento pelo próprio paciente no Telegram e implantação e entregáveis da Fase 12. Da Fase 9, entram somente o bot, o vínculo com o paciente e o fluxo de agendamento. A forma de identificar o paciente precisa ser definida antes da implementação. As demais atividades das Fases 2 a 11 ficam apenas como referência do SIGV e não devem ser iniciadas sem nova decisão. A implantação com Docker e CI/CD já foi preparada, conforme [implantacao.md](implantacao.md).

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
- O agendamento ainda não verifica disponibilidade da vacina. A geração das doses conforme periodicidade e intervalo já existe.
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
| RF05 | Agendamento | 🟡 | Há escolha de data e horário e cancelamento pela baixa. Faltam unidade e remarcação. A Fase 1 acrescenta a recusa por falta de estoque. |
| RF06 | Protocolo e QR Code | ❌ | — |
| RF07 | Notificações | ❌ | — |
| RF08 | Identificação do paciente | 🟡 | Busca apenas pelo ID do paciente. Faltam QR Code, CPF, CNS e protocolo. |
| RF09 | Check-in | ❌ | — |
| RF10 | Recomendação de vacinas | ❌ | — |
| RF11 | Explicação das recomendações | ❌ | — |
| RF12 | Doses pendentes | 🟡 | Cada agenda guarda o número da dose. Não há identificação de reforço nem de doses atrasadas. |
| RF13 | Incompatibilidades | ❌ | Fora do escopo atual. |
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

## 2. Estoque e disponibilidade no agendamento

A especificação completa está em [estoque-e-regras-agendamento.md](estoque-e-regras-agendamento.md). Resumo das regras:

- **RN01–RN03** Controle por lote, com vacina, número, fabricante, validade e quantidade. Só contam lotes válidos na data considerada.
- **RN04** Cada agenda Agendado reserva uma dose. Estoque disponível = estoque em lotes − doses reservadas. A reserva não altera a quantidade do lote.
- **RN05** Sem estoque suficiente para as doses do agendamento, nenhuma agenda é criada e o sistema informa a indisponibilidade, conforme D14 e D24.
- **RN06** Na baixa Realizado, o sistema escolhe o lote válido que vence primeiro, desconta uma unidade e registra o lote na agenda. A recusa da baixa sem lote válido depende de D19.
- **RN07–RN08** Cancelar ou excluir uma agenda Agendado libera sua reserva; um lote usado não pode ser excluído.
- **RN20** A tela Estoque classifica os lotes por validade: válido, vence em breve (30 dias) ou vencido.

Impacto previsto no banco: tabela `lotes` e campo `agendas.lote_id`. As tabelas do MER e os campos existentes do cadastro de vacinas são preservados. A disponibilidade é calculada a partir dos lotes e das reservas.

## 3. Decisões pendentes

Estas questões não estão definidas no documento do SIGV nem na sugestão do professor e precisam de resposta do responsável antes ou durante as fases indicadas. Não devem ser resolvidas por suposição. As recomendações de estoque para D14, D15, D18, D19 e D24 estão na [especificação do estoque](estoque-e-regras-agendamento.md#7-decisões-e-recomendações).

| # | Questão | Afeta |
| --- | --- | --- |
| D01 | Qual funcionalidade será apresentada como adicional do **Item 7**: estoque, agendamento pelo Telegram ou ambas? | Escopo e entrega |
| D02 | Quais requisitos são obrigatórios para a entrega e qual é o prazo? O documento não define prioridades. | Ordem das fases |
| D03 | Nomenclatura: a tabela `usuarios` do MER representa pacientes. Os usuários do sistema (RF24) serão o `User` do Django com outro nome na interface, como "Profissionais"? | Fase 2 |
| D04 | Como funciona a autenticação do frontend (sessão ou token)? | Fase 2 |
| D05 | Quais unidades de saúde existem e como são cadastradas? Há capacidade de atendimento por horário? | Fase 4 |
| D06 | Remarcar uma dose altera as datas das doses seguintes do mesmo esquema? | Fase 4 |
| D07 | Qual é a ordem e o peso das prioridades da fila (gestantes, idosos, PCD, crianças, emergências)? Como se calcula a previsão de atendimento? | Fase 5 |
| D08 | A baixa "Realizada" passa a exigir o registro completo da aplicação (local anatômico, profissional etc.)? | Fase 7 |
| D09 | Qual é a fonte das regras do PNI e das contraindicações? O sistema terá um conjunto inicial de regras ou elas serão cadastradas manualmente? | Fase 8 |
| D10 | Hospedagem do bot do Telegram: polling ou webhook? Quem cria o bot e guarda o token? Como vincular a conta do Telegram ao próprio paciente? | Agendamento pelo Telegram |
| D11 | Como o envio de lembretes será agendado (comando periódico, cron, outro)? | Fase 9 |
| D12 | Qual técnica de "inteligência artificial" é aceitável para a predição de demanda (média móvel, regressão, outro) e com quais dados históricos? | Fase 11 |
| D13 | Onde o sistema será hospedado? **Parcialmente decidida em 17/11/2026:** todo o sistema será hospedado depois de pronto. A implantação foi preparada com Docker e CI/CD para funcionar em qualquer hospedagem com Docker; falta escolher a hospedagem ([implantacao.md](implantacao.md)). | Fase 12 |
| D14 | ~~Em uma vacina de várias doses, o agendamento reserva estoque para todas as doses do esquema ou só para a primeira?~~ **Decidida em 27/11/2026:** para todas as doses; cada agenda Agendado reserva uma dose. | Fase 1 |
| D15 | **Confirmada em 23/11/2026:** o agendamento reserva doses, com estoque por lotes e validade. Sem disponibilidade, apenas informar e recusar o agendamento. | Fase 1 |
| D18 | ~~Na baixa Realizado, o lote é escolhido pelo sistema (vencimento mais próximo) ou pelo profissional?~~ **Decidida em 17/11/2026:** pelo sistema, escolhendo o lote válido que vence primeiro, o que permite controlar a validade. O estoque só diminui na confirmação da aplicação. | Fase 1 e Fase 7 |
| D19 | A baixa Realizado pode ser recusada por falta de estoque, alterando o comportamento atual do Item 5? | Fase 1 |
| D24 | ~~Como considerar a validade dos lotes nas datas futuras das doses: verificar o estoque somente na data da primeira dose ou em cada data de dose?~~ **Decidida em 27/11/2026:** somente na data da primeira dose; se os lotes vencerem antes das doses seguintes, a falta aparece na baixa. | Fase 1 |

As decisões D16, D17, D20, D21, D22 e D23 foram retiradas em 23/11/2026 por tratarem das funcionalidades removidas. Os demais identificadores foram mantidos para preservar as referências.

## 4. Atividades

As fases estão em ordem de dependência: cada uma usa o que as anteriores criam. Dentro de uma fase, as atividades podem ser divididas entre a dupla. Toda atividade inclui backend, frontend, testes e atualização da documentação correspondente, salvo indicação.

### Fase 0 — Preparação

- [ ] **A01** Obter as respostas das decisões do escopo atual: D01, D02, D10 (bot e identificação do paciente), D13 (hospedagem) e D19. D14 e D24 foram decididas em 27/11/2026.
- [x] **A02** Registrar no README e em [modelo-dados.md](modelo-dados.md) as ampliações do escopo, distinguindo-as do enunciado original.
- [x] **A03** Desenhar o modelo de dados necessário à Fase 1 a partir do MER, sem remover nada dele, e documentar a justificativa de cada adequação em [modelo-dados.md](modelo-dados.md).

### Fase 1 — Estoque e disponibilidade no agendamento (RF05 e RF20 parciais)

Vem primeiro porque foi sugerida pelo professor, é candidata ao Item 7 (D01) e não depende de autenticação, unidades ou cadastro completo do paciente. Especificação: [estoque-e-regras-agendamento.md](estoque-e-regras-agendamento.md).

- [x] **A04** Criar o modelo `Lote` (tabela `lotes`) com vacina, número, fabricante, validade e quantidade, com restrição de quantidade não negativa e número único por vacina, e os endpoints de listagem, cadastro, consulta e exclusão (RN01 a RN03, RN08).
- [x] **A05** Acrescentar às respostas de vacina os campos somente leitura de estoque em lotes, doses reservadas e estoque disponível (RN03, RN04), mantendo os campos atuais do cadastro.
- [x] **A07** No agendamento, calcular o estoque disponível descontando as doses reservadas pelas agendas Agendado e recusar com HTTP 409 ("vacina indisponível") quando ele não cobrir as doses do agendamento, sem criar nenhuma agenda e bloqueando os lotes durante a transação (RN04, RN05), conforme D14.
- [ ] **A08** Na baixa Realizado, o sistema escolhe o lote válido que vence primeiro, desconta uma unidade e o registra em `Agenda.lote`, na mesma transação, informando o lote na resposta e recusando a baixa sem lote válido (RN06, RN07). Classificar os lotes por validade (RN20), conforme D19.
- [ ] **A10** Criar a tela Estoque, com cadastro e listagem de lotes classificados por validade e resumo por vacina; mostrar a disponibilidade nas telas Vacinas e Novo agendamento; exibir a mensagem de indisponibilidade sem criar agenda; informar o lote escolhido na confirmação da aplicação e na consulta. **Em andamento (#14):** a tela Estoque já mostra cada vacina em um card com as doses dos seus lotes e permite cadastrar, consultar e excluir lotes com a classificação da validade; o resumo por vacina e a disponibilidade já podem usar os dados da API (A05 e A07); o lote utilizado depende de A08.
- [ ] **A11** Escrever os testes previstos na especificação e atualizar [backend.md](backend.md), [frontend.md](frontend.md) e [modelo-dados.md](modelo-dados.md). Se D01 confirmar, redigir o PDF do Item 7 a partir da especificação.

As atividades A06 e A09 foram retiradas em 23/11/2026; a numeração das demais foi preservada.

### Referência futura — Fases 2 a 11, com recorte autorizado da Fase 9

> As fases abaixo registram o restante do SIGV para consulta futura. Somente o recorte de agendamento pelo próprio paciente da Fase 9 está autorizado, além da Fase 12. As demais atividades não devem ser iniciadas sem nova decisão.

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

- [ ] **A40** Criar o cadastro de regras de vacinação (faixa etária, sexo, gestação, contraindicações, intervalos mínimos entre vacinas diferentes, incompatibilidades) e de campanhas vigentes, editável pelo Gestor (RF14).
- [ ] **A41** Implementar o serviço de recomendação que cruza o perfil do paciente, a triagem, as alergias e a carteira com as regras (RF10).
- [ ] **A42** Exibir a justificativa de cada recomendação (RF11).
- [ ] **A43** Classificar as doses do paciente em primeira dose, segunda dose, reforço e atrasadas (RF12).
- [ ] **A44** Alertar sobre incompatibilidades, contraindicação e idade inadequada no agendamento e no registro da aplicação, junto com as recusas da Fase 1 (RF13).
- [ ] **A45** Listar os pacientes com esquema vacinal incompleto (RF29).

### Fase 9 — Telegram e notificações (RF02, RF03, RF04, RF07, RF30)

**Recorte autorizado em 23/11/2026:** criar o bot, vincular a conta ao próprio paciente e permitir escolher vacina, data e horário, confirmar e realizar o agendamento usando a lógica existente e a verificação de estoque. O método de vínculo ainda depende de D10; CPF não é requisito definido para esse recorte. A lista abaixo descreve a ampliação futura do SIGV; atualização cadastral, triagem, recomendações, cancelamento e remarcação pelo bot, protocolo, QR Code e lembretes não entram automaticamente no escopo atual.

- [ ] **A46** Criar o bot do Telegram e o vínculo entre o chat e o paciente, conforme D10 (RF03).
- [ ] **A47** Implementar a atualização cadastral pelo bot (RF02).
- [ ] **A48** Implementar a triagem pelo bot: sintomas, febre, gravidez, alergias, medicamentos, imunossupressão, doenças recentes, peso e viagens internacionais. As respostas ficam salvas no modelo `Triagem` (RF04).
- [ ] **A49** Mostrar as recomendações no bot e permitir agendar, cancelar e remarcar, devolvendo o protocolo e o QR Code. A recusa por indisponibilidade de estoque é informada pelo bot com a mesma mensagem da API.
- [ ] **A50** Enviar confirmação de agendamento, lembrete de atendimento, lembrete de segunda dose e reforço e informações de campanhas (RF07).
- [ ] **A51** Enviar convites automáticos para pacientes com doses pendentes ou atrasadas (RF30).

### Fase 10 — Relatórios, indicadores e exportação (RF21, RF22, RF23)

- [ ] **A52** Criar os relatórios de pacientes atendidos, vacinas aplicadas, tempo médio de atendimento e filas, com filtros por período e unidade (RF21).
- [ ] **A53** Criar o painel de indicadores: cobertura vacinal, doses aplicadas, campanhas, estoque e pacientes faltosos (RF22).
- [ ] **A54** Exportar os relatórios em PDF, Excel e CSV (RF23).

### Fase 11 — Predição de demanda e otimização do estoque (RF27, RF28)

- [ ] **A55** Implementar a estimativa de demanda diária, considerando campanhas e sazonalidade, conforme D12 (RF27).
- [ ] **A56** Sugerir a quantidade de vacinas necessária a partir da demanda estimada e do estoque atual (RF28).

### Fase 12 — Implantação e entrega (no escopo atual)

Com o escopo atual, o manual e os entregáveis cobrem os itens 1 a 6, o estoque da Fase 1 e o agendamento pelo próprio paciente no Telegram. A preparação da implantação (A58) já foi feita.

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
- O agendamento pelo próprio paciente no Telegram reutiliza o cadastro e a geração de doses existentes, com verificação de estoque. Não depende das ampliações das Fases 3, 4 e 8; a forma de vincular o paciente precisa ser definida (D10). As demais atividades da Fase 9 mantêm suas dependências futuras.
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
