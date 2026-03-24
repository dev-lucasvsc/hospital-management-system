package com.example.demo.Model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "consulta")
@Data
public class Consulta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String consultorio;
    private String senha;
    private LocalDateTime dataHora;
    private LocalDateTime dataHoraConclusao;

    // S, P ou U
    private String prioridade;

    @Enumerated(EnumType.STRING)
    private StatusConsulta status = StatusConsulta.AGUARDANDO;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "paciente_id")
    private Paciente paciente;
}