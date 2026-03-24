package com.example.demo.Controller;

import com.example.demo.DTO.FuncionarioLoginResponse;
import com.example.demo.Model.Funcionario;
import com.example.demo.Repository.FuncionarioRepository;
import com.example.demo.Service.LogService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/funcionarios")
@CrossOrigin(origins = "*")
public class FuncionarioController {

    @Autowired private FuncionarioRepository repository;
    @Autowired private LogService logService;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);

    @PostConstruct
    public void init() {
        if (repository.count() == 0) {
            Funcionario admin = new Funcionario();
            admin.setNome("Administrador do Sistema");
            admin.setSenha(encoder.encode("123456"));
            admin.setCargo("ADMIN");
            repository.save(admin);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<FuncionarioLoginResponse> login(@RequestBody Funcionario loginData) {
        Optional<Funcionario> encontrado = repository.findById(loginData.getId());

        if (encontrado.isPresent() && encoder.matches(loginData.getSenha(), encontrado.get().getSenha())) {
            Funcionario f = encontrado.get();
            logService.registrarLog("LOGIN",
                    "Funcionário " + f.getNome() + " (" + f.getCargo() + ") autenticado", f.getNome());
            return ResponseEntity.ok(
                    new FuncionarioLoginResponse(f.getId(), f.getNome(), f.getCargo(), f.getRegistroProfissional())
            );
        }
        return ResponseEntity.status(401).build();
    }

    @PostMapping("/cadastrar")
    public ResponseEntity<FuncionarioLoginResponse> cadastrar(@RequestBody Funcionario novo) {
        novo.setSenha(encoder.encode(novo.getSenha()));
        Funcionario salvo = repository.save(novo);
        return ResponseEntity.ok(
                new FuncionarioLoginResponse(salvo.getId(), salvo.getNome(), salvo.getCargo(), salvo.getRegistroProfissional())
        );
    }

    @GetMapping
    public ResponseEntity<List<FuncionarioLoginResponse>> listarTodos() {
        return ResponseEntity.ok(repository.findAll().stream()
                .map(f -> new FuncionarioLoginResponse(f.getId(), f.getNome(), f.getCargo(), f.getRegistroProfissional()))
                .toList());
    }
}