package com.example.demo.Repository;

import com.example.demo.Model.Funcionario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface FuncionarioRepository extends JpaRepository<Funcionario, Long> {

    // Valida login cruzando matrícula (ID) com senha no banco
    Optional<Funcionario> findByIdAndSenha(Long id, String senha);
}