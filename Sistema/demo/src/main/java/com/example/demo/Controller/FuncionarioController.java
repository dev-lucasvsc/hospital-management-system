package com.example.demo.Controller;

import com.example.demo.Model.Funcionario;
import com.example.demo.Repository.FuncionarioRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/funcionarios")
@CrossOrigin(origins = "*")
public class FuncionarioController {

    @Autowired
    private FuncionarioRepository repository;

    // ✨ Cria o Gerente (ID 1) sozinho ao ligar o servidor!
    @PostConstruct
    public void init() {
        if (repository.count() == 0) {
            Funcionario admin = new Funcionario();
            admin.setNome("Administrador do Sistema");
            admin.setSenha("123456");
            admin.setCargo("ADMIN"); // Adaptado para a sua variável 'cargo'
            repository.save(admin);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Funcionario> login(@RequestBody Funcionario loginData) {
        return repository.findByIdAndSenha(loginData.getId(), loginData.getSenha())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(401).build());
    }

    @PostMapping("/cadastrar")
    public ResponseEntity<Funcionario> cadastrar(@RequestBody Funcionario novo) {
        return ResponseEntity.ok(repository.save(novo));
    }

    @GetMapping
    public ResponseEntity<List<Funcionario>> listarTodos() {
        return ResponseEntity.ok(repository.findAll());
    }
}