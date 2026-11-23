# Modelo de dados e adequações ao MER

O ponto de partida é o [MER em PNG](mer-vacinacao.png). As decisões abaixo registram como ele foi representado no Django e complementado para atender aos itens 1 a 6.

## Organização

- App `usuarios`: modelos `Usuario` e `Alergia`, nas tabelas `usuarios` e `alergias`.
- App `vacinacao`: modelos `Vacina` e `Agenda`, nas tabelas `vacinas` e `agendas`.
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

Não foi acrescentado um modelo de esquema vacinal, histórico ou outra entidade adicional. Até esta etapa, não há implantação de funcionalidades fora dos itens 1 a 6.

## Adequações previstas: estoque e intervalo entre aplicações

> **Situação:** previstas, ainda não implementadas. Correspondem à sugestão do professor de 17/11/2026, candidata ao Item 7, especificada em [estoque-e-regras-agendamento.md](estoque-e-regras-agendamento.md).

O MER não possui onde registrar a quantidade disponível de cada vacina, a validade dos lotes nem um tempo limite para repetir a aplicação. As adequações abaixo apenas acrescentam estruturas; nenhuma tabela ou campo do MER é removido ou alterado.

- **Nova tabela `lotes`** (modelo `Lote`, app `vacinacao`): `vacina_id`, `numero`, `fabricante`, `validade` e `quantidade`. É necessária porque a disponibilidade de uma vacina depende da quantidade e da validade de cada lote recebido; um único campo de quantidade na vacina não permitiria descartar as unidades vencidas. Restrições: quantidade maior ou igual a zero e número do lote único por vacina. Excluir uma vacina exclui seus lotes em cascata, mantendo o comportamento já adotado para as agendas. O agendamento não altera a quantidade: cada agenda Agendado apenas reserva uma dose, e as reservas são calculadas pela contagem dessas agendas, sem tabela própria. A quantidade só diminui na baixa Realizado, quando o sistema escolhe o lote válido que vence primeiro.
- **Nova tabela `lista_espera`** (modelo `ListaEspera`, app `vacinacao`): `usuario_id`, `vacina_id`, `data_entrada` e `situacao` (`Aguardando` ou `Atendido`). Guarda os pacientes que aceitaram esperar por uma vacina indisponível, na ordem de entrada. Uma restrição única condicional impede duas entradas `Aguardando` para o mesmo paciente e a mesma vacina. Excluir um paciente ou uma vacina exclui suas entradas em cascata.
- **Novos campos em `vacinas` para a regra de reaplicação**, preenchida obrigatoriamente no cadastro por decisão do responsável (17/11/2026):
  - `reaplicacao`, `varchar(10)` obrigatório com `TextChoices`: `Prazo` (após prazo mínimo) ou `Unica` (uma vez na vida);
  - `prazo_reaplicacao`, inteiro maior que zero, obrigatório para `Prazo` e nulo para `Unica`;
  - `periodicidade_reaplicacao`, unidade do prazo com os mesmos códigos de `periodicidade` (1 dias, 2 semanas, 3 meses e 4 anos), obrigatória para `Prazo` e nula para `Unica`.

  Uma restrição no banco garante a coerência entre os três campos. Não foi possível reaproveitar `periodicidade` e `intervalo`, pois eles descrevem o espaço entre as doses de um mesmo esquema e são nulos em vacinas de dose única. As vacinas já cadastradas são dados fictícios, usados apenas para povoar a aplicação. Por isso, a migration atribui a elas o valor provisório `Unica`, que não exige prazo, e elas podem ser excluídas ou recadastradas (decisão D21 do [planejamento](planejamento.md#3-decisões-pendentes)).
- **Novo campo `agendas.lote_id`**, chave estrangeira opcional para `lotes`, preenchida na baixa Realizado. Registra de qual lote saiu a dose aplicada. Usa `RESTRICT`: impede excluir um lote já utilizado, mas permite a exclusão em cascata quando a vacina inteira é excluída. Agendas realizadas antes da funcionalidade ficam com o campo nulo.

A última aplicação de uma vacina, usada na regra de intervalo, é obtida das agendas Realizado e de sua `data_situacao`, sem necessidade de nova tabela de histórico.
