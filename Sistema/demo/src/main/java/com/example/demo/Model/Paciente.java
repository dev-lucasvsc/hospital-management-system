package com.example.demo.Model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Paciente {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String dataNascimento;
    private String cpf;
    private String numeroSus;
    private String genero;
    private boolean possuiConvenio;
    private String numeroConvenio;
}