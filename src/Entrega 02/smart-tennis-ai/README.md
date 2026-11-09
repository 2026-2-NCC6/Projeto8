# Smart Tennis Arena

Atue como um desenvolvedor Full-Stack sênior e crie a estrutura de um site/dashboard web chamado 'Smart Tennis Arena'. O sistema é focado em treinos gamificados de tênis integrados com robótica e sensores IoT. O design da interface deve ser moderno, limpo e esportivo, adotando obrigatoriamente a cor branca como primária (para fundos e estrutura) e a cor vermelha como secundária (para botões, destaques e alertas).

O núcleo da aplicação é um dashboard que registrará a precisão de rebatidas realizadas em uma maquete. O sistema deve exibir uma gamificação baseada na precisão com que o usuário acerta os alvos de LED na maquete, mostrando pontos, bônus e progressão.

Crie um fluxo de Autenticação (Login e Cadastro) com controle de acesso para três perfis de usuários:

Praticante (Jogador): Durante o cadastro, deve haver uma opção para selecionar o seu nível de tênis. O painel deste usuário deve permitir que ele acompanhe seu desempenho nas sessões, visualize seu histórico de treinos e acesse os treinamentos recebidos.

Professor/Instituição (Treinador): O painel deste usuário deve ter ferramentas para acompanhar o desempenho e os indicadores de seus alunos. Deve também permitir que o treinador envie treinamentos diretamente para os alunos.

Administrador: Painel de gestão administrativa para gerenciar usuários, permissões e parâmetros gerais do sistema.

A estrutura do site deve conter fluxos de páginas claros para:

Gestão de Sessões: Páginas para seleção, configuração, execução e acompanhamento em tempo real das sessões de treino.

Gestão de Treinos: Páginas focadas na criação, gestão, publicação, versionamento (rascunho, revisão, publicado) e análise dos treinos.

Gere a estrutura de rotas protegidas por perfil, as telas de dashboard com placeholders para gráficos de desempenho e tabelas de análise, garantindo uma navegação intuitiva."

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://smart-tennis-ai.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3e135022-afc4-4c78-b92d-1807f8a82225).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
