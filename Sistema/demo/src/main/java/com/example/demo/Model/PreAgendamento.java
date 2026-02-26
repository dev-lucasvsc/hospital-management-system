package com.example.demo.Model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class PreAgendamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String cpf;
    private String dataNascimento;

    // Identificador do WhatsApp (número de telefone)
    private String telefone;

    // Campo para armazenar os sintomas relatados na triagem
    @Column(columnDefinition = "TEXT")
    private String sintomas;

    // Estados: PENDENTE, AGUARDANDO_NOME, AGUARDANDO_CPF, AGUARDANDO_SINTOMAS, CONCLUIDO
    private String status = "PENDENTE";

    private LocalDateTime dataSolicitacao;

    @PrePersist
    protected void onCreate() {
        this.dataSolicitacao = LocalDateTime.now();
    }
}