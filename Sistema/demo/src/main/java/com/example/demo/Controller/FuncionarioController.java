package com.example.demo.Controller;

import com.example.demo.Config.JwtUtil;
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

/**
 * Controller de autenticação e gestão de funcionários.
 *
 * Login retorna um token JWT válido por 8 horas.
 * O frontend deve enviar o token em todas as requisições subsequentes:
 *   Authorization: Bearer <token>
 */
@RestController
@RequestMapping("/funcionarios")
public class FuncionarioController {

    @Autowired private FuncionarioRepository repository;
    @Autowired private LogService logService;
    @Autowired private JwtUtil jwtUtil;

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

    /**
     * POST /funcionarios/login — rota pública.
     * Valida matrícula + senha e retorna JWT + dados do funcionário.
     */
    @PostMapping("/login")
    public ResponseEntity<FuncionarioLoginResponse> login(@RequestBody Funcionario loginData) {
        Optional<Funcionario> encontrado = repository.findById(loginData.getId());

        if (encontrado.isPresent() &&
                encoder.matches(loginData.getSenha(), encontrado.get().getSenha())) {

            Funcionario f = encontrado.get();
            String token = jwtUtil.gerarToken(f.getId(), f.getNome(), f.getCargo());

            logService.registrarLog("LOGIN",
                    "Funcionário " + f.getNome() + " (" + f.getCargo() + ") autenticado",
                    f.getNome());

            return ResponseEntity.ok(new FuncionarioLoginResponse(
                    f.getId(), f.getNome(), f.getCargo(), f.getRegistroProfissional(), token
            ));
        }

        return ResponseEntity.status(401).build();
    }

    /**
     * POST /funcionarios/cadastrar — requer ROLE_ADMIN (validado pelo SecurityConfig).
     */
    @PostMapping("/cadastrar")
    public ResponseEntity<FuncionarioLoginResponse> cadastrar(@RequestBody Funcionario novo) {
        novo.setSenha(encoder.encode(novo.getSenha()));
        Funcionario salvo = repository.save(novo);
        return ResponseEntity.ok(new FuncionarioLoginResponse(
                salvo.getId(), salvo.getNome(), salvo.getCargo(),
                salvo.getRegistroProfissional(), null // sem token ao cadastrar
        ));
    }

    /**
     * GET /funcionarios — requer ROLE_ADMIN (validado pelo SecurityConfig).
     */
    @GetMapping
    public ResponseEntity<List<FuncionarioLoginResponse>> listarTodos() {
        return ResponseEntity.ok(repository.findAll().stream()
                .map(f -> new FuncionarioLoginResponse(
                        f.getId(), f.getNome(), f.getCargo(), f.getRegistroProfissional(), null
                ))
                .toList());
    }
}
