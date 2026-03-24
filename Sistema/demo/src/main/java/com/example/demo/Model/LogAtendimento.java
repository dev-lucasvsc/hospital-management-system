package com.example.demo.Model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "log_atendimento")
@Data
public class LogAtendimento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // AGENDAMENTO, CONCLUSAO, LOGIN, ERRO
    private String tipoEvento;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    private String usuarioResponsavel;

    private LocalDateTime dataHora;

    @PrePersist
    protected void onCreate() {
        this.dataHora = LocalDateTime.now();
    }
}