<div align="center">

# Projeto Interdisciplinar - 🎾 Sweet Spot (Smart Tennis Arena)

### 💡 Treinos gamificados de precisão no tênis com Visão Computacional, IoT e API
&nbsp;&nbsp;&nbsp;&nbsp; <img height="400" alt="Logo FECAP" src="https://github.com/user-attachments/assets/01348b62-c4a4-43db-897b-15e4f8ed6a80" />

**FECAP - Fundação Escola de Comércio Álvares Penteado**

</div>

---

## 📝 Descrição

A **Sweet Spot (Smart Tennis Arena)** propõe o desenvolvimento de uma solução tecnológica para criação e execução de treinos gamificados de precisão no tênis. O projeto une visão computacional, desenvolvimento web e hardware IoT para criar um ecossistema focado no aprimoramento esportivo interativo.

O projeto tem como objetivo tornar os treinos solo mais dinâmicos. No protótipo, bolinhas de isopor simulam as bolas em jogo. O jogador realiza o movimento de devolução contra uma parede equipada com LEDs, que atuam como alvos dinâmicos, exigindo velocidade de reação e precisão.

A solução dispensa o uso de sensores físicos de impacto na parede. Em vez disso, integra um motor de **Visão Computacional (YOLOv11 e OpenCV)** alimentado por duas webcams (frontal e lateral) para rastrear a bola e detectar o momento exato da colisão por meio de heurísticas visuais (inversão de trajetória, escala e perda de rastreio).

Além do módulo embarcado (Arduino controlando os LEDs) e do script de visão, o projeto conta com um **backend (API em Node.js)** responsável por receber a telemetria das sessões, e um **dashboard web (React)** focado na análise de desempenho, mapa de alvos e gamificação (XP e progressão de nível).

---

## ✅ Status atual do sistema

O sistema encontra-se planejado e estruturado com a seguinte arquitetura:

```text
Dashboard Web (React / TypeScript)
        ↕
Backend e API (Node.js / Express / MySQL)
        ↕
Plataforma de Visão (Script Python / YOLOv11)
```

O módulo IoT atua em sincronia com o motor de visão. O script lê o ambiente pela câmera, detecta os eventos de impacto, calcula a precisão em relação ao alvo iluminado e se comunica com o backend para registrar os resultados.

```text
Câmaras Duplas (Rastreamento espacial e de profundidade)
        ↓
Motor de Visão Computacional (Detecção de colisão)
        ↕ (Comunicação Serial)
Dispositivo IoT (Arduino acendendo LEDs alvo)
```

### Estado atual dos módulos

- ✅ **Visão Computacional:** modelo YOLOv11 treinado (Label Studio) funcional, com detecção heurística de impactos e calibração espacial por homografia.
- ✅ **Frontend Web:** desenvolvido como SPA (React/TanStack), contendo dashboard de estatísticas, mapas de calor de precisão e gamificação de evolução.
- ✅ **Backend e API:** API RESTful robusta (Node.js) com autenticação JWT e rotas preparadas para receber as batidas de telemetria em tempo real.
- ✅ **Banco de dados:** estruturado em MySQL (cloud Aiven) utilizando Views para otimização do cálculo de desempenho do praticante.
- ✅ **Login e cadastro:** controle de acesso (RBAC) com perfis isolados para praticantes, treinadores e administradores.
- ✅ **Módulo IoT:** integração serial ativa com microcontrolador (Arduino) e fitas de LED endereçáveis (com capacitores e resistores de proteção no circuito).

---

## 👥 Integrantes

- [Arthur Paltrinieri Silva](https://www.linkedin.com/in/arthur-paltrinieri/)
- [Integrante 2](#)
- [Integrante 3](#)
- [Integrante 4](#)

---

## 👨‍🏫 Professores Orientadores

- Orientador(a) de Inovação e Empreendedorismo
- Orientador(a) de Redes de Computadores e Cibersegurança
- Orientador(a) de Sistemas Embarcados e Robótica
- Orientador(a) de Teoria da Computação e Linguagens Formais
- Orientador(a) de Projeto Interdisciplinar

---

## 📌 Detalhes do Projeto

### 🕹️ Gamificação e Públicos

O módulo de gamificação adapta a lógica de jogo para os praticantes. O sistema converte os pontos de precisão das batidas em experiência (XP), permitindo a evolução de nível na plataforma. O histórico destaca a precisão média, a maior sequência de acertos (combos) e o tempo de reação, gerando grande engajamento na melhoria contínua.

---

### ⚖️ Pontuação automática

O sistema contabiliza os acertos lidos pelo script de Visão Computacional e calcula a precisão em tempo real. A lógica mede a distância euclidiana entre a coordenada X/Y do impacto e o centro do LED. Se for menor que a tolerância definida, um acerto (HIT) é computado e enviado imediatamente à API.

---

### 🔁 Comportamento por Máquina de Estados

Para garantir o controle preciso de eventos, foi implementada a modelagem formal do comportamento do sistema através de uma máquina de estados (MEF). Isso permite transições exatas entre o rastreamento da bola (Tracking), detecção de impacto, cálculo geométrico e registro na API, evitando que leituras falsas quebrem a lógica do treino.

---

### 🖥️ Backend e API

O backend centraliza a lógica de negócios e armazena toda a telemetria, disponibilizando contratos REST/JSON. Desenvolvido em Node.js com Express e MySQL, ele recebe as requisições geradas pelo motor de visão e utiliza *Views* SQL avançadas para entregar respostas ultrarrápidas ao frontend.

---

### 🌐 Aplicativo e Dashboard

O frontend web é uma Single Page Application moderna. Possui um painel central para o atleta visualizar suas métricas e mapas de alvos, além de uma área restrita para professores (treinadores) gerenciarem seus alunos e acompanharem o desempenho da turma.

---

### 🧠 Integração Física e IoT

O hardware atua na quadra física (maquete). Diferente de sistemas tradicionais baseados em sensores físicos de contato, a Sweet Spot utiliza **duas câmeras** (frontal e lateral) que agem como os "sensores" principais, validando posição e profundidade. O microcontrolador (Arduino) é responsável exclusivamente por comandar os atuadores (acionar os LEDs na parede).

---

## 🗂️ Estrutura de Pastas

```text
Projeto_Smart_Tennis/
├── Documentos/
│   ├── Entrega01/
│   └── Entrega02/
│       ├── Modelagem_Maquinas_de_Estados.pdf
│       └── Arquitetura_IoT_Esquematicos.pdf
│
├── src/
│   ├── IoT_Embarcados/
│   ├── Visao_Computacional/
│   ├── Backend_API/
│   └── Frontend_Web/
│
├── .gitignore
└── README.md
```

---

## 📁 Descrição das principais pastas

📂 **Documentos:** reúne os arquivos relacionados às entregas das disciplinas do PI, incluindo diagrama de estados, modelagem de banco de dados e diagramas IoT.

📂 **src:** contém os arquivos de implementação do projeto.

📂 **src/IoT_Embarcados:** contém os códigos em C/C++ (Arduino) responsáveis por receber comandos via Serial e controlar a matriz de fitas LED.

📂 **src/Visao_Computacional:** contém o script Python (`tennis_arena.py`) de processamento, o modelo YOLOv11 treinado e a lógica de calibração por homografia.

📂 **src/Backend_API:** contém a aplicação backend Node.js responsável pela comunicação com o banco de dados MySQL, autenticação e rotas.

📂 **src/Frontend_Web:** contém a interface web (dashboard) React utilizada para a visualização dos dados, evolução gamificada e gestão de treinos.

---

## 🛠️ Como executar o sistema atualmente

### Execução recomendada

Para testar o ambiente web e a API, o usuário deve rodar os serviços locais de frontend e backend utilizando o **Bun** ou Node. O motor de Visão e o IoT rodam através do interpretador Python e da placa microcontroladora conectada.

---

## 🌐 Executar o Web e API

### 1. Clonar o repositório

```bash
git clone [https://github.com/SeuUsuario/Projeto_Smart_Tennis.git](https://github.com/SeuUsuario/Projeto_Smart_Tennis.git)
cd Projeto_Smart_Tennis
```

---

### 2. Acessar a pasta do Backend

```bash
cd src/Backend_API
```

---

### 3. Instalar dependências e executar

Configure o seu arquivo `.env` com os dados do MySQL e execute:
```bash
bun install
bun run dev
```

---

### 4. Executar o Frontend Web

Em um novo terminal:
```bash
cd src/Frontend_Web
bun install
bun run dev
```

---

## 👁️ Executar o módulo IoT e Visão Computacional

O código embarcado deve ser carregado no Arduino e o script de visão executado no computador.

### 1. Acessar a pasta IoT e Compilar

Acesse a pasta `src/IoT_Embarcados` e utilize a Arduino IDE para compilar o código fonte e gravar na placa Arduino Uno.

---

### 2. Executar o Motor de Visão Computacional

Certifique-se de ter o Python instalado e uma webcam ativa.
```bash
cd ../Visao_Computacional
pip install ultralytics opencv-python numpy pyserial
python tennis_arena.py --model best.pt --source 0 --port COM3 --led-mode serial
```
*(Substitua `COM3` pela porta serial em que o seu Arduino está conectado)*.

---

## ⚙️ Ferramentas e Tecnologias

### Desenvolvimento principal Web e API

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)

### Visão Computacional, IoT e IA

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![YOLO](https://img.shields.io/badge/YOLOv11-00FFFF?style=for-the-badge&logo=yolo&logoColor=black)
![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)
![Arduino](https://img.shields.io/badge/Arduino-00979D?style=for-the-badge&logo=arduino&logoColor=white)

### Banco de dados e Organização

![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)

---

## 📊 Funcionalidades principais

- Autenticação JWT com controle de papéis (praticante, treinador, admin).
- Painel web contendo estatísticas gerais, evolução de XP e mapa de alvos.
- Calibração espacial automatizada mapeando pixels da câmera em centímetros na parede.
- Detecção heurística inteligente (rejeitando falsos positivos baseando-se em profundidade e vetores).
- Envio de telemetria imediata por HTTP com armazenamento estruturado relacional.

---

## 📦 Sensores e Atuadores

No modelo arquitetural atual:
- **Câmeras (Frontal e Lateral):** Substituem os tradicionais sensores de impacto e presença. Atuam como os "olhos" do sistema e fornecem os dados de colisão e profundidade.
- **Matriz de LEDs WS2812B:** Atuadores que fornecem feedback visual instantâneo para guiar o praticante.
*(Sistemas ultrassónicos e piezelétricos foram conceituados, mas substituídos pela eficiência superior e escalabilidade da visão computacional YOLOv11 para múltiplos alvos).*

---

## 🔐 Observações de segurança

- Proteção de senhas com *hashing* seguro via Bcrypt.
- Proteção total de endpoints através de *Middlewares* exigindo Token JWT válido.
- Utilização de proteção elétrica (capacitores e resistores) na interface do microcontrolador para isolamento contra picos de corrente da matriz de LEDs de alta densidade.

---

## 📄 Licença

Sweet Spot (Smart Tennis Arena) © 2026.

Este projeto foi desenvolvido para fins acadêmicos no curso de Ciência da Computação da FECAP, no contexto do Projeto Interdisciplinar do 6º semestre.
