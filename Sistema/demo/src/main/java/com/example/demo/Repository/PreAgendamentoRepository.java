package com.example.demo.Repository;

import com.example.demo.Model.PreAgendamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PreAgendamentoRepository extends JpaRepository<PreAgendamento, Long> {

    // Busca um atendimento em andamento para o número do WhatsApp
    Optional<PreAgendamento> findByTelefoneAndStatusNot(String telefone, String status);

    // Busca todos os pré-agendamentos com um status específico (ex: CONCLUIDO para a recepção)
    List<PreAgendamento> findByStatus(String status);

    // ADICIONADO: Método que estava em falta e causou o erro de compilação
    Optional<PreAgendamento> findFirstByCpfAndStatusOrderByIdDesc(String cpf, String status);
}