package com.example.demo.Repository;

import com.example.demo.Model.Consulta;
import com.example.demo.Model.StatusConsulta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ConsultaRepository extends JpaRepository<Consulta, Long> {

    // Busca todas as consultas com um determinado status, ordenadas por ID decrescente
    List<Consulta> findByStatusOrderByIdDesc(StatusConsulta status);

    // Conta quantas consultas AGUARDANDO existem em um consultório específico
    // Usado pelo ConsultaService para distribuir pacientes para a sala com menor fila
    long countByConsultorioAndStatus(String consultorio, StatusConsulta status);

    // Busca histórico de atendimentos de um paciente pelo CPF
    List<Consulta> findByPacienteCpfOrderByDataHoraDesc(String cpf);

    // Busca a fila de um consultório específico
    List<Consulta> findByConsultorioAndStatusOrderByIdDesc(String consultorio, StatusConsulta status);
}