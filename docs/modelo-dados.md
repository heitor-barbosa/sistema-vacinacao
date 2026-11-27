# Modelo de dados e adequações ao MER

O ponto de partida é o [MER em PNG](mer-vacinacao.png). As decisões abaixo registram como ele foi representado no Django e complementado para atender aos itens 1 a 6.

## Organização

- App `usuarios`: modelos `Usuario` e `Alergia`, nas tabelas `usuarios` e `alergias`.
- App `vacinacao`: modelos `Vacina` e `Agenda`, nas tabelas `vacinas` e `agendas`, e o modelo `Lote`, na tabela `lotes`, acrescentado para o estoque (ver [Adequações para o estoque](#adequações-para-o-estoque)).
- `Usuario` representa um paciente. Não estende o usuário de autenticação do Django.
- IDs são inteiros gerados automaticamente, correspondendo ao `int` do MER.

## Relacionamentos

- `Agenda.usuario` e `Agenda.vacina` geram as colunas `usuario_id` e `vacina_id`. Elas materializam os relacionamentos de muitas agendas para um paciente e uma vacina mostrados no diagrama.
- `Usuario.alergias` é um relacionamento muitos para muitos. A tabela intermediária `usuarios_alergias`, gerada pelo Django, armazena os vínculos e permite zero ou várias alergias por paciente.
- Por decisão explícita do responsável, excluir um paciente ou uma vacina pelo sistema exclui suas agendas em cascata, inclusive realizadas e canceladas. Excluir um paciente também remove seus vínculos com alergias, preservando as alergias cadastradas. Excluir uma vacina preserva os pacientes.
- Excluir uma alergia remove apenas os vínculos correspondentes, preservando os pacientes e suas agendas.

## Campos e validações

- Foi acrescentado `Agenda.dose`, inteiro positivo, para guardar a posição da dose e atender à consulta do Item 6. Sem esse campo, exclusões de outras agendas poderiam tornar a numeração calculada pela ordem das datas incorreta.
- `situacao` mantém o tamanho de dez caracteres previsto no MER e usa `TextChoices` com Agendado, Realizado e Cancelado, em lugar do ENUM citado para Java.
- `data_situacao` aceita nulo para Agendado. Uma restrição no banco exige data preenchida para Realizado e Cancelado, e nula para Agendado. A baixa define a data pelo backend.
- `periodicidade` mantém os códigos do MER: 1 dias, 2 semanas, 3 meses e 4 anos. Ela e `intervalo` podem ser nulos em vacinas de dose única, pois não têm significado nesse caso. Para múltiplas doses, há validação na API e restrição no banco exigindo periodicidade válida e intervalo positivo.
- `doses` e `dose` possuem restrições de valor maior que zero.
- `hora` utiliza `TimeField`, uma das alternativas do MER.
- `numero` utiliza `DecimalField(max_digits=10, decimal_places=0)`, concretizando o tipo `numeric` do MER como um número de endereço inteiro de até dez dígitos.
- `sexo` mantém um caractere: M ou F. `uf` mantém dois caracteres e valida as 27 siglas. Os limites de tamanho dos demais campos seguem o MER.
- `descricao` da vacina e `observacoes` da agenda são opcionais; os demais campos cadastrais do paciente são obrigatórios. Alergias são opcionais.

## Regras de geração

Cada POST de agendamento cria um conjunto completo de doses em uma transação. Os intervalos são calculados a partir da primeira data escolhida; meses e anos usam o último dia válido quando o dia original não existir. As agendas mantêm o mesmo horário e observações.

Para os itens 1 a 6, não foi acrescentado um modelo de esquema vacinal, histórico ou outra entidade adicional. As estruturas do estoque estão descritas na seção seguinte.

## Adequações para o estoque

> **Situação:** a tabela `lotes` e o campo `agendas.lote_id` foram criados na migration `vacinacao/0002_lotes` (issue #11), com cadastro, consulta, listagem e exclusão de lotes pela API. A reserva no agendamento (issue #12) e o consumo na baixa Realizado (issue #13) ainda não foram implementados. As estruturas correspondem à proposta de estoque por lotes confirmada pelo responsável em 23/11/2026, candidata ao Item 7, especificada em [estoque-e-regras-agendamento.md](estoque-e-regras-agendamento.md).

O MER não possui onde registrar a quantidade disponível de cada vacina e a validade dos lotes. As adequações abaixo apenas acrescentam estruturas; nenhuma tabela ou campo do MER é removido ou alterado.

- **Nova tabela `lotes`** (modelo `Lote`, app `vacinacao`): `vacina_id`, `numero`, `fabricante`, `validade` e `quantidade`. É necessária porque a disponibilidade de uma vacina depende da quantidade e da validade de cada lote recebido; um único campo de quantidade na vacina não permitiria descartar as unidades vencidas. Restrições no banco: quantidade maior ou igual a zero, criada pelo `PositiveIntegerField`, e número do lote único por vacina (`lote_numero_unico_por_vacina`). Excluir uma vacina exclui seus lotes em cascata, mantendo o comportamento já adotado para as agendas. O agendamento não altera a quantidade: cada agenda Agendado apenas reserva uma dose, e as reservas são calculadas pela contagem dessas agendas, sem tabela própria. A quantidade só diminui na baixa Realizado, quando o sistema escolhe o lote válido que vence primeiro.
- **Novo campo `agendas.lote_id`**, chave estrangeira opcional para `lotes`, a ser preenchida na baixa Realizado (issue #13). Foi criada na mesma migration da tabela `lotes` para que a issue #13 não precise de outra migration. Registra de qual lote saiu a dose aplicada. Usa `RESTRICT`: impede excluir um lote já utilizado, mas permite a exclusão em cascata quando a vacina inteira é excluída. Agendas realizadas antes da funcionalidade ficam com o campo nulo.

Os campos existentes `doses`, `periodicidade` e `intervalo` continuam definindo a geração das doses. Por decisão do responsável em 23/11/2026, não serão acrescentados campos de reaplicação nem uma tabela de lista de espera; a indisponibilidade apenas impede o agendamento.
