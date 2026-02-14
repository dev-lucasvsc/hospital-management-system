# 🏥 Hospital Management System

Sistema Full Stack de gestão hospitalar com foco em triagem de pacientes e métricas de atendimento.

## 🧱 Estrutura do Projeto
- **/Sistema**: Backend em Java (Spring Boot) com persistência em PostgreSQL.
- **/Front Sistema**: Frontend em React (TypeScript) com interface responsiva.

## ⚙️ Funcionalidades Implementadas
- **Login por Perfil**: Acesso restrito para Médicos e Recepcionistas.
- **Triagem Inteligente**: Priorização automática baseada em urgência (Normal, Preferencial, Urgente).
- **Balanceamento de Consultórios**: O sistema distribui pacientes para os consultórios menos ocupados.
- **Monitor de TV**: Painel de chamadas com alerta sonoro e voz sintetizada.
- **Dashboard de Gestão**: Monitoramento de tempo médio de espera e total de atendimentos.

## 🛠️ Hierarquia Hospitalar Suportada
Baseado em padrões reais de gestão, o sistema separa responsabilidades entre:
- **Equipe de Apoio (Recepção)**: Fluxo de entrada e registros.
- **Equipe Assistencial (Médicos)**: Chamada e conclusão de atendimentos.
- **Alta Direção**: Acesso a métricas de desempenho e histórico.
