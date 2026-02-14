package com.example.demo.Service;

import com.example.demo.Model.Consulta;
import com.example.demo.Repository.ConsultaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class ConsultaService {

    @Autowired
    private ConsultaRepository consultaRepository;

    private final AtomicInteger contS = new AtomicInteger(1);
    private final AtomicInteger contP = new AtomicInteger(1);
    private final AtomicInteger contU = new AtomicInteger(1);
    private final List<String> consultoriosHosp = List.of("01", "02", "03", "04", "05");

    public Consulta realizarAgendamento(Consulta consulta) {
        consulta.setConsultorio(definirMelhorConsultorio());
        String prefixo = consulta.getPrioridade();
        int numero = prefixo.equals("U") ? contU.getAndIncrement() :
                prefixo.equals("P") ? contP.getAndIncrement() : contS.getAndIncrement();

        consulta.setSenha(String.format("%s-%03d", prefixo, numero));
        consulta.setStatus("AGUARDANDO");
        consulta.setDataHora(LocalDateTime.now());
        return consultaRepository.save(consulta);
    }

    private String definirMelhorConsultorio() {
        String melhor = consultoriosHosp.get(0);
        long menorFila = Long.MAX_VALUE;
        for (String c : consultoriosHosp) {
            long totalAguardando = consultaRepository.countByConsultorioAndStatus(c, "AGUARDANDO");
            if (totalAguardando < menorFila) {
                menorFila = totalAguardando;
                melhor = c;
            }
        }
        return melhor;
    }

    public List<Consulta> buscarFila() {
        return consultaRepository.findByStatusOrderByIdDesc("AGUARDANDO").stream()
                .sorted((c1, c2) -> {
                    int p1 = c1.getPrioridade().equals("U") ? 3 : c1.getPrioridade().equals("P") ? 2 : 1;
                    int p2 = c2.getPrioridade().equals("U") ? 3 : c2.getPrioridade().equals("P") ? 2 : 1;
                    if (p1 != p2) return Integer.compare(p2, p1);
                    return c1.getDataHora().compareTo(c2.getDataHora());
                }).collect(Collectors.toList());
    }

    public List<Consulta> buscarHistorico() {
        return consultaRepository.findByStatusOrderByIdDesc("CONCLUIDO");
    }

    public void concluirAtendimento(Long id) {
        Consulta c = consultaRepository.findById(id).orElseThrow();
        c.setStatus("CONCLUIDO");
        c.setDataHoraConclusao(LocalDateTime.now());
        consultaRepository.save(c);
    }
}