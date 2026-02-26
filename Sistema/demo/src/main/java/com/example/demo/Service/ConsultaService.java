package com.example.demo.Service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.example.demo.Model.Consulta;
import com.example.demo.Model.Paciente;
import com.example.demo.Repository.ConsultaRepository;
import com.example.demo.Repository.PacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class ConsultaService {

    @Autowired
    private ConsultaRepository consultaRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final AtomicInteger contS = new AtomicInteger(1);
    private final AtomicInteger contP = new AtomicInteger(1);
    private final AtomicInteger contU = new AtomicInteger(1);
    private final List<String> consultoriosHosp = List.of("01", "02", "03", "04", "05");

    public Consulta realizarAgendamento(Consulta consulta) {
        if (consulta.getPaciente() != null && consulta.getPaciente().getCpf() != null) {
            Optional<Paciente> pacienteExistente = pacienteRepository.findByCpf(consulta.getPaciente().getCpf());

            if (pacienteExistente.isPresent()) {
                Paciente p = pacienteExistente.get();
                p.setNome(consulta.getPaciente().getNome());
                p.setDataNascimento(consulta.getPaciente().getDataNascimento());
                p.setNumeroSus(consulta.getPaciente().getNumeroSus());
                p.setPossuiConvenio(consulta.getPaciente().isPossuiConvenio());
                p.setNumeroConvenio(consulta.getPaciente().getNumeroConvenio());
                p.setGenero(consulta.getPaciente().getGenero());

                // Endereço
                p.setCep(consulta.getPaciente().getCep());
                p.setRua(consulta.getPaciente().getRua());
                p.setBairro(consulta.getPaciente().getBairro());
                p.setCidade(consulta.getPaciente().getCidade());
                p.setUf(consulta.getPaciente().getUf());

                // Dados Complementares
                p.setTelefone(consulta.getPaciente().getTelefone());
                p.setNomeMae(consulta.getPaciente().getNomeMae());
                p.setNomePai(consulta.getPaciente().getNomePai());
                p.setPeso(consulta.getPaciente().getPeso());
                p.setAltura(consulta.getPaciente().getAltura());

                consulta.setPaciente(p);
            }
        }

        consulta.setConsultorio(definirMelhorConsultorio());
        String prefixo = consulta.getPrioridade();
        int numero = prefixo.equals("U") ? contU.getAndIncrement() :
                prefixo.equals("P") ? contP.getAndIncrement() : contS.getAndIncrement();

        consulta.setSenha(String.format("%s-%03d", prefixo, numero));
        consulta.setStatus("AGUARDANDO");
        consulta.setDataHora(LocalDateTime.now());

        Consulta consultaSalva = consultaRepository.save(consulta);

        // Avisa os painéis via WebSocket
        messagingTemplate.convertAndSend("/topic/fila", "ATUALIZAR_FILA");

        return consultaSalva;
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

    public List<Consulta> buscarFilaPorConsultorio(String consultorio) {
        return consultaRepository.findByConsultorioAndStatusOrderByIdDesc(consultorio, "AGUARDANDO").stream()
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

    // ✨ CORREÇÃO DAQUI (agora recebe "String observacoes")
    public void concluirAtendimento(Long id, String observacoes) {
        Consulta c = consultaRepository.findById(id).orElseThrow();
        c.setStatus("CONCLUIDO");
        c.setDataHoraConclusao(LocalDateTime.now());

        if (observacoes != null && !observacoes.isEmpty()) {
            c.setObservacoes(observacoes);
        }

        consultaRepository.save(c);
        messagingTemplate.convertAndSend("/topic/fila", "ATUALIZAR_FILA");
    }

    public List<Consulta> buscarHistoricoPorCpf(String cpf) {
        return consultaRepository.findByPacienteCpfOrderByDataHoraDesc(cpf);
    }
}