package com.example.demo.Service;

import com.example.demo.Model.Consulta;
import com.example.demo.Model.Paciente;
import com.example.demo.Model.StatusConsulta;
import com.example.demo.Repository.ConsultaRepository;
import com.example.demo.Repository.PacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class ConsultaService {

    @Autowired private ConsultaRepository consultaRepository;
    @Autowired private PacienteRepository pacienteRepository;
    @Autowired private StringRedisTemplate redisTemplate;
    @Autowired private LogService logService;

    private final AtomicInteger contS = new AtomicInteger(1);
    private final AtomicInteger contP = new AtomicInteger(1);
    private final AtomicInteger contU = new AtomicInteger(1);

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

        // Consultório não definido no agendamento — atribuído só na chamada
        consulta.setConsultorio(null);

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

        logService.registrarLog("AGENDAMENTO",
                String.format("Senha %s gerada para %s — aguardando na fila global",
                        salva.getSenha(),
                        salva.getPaciente() != null ? salva.getPaciente().getNome() : "desconhecido"));

        redisTemplate.opsForList().leftPush("fila:notificacoes", "ATUALIZAR_FILA:" + salva.getSenha());
        System.out.printf("[SERVICE] thread=%s senha=%s publicada na fila Redis%n",
                Thread.currentThread().getName(), salva.getSenha());

        return salva;
    }

    /**
     * Médico chama o próximo da fila global.
     * O consultório é atribuído aqui — não no agendamento.
     */
    @Transactional
    public Consulta chamarProximo(String consultorio) {
        List<Consulta> fila = buscarFilaGlobal();
        if (fila.isEmpty()) throw new RuntimeException("FILA_VAZIA");

        Consulta proximo = fila.get(0);
        proximo.setConsultorio(consultorio);
        proximo.setStatus(StatusConsulta.EM_ATENDIMENTO);

        Consulta salvo = consultaRepository.save(proximo);

        logService.registrarLog("CHAMADA",
                String.format("Senha %s chamada para consultório %s — %s",
                        salvo.getSenha(), consultorio,
                        salvo.getPaciente() != null ? salvo.getPaciente().getNome() : "desconhecido"));

        redisTemplate.opsForList().leftPush("fila:notificacoes", "ATUALIZAR_FILA:CHAMADA");
        System.out.printf("[SERVICE] thread=%s senha=%s direcionada para consultório %s%n",
                Thread.currentThread().getName(), salvo.getSenha(), consultorio);

        return salvo;
    }

    public List<Consulta> buscarFilaGlobal() {
        return consultaRepository.findByStatusOrderByIdAsc(StatusConsulta.AGUARDANDO)
                .stream().sorted((a, b) -> {
                    int pa = peso(a.getPrioridade()), pb = peso(b.getPrioridade());
                    if (pa != pb) return Integer.compare(pb, pa);
                    return a.getDataHora().compareTo(b.getDataHora());
                }).collect(Collectors.toList());
    }

    public Optional<Consulta> buscarEmAtendimento(String consultorio) {
        return consultaRepository
                .findByConsultorioAndStatus(consultorio, StatusConsulta.EM_ATENDIMENTO)
                .stream().findFirst();
    }

    public List<Consulta> buscarTodosEmAtendimento() {
        return consultaRepository.findByStatusOrderByIdDesc(StatusConsulta.EM_ATENDIMENTO);
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
                        id, c.getPaciente() != null ? c.getPaciente().getNome() : "desconhecido"));

        redisTemplate.opsForList().leftPush("fila:notificacoes", "ATUALIZAR_FILA:CONCLUSAO");
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
}