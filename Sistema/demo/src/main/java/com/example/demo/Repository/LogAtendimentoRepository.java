package com.example.demo.Repository;

import com.example.demo.Model.LogAtendimento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LogAtendimentoRepository extends JpaRepository<LogAtendimento, Long> {
    List<LogAtendimento> findByTipoEventoOrderByDataHoraDesc(String tipoEvento);
}