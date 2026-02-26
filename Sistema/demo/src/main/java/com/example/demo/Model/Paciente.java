package com.example.demo.Model;

import jakarta.persistence.*;

@Entity
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

    // Endereço
    private String cep;
    private String rua;
    private String bairro;
    private String cidade;
    private String uf;

    // Contatos e Filiação
    private String telefone;
    private String nomeMae;
    private String nomePai;
    private String peso;
    private String altura;

    public Paciente() {}

    // Getters e Setters Clássicos
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getDataNascimento() { return dataNascimento; }
    public void setDataNascimento(String dataNascimento) { this.dataNascimento = dataNascimento; }

    public String getCpf() { return cpf; }
    public void setCpf(String cpf) { this.cpf = cpf; }

    public String getNumeroSus() { return numeroSus; }
    public void setNumeroSus(String numeroSus) { this.numeroSus = numeroSus; }

    public String getGenero() { return genero; }
    public void setGenero(String genero) { this.genero = genero; }

    public boolean isPossuiConvenio() { return possuiConvenio; }
    public void setPossuiConvenio(boolean possuiConvenio) { this.possuiConvenio = possuiConvenio; }

    public String getNumeroConvenio() { return numeroConvenio; }
    public void setNumeroConvenio(String numeroConvenio) { this.numeroConvenio = numeroConvenio; }

    public String getCep() { return cep; }
    public void setCep(String cep) { this.cep = cep; }

    public String getRua() { return rua; }
    public void setRua(String rua) { this.rua = rua; }

    public String getBairro() { return bairro; }
    public void setBairro(String bairro) { this.bairro = bairro; }

    public String getCidade() { return cidade; }
    public void setCidade(String cidade) { this.cidade = cidade; }

    public String getUf() { return uf; }
    public void setUf(String uf) { this.uf = uf; }

    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }

    public String getNomeMae() { return nomeMae; }
    public void setNomeMae(String nomeMae) { this.nomeMae = nomeMae; }

    public String getNomePai() { return nomePai; }
    public void setNomePai(String nomePai) { this.nomePai = nomePai; }

    public String getPeso() { return peso; }
    public void setPeso(String peso) { this.peso = peso; }

    public String getAltura() { return altura; }
    public void setAltura(String altura) { this.altura = altura; }
}