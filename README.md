
```markdown
<div align="center">

# Projeto Interdisciplinar - 🎾 Smart Tennis Arena

### 💡 Treinos gamificados de tênis com IoT, robótica, sensores e integração por API[cite: 1]
&nbsp;&nbsp;&nbsp;&nbsp; <img height="400" alt="Logo FECAP" src="https://github.com/user-attachments/assets/01348b62-c4a4-43db-897b-15e4f8ed6a80" />

**FECAP - Fundação Escola de Comércio Álvares Penteado**

</div>

---

## 📝 Descrição

A **Smart Tennis Arena** propõe o desenvolvimento de uma solução integrada de IoT e Robótica para criação e execução de treinos gamificados de tênis[cite: 1]. O projeto une desenvolvimento mobile, web e hardware para criar um ecossistema focado no aprimoramento esportivo[cite: 1].

O projeto tem como objetivo adaptar os treinos para diferentes perfis, utilizando narrativas lúdicas e alvos coloridos para crianças iniciantes, e focando em metas de precisão, consistência e acompanhamento de resultados para adultos e praticantes avançados[cite: 1].

A solução toma como referência máquinas lançadoras de bolas, como a Spinshot Plus-2, integrando um módulo IoT com microcontroladores (Arduino/ESP32/Raspberry Pi) para captar eventos por meio de **sensores** e acionar **atuadores** na quadra[cite: 1].

Além do módulo embarcado, o projeto conta com um **backend (API)** responsável por enviar telemetria e resultados de sessões para a plataforma mãe[cite: 1], e interfaces (aplicativo mobile e dashboard web) focadas na criação, gestão e execução de treinos, preparando o terreno para um futuro marketplace[cite: 1].

---

## ✅ Status atual do sistema

O sistema encontra-se planejado com a seguinte arquitetura:

```text
Aplicativo Mobile e Dashboard Web
        ↓
Backend e API (Node.js / Java / .NET)
        ↓
Plataforma Mãe SmartTennis
```

O módulo IoT também foi projetado para integrar-se ao sistema. Dessa forma, ele lê sensores da quadra, gera os eventos em tempo real e se comunica com o aplicativo ou API para registrar os acertos e pontuações[cite: 1].

```text
Dispositivo IoT (Sensores e Atuadores)
        ↓
Aplicativo Mobile / Backend
        ↓
Plataforma Mãe SmartTennis
```

### Estado atual dos módulos

- ✅ **Frontend Web:** projetado para a criação, edição, simulação e publicação de treinos gamificados[cite: 1].
- ✅ **Aplicativo Mobile:** planejado para pareamento com dispositivos IoT, seleção de treinos e acompanhamento da sessão (incluindo modo offline)[cite: 1].
- ✅ **Backend e API:** com contratos documentados (OpenAPI) para integração de telemetria e metadados[cite: 1].
- ✅ **Banco de dados:** projetado para transações (PostgreSQL/MySQL) e séries temporais[cite: 1].
- ✅ **Login e cadastro:** controle de acesso com perfis de jogador, treinador/autor e administrador[cite: 1].
- ✅ **Módulo IoT:** integrado para leitura de sensores (presença, impacto) e acionamento de atuadores (LEDs, buzzers)[cite: 1].
- ⚠️ **Execução Física:** a integração com máquinas de mercado exige interfaces autorizadas ou um simulador de hardware, sempre com implementação de parada segura (emergency stop)[cite: 1].

---

## 👥 Integrantes

- [Arthur Paltrinieri Silva](https://www.linkedin.com/in/arthur-paltrinieri/)
- [Integrante 2](#)
- [Integrante 3](#)
- [Integrante 4](#)

---

## 👨‍🏫 Professores Orientadores

- Orientador(a) de Inovação e Empreendedorismo[cite: 1]
- Orientador(a) de Redes de Computadores e Cibersegurança[cite: 1]
- Orientador(a) de Sistemas Embarcados e Robótica[cite: 1]
- Orientador(a) de Teoria da Computação e Linguagens Formais[cite: 1]
- Orientador(a) de Projeto Interdisciplinar[cite: 1]

---

## 📌 Detalhes do Projeto

### 🕹️ Gamificação e Públicos

O módulo de gamificação adapta a lógica de jogo para os praticantes[cite: 1]. Para o público infantil, são acionados sons, narrativas e alvos visuais para engajamento; para o público avançado, a prioridade é a extração de dados precisos de intensidade e consistência[cite: 1].

---

### ⚖️ Pontuação automática

O sistema contabiliza os acertos lidos pelos sensores e calcula os pontos, bônus e penalidades em tempo real[cite: 1]. Dessa forma, metas pré-definidas no treino geram feedbacks no dispositivo IoT e no aplicativo mobile durante a sessão[cite: 1].

---

### 🔁 Comportamento por Máquina de Estados

Para garantir o controle preciso de eventos, foi implementada a modelagem formal do comportamento do sistema através de uma máquina de estados[cite: 1]. Isso permite transições exatas entre repouso, execução, falhas e conclusão do exercício, evitando erros operacionais[cite: 1].

---

### 🖥️ Backend e API

O backend centraliza a lógica de negócios e as regras estruturais da solução, disponibilizando ou consumindo contratos REST/JSON[cite: 1]. Ele permite a sincronização de dados de sessões executadas offline pelo mobile, enviando o resumo e a telemetria à plataforma mãe[cite: 1].

---

### 🌐 Aplicativo e Dashboard

O frontend web possui um editor onde treinadores definem as sequências, sensores necessários e regras de conclusão[cite: 1]. Já o aplicativo mobile conecta-se fisicamente (via Bluetooth Low Energy ou Wi-Fi) ao controlador IoT para dar início e pausar o treinamento[cite: 1].

---

### 🧠 Integração Física e IoT

O hardware atua separadamente na quadra. Ele realiza a aquisição de sensores (distância, movimento, toque) e comanda os atuadores[cite: 1]. Por motivos de segurança, a máquina física lançadora de bolas não sofre engenharia reversa; o MVP utiliza as interfaces documentadas ou um simulador validado[cite: 1].

---

## 🗂️ Estrutura de Pastas

```text
Projeto_Smart_Tennis/
├── Documentos/
│   ├── Entrega01/
│   └── Entrega02/
│   └── Analise_de_Mercado_e_Escopo.pdf
│   └── Maquinas_de_Estados.pdf
│   └── Relatorio_de_Vulnerabilidades.pdf
│
├── src/
│   ├── Entrega01/
│   └── Entrega02/
│       ├── IoT_Embarcados/
│       ├── Backend_API/
│       ├── Frontend_Web/
│       └── Mobile_App/
│
├── .gitignore
└── README.md
```

---

## 📁 Descrição das principais pastas

📂 **Documentos:** reúne os arquivos relacionados às entregas das disciplinas do PI, incluindo diagrama de blocos, contratos de API, e estimativa de mercado (TAM)[cite: 1].

📂 **src:** contém os arquivos de implementação do projeto, separados por entrega.

📂 **src/Entrega02/IoT_Embarcados:** contém os códigos em C/C++ (Arduino/ESP) responsáveis por operar sensores, controlar os atuadores e estabelecer a comunicação (MQTT, BLE, Wi-Fi)[cite: 1].

📂 **src/Entrega02/Backend_API:** contém a aplicação backend responsável pela comunicação com banco de dados, documentação OpenAPI e integração com a SmartTennis[cite: 1].

📂 **src/Entrega02/Frontend_Web:** contém a interface web (dashboard) utilizada para gestão de usuários, criação e versionamento de treinos[cite: 1].

📂 **src/Entrega02/Mobile_App:** contém o aplicativo voltado para o controle direto da sessão em quadra e pareamento de dispositivos[cite: 1].

---

## 🛠️ Como executar o sistema atualmente

### Execução recomendada

Para testar o ambiente de gestão (dashboard), o usuário pode rodar os serviços locais de frontend e backend. O hardware (IoT) é carregado separadamente via placa de desenvolvimento[cite: 1].

---

## 🌐 Executar o Web e API

### 1. Clonar o repositório

```bash
git clone [https://github.com/SeuUsuario/Projeto_Smart_Tennis.git](https://github.com/SeuUsuario/Projeto_Smart_Tennis.git)
```

```bash
cd Projeto_Smart_Tennis
```

---

### 2. Acessar a pasta do Backend

```bash
cd "src/Entrega02/Backend_API"
```

---

### 3. Instalar dependências e executar

```bash
npm install
npm run dev
```

---

### 4. Executar o Frontend Web

Em um novo terminal:
```bash
cd "src/Entrega02/Frontend_Web"
npm install
npm run dev
```

---

## 👁️ Executar o módulo IoT e Mobile

O código embarcado deve ser carregado diretamente no microcontrolador (ESP32 ou Arduino)[cite: 1]. 

### 1. Acessar a pasta IoT

```bash
cd "src/Entrega02/IoT_Embarcados"
```

---

### 2. Compilar e dar upload

Utilize a Arduino IDE ou PlatformIO para compilar os códigos fonte (ex: `main.cpp`) e gravar na placa.

---

### 3. Executar o Aplicativo Mobile

```bash
cd "../Mobile_App"
flutter run 
```
*(Substitua `flutter run` pelo comando correspondente à tecnologia mobile adotada, como React Native ou Kotlin).*[cite: 1] O aplicativo buscará o dispositivo IoT via Bluetooth ou rede local[cite: 1].

---

## ⚙️ Ferramentas e Tecnologias

### Desenvolvimento principal Web e Mobile

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

### IoT, Robótica e Cibersegurança

![Arduino](https://img.shields.io/badge/Arduino-00979D?style=for-the-badge&logo=arduino&logoColor=white)
![C++](https://img.shields.io/badge/C++-00599C?style=for-the-badge&logo=c%2B%2B&logoColor=white)
![MQTT](https://img.shields.io/badge/MQTT-660066?style=for-the-badge&logo=mqtt&logoColor=white)
![OWASP ZAP](https://img.shields.io/badge/OWASP-ZAP-blue?style=for-the-badge)

### Banco de dados e backend

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![REST API](https://img.shields.io/badge/REST%20API-000000?style=for-the-badge&logoColor=white)

### Organização e versionamento

![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
![Scrum](https://img.shields.io/badge/Scrum-009FDA?style=for-the-badge&logoColor=white)

---

## 📊 Funcionalidades principais

- Autenticação com controle de perfil (jogador, treinador/autor e administrador)[cite: 1].
- Catálogo para consulta e filtro de treinos disponibilizados[cite: 1].
- Editor web para projetar sequências, sensores, feedbacks e critérios do exercício[cite: 1].
- Simulação prévia para validar as regras antes de publicar a atividade[cite: 1].
- Pareamento mobile com dispositivos IoT para orquestração local[cite: 1].
- Execução offline de sessões já baixadas e ressincronização posterior[cite: 1].
- Geração de pontuação em tempo real baseada em métricas definidas[cite: 1].
- Registro de auditoria abrangendo acessos, acionamento de emergência e logs de erros[cite: 1].

---

## 📦 Sensores e Atuadores

O modelo arquitetural do hardware considera o uso de:

```text
sensores de distância
sensores de presença
sensores de movimento e pressão
alvos de contato
LEDs e displays (feedback visual)
buzzers (feedback sonoro)
servos e motores
```

Os dados coletados geram eventos padronizados com carimbo de data/hora no controlador[cite: 1].

---

## 🔐 Observações de segurança

- É obrigatória a implementação do botão de **parada segura**, interrompendo todas as ações e impedindo comandos automáticos até o reinício explícito[cite: 1].
- A arquitetura exige a proteção de dados perante a LGPD, aplicando retenção limitada e proteção redobrada a menores de idade[cite: 1].
- A comunicação embarcada e as interfaces API precisam utilizar chaves protegidas, comunicação cifrada e medidas contra as vulnerabilidades do OWASP Top 10[cite: 1].

---

## 📄 Licença

Smart Tennis Arena © 2026.

Este projeto foi desenvolvido para fins acadêmicos no curso de Ciência da Computação da FECAP, no contexto do Projeto Interdisciplinar do 6º semestre[cite: 1].

```
