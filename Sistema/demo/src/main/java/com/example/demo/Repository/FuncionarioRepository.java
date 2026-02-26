package com.example.demo.Repository;

import com.example.demo.Model.Funcionario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional; // ✨ Não esqueça desta importação!

@Repository
public interface FuncionarioRepository extends JpaRepository<Funcionario, Long> {

    // ✨ NOVA FUNÇÃO: Busca o funcionário cruzando a matrícula (ID) com a senha no momento do Login
    Optional<Funcionario> findByIdAndSenha(Long id, String senha);
}