package com.example.demo.Repository;

import com.example.demo.Model.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PacienteRepository extends JpaRepository<Paciente, Long> {

    // Busca paciente pelo CPF — usado na recepção para autocompletar cadastro
    Optional<Paciente> findByCpf(String cpf);
}