package com.example.demo.Model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Consulta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String consultorio;
    private String senha;
    private LocalDateTime dataHora;
    private LocalDateTime dataHoraConclusao;
    private String prioridade; // S, P ou U
    private String status = "AGUARDANDO";

    // ✨ AQUI ESTÁ A VARIÁVEL QUE FALTAVA!
    private String observacoes;

    @ManyToOne(cascade = CascadeType.ALL)
    private Paciente paciente;
}