package com.example.demo.Repository;

import com.example.demo.Model.Consulta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ConsultaRepository extends JpaRepository<Consulta, Long> {
    List<Consulta> findByStatusOrderByIdDesc(String status);

    // Conta quantos pacientes estão esperando em um consultório específico
    long countByConsultorioAndStatus(String consultorio, String status);
}