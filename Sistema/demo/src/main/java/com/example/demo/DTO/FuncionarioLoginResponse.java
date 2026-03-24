package com.example.demo.DTO;

public class FuncionarioLoginResponse {

    private Long id;
    private String nome;
    private String cargo;
    private String registroProfissional;

    public FuncionarioLoginResponse(Long id, String nome, String cargo, String registroProfissional) {
        this.id = id;
        this.nome = nome;
        this.cargo = cargo;
        this.registroProfissional = registroProfissional;
    }

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public String getCargo() { return cargo; }
    public String getRegistroProfissional() { return registroProfissional; }
}