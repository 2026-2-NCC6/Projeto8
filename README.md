# Projeto Interdisciplinar - 🎾 Sweet Spot (Smart Tennis Arena)

### 💡 Treinos de precisão no ténis com Visão Computacional, IoT, YOLOv11 e Dashboard Interativo
     https://github.com/user-attachments/assets/01348b62-c4a4-43db-897b-15e4f8ed6a80" />

**FECAP - Fundação Escola de Comércio Álvares Penteado**



---

## 📝 Descrição

A **Sweet Spot (Smart Tennis Arena)** é uma solução tecnológica focada no treino solo de precisão no ténis, criada para tornar a prática interativa, mensurável e gamificada. O projeto une desenvolvimento web moderno, hardware IoT e visão computacional avançada para criar um ecossistema completo de aprimoramento desportivo.

No protótipo físico (maquete), bolinhas de isopor simulam as bolas em jogo. O jogador realiza o remate contra uma parede equipada com matrizes de LEDs, que atuam como alvos dinâmicos. Quando o sistema deteta um impacto no alvo ativo, atribui pontuação baseada na precisão (distância ao centro), regista o tempo de reação, calcula a sequência de acertos (combo) e gera um novo alvo.

O grande diferencial tecnológico da arena é a **ausência de sensores de impacto físicos na parede**. Toda a deteção de colisão é realizada por **Visão Computacional**, utilizando um modelo **YOLOv11** treinado no Label Studio e um sistema de câmaras duplas que identifica o momento do impacto através de heurísticas visuais (inversão de trajetória, escala e *motion blur*), cruzando as coordenadas através de uma calibração por homografia.

---

## ✅ Arquitetura e Status do Sistema

A arquitetura do projeto foi desenhada para ser modular, operando em tempo real através da comunicação Serial e requisições HTTP RESTful:

```text
Maquete Física (Arduino + LEDs WS2812B)
       ↕ (Comunicação Serial)
Câmaras Duplas ➔ Script Python (YOLOv11 / OpenCV / Telemetria)
       ↓ (Requisições HTTP POST)
Backend API (Node.js / Express / MySQL)
       ↕ (REST API / JWT)
Dashboard Web (React / TypeScript / TanStack)
```

### Estado atual dos módulos

- ✅ **Visão Computacional e IA:** Modelo YOLOv11 funcional. Script (`tennis_arena.py`) processa frames, faz calibração espacial, deteta colisões por heurísticas e envia dados de telemetria.
- ✅ **Frontend Web:** Totalmente desenvolvido em React (SPA) sem dependências legacy. Utiliza TanStack Router/Query, Tailwind CSS v4 e Shadcn UI. O painel apresenta o XP, nível, mapa de alvos e estatísticas em tempo real.
- ✅ **Backend e API:** API RESTful robusta em Node.js/Express. Inclui autenticação por JWT, controlo de acesso baseado em funções (RBAC) e rotas otimizadas para processamento de telemetria.
- ✅ **Base de Dados:** Persistência em MySQL (cloud Aiven) utilizando UUIDs. Implementação de *Views* SQL (`vw_desempenho_praticante`) para agregação ultrarrápida de estatísticas complexas.
- ✅ **Módulo IoT (Hardware):** Arduino Uno integrado com fitas de LED endereçáveis, alimentado por fonte externa com circuito de proteção (capacitores/resistores), a comunicar ativamente com o motor de visão.

---

## 👥 Integrantes

- Arthur Paltrinieri Silva
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

### 👁️ Visão Computacional (O Motor do Jogo)
Em vez de depender de malhas de sensores físicos vulneráveis ao impacto, o sistema vê e compreende o jogo. A câmara frontal mapeia a quadra (pixels para centímetros), enquanto a câmara lateral ajuda a confirmar o momento exato em que a bola inverte a sua física após chocar com a parede de LEDs.

### ⚖️ Telemetria e Pontuação Automática
O script de Python calcula a distância euclidiana entre a coordenada do impacto da bola e o centro do LED que estava aceso. Se estiver dentro da tolerância, regista um acerto (HIT), envia o *feedback* para o Arduino (para efeitos sonoros/visuais) e dispara um *payload* de dados para a API Node.js.

### 🔁 Comportamento por Máquina de Estados
O controlo do sistema está rigorosamente modelado numa Máquina de Estados Finitos (MEF). O fluxo transita de forma síncrona entre *Aguardando Sessão* $\rightarrow$ *Rastreamento (Tracking)* $\rightarrow$ *Cálculo Geométrico* $\rightarrow$ *Acerto/Erro* $\rightarrow$ *Registo na Cloud*, impedindo falhas lógicas durante as jogadas rápidas.

### 🖥️ Dashboard e Gamificação
Os praticantes têm acesso a um painel que traduz o seu esforço físico em progressão digital. O sistema converte pontos em experiência (XP), permitindo a subida de nível. O painel também inclui mapas de calor para identificar as zonas da quadra onde o jogador tem maior ou menor taxa de precisão e tempo de reação.

---

## 🗂️ Estrutura de Pastas

```text
Sweet_Spot_Arena/
├── Documentos/
│   ├── Modelagem_de_Estados.pdf
│   └── Arquitetura_IoT_Esquematicos.pdf
│
├── smart-tennis-ai/        # Frontend Web
│   ├── src/
│   │   ├── components/     # Componentes Shadcn UI
│   │   ├── routes/         # TanStack Router (Dashboard, Sessões)
│   │   └── services/       # Configuração Axios (api.ts)
│   ├── bun.lock
│   └── package.json
│
├── smart-tennis-api/       # Backend Node.js
│   ├── src/
│   │   ├── db.ts           # Conexão MySQL (Aiven)
│   │   ├── server.ts       # Rotas Express
│   │   └── middlewares/    # Autenticação JWT e RBAC
│   └── .env
│
├── computer-vision/        # Scripts de IA e Rastreamento
│   ├── tennis_arena.py
│   ├── best.pt             # Modelo YOLOv11 treinado
│   └── arena_calib.json
│
└── hardware-iot/           # Código do Microcontrolador
    └── arena_controller.ino
```

---

## 🛠️ Como executar o sistema localmente

O projeto utiliza o **Bun** como gestor de pacotes e *runtime* ultrarrápido para o ecossistema JavaScript/TypeScript.

### 1. Iniciar a API (Backend)

```bash
cd smart-tennis-api
bun install
# Certifique-se de que o ficheiro .env está configurado com as credenciais do MySQL
bun run dev
```
*A API ficará disponível em `http://localhost:3333`.*

### 2. Iniciar o Dashboard (Frontend)

Em um novo terminal:
```bash
cd smart-tennis-ai
bun install
bun run dev
```
*O painel web ficará disponível em `http://localhost:8080` (ou porta configurada pelo Vite).*

### 3. Iniciar o Motor de Visão Computacional

Certifique-se de que tem o Python instalado e o Arduino conectado à porta Serial (ex: `COM3` ou `/dev/ttyUSB0`).
```bash
cd computer-vision
pip install ultralytics opencv-python numpy pyserial
python tennis_arena.py --model best.pt --source 0 --port COM3 --led-mode serial
```

---

## ⚙️ Ferramentas e Tecnologias

### Visão Computacional e IA




### Web e Backend





### Base de Dados e Infraestrutura




### IoT e Hardware



---

## 📄 Licença

Sweet Spot (Smart Tennis Arena) © 2026.

Este projeto foi desenvolvido para fins académicos no curso de Ciência da Computação da FECAP, no contexto do Projeto Interdisciplinar do 6º semestre.
