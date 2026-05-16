# Sistema de Gestão Hospitalar

Sistema de triagem e recepção hospitalar com suporte a concorrência real, paralelismo via fila Redis e notificações em tempo real via WebSocket.

Desenvolvido como Projeto Integrador de Computação Paralela — UNIEURO ADS.

---

## Tecnologias

**Backend**
- Java 17 + Spring Boot 4
- Spring Security + JWT
- Spring Data JPA + Hibernate (Optimistic Locking)
- WebSocket + STOMP
- Redis (fila de notificações)
- PostgreSQL

**Frontend**
- React + TypeScript + Vite
- Nginx (produção via Docker)

**Infraestrutura**
- Docker + Docker Compose
- 4 containers: backend, frontend, PostgreSQL, Redis

---

## Arquitetura de Concorrência e Paralelismo

```
[Requisição HTTP]
      |
      v
[ConsultaService]  →  salva no banco (AtomicInteger p/ senha thread-safe)
      |                @Transactional + @Version (Optimistic Locking)
      |
      v
[Redis Queue]      →  fila:notificacoes (evento publicado, request retorna)
      |
      v
[NotificacaoWorker]  →  consome a fila a cada 1s em thread separada (@Async + @Scheduled)
      |
      v
[WebSocket]        →  /topic/fila → painéis atualizam em tempo real

[LogService]       →  persiste logs em thread @Async (pool hospital-async-*)
                       independente do fluxo principal
```

**Mecanismos implementados:**
- `AtomicInteger` — geração de senhas thread-safe sem synchronized
- `@Version` — Optimistic Locking detecta conflitos e retorna HTTP 409
- `@Async` com pool dedicado — logs e worker em threads separadas
- Redis + Worker — paralelismo real desacoplado da requisição principal

---

## Como Executar

### Com Docker (recomendado)

Pré-requisito: [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado.

```bash
# Subir todos os containers
docker-compose up --build

# Acessar o sistema
# Frontend: http://localhost
# Backend:  http://localhost:8080

# Ver logs em tempo real
docker-compose logs -f backend

# Filtrar logs de concorrência e paralelismo
docker-compose logs backend | grep -E "WORKER|SERVICE|CONFLITO|LOG ASYNC"

# Encerrar
docker-compose down
```

**Containers iniciados:**
| Container | Porta | Função |
|---|---|---|
| hospital-frontend | 80 | Interface React (Nginx) |
| hospital-backend | 8080 | API Spring Boot |
| hospital-db | 5432 | PostgreSQL |
| hospital-redis | 6379 | Fila de notificações |

**Credenciais padrão:**
- Banco: `postgres` / `210805`
- Login admin: id `1` / senha `123456`

---

### Sem Docker (desenvolvimento local)

Pré-requisitos: Java 17+, Node.js, PostgreSQL, Redis.

**Backend — IntelliJ ou terminal:**
```bash
cd Sistema/demo
./mvnw spring-boot:run
```

**Frontend:**
```bash
cd "Front Sistema/recepcao-hospital"
npm install
npm run dev
```

Configurar `application.properties` com as credenciais locais do banco.

---

## Testando Concorrência e Paralelismo

Com o sistema rodando via Docker, execute o script de teste:

**Windows (PowerShell):**
```powershell
.\teste-concorrencia.ps1
```

**Linux/Mac:**
```bash
chmod +x teste-concorrencia.sh && ./teste-concorrencia.sh
```

**Resultado esperado:**
```
TESTE 1 — 5 agendamentos paralelos simultâneos
[REQ 1] HTTP 200 | Senha: S-001 | Consultorio: 02
[REQ 2] HTTP 200 | Senha: S-005 | Consultorio: 02
[REQ 3] HTTP 200 | Senha: S-004 | Consultorio: 02
[REQ 4] HTTP 200 | Senha: S-003 | Consultorio: 02
[REQ 5] HTTP 200 | Senha: S-002 | Consultorio: 02

TESTE 2 — Conflito de concorrência (HTTP 409)
[REQ A] Status: 204 — SUCESSO
[REQ B] Status: 409 — CONFLITO DETECTADO (Optimistic Lock funcionou!)
```

Logs correspondentes no backend:
```
[SERVICE] thread=http-nio-8080-exec-2  senha=S-001  publicada na fila Redis
[LOG ASYNC] thread=hospital-async-2  tipo=AGENDAMENTO  desc=Senha S-001 gerada
[WORKER] thread=hospital-async-4  evento=ATUALIZAR_FILA:S-001  → notificando WebSocket
[CONTROLLER] CONFLITO DETECTADO  thread=http-nio-8080-exec-8  consulta id=2  → retornando 409
```

---

## Funcionalidades

- Painel de Recepção — cadastro e triagem de pacientes com geração de senha
- Painel Médico — visualização de fila por consultório e conclusão de atendimentos
- Autenticação JWT — controle de acesso por cargo (ADMIN, RECEPCAO, MEDICO)
- Notificações em tempo real — WebSocket atualiza painéis automaticamente
- Histórico de atendimentos — consulta por CPF
- Log de auditoria — registro assíncrono de todas as operações

---

## Estrutura do Projeto

```
Hospital-Management-System/
├── docker-compose.yml
├── teste-concorrencia.ps1
├── teste-concorrencia.sh
├── evidencia-logs.txt
├── Sistema/demo/                          # Backend Spring Boot
│   ├── src/main/java/com/example/demo/
│   │   ├── Config/
│   │   │   ├── AsyncConfig.java           # Pool de threads assíncrono
│   │   │   ├── SecurityConfig.java        # Spring Security + JWT
│   │   │   ├── JwtAuthFilter.java
│   │   │   └── JwtUtil.java
│   │   ├── Controller/
│   │   │   ├── ConsultaController.java    # Trata HTTP 409 (conflito)
│   │   │   └── FuncionarioController.java
│   │   ├── Model/
│   │   │   ├── Consulta.java              # @Version (Optimistic Locking)
│   │   │   └── ...
│   │   └── Service/
│   │       ├── ConsultaService.java       # AtomicInteger + Redis publish
│   │       ├── NotificacaoWorker.java     # Worker fila Redis (@Async + @Scheduled)
│   │       └── LogService.java            # Log assíncrono (@Async)
│   └── Dockerfile
└── Front Sistema/recepcao-hospital/       # Frontend React
    └── Dockerfile
```
