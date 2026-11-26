# Estoque de vacinas e regras de agendamento

> **Situação:** proposta, ainda não implementada. As decisões em aberto estão na seção [7](#7-decisões-e-recomendações) e no [planejamento](planejamento.md#3-decisões-pendentes).

O estoque de vacinas foi sugerido pelo professor em 17/11/2026. Em **23/11/2026**, o responsável confirmou o controle por **lotes, validade e reservas** e retirou da proposta as regras adicionais de reaplicação e a lista de espera.

Quando não houver estoque disponível, o sistema apenas informa a indisponibilidade e recusa o agendamento. O cadastro da vacina e a geração automática das doses continuam usando os campos existentes `doses`, `periodicidade` e `intervalo`, conforme o enunciado.

O estoque só diminui quando a aplicação é confirmada. Nesse momento, o sistema escolhe o lote válido que vence primeiro. Cada dose Agendado representa uma reserva.

Esta especificação trata somente do estoque e de sua verificação no agendamento. A integração com o Telegram para o próprio paciente agendar também foi solicitada em 23/11/2026 e está registrada no [planejamento](planejamento.md). Unidades de saúde, movimentações e perdas, alertas configuráveis, avisos automáticos, escolha manual ou edição de lotes e remarcação continuam fora desta proposta.

O estoque permanece candidato à funcionalidade adicional do **Item 7** do [enunciado](instrucoes-projeto.md), conforme D01. Se escolhido, este documento serve de base para o PDF exigido pelo item.

## 1. Como funciona hoje

- O agendamento (`POST /api/agendas/`) cria todas as doses do esquema sem verificar se a vacina está disponível.
- A baixa como Realizado apenas muda a situação; nenhum estoque é consumido.
- As doses já são geradas conforme `doses`, `periodicidade` e `intervalo` cadastrados na vacina.

## 2. Regras de negócio — estoque

| Regra | Descrição |
| --- | --- |
| **RN01** | O estoque é controlado por **lote**. Cada lote pertence a uma vacina e possui número, fabricante, data de validade e quantidade de doses. A entrada no estoque é feita pelo cadastro de um lote. Cada unidade corresponde a uma dose aplicada. |
| **RN02** | A quantidade de um lote nunca é negativa. O número do lote é único para cada vacina. |
| **RN03** | Um lote só pode ser usado até a data de validade, inclusive. O **estoque em lotes** de uma vacina em uma data é a soma das quantidades dos seus lotes com validade igual ou posterior a essa data. |
| **RN04** | Cada agenda com situação Agendado **reserva** uma dose da vacina. O **estoque disponível** é o estoque em lotes menos as doses reservadas. Por exemplo, com 100 doses em lotes e nenhuma reserva, podem ser feitos 100 agendamentos de dose; o 101º é recusado. Se lotes vencerem e o estoque em lotes ficar menor que as reservas, as agendas existentes são mantidas, o estoque disponível é exibido como zero e a falta aparece na baixa (RN06). |
| **RN05** | Ao agendar, o estoque disponível na data da primeira dose precisa ser suficiente para todas as doses que o agendamento cria (D14 e D24). Se não for, nenhuma dose é criada e o sistema informa: *"Vacina indisponível: não há doses suficientes da vacina {vacina} em estoque. O agendamento não foi realizado."* |
| **RN06** | A reserva não altera a quantidade dos lotes. Somente na baixa como **Realizado**, que confirma a aplicação, o sistema escolhe o lote válido na data atual que vence primeiro, desconta uma unidade e registra esse lote na agenda, na mesma transação (D18). A reserva da agenda vira consumo, e o estoque disponível não muda. A confirmação informa o lote usado: *"Aplicação registrada com o lote {número}, validade {data}."* Sem lote válido com quantidade, a baixa é recusada e a agenda continua como Agendado (D19). |
| **RN07** | Cancelar ou excluir uma agenda Agendado libera a reserva, e o estoque disponível aumenta em uma dose. Excluir uma agenda realizada não devolve a unidade, pois a vacina já foi aplicada. |
| **RN08** | Um lote já utilizado em uma aplicação não pode ser excluído. Excluir uma vacina exclui seus lotes, assim como já exclui suas agendas. |
| **RN20** | **Controle de validade:** como o sistema escolhe o lote, lotes vencidos nunca são usados nem contam no estoque (RN03). A tela Estoque classifica cada lote como **válido**, **vence em breve** (validade nos próximos 30 dias) ou **vencido**, e mostra a quantidade que será perdida nos lotes vencidos. O prazo de 30 dias é fixo nesta etapa; torná-lo configurável e emitir alertas faz parte da ampliação do estoque prevista no planejamento. |

As regras RN09 a RN19 foram retiradas em 23/11/2026, junto com a reaplicação e a lista de espera. A RN20 manteve o identificador para preservar as referências.

## 3. Ordem das verificações no agendamento

Ao receber um novo agendamento, o backend executa as verificações nesta ordem e informa a primeira regra não atendida:

1. Validação dos campos, como já é feito hoje.
2. Verificação do estoque disponível na data da primeira dose (RN04 e RN05).
3. Geração de todas as doses conforme a regra existente de doses, periodicidade e intervalo.

Se qualquer verificação falhar, nenhuma agenda é criada. As verificações e a criação ocorrem na mesma transação que já existe em `criar_agendas`. Para evitar que dois agendamentos simultâneos usem a mesma última dose, a verificação do estoque bloqueia os lotes da vacina durante a transação (`select_for_update`).

## 4. Exemplos

Considere uma vacina de dose única e o lote L1, com validade em 30/11/2026 e uma dose disponível:

| # | Situação | Resultado | Disponível depois |
| --- | --- | --- | --- |
| 1 | Maria agenda para 25/11/2026. | Aceito. Uma dose é reservada, sem alterar a quantidade de L1. | 0 |
| 2 | João tenta agendar para 26/11/2026. | Recusado: vacina indisponível. Nenhuma agenda é criada. | 0 |
| 3 | Maria cancela a agenda. | A reserva é liberada; L1 continua com uma dose. | 1 |
| 4 | João faz um novo agendamento para 26/11/2026. | Aceito. Uma dose é reservada. | 0 |
| 5 | Em 26/11/2026, a agenda de João recebe baixa Realizado. | O sistema usa L1, que passa a zero. A reserva vira consumo. | 0 |

## 5. Impacto no banco de dados

As quatro tabelas do MER são preservadas. As mudanças são acréscimos, justificados em [modelo-dados.md](modelo-dados.md#adequações-previstas-estoque).

**Nova tabela `lotes`** (modelo `Lote`, app `vacinacao`):

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | inteiro, chave primária | Gerado automaticamente. |
| `vacina_id` | chave estrangeira para `vacinas` | Obrigatório. Exclusão em cascata com a vacina (RN08). |
| `numero` | `varchar(30)` | Obrigatório. Único com `vacina_id` (RN02). |
| `fabricante` | `varchar(60)` | Obrigatório. |
| `validade` | `date` | Obrigatório (RN03). |
| `quantidade` | inteiro | Obrigatório. Restrição no banco: maior ou igual a zero (RN02). |

**Novo campo em `agendas`:**

| Campo | Tipo | Regra |
| --- | --- | --- |
| `lote_id` | chave estrangeira para `lotes`, nula | Preenchido somente na baixa Realizado (RN06). Usa `on_delete=RESTRICT`: impede excluir um lote usado (RN08), mas permite a exclusão em cascata quando a própria vacina é excluída. |

As reservas não precisam de tabela própria: são as agendas com situação Agendado, contadas por vacina (RN04).

Relacionamentos resultantes: uma vacina tem vários lotes; um lote pode ser usado em várias agendas; cada agenda realizada a partir desta funcionalidade aponta para um lote. As agendas realizadas antes dela ficam com `lote_id` nulo. O cadastro de vacinas mantém seus campos atuais; o estoque é calculado a partir dos lotes e das reservas.

## 6. Impacto na API e nas telas

### API

| Método | Endpoint | Mudança |
| --- | --- | --- |
| GET / POST | `/api/lotes/` | Novo. Listar / cadastrar lote, em ordem de validade. Filtro opcional `?vacina={id}`. As respostas incluem `situacao_validade` (`Valido`, `Vence em breve` ou `Vencido`), calculada para a data atual (RN20). |
| GET / DELETE | `/api/lotes/{id}/` | Novo. Consultar / excluir lote não utilizado. |
| GET / POST | `/api/vacinas/` | Mantém os campos atuais do cadastro. As respostas incluem, somente para leitura, `estoque_lotes`, `doses_reservadas` e `estoque_disponivel`, calculados para a data atual. |
| POST | `/api/agendas/` | Acrescenta a verificação de disponibilidade às validações existentes. |
| POST | `/api/agendas/{id}/baixa/` | Com `Realizado`, consome o estoque conforme RN06 ou retorna 400. |
| GET | `/api/agendas/` e demais | As respostas incluem `lote` e `lote_numero`. |

A recusa por falta de estoque retorna HTTP **409**, com uma mensagem de indisponibilidade:

```json
{"detail": "Vacina indisponível: não há doses suficientes da vacina Vacina A em estoque. O agendamento não foi realizado."}
```

As validações atuais dos campos continuam retornando HTTP 400. A correção de um lote cadastrado errado é feita por exclusão e novo cadastro, enquanto ele não tiver sido usado, mantendo a ausência de PUT e PATCH.

### Telas

- **Agendas — Novo agendamento:** ao escolher a vacina, mostra o estoque disponível. Em caso de indisponibilidade, exibe a mensagem do backend e mantém o formulário aberto.
- **Estoque (nova, no grupo Cadastros do menu):** resumo por vacina com estoque em lotes, doses reservadas e estoque disponível, destacando quando as reservas superam o estoque em lotes; cadastro, consulta e exclusão de lote; listagem em ordem de validade, com número, fabricante, validade, quantidade e classificação (RN20).
- **Vacinas:** mostra o estoque disponível e mantém o cadastro existente de doses, periodicidade e intervalo.
- **Agendas e Início — baixa e consulta:** ao confirmar a aplicação, a mensagem informa o lote escolhido e sua validade; a consulta mostra o lote utilizado; eventual recusa por falta de lote válido aparece como mensagem, conforme D19.

## 7. Decisões e recomendações

O documento não deve ser implementado com base em suposições. As recomendações abaixo foram usadas nas regras e precisam ser confirmadas pelo responsável pelo projeto.

| # | Questão | Recomendação | Alternativa |
| --- | --- | --- | --- |
| D14 | Em uma vacina de várias doses, o agendamento reserva estoque para todas as doses do esquema ou só para a primeira? | Todas (RN05). Cada agenda Agendado reserva uma dose, o que mantém exata a conta "100 doses, 100 agendamentos" e evita esquemas que começam sem doses para terminar. Esquemas longos mantêm doses reservadas por mais tempo. | Reservar só a primeira dose, o que exige marcar quais agendas têm reserva e conferir as demais doses somente na aplicação. |
| D15 | O agendamento reserva estoque? | **Decidida em 17/11/2026:** sim. Cada agenda reserva uma dose do estoque disponível. **Confirmada em 23/11/2026:** sem estoque, apenas informar indisponibilidade e recusar o agendamento (RN04, RN05). | — |
| D18 | Na baixa Realizado, quem escolhe o lote? | **Decidida em 17/11/2026:** o sistema, pelo lote válido que vence primeiro. O estoque só diminui na confirmação da aplicação, e a escolha automática permite ao sistema controlar a validade (RN06, RN20). | — |
| D19 | A baixa Realizado pode ser recusada por falta de estoque? Isso altera o comportamento atual do Item 5. Com a reserva, só acontece quando lotes vencem. | Sim, para manter o estoque coerente com as aplicações. | Permitir a baixa sem lote, deixando o estoque inconsistente. |
| D24 | Como considerar a validade dos lotes nas datas futuras das doses? | Verificar o estoque somente na data da primeira dose (RN05). Se os lotes vencerem antes das doses seguintes, as agendas são mantidas e a falta aparece na baixa (RN04, RN06), conforme D19. | Verificar cada dose com os lotes válidos na sua data, o que recusa mais esquemas longos quando os lotes atuais vencem antes das últimas doses. |

## 8. Testes previstos

**Backend:**

- Cadastro de lote, unicidade do número por vacina, quantidade negativa recusada e exclusão de lote usado recusada.
- Estoque em lotes considerando somente lotes válidos na data; doses reservadas e estoque disponível.
- Com N doses em estoque, N agendamentos de dose aceitos e o seguinte recusado com HTTP 409, sem criar nenhuma agenda; o mesmo com lote vencido na data da primeira dose.
- Vacina de várias doses recusada quando o estoque disponível não cobre todas as doses do esquema.
- Cancelamento e exclusão de agenda Agendado liberando a reserva; baixa Realizado mantendo o estoque disponível.
- Geração das doses preservando as regras existentes de periodicidade e intervalo, inclusive em fins de mês e anos bissextos.
- Agendamento sem alterar a quantidade dos lotes; baixa Realizado descontando o lote válido que vence primeiro, ignorando os vencidos, e registrando-o; baixa recusada sem lote válido; baixa Cancelado sem alterar os lotes.
- Classificação dos lotes em válido, vence em breve (limite de 30 dias) e vencido.
- Exclusão de vacina com lotes e agendas realizadas.

**Frontend:** cadastro e listagem de lotes com classificação de validade e resumo do estoque; quantidade disponível na tela Vacinas e no agendamento; mensagem de indisponibilidade sem criação de agenda; lote informado na confirmação da aplicação e na consulta da agenda.
