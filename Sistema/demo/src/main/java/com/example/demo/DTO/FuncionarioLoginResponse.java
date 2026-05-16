package com.example.demo.DTO;

/**
 * DTO de resposta do login.
 * Retorna o token JWT e os dados necessários para o frontend.
 * O campo senha NUNCA é incluído.
 */
public class FuncionarioLoginResponse {

    private Long id;
    private String nome;
    private String cargo;
    private String registroProfissional;
    private String token; // JWT — válido por 8 horas

    public FuncionarioLoginResponse(Long id, String nome, String cargo,
                                    String registroProfissional, String token) {
        this.id = id;
        this.nome = nome;
        this.cargo = cargo;
        this.registroProfissional = registroProfissional;
        this.token = token;
    }

    public Long getId()                  { return id; }
    public String getNome()              { return nome; }
    public String getCargo()             { return cargo; }
    public String getRegistroProfissional() { return registroProfissional; }
    public String getToken()             { return token; }
}
