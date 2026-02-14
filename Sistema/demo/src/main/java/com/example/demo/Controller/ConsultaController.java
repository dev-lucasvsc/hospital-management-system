package com.example.demo.Controller;

import com.example.demo.Model.Consulta;
import com.example.demo.Service.ConsultaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/consultas")
@CrossOrigin(origins = "*")
public class ConsultaController {

    @Autowired
    private ConsultaService consultaService;

    @PostMapping("/agendar")
    public ResponseEntity<Consulta> agendar(@RequestBody Consulta consulta) {
        try {
            Consulta consultaSalva = consultaService.realizarAgendamento(consulta);
            return ResponseEntity.ok(consultaSalva);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
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
    public ResponseEntity<Void> concluirAtendimento(@PathVariable Long id) {
        consultaService.concluirAtendimento(id);
        return ResponseEntity.noContent().build();
    }
}