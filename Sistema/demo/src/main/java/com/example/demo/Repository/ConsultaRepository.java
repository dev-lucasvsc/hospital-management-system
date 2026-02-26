package com.example.demo.Repository;

import com.example.demo.Model.Consulta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ConsultaRepository extends JpaRepository<Consulta, Long> {
    List<Consulta> findByStatusOrderByIdDesc(String status);

    long countByConsultorioAndStatus(String consultorio, String status);

    List<Consulta> findByPacienteCpfOrderByDataHoraDesc(String cpf);

    // ✨ NOVA FUNÇÃO: Procura a fila de um consultório específico
    List<Consulta> findByConsultorioAndStatusOrderByIdDesc(String consultorio, String status);
}