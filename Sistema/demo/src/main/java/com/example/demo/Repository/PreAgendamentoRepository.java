package com.example.demo.Repository;

import com.example.demo.Model.PreAgendamento;
import com.example.demo.Model.StatusPreAgendamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PreAgendamentoRepository extends JpaRepository<PreAgendamento, Long> {

    // Busca atendimento em andamento para o número de WhatsApp (qualquer status exceto CONCLUIDO)
    Optional<PreAgendamento> findByTelefoneAndStatusNot(String telefone, StatusPreAgendamento status);

    // Lista todos os pré-agendamentos com um status específico
    List<PreAgendamento> findByStatus(StatusPreAgendamento status);

    // Busca o pré-agendamento mais recente de um CPF com status específico
    // Usado pela recepção para importar dados do WhatsApp
    Optional<PreAgendamento> findFirstByCpfAndStatusOrderByIdDesc(String cpf, StatusPreAgendamento status);
}