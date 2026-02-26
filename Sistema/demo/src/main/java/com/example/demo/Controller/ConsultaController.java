package com.example.demo.Controller;

import com.example.demo.Model.Consulta;
import com.example.demo.Model.PreAgendamento;
import com.example.demo.Repository.PreAgendamentoRepository;
import com.example.demo.Service.ConsultaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/consultas")
@CrossOrigin(origins = "*")
public class ConsultaController {

    @Autowired
    private ConsultaService consultaService;

    @Autowired
    private PreAgendamentoRepository preAgendamentoRepository;

    @PostMapping("/agendar")
    public ResponseEntity<Consulta> agendar(@RequestBody Consulta consulta) {
        try {
            Consulta consultaSalva = consultaService.realizarAgendamento(consulta);
            return ResponseEntity.ok(consultaSalva);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ✨ ROTA 1: Para o React procurar o CPF e mostrar o banner verde
    @GetMapping("/whatsapp/pre-agendamento/{cpf}")
    public ResponseEntity<PreAgendamento> buscarPreAgendamento(@PathVariable String cpf) {
        Optional<PreAgendamento> preOpt = preAgendamentoRepository.findFirstByCpfAndStatusOrderByIdDesc(cpf, "PENDENTE");

        if(preOpt.isPresent()) {
            return ResponseEntity.ok(preOpt.get());
        }
        return ResponseEntity.notFound().build();
    }

    // ✨ ROTA 2: Para o React dar baixa no WhatsApp silenciosamente após cadastrar
    @PutMapping("/whatsapp/pre-agendamento/{cpf}/concluir")
    public ResponseEntity<Void> concluirPreAgendamento(@PathVariable String cpf) {
        Optional<PreAgendamento> preOpt = preAgendamentoRepository.findFirstByCpfAndStatusOrderByIdDesc(cpf, "PENDENTE");

        if(preOpt.isPresent()) {
            PreAgendamento pre = preOpt.get();
            pre.setStatus("CONCLUIDO");
            preAgendamentoRepository.save(pre);
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/fila")
    public ResponseEntity<List<Consulta>> listarFila() {
        return ResponseEntity.ok(consultaService.buscarFila());
    }

    @GetMapping("/historico")
    public ResponseEntity<List<Consulta>> listarHistorico() {
        return ResponseEntity.ok(consultaService.buscarHistorico());
    }

    @PutMapping("/{id}/concluir")
    public ResponseEntity<Void> concluirAtendimento(@PathVariable Long id, @RequestBody(required = false) String observacoes) {
        consultaService.concluirAtendimento(id, observacoes);
        return ResponseEntity.noContent().build();
    }
}