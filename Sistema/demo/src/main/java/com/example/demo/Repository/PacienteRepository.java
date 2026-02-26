package com.example.demo.Repository;

import com.example.demo.Model.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PacienteRepository extends JpaRepository<Paciente, Long> {
    // ✨ NOVA FUNÇÃO: Procura um paciente na base de dados usando o CPF
    Optional<Paciente> findByCpf(String cpf);
}