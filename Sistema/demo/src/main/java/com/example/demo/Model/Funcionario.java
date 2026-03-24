package com.example.demo.Model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Entity
@Table(name = "funcionario")
@Data
public class Funcionario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Nome é obrigatório")
    private String nome;

    // Armazenado como hash BCrypt — nunca em texto puro
    @NotBlank(message = "Senha é obrigatória")
    private String senha;

    // Valores esperados: RECEPCAO, MEDICO, ADMIN
    @NotBlank(message = "Cargo é obrigatório")
    private String cargo;

    private String registroProfissional;
    private String cpf;
    private String dataNascimento;
}