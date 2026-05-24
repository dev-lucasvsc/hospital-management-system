package com.example.demo.Repository;

import com.example.demo.Model.Consulta;
import com.example.demo.Model.StatusConsulta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ConsultaRepository extends JpaRepository<Consulta, Long> {

    List<Consulta> findByStatusOrderByIdDesc(StatusConsulta status);

    // Fila global ordenada por ID crescente (ordem de chegada)
    List<Consulta> findByStatusOrderByIdAsc(StatusConsulta status);

    long countByConsultorioAndStatus(String consultorio, StatusConsulta status);

    List<Consulta> findByPacienteCpfOrderByDataHoraDesc(String cpf);

    List<Consulta> findByConsultorioAndStatusOrderByIdDesc(String consultorio, StatusConsulta status);

    // Busca paciente em atendimento em um consultório específico
    List<Consulta> findByConsultorioAndStatus(String consultorio, StatusConsulta status);
}