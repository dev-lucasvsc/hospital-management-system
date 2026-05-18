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

    @GetMapping("/fila")
    public ResponseEntity<List<Consulta>> listarFila() {
        return ResponseEntity.ok(consultaService.buscarFila());
    }

    @GetMapping("/fila/{consultorio}")
    public ResponseEntity<List<Consulta>> listarFilaPorConsultorio(@PathVariable String consultorio) {
        return ResponseEntity.ok(consultaService.buscarFilaPorConsultorio(consultorio));
    }

    @GetMapping("/historico")
    public ResponseEntity<List<Consulta>> listarHistorico() {
        return ResponseEntity.ok(consultaService.buscarHistorico());
    }

    @GetMapping("/historico/{cpf}")
    public ResponseEntity<List<Consulta>> listarHistoricoPorCpf(@PathVariable String cpf) {
        return ResponseEntity.ok(consultaService.buscarHistoricoPorCpf(cpf));
    }

    /**
     * CONCORRÊNCIA — Optimistic Locking
     * Se dois médicos tentarem concluir o mesmo atendimento simultaneamente,
     * o segundo recebe HTTP 409 Conflict (conflito real, detectável nos logs).
     */
    @PutMapping("/{id}/concluir")
    public ResponseEntity<Void> concluirAtendimento(
            @PathVariable Long id,
            @RequestBody(required = false) String observacoes) {
        try {
            consultaService.concluirAtendimento(id, observacoes);
            System.out.printf("[CONTROLLER] thread=%s concluiu consulta id=%d%n",
                    Thread.currentThread().getName(), id);
            return ResponseEntity.noContent().build(); // 204 — sucesso

        } catch (ObjectOptimisticLockingFailureException e) {
            // Conflito real de concorrência detectado pelo Hibernate
            System.out.printf("[CONTROLLER] CONFLITO DETECTADO thread=%s consulta id=%d — retornando 409%n",
                    Thread.currentThread().getName(), id);
            return ResponseEntity.status(409).build(); // 409 Conflict
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