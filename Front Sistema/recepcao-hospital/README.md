# Sistema Hospitalar — Módulo de Triagem e Recepção

Projeto acadêmico desenvolvido no curso de Análise e Desenvolvimento de Sistemas — UNIEURO.
Disciplina: Projeto Integrador de Computação Paralela.

---

## Visão geral

Sistema web para triagem e recepção hospitalar que automatiza a geração de senhas, organização
da fila de atendimento e comunicação em tempo real entre recepção, médicos e monitores de TV.

---

## Stack tecnológica

| Camada      | Tecnologia                        |
|-------------|-----------------------------------|
| Backend     | Java 17 + Spring Boot 4           |
| Banco       | PostgreSQL (via JPA/Hibernate)    |
| Frontend    | React 19 + TypeScript + Vite      |
| Tempo real  | WebSocket (STOMP sobre SockJS)    |
| Build       | Maven (backend) / npm (frontend)  |

---

## Arquitetura

```
Frontend (React)
     │  HTTP REST + WebSocket (STOMP)
     ▼
Backend (Spring Boot)
  Controller → Service → Repository
     │
     ▼
PostgreSQL
```

**Camadas do backend:**
- `Controller` — recebe e responde requisições HTTP
- `Service`    — lógica de negócio (geração de senhas, distribuição de filas)
- `Repository` — acesso ao banco via Spring Data JPA
- `Config`     — configuração do WebSocket

---

## Funcionalidades implementadas

- Cadastro de pacientes com busca automática por CPF
- Preenchimento automático de endereço via ViaCEP
- Importação de pré-agendamento realizado via WhatsApp
- Geração de senha com prioridade: S (Normal), P (Preferencial), U (Urgente)
- Distribuição automática para o consultório com menor fila
- Fila em tempo real via WebSocket — sem necessidade de recarregar a página
- Painel médico com chamada por voz (Web Speech API)
- Finalização de atendimento com registro de observações (prontuário)
- Histórico de atendimentos com métricas (tempo médio, urgentes, total)
- Monitor de TV para a sala de espera
- Painel administrativo para gestão de funcionários
- Controle de acesso por cargo: ADMIN, MEDICO, RECEPCAO
- Bot de pré-agendamento via WhatsApp Business API

---

## Endpoints da API

### Consultas

| Método | Rota                                              | Descrição                              |
|--------|---------------------------------------------------|----------------------------------------|
| POST   | `/consultas/agendar`                              | Cadastra paciente e gera senha         |
| GET    | `/consultas/fila`                                 | Lista todos AGUARDANDO por prioridade  |
| GET    | `/consultas/fila/{consultorio}`                   | Lista fila de uma sala específica      |
| GET    | `/consultas/historico`                            | Lista todos CONCLUIDO                  |
| GET    | `/consultas/historico/{cpf}`                      | Histórico de um paciente pelo CPF      |
| PUT    | `/consultas/{id}/concluir`                        | Finaliza um atendimento                |
| GET    | `/consultas/whatsapp/pre-agendamento/{cpf}`       | Verifica pré-agendamento do WhatsApp   |
| PUT    | `/consultas/whatsapp/pre-agendamento/{cpf}/concluir` | Marca pré-agendamento como importado |

### Funcionários

| Método | Rota                      | Descrição                    |
|--------|---------------------------|------------------------------|
| POST   | `/funcionarios/login`     | Autentica funcionário        |
| POST   | `/funcionarios/cadastrar` | Cadastra novo funcionário    |
| GET    | `/funcionarios`           | Lista todos os funcionários  |

### WhatsApp

| Método | Rota                     | Descrição                          |
|--------|--------------------------|------------------------------------|
| GET    | `/api/whatsapp/webhook`  | Validação do webhook pela Meta     |
| POST   | `/api/whatsapp/webhook`  | Recebe mensagens dos pacientes     |

---

## Máquinas de estados

**Consulta (fila de atendimento):**
```
AGUARDANDO → CONCLUIDO
```

**Pré-agendamento WhatsApp:**
```
PENDENTE → AGUARDANDO_NOME → AGUARDANDO_CPF → AGUARDANDO_SINTOMAS → CONCLUIDO
```

---

## Computação Paralela — estado atual

O sistema já possui thread safety na geração de senhas:

```java
// ConsultaService.java
private final AtomicInteger contS = new AtomicInteger(1); // Normal
private final AtomicInteger contP = new AtomicInteger(1); // Preferencial
private final AtomicInteger contU = new AtomicInteger(1); // Urgente
```

O uso de `AtomicInteger` garante que múltiplas requisições simultâneas gerem
senhas únicas sem condição de corrida, sem necessidade de bloco `synchronized`.

**Trabalho futuro:** implementar `@Async` + `@EnableAsync` para processamento
assíncrono de logs de atendimento em volumes altos, evitando que a gravação no
banco bloqueie o tempo de resposta da API.

---

## Como executar

### Pré-requisitos
- Java 17+
- PostgreSQL rodando localmente (porta 5432)
- Node.js 18+
- Banco de dados `hospital_db` criado no PostgreSQL

### Backend

```bash
# Defina as variáveis de ambiente (ou edite application.properties para desenvolvimento)
export DB_URL=jdbc:postgresql://localhost:5432/hospital_db
export DB_USER=postgres
export DB_PASSWORD=sua_senha

cd Sistema/demo
./mvnw spring-boot:run
```

O backend sobe em `http://localhost:8080`.

### Frontend

```bash
cd "Front Sistema/recepcao-hospital"
npm install
npm run dev
```

O frontend sobe em `http://localhost:5173`.

---

## Credenciais padrão

Na primeira inicialização, o sistema cria automaticamente um administrador:

| Campo     | Valor                   |
|-----------|-------------------------|
| Matrícula | 1                       |
| Senha     | 123456                  |
| Cargo     | ADMIN                   |

**Altere a senha após o primeiro acesso.**

---

## Dívida técnica conhecida

| Item                          | Impacto   | Solução sugerida                            |
|-------------------------------|-----------|---------------------------------------------|
| Senha em texto puro           | Alto      | BCryptPasswordEncoder                       |
| Sem JWT / autenticação real   | Alto      | Spring Security + JWT                       |
| Credenciais no properties     | Alto      | Variáveis de ambiente (já preparado)        |
| @CrossOrigin("*")             | Médio     | Restringir para origem do frontend          |
| Sem DTOs na API               | Médio     | Criar DTOs de request/response              |
| Contadores de senha em memória| Médio     | Persistir no banco para sobreviver restart  |
| Sem testes automatizados      | Médio     | JUnit + Mockito + @WebMvcTest               |
| dataNascimento como String    | Baixo     | Migrar para LocalDate                       |

---

## Repositório

https://github.com/dev-lucasvsc/hospital-management-system.git