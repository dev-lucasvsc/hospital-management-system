package com.example.demo.Controller;

import com.example.demo.Model.Consulta;
import com.example.demo.Model.PreAgendamento;
import com.example.demo.Model.StatusPreAgendamento;
import com.example.demo.Repository.PreAgendamentoRepository;
import com.example.demo.Service.ConsultaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/consultas")
@CrossOrigin(origins = "*")
public class ConsultaController {

    @Autowired private ConsultaService consultaService;
    @Autowired private PreAgendamentoRepository preAgendamentoRepository;

    @PostMapping("/agendar")
    public ResponseEntity<Consulta> agendar(@RequestBody Consulta consulta) {
        try {
            return ResponseEntity.ok(consultaService.realizarAgendamento(consulta));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /** Fila global — apenas AGUARDANDO, sem consultório, ordenada por prioridade */
    @GetMapping("/fila")
    public ResponseEntity<List<Consulta>> listarFilaGlobal() {
        return ResponseEntity.ok(consultaService.buscarFilaGlobal());
    }

    @GetMapping("/fila/{consultorio}")
    public ResponseEntity<List<Consulta>> listarFilaPorConsultorio(@PathVariable String consultorio) {
        return ResponseEntity.ok(consultaService.buscarFilaPorConsultorio(consultorio));
    }

    /**
     * Médico chama o próximo da fila global para seu consultório.
     * Retorna a consulta com status EM_ATENDIMENTO e consultório atribuído.
     */
    @PostMapping("/chamar/{consultorio}")
    public ResponseEntity<Consulta> chamarProximo(@PathVariable String consultorio) {
        try {
            return ResponseEntity.ok(consultaService.chamarProximo(consultorio));
        } catch (RuntimeException e) {
            if ("FILA_VAZIA".equals(e.getMessage())) {
                return ResponseEntity.noContent().build(); // 204 — fila vazia
            }
            return ResponseEntity.internalServerError().build();
        }
    }

    /** Retorna o paciente atualmente em atendimento em um consultório */
    @GetMapping("/em-atendimento/{consultorio}")
    public ResponseEntity<Consulta> emAtendimento(@PathVariable String consultorio) {
        return consultaService.buscarEmAtendimento(consultorio)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /** Retorna todos os pacientes em atendimento (todos os consultórios) — usado pelo Monitor TV */
    @GetMapping("/em-atendimento-todos")
    public ResponseEntity<List<Consulta>> emAtendimentoTodos() {
        return ResponseEntity.ok(consultaService.buscarTodosEmAtendimento());
    }

    @GetMapping("/historico")
    public ResponseEntity<List<Consulta>> listarHistorico() {
        return ResponseEntity.ok(consultaService.buscarHistorico());
    }

    @GetMapping("/historico/{cpf}")
    public ResponseEntity<List<Consulta>> listarHistoricoPorCpf(@PathVariable String cpf) {
        return ResponseEntity.ok(consultaService.buscarHistoricoPorCpf(cpf));
    }

    @PutMapping("/{id}/concluir")
    public ResponseEntity<Void> concluirAtendimento(
            @PathVariable Long id,
            @RequestBody(required = false) String observacoes) {
        try {
            consultaService.concluirAtendimento(id, observacoes);
            System.out.printf("[CONTROLLER] thread=%s concluiu consulta id=%d%n",
                    Thread.currentThread().getName(), id);
            return ResponseEntity.noContent().build();
        } catch (ObjectOptimisticLockingFailureException e) {
            System.out.printf("[CONTROLLER] CONFLITO DETECTADO thread=%s consulta id=%d — retornando 409%n",
                    Thread.currentThread().getName(), id);
            return ResponseEntity.status(409).build();
        }
    }

    @GetMapping("/whatsapp/pre-agendamento/{cpf}")
    public ResponseEntity<PreAgendamento> buscarPreAgendamento(@PathVariable String cpf) {
        Optional<PreAgendamento> pre = preAgendamentoRepository
                .findFirstByCpfAndStatusOrderByIdDesc(cpf, StatusPreAgendamento.CONCLUIDO);
        return pre.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/whatsapp/pre-agendamento/{cpf}/concluir")
    public ResponseEntity<Void> concluirPreAgendamento(@PathVariable String cpf) {
        preAgendamentoRepository
                .findFirstByCpfAndStatusOrderByIdDesc(cpf, StatusPreAgendamento.CONCLUIDO)
                .ifPresent(preAgendamentoRepository::save);
        return ResponseEntity.ok().build();
    }
}