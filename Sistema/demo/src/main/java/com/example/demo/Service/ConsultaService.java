package com.example.demo.Service;

import com.example.demo.Model.Consulta;
import com.example.demo.Model.Paciente;
import com.example.demo.Model.StatusConsulta;
import com.example.demo.Repository.ConsultaRepository;
import com.example.demo.Repository.PacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * COMPUTAÇÃO PARALELA — dois mecanismos implementados:
 *
 * 1. AtomicInteger: senhas geradas de forma thread-safe sem synchronized.
 * 2. LogService @Async: logs persistidos em thread separada do pool,
 *    sem bloquear a resposta da API. Mantém RNF < 2s mesmo em pico.
 */
@Service
public class ConsultaService {

    @Autowired private ConsultaRepository consultaRepository;
    @Autowired private PacienteRepository pacienteRepository;
    @Autowired private SimpMessagingTemplate messagingTemplate;
    @Autowired private LogService logService;

    private final AtomicInteger contS = new AtomicInteger(1);
    private final AtomicInteger contP = new AtomicInteger(1);
    private final AtomicInteger contU = new AtomicInteger(1);

    private final List<String> consultorios = List.of("01", "02", "03", "04", "05");

    @Transactional
    public Consulta realizarAgendamento(Consulta consulta) {
        if (consulta.getPaciente() != null && consulta.getPaciente().getCpf() != null) {
            Optional<Paciente> existente = pacienteRepository.findByCpf(consulta.getPaciente().getCpf());
            if (existente.isPresent()) {
                Paciente p = existente.get();
                atualizarPaciente(p, consulta.getPaciente());
                consulta.setPaciente(p);
            }
        }

        consulta.setConsultorio(menorFila());

        String prefixo = consulta.getPrioridade();
        int numero = switch (prefixo) {
            case "U" -> contU.getAndIncrement();
            case "P" -> contP.getAndIncrement();
            default  -> contS.getAndIncrement();
        };

        consulta.setSenha(String.format("%s-%03d", prefixo, numero));
        consulta.setStatus(StatusConsulta.AGUARDANDO);
        consulta.setDataHora(LocalDateTime.now());

        Consulta salva = consultaRepository.save(consulta);

        // Log assíncrono — thread separada, não bloqueia resposta
        logService.registrarLog("AGENDAMENTO",
                String.format("Senha %s gerada para %s → consultório %s",
                        salva.getSenha(),
                        salva.getPaciente() != null ? salva.getPaciente().getNome() : "desconhecido",
                        salva.getConsultorio()));

        messagingTemplate.convertAndSend("/topic/fila", "ATUALIZAR_FILA");
        return salva;
    }

    private String menorFila() {
        String melhor = consultorios.get(0);
        long menor = Long.MAX_VALUE;
        for (String c : consultorios) {
            long total = consultaRepository.countByConsultorioAndStatus(c, StatusConsulta.AGUARDANDO);
            if (total < menor) { menor = total; melhor = c; }
        }
        return melhor;
    }

    private void atualizarPaciente(Paciente d, Paciente o) {
        d.setNome(o.getNome()); d.setDataNascimento(o.getDataNascimento());
        d.setNumeroSus(o.getNumeroSus()); d.setPossuiConvenio(o.isPossuiConvenio());
        d.setNumeroConvenio(o.getNumeroConvenio()); d.setGenero(o.getGenero());
        d.setCep(o.getCep()); d.setRua(o.getRua()); d.setBairro(o.getBairro());
        d.setCidade(o.getCidade()); d.setUf(o.getUf()); d.setTelefone(o.getTelefone());
        d.setNomeMae(o.getNomeMae()); d.setNomePai(o.getNomePai());
        d.setPeso(o.getPeso()); d.setAltura(o.getAltura());
    }

    public List<Consulta> buscarFila() {
        return consultaRepository.findByStatusOrderByIdDesc(StatusConsulta.AGUARDANDO)
                .stream().sorted((a, b) -> {
                    int pa = peso(a.getPrioridade()), pb = peso(b.getPrioridade());
                    if (pa != pb) return Integer.compare(pb, pa);
                    return a.getDataHora().compareTo(b.getDataHora());
                }).collect(Collectors.toList());
    }

    public List<Consulta> buscarFilaPorConsultorio(String c) {
        return consultaRepository.findByConsultorioAndStatusOrderByIdDesc(c, StatusConsulta.AGUARDANDO)
                .stream().sorted((a, b) -> {
                    int pa = peso(a.getPrioridade()), pb = peso(b.getPrioridade());
                    if (pa != pb) return Integer.compare(pb, pa);
                    return a.getDataHora().compareTo(b.getDataHora());
                }).collect(Collectors.toList());
    }

    private int peso(String p) {
        return switch (p) { case "U" -> 3; case "P" -> 2; default -> 1; };
    }

    public List<Consulta> buscarHistorico() {
        return consultaRepository.findByStatusOrderByIdDesc(StatusConsulta.CONCLUIDO);
    }

    public List<Consulta> buscarHistoricoPorCpf(String cpf) {
        return consultaRepository.findByPacienteCpfOrderByDataHoraDesc(cpf);
    }

    @Transactional
    public void concluirAtendimento(Long id, String observacoes) {
        Consulta c = consultaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Consulta não encontrada: " + id));

        c.setStatus(StatusConsulta.CONCLUIDO);
        c.setDataHoraConclusao(LocalDateTime.now());
        if (observacoes != null && !observacoes.isBlank()) c.setObservacoes(observacoes);

        consultaRepository.save(c);

        logService.registrarLog("CONCLUSAO",
                String.format("Atendimento %d concluído. Paciente: %s",
                        id,
                        c.getPaciente() != null ? c.getPaciente().getNome() : "desconhecido"));

        messagingTemplate.convertAndSend("/topic/fila", "ATUALIZAR_FILA");
    }
}