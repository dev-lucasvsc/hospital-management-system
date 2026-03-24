package com.example.demo.Model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "pre_agendamento")
@Data
public class PreAgendamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    private String cpf;

    private String dataNascimento;

    // Número de telefone (identificador do WhatsApp)
    private String telefone;

    @Column(columnDefinition = "TEXT")
    private String sintomas;

    @Enumerated(EnumType.STRING)
    private StatusPreAgendamento status = StatusPreAgendamento.PENDENTE;

    private LocalDateTime dataSolicitacao;

    @PrePersist
    protected void onCreate() {
        this.dataSolicitacao = LocalDateTime.now();
    }
}