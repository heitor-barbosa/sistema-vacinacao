# Estoque de vacinas e regras de agendamento

> **Situação:** proposta, ainda não implementada. As decisões em aberto estão na seção [9](#9-decisões-e-recomendações) e no [planejamento](planejamento.md#3-decisões-pendentes).

Em 17/11/2026, o professor sugeriu duas funcionalidades para o sistema:

1. **Estoque de vacinas:** quando uma pessoa tentar agendar uma dose e não houver a vacina em estoque, ela é avisada e o agendamento não é realizado.
2. **Intervalo entre aplicações:** se uma pessoa tomou uma vacina há pouco tempo, ela não pode agendar a mesma vacina antes de passar o tempo limite definido para essa vacina.

O responsável pelo projeto complementou a sugestão com estas decisões, todas de 17/11/2026:

- O tempo limite é informado obrigatoriamente no **cadastro de cada vacina**: quem cadastra indica em quanto tempo a pessoa poderá tomar a vacina novamente ou se ela é tomada apenas uma vez na vida.
- O estoque é consultado em todo agendamento e **cada dose agendada reserva uma dose do estoque**: com 100 doses em estoque, podem ser feitos apenas 100 agendamentos de dose. No 101º, o sistema informa que a vacina está indisponível e pergunta se o paciente deseja entrar na **lista de espera**.
- A reserva não diminui o estoque. O estoque só diminui quando a aplicação é confirmada, e o **lote é escolhido pelo próprio sistema**, o que lhe permite controlar as datas de validade. Esse controle de validade também aparece nas telas.

**Escopo fechado (17/11/2026):** por decisão do responsável, o escopo atual se limita ao que está neste documento. Ficam **fora** dele, mesmo quando citados como possibilidade futura: unidades de saúde, movimentações e perdas de estoque, alertas e prazos configuráveis de validade, avisos automáticos aos pacientes (Telegram ou outros), escolha manual do lote, edição de lotes, remarcação de agendas, autenticação e as demais funcionalidades do documento do SIGV. Qualquer acréscimo exige nova decisão do responsável.

Este documento detalha as regras de negócio, o impacto no banco de dados, na API e nas telas, e os testes previstos. Se a sugestão for adotada como a funcionalidade adicional do **Item 7** do [enunciado](instrucoes-projeto.md) (decisão D01), ele serve de base para o PDF exigido pelo item.

## 1. Como funciona hoje

- O agendamento (`POST /api/agendas/`) cria todas as doses do esquema sem verificar se a vacina está disponível.
- A baixa como Realizado apenas muda a situação; nenhum estoque é consumido.
- Nada impede que o mesmo paciente agende a mesma vacina várias vezes, inclusive logo depois de tê-la tomado ou com outro esquema da mesma vacina ainda em andamento.
- Não há lista de espera.

## 2. Regras de negócio — estoque

| Regra | Descrição |
| --- | --- |
| **RN01** | O estoque é controlado por **lote**. Cada lote pertence a uma vacina e possui número, fabricante, data de validade e quantidade de doses. A entrada no estoque é feita pelo cadastro de um lote. Cada unidade corresponde a uma dose aplicada. |
| **RN02** | A quantidade de um lote nunca é negativa. O número do lote é único para cada vacina. |
| **RN03** | Um lote só pode ser usado até a data de validade, inclusive. O **estoque em lotes** de uma vacina em uma data é a soma das quantidades dos seus lotes com validade igual ou posterior a essa data. |
| **RN04** | Cada agenda com situação Agendado **reserva** uma dose da vacina. O **estoque disponível** é o estoque em lotes menos as doses reservadas. Por exemplo, com 100 doses em lotes e nenhuma reserva, podem ser feitos 100 agendamentos de dose; o 101º é recusado. Se lotes vencerem e o estoque em lotes ficar menor que as reservas, as agendas existentes são mantidas, o estoque disponível é exibido como zero e a falta aparece na baixa (RN06). |
| **RN05** | Ao agendar, o estoque disponível na data da primeira dose precisa ser suficiente para todas as doses que o agendamento cria (D14). Se não for, nenhuma dose é criada e o sistema informa: *"Vacina indisponível: não há doses suficientes da vacina {vacina} em estoque. O agendamento não foi realizado."* Em seguida, pergunta se o paciente deseja entrar na lista de espera (RN15). |
| **RN06** | A reserva não altera a quantidade dos lotes. Somente na baixa como **Realizado**, que confirma a aplicação, o sistema escolhe o lote válido na data atual que vence primeiro, desconta uma unidade e registra esse lote na agenda, na mesma transação (D18). A reserva da agenda vira consumo, e o estoque disponível não muda. A confirmação informa o lote usado: *"Aplicação registrada com o lote {número}, validade {data}."* Sem lote válido com quantidade, a baixa é recusada e a agenda continua como Agendado (D19). |
| **RN07** | Cancelar ou excluir uma agenda Agendado libera a reserva, e o estoque disponível aumenta em uma dose. Excluir uma agenda realizada não devolve a unidade, pois a vacina já foi aplicada. |
| **RN08** | Um lote já utilizado em uma aplicação não pode ser excluído. Excluir uma vacina exclui seus lotes e suas entradas na lista de espera, assim como já exclui suas agendas. |
| **RN20** | **Controle de validade:** como o sistema escolhe o lote, lotes vencidos nunca são usados nem contam no estoque (RN03). A tela Estoque classifica cada lote como **válido**, **vence em breve** (validade nos próximos 30 dias) ou **vencido**, e mostra a quantidade que será perdida nos lotes vencidos. O prazo de 30 dias é fixo nesta etapa; torná-lo configurável e emitir alertas faz parte da ampliação do estoque prevista no planejamento. |

## 3. Regras de negócio — intervalo entre aplicações

| Regra | Descrição |
| --- | --- |
| **RN09** | No cadastro de cada vacina, é obrigatório informar a **regra de reaplicação**, com uma das opções:<br>• **Após prazo mínimo:** a pessoa pode tomar a vacina novamente depois de um prazo informado em dias, semanas, meses ou anos, por exemplo 10 anos.<br>• **Uma vez na vida:** depois de aplicada, a vacina não pode mais ser agendada para a mesma pessoa.<br>A regra trata do esquema inteiro. Em vacinas de várias doses, as doses do esquema continuam seguindo doses, periodicidade e intervalo; a regra de reaplicação define quando um **novo** esquema pode ser agendado. Em vacinas de dose única, esquema e dose coincidem. |
| **RN10** | A **última aplicação** de uma vacina para um paciente é a maior `data_situacao` entre as agendas desse paciente e dessa vacina com situação Realizado. Pelo enunciado, essa é a data em que a vacina foi aplicada. |
| **RN11** | **Após prazo mínimo:** a data liberada é a última aplicação somada ao prazo, calculada como as datas das doses (quando o dia não existe no mês, usa-se o último dia válido). Um novo agendamento só é aceito se a data da primeira dose for igual ou posterior à data liberada. Caso contrário, é recusado com o aviso: *"{paciente} recebeu a vacina {vacina} em {data da última aplicação}. Um novo agendamento só é permitido a partir de {data liberada}."* |
| **RN12** | **Uma vez na vida:** a vacina só pode ser agendada uma vez para cada paciente. Se ele tiver qualquer agenda dessa vacina com situação Realizado, o novo agendamento é recusado, mesmo que as demais doses do esquema tenham sido canceladas (D20), com o aviso: *"{paciente} já recebeu a vacina {vacina}, que é aplicada uma única vez na vida. O agendamento não foi realizado."* Se a agenda ainda estiver como Agendado, vale a RN13. Somente agendas canceladas não contam. |
| **RN13** | Um novo agendamento também é recusado se o paciente já tiver alguma agenda da mesma vacina com situação Agendado: *"{paciente} já possui doses agendadas da vacina {vacina}. Cancele-as ou aguarde a aplicação antes de um novo agendamento."* Por decisão do responsável (17/11/2026), o paciente não pode ter mais de uma dose agendada de uma vacina de dose única nem agendar mais de uma vez uma vacina "uma vez na vida". Nas vacinas de várias doses com prazo mínimo, a regra evita esquemas duplicados (D17). |
| **RN14** | As regras RN11 a RN13 valem apenas para o novo agendamento. As doses seguintes geradas automaticamente no mesmo agendamento continuam seguindo a regra do enunciado e não são afetadas pela regra de reaplicação. |

## 4. Regras de negócio — lista de espera

| Regra | Descrição |
| --- | --- |
| **RN15** | Quando o agendamento é recusado por falta de estoque (RN05), o sistema pergunta: *"Deseja incluir {paciente} na lista de espera da vacina {vacina}?"* Se a resposta for sim, o paciente entra na lista e o sistema informa a posição dele. Se for não, nada é registrado e o formulário continua aberto. |
| **RN16** | Cada entrada guarda paciente, vacina, data e hora de entrada, definidas pelo backend, e situação **Aguardando**. A lista de cada vacina é ordenada pela entrada: quem entrou primeiro é atendido primeiro. |
| **RN17** | Só entra na lista quem poderia agendar se houvesse estoque: valem as regras RN11 a RN13. O paciente não pode estar duas vezes como Aguardando na lista da mesma vacina. |
| **RN18** | Quando a vacina volta a ter estoque disponível, por um novo lote ou por cancelamentos, a tela Lista de espera mostra os pacientes Aguardando, em ordem, ao lado do estoque disponível. O atendente entra em contato com o paciente e usa **Agendar**, que abre o novo agendamento com paciente e vacina preenchidos (D22). O agendamento segue todas as regras anteriores. Ao ser criado, a entrada do paciente na lista daquela vacina passa automaticamente para **Atendido**. |
| **RN19** | O paciente pode sair da lista a pedido, pela exclusão da entrada. Excluir um paciente ou uma vacina exclui suas entradas na lista. |

## 5. Ordem das verificações no agendamento

Ao receber um novo agendamento, o backend executa as verificações nesta ordem e informa a primeira regra não atendida:

1. Validação dos campos, como já é feito hoje.
2. Esquema da mesma vacina em andamento (RN13).
3. Regra de reaplicação da vacina: prazo mínimo desde a última aplicação (RN11) ou uma vez na vida (RN12).
4. Estoque disponível na data da primeira dose (RN04 e RN05). É a última verificação, para que a lista de espera só seja oferecida a quem atende às demais regras (RN17).
5. Geração das doses, sem alteração na regra atual, e marcação da entrada da lista de espera como Atendido, quando houver (RN18).

Se qualquer verificação falhar, nenhuma agenda é criada. As verificações e a criação ocorrem na mesma transação que já existe em `criar_agendas`. Para evitar que dois agendamentos simultâneos usem a mesma última dose, a verificação do estoque bloqueia os lotes da vacina durante a transação (`select_for_update`).

## 6. Exemplos

Considere a **Vacina A**, de dose única, cadastrada com reaplicação após prazo mínimo de 6 meses, a **Vacina B**, cadastrada como uma vez na vida, e o lote da Vacina A:

| Lote | Validade | Quantidade |
| --- | --- | --- |
| L1 | 30/11/2026 | 1 |

| # | Situação | Resultado | Disponível depois |
| --- | --- | --- | --- |
| 1 | Maria agenda a Vacina A para 20/11/2026. | Aceito. A agenda reserva uma dose (RN04). | 0 |
| 2 | João tenta agendar a Vacina A para 25/11/2026. | Recusado: vacina indisponível (RN05). João aceita entrar na lista de espera e fica na posição 1 (RN15, RN16). | 0 |
| 3 | Em 20/11/2026, a agenda de Maria recebe baixa Realizado. | O sistema escolhe L1, que passa para 0, e registra L1 na agenda. A reserva vira consumo (RN06). Até aqui, L1 continuava com 1 unidade, apesar da reserva. Na tela Estoque, L1 aparecia como "vence em breve" (RN20). | 0 |
| 4 | Chega o lote L2, com validade 31/12/2027 e 10 doses. | A tela Lista de espera mostra João em primeiro. O atendente agenda João para 01/12/2026; a entrada dele passa para Atendido (RN18). | 9 |
| 5 | João cancela a agenda. | A reserva é liberada (RN07). | 10 |
| 6 | Maria tenta agendar a Vacina A novamente para 01/02/2027. | Recusado (RN11). A aplicação foi em 20/11/2026; o novo agendamento só é permitido a partir de 20/05/2027. | 10 |
| 7 | Pedro já tem a Vacina A agendada e tenta agendá-la outra vez. | Recusado (RN13). | — |
| 8 | Ana recebeu a Vacina B em 2020 e tenta agendá-la novamente. | Recusado em qualquer data (RN12). | — |
| 9 | Carlos tem a Vacina B agendada, ainda não aplicada, e tenta agendá-la para outra data. | Recusado (RN13). Para mudar a data, ele precisa cancelar a agenda existente. | — |

## 7. Impacto no banco de dados

As quatro tabelas do MER são preservadas. As mudanças são acréscimos, justificados em [modelo-dados.md](modelo-dados.md#adequações-previstas-estoque-e-intervalo-entre-aplicações).

**Nova tabela `lotes`** (modelo `Lote`, app `vacinacao`):

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | inteiro, chave primária | Gerado automaticamente. |
| `vacina_id` | chave estrangeira para `vacinas` | Obrigatório. Exclusão em cascata com a vacina (RN08). |
| `numero` | `varchar(30)` | Obrigatório. Único com `vacina_id` (RN02). |
| `fabricante` | `varchar(60)` | Obrigatório. |
| `validade` | `date` | Obrigatório (RN03). |
| `quantidade` | inteiro | Obrigatório. Restrição no banco: maior ou igual a zero (RN02). |

**Nova tabela `lista_espera`** (modelo `ListaEspera`, app `vacinacao`):

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | inteiro, chave primária | Gerado automaticamente. |
| `usuario_id` | chave estrangeira para `usuarios` | Obrigatório. Exclusão em cascata com o paciente (RN19). |
| `vacina_id` | chave estrangeira para `vacinas` | Obrigatório. Exclusão em cascata com a vacina (RN19). |
| `data_entrada` | `timestamp` | Definida pelo backend na inclusão. Ordena a lista (RN16). |
| `situacao` | `varchar(10)` | `Aguardando` ou `Atendido`, com `TextChoices`. Começa como `Aguardando`. |

Uma restrição única condicional impede duas entradas `Aguardando` para o mesmo paciente e a mesma vacina (RN17).

**Novos campos em `vacinas`** (RN09):

| Campo | Tipo | Regra |
| --- | --- | --- |
| `reaplicacao` | `varchar(10)` | Obrigatório. `Prazo` (após prazo mínimo) ou `Unica` (uma vez na vida), representados com `TextChoices`, como a situação da agenda. |
| `prazo_reaplicacao` | inteiro, nulo | Obrigatório e maior que zero quando `reaplicacao` é `Prazo`; nulo quando é `Unica`. |
| `periodicidade_reaplicacao` | inteiro, nulo | Unidade do prazo, com os mesmos códigos de `periodicidade`: 1 dias, 2 semanas, 3 meses e 4 anos. Obrigatória quando `reaplicacao` é `Prazo`; nula quando é `Unica`. |

Uma restrição no banco garante a coerência entre os três campos, como já ocorre com `periodicidade` e `intervalo`.

**Novo campo em `agendas`:**

| Campo | Tipo | Regra |
| --- | --- | --- |
| `lote_id` | chave estrangeira para `lotes`, nula | Preenchido somente na baixa Realizado (RN06). Usa `on_delete=RESTRICT`: impede excluir um lote usado (RN08), mas permite a exclusão em cascata quando a própria vacina é excluída. |

As reservas não precisam de tabela própria: são as agendas com situação Agendado, contadas por vacina (RN04).

Relacionamentos resultantes: uma vacina tem vários lotes e várias entradas na lista de espera; um paciente tem várias entradas na lista de espera; um lote pode ser usado em várias agendas; cada agenda realizada a partir desta funcionalidade aponta para um lote. As agendas realizadas antes dela ficam com `lote_id` nulo.

## 8. Impacto na API e nas telas

### API

| Método | Endpoint | Mudança |
| --- | --- | --- |
| GET / POST | `/api/lotes/` | Novo. Listar / cadastrar lote, em ordem de validade. Filtro opcional `?vacina={id}`. As respostas incluem `situacao_validade` (`Valido`, `Vence em breve` ou `Vencido`), calculada para a data atual (RN20). |
| GET / DELETE | `/api/lotes/{id}/` | Novo. Consultar / excluir lote não utilizado. |
| GET / POST | `/api/lista-espera/` | Novo. Listar / incluir paciente na lista. Filtros opcionais `?vacina={id}`, `?usuario={id}` e `?situacao=Aguardando`. Ordenada pela entrada; as entradas Aguardando trazem a `posicao` na lista da vacina. |
| GET / DELETE | `/api/lista-espera/{id}/` | Novo. Consultar / retirar o paciente da lista. |
| GET / POST | `/api/vacinas/` | Exige `reaplicacao` e, quando ela é `Prazo`, `prazo_reaplicacao` e `periodicidade_reaplicacao`. As respostas incluem, somente para leitura, `estoque_lotes`, `doses_reservadas`, `estoque_disponivel` (calculados para a data atual) e `lista_espera` (quantidade de pacientes Aguardando). |
| POST | `/api/agendas/` | Passa a aplicar as regras das seções 2 a 5. |
| POST | `/api/agendas/{id}/baixa/` | Com `Realizado`, consome o estoque conforme RN06 ou retorna 400. |
| GET | `/api/agendas/` e demais | As respostas incluem `lote` e `lote_numero`. |

Exemplos de cadastro de vacina:

```json
{"titulo": "Vacina A", "doses": 1, "reaplicacao": "Prazo", "prazo_reaplicacao": 6, "periodicidade_reaplicacao": 3}
```

```json
{"titulo": "Vacina B", "doses": 1, "reaplicacao": "Unica"}
```

Respostas de recusa do agendamento:

- **Falta de estoque:** HTTP **409**, para que o frontend saiba que deve oferecer a lista de espera:

  ```json
  {"detail": "Vacina indisponível: não há doses suficientes da vacina Vacina A em estoque. O agendamento não foi realizado.", "lista_espera": true}
  ```

- **Demais regras:** HTTP 400 com a mensagem no campo `vacina` (esquema em andamento e uma vez na vida) ou `data` (prazo mínimo), como as validações atuais.

Inclusão na lista de espera, POST `/api/lista-espera/`:

```json
{"usuario": 2, "vacina": 1}
```

A inclusão aplica RN17 e retorna 201 com a entrada e a `posicao`. A correção de um lote cadastrado errado é feita por exclusão e novo cadastro, enquanto ele não tiver sido usado, mantendo a ausência de PUT e PATCH.

### Telas

- **Agendas — Novo agendamento:** ao escolher a vacina, mostra o estoque disponível. Se o backend responder 409, abre a confirmação *"Vacina indisponível. Deseja incluir {paciente} na lista de espera da vacina {vacina}?"*, com **Entrar na lista de espera** e **Agora não**. Na primeira opção, mostra *"{paciente} entrou na lista de espera da vacina {vacina}, na posição {n}."* Outras recusas aparecem como mensagem e o formulário continua aberto. A função `requisicao` de `api.js` precisará informar o status HTTP do erro para diferenciar o 409.
- **Lista de espera (nova, no grupo Atendimento do menu):** filtro por vacina; mostra posição, paciente, data de entrada e situação, além do estoque disponível da vacina. Entradas Aguardando têm **Agendar**, que abre o novo agendamento preenchido, e **Remover**, com confirmação.
- **Estoque (nova, no grupo Cadastros do menu):** resumo por vacina, com estoque em lotes, doses reservadas, estoque disponível e pacientes na lista de espera, destacando quando as reservas superam o estoque em lotes; lista dos lotes com número, fabricante, validade, quantidade e a classificação válido, vence em breve, vencido ou esgotado, em ordem de validade (RN20); cadastro e exclusão de lote.
- **Vacinas:** seletor obrigatório **Reaplicação**, com as opções "Após prazo mínimo" e "Uma vez na vida". Na primeira, aparecem os campos obrigatórios de prazo e unidade (dias, semanas, meses ou anos), no mesmo formato da periodicidade das doses. A listagem mostra a regra, como "Após 10 anos" ou "Uma vez na vida", e o estoque disponível.
- **Agendas e Início — baixa e consulta:** ao confirmar a aplicação, a mensagem de sucesso informa o lote escolhido pelo sistema e sua validade; a recusa por falta de lote válido aparece como mensagem; a consulta mostra o lote utilizado.

## 9. Decisões e recomendações

O documento não deve ser implementado com base em suposições. As recomendações abaixo foram usadas nas regras e precisam ser confirmadas pelo responsável pelo projeto.

| # | Questão | Recomendação | Alternativa |
| --- | --- | --- | --- |
| D14 | Em uma vacina de várias doses, o agendamento reserva estoque para todas as doses do esquema ou só para a primeira? | Todas (RN05). Cada agenda Agendado reserva uma dose, o que mantém exata a conta "100 doses, 100 agendamentos" e evita esquemas que começam sem doses para terminar. Esquemas longos mantêm doses reservadas por mais tempo. | Reservar só a primeira dose, o que exige marcar quais agendas têm reserva e conferir as demais doses somente na aplicação. |
| D15 | O agendamento reserva estoque? | **Decidida em 17/11/2026:** sim. Cada agendamento consome uma dose do estoque disponível; sem estoque, a vacina fica indisponível e é oferecida a lista de espera (RN04, RN05, RN15). | — |
| D16 | Como se define o tempo limite? | **Decidida em 17/11/2026:** campo obrigatório no cadastro da vacina, com prazo mínimo (quantidade e unidade) ou uma vez na vida (RN09). | — |
| D17 | Bloquear um novo agendamento quando o paciente já tem doses Agendado da mesma vacina? | **Decidida em 17/11/2026 para vacinas de dose única e "uma vez na vida":** sim (RN13). Para vacinas de várias doses com prazo mínimo, a recomendação é a mesma, pois evita esquemas duplicados que burlariam a regra de reaplicação. | Nas vacinas de várias doses com prazo mínimo, bloquear somente pela regra de reaplicação. |
| D18 | Na baixa Realizado, quem escolhe o lote? | **Decidida em 17/11/2026:** o sistema, pelo lote válido que vence primeiro. O estoque só diminui na confirmação da aplicação, e a escolha automática permite ao sistema controlar a validade (RN06, RN20). | — |
| D19 | A baixa Realizado pode ser recusada por falta de estoque? Isso altera o comportamento atual do Item 5. Com a reserva, só acontece quando lotes vencem. | Sim, para manter o estoque coerente com as aplicações. | Permitir a baixa sem lote, deixando o estoque inconsistente. |
| D20 | Em uma vacina "uma vez na vida" com várias doses, se o paciente recebeu só parte do esquema e as demais doses foram canceladas, ele pode agendar de novo? | **Decidida em 17/11/2026:** não. Basta uma dose Realizado para bloquear (RN12). | — |
| D21 | Quais valores de reaplicação recebem as vacinas já cadastradas quando o campo obrigatório for criado? | **Decidida em 17/11/2026:** as vacinas existentes são fictícias e servem apenas para povoar a aplicação. A migration atribui o valor provisório `Unica`, que não exige prazo, e essas vacinas podem ser excluídas ou recadastradas. | — |
| D22 | Quando a vacina volta a ter estoque, como o paciente da lista de espera é atendido? | O atendente consulta a tela Lista de espera, contata o paciente e agenda pela ordem de entrada (RN18). O aviso automático ao paciente entra com as notificações pelo Telegram, previstas no planejamento. | Agendar automaticamente, o que exigiria escolher data e horário sem o paciente. |
| D23 | Doses que voltam ao estoque devem ficar reservadas para a lista de espera, impedindo que um paciente fora da lista agende antes? | Não nesta etapa. A tela mostra a ordem e o atendente a segue, o que mantém as regras simples. | Descontar do estoque disponível os pacientes Aguardando, liberando o agendamento direto só quando a lista estiver vazia. |

## 10. Testes previstos

**Backend:**

- Cadastro de lote, unicidade do número por vacina, quantidade negativa recusada e exclusão de lote usado recusada.
- Estoque em lotes considerando somente lotes válidos na data; doses reservadas e estoque disponível.
- Com N doses em estoque, N agendamentos de dose aceitos e o seguinte recusado com HTTP 409, sem criar nenhuma agenda; o mesmo com lote vencido na data da primeira dose.
- Vacina de várias doses recusada quando o estoque disponível não cobre todas as doses do esquema.
- Cancelamento e exclusão de agenda Agendado liberando a reserva; baixa Realizado mantendo o estoque disponível.
- Cadastro de vacina sem regra de reaplicação recusado; "Após prazo mínimo" sem prazo ou unidade recusado; "Uma vez na vida" com prazo preenchido recusado.
- Agendamento recusado antes da data liberada pelo prazo mínimo e aceito exatamente nela, em cada unidade (dias, semanas, meses e anos) e em fim de mês.
- Agendamento de vacina "uma vez na vida" recusado quando há uma dose Realizado, inclusive com as demais doses canceladas, e aceito quando as agendas anteriores foram apenas canceladas.
- Segundo agendamento de vacina de dose única ou "uma vez na vida" recusado enquanto houver uma agenda Agendado dessa vacina.
- Agendamento recusado com esquema da mesma vacina em andamento; aceito depois que as doses forem realizadas ou canceladas, respeitado o intervalo.
- Doses seguintes geradas normalmente, sem bloqueio pela regra de reaplicação.
- Agendamento sem alterar a quantidade dos lotes; baixa Realizado descontando o lote válido que vence primeiro, ignorando os vencidos, e registrando-o; baixa recusada sem lote válido; baixa Cancelado sem alterar os lotes.
- Classificação dos lotes em válido, vence em breve (limite de 30 dias) e vencido.
- Lista de espera: inclusão com posição correta, ordem por entrada, segunda entrada Aguardando recusada, inclusão recusada quando RN11 a RN13 impedem o agendamento, entrada marcada como Atendido ao agendar e exclusão em cascata com paciente e vacina.
- Exclusão de vacina com lotes, agendas realizadas e entradas na lista de espera.

**Frontend:** campos de reaplicação no cadastro de vacinas (prazo e unidade exibidos e obrigatórios somente para "Após prazo mínimo"); cadastro e listagem de lotes com a classificação de validade e resumo do estoque; lote informado na mensagem de aplicação; pergunta da lista de espera após o 409, com as duas respostas; tela Lista de espera com Agendar e Remover; exibição das demais mensagens de recusa e do lote na consulta da agenda.
