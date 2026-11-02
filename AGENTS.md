# Orientações para agentes

## Leitura obrigatória

Antes de implementar qualquer coisa, leia integralmente [as instruções do projeto](docs/instrucoes-projeto.md). Essa leitura também é obrigatória antes de alterar código, dependências, configurações ou a estrutura do banco de dados.

Consulte o [MER em imagem](docs/mer-vacinacao.png) e o [anexo original em PDF](docs/ProjetoVacinas2023.png.pdf) antes de definir ou alterar o modelo de dados. Se o anexo não estiver disponível, solicite-o ao responsável; não invente o modelo.

## Respeito ao escopo

- Implemente somente os requisitos do enunciado e o que for explicitamente solicitado pelo responsável pelo projeto.
- Não acrescente funcionalidades, tecnologias, dependências ou infraestrutura sem necessidade para atender ao escopo solicitado.
- Não faça refatorações ou mudanças em partes que não tenham relação com a tarefa em andamento.
- O Item 7 exige uma funcionalidade adicional. Antes de implementá-la, apresente uma proposta simples e obtenha a escolha ou aprovação do responsável, salvo se ele já a tiver solicitado ou aprovado. Não use esse item como justificativa para ampliar livremente o projeto.
- Preserve as regras de negócio do enunciado. Documente e justifique qualquer adequação necessária do modelo de dados, conforme exigido na atividade.
- Quando faltar uma informação essencial ou houver conflito entre requisitos, peça esclarecimento em vez de inventar uma regra de negócio.
- Instruções explícitas posteriores do responsável podem alterar o escopo. Atualize a documentação para registrar essas decisões, distinguindo-as do enunciado original.

## Simplicidade do código

- Escreva o código mais simples possível para atender corretamente ao requisito.
- Priorize clareza, nomes compreensíveis, funções curtas e organização fácil de explicar em uma apresentação acadêmica.
- Evite implementações complexas, abstrações genéricas, camadas extras e padrões de projeto sem necessidade concreta.
- Não crie soluções para necessidades futuras ou hipotéticas.
- Reutilize as tecnologias e os padrões já adotados no repositório. Adicione dependências somente quando forem necessárias para a tarefa.
- Mantenha as validações e o tratamento de erros necessários à correção dos dados e às regras do projeto; simplicidade não significa omitir requisitos.

## Verificação e documentação

- Verifique o comportamento alterado, especialmente as regras de doses, datas e situações das agendas quando forem afetadas.
- Mantenha as instruções de instalação, configuração e execução coerentes com a implementação.
- Ao concluir uma tarefa, informe de forma breve o que mudou, como foi verificado e qualquer pendência real.

## Commits e pull requests

- Use sempre Conventional Commits nas mensagens de commit e nos títulos de pull requests.
- Formato: `tipo(escopo opcional): descrição curta`. Exemplos: `docs: documenta os requisitos do projeto`, `feat(agendas): cria agendamentos das doses` e `fix(agendas): corrige a data da próxima dose`.
- Escolha um tipo que represente a mudança, como `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci` ou `build`.
- Escreva descrições claras e específicas. O corpo da PR deve seguir o template do repositório.
