package com.example.demo.Service;

import com.example.demo.Model.LogAtendimento;
import com.example.demo.Repository.LogAtendimentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
public class LogService {

    @Autowired
    private LogAtendimentoRepository logRepository;

    @Async("taskExecutor")
    public CompletableFuture<Void> registrarLog(String tipoEvento, String descricao, String usuario) {
        try {
            LogAtendimento log = new LogAtendimento();
            log.setTipoEvento(tipoEvento);
            log.setDescricao(descricao);
            log.setUsuarioResponsavel(usuario);
            logRepository.save(log);

            System.out.printf("[LOG ASYNC] thread=%s tipo=%s desc=%s%n",
                    Thread.currentThread().getName(), tipoEvento, descricao);

        } catch (Exception e) {
            System.err.println("[LOG ASYNC] Erro ao registrar log: " + e.getMessage());
        }
        return CompletableFuture.completedFuture(null);
    }

    /**
     * Versão simplificada sem usuário (para eventos de sistema).
     */
    @Async("taskExecutor")
    public CompletableFuture<Void> registrarLog(String tipoEvento, String descricao) {
        return registrarLog(tipoEvento, descricao, "SISTEMA");
    }
}