package com.example.demo.Service;

import com.example.demo.Model.PreAgendamento;
import com.example.demo.Model.StatusPreAgendamento;
import com.example.demo.Repository.PreAgendamentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Máquina de estados do bot WhatsApp.
 * Fluxo: PENDENTE → AGUARDANDO_NOME → AGUARDANDO_CPF → AGUARDANDO_SINTOMAS → CONCLUIDO
 */
@Service
public class PreAgendamentoService {

    @Autowired private PreAgendamentoRepository preAgendamentoRepository;
    @Autowired private LogService logService;

    @Transactional
    public String processarMensagem(String telefone, String mensagem) {
        Optional<PreAgendamento> atual = preAgendamentoRepository
                .findByTelefoneAndStatusNot(telefone, StatusPreAgendamento.CONCLUIDO);

        if (atual.isEmpty()) return iniciar(telefone);
        return continuar(atual.get(), mensagem);
    }

    private String iniciar(String telefone) {
        PreAgendamento novo = new PreAgendamento();
        novo.setTelefone(telefone);
        novo.setStatus(StatusPreAgendamento.AGUARDANDO_NOME);
        preAgendamentoRepository.save(novo);
        logService.registrarLog("PRE_AGENDAMENTO", "Novo pré-agendamento iniciado: " + telefone);
        return "Olá! Sou o assistente virtual do hospital. Para começar, qual o seu nome completo?";
    }

    private String continuar(PreAgendamento ag, String mensagem) {
        return switch (ag.getStatus()) {
            case AGUARDANDO_NOME -> {
                ag.setNome(mensagem);
                ag.setStatus(StatusPreAgendamento.AGUARDANDO_CPF);
                preAgendamentoRepository.save(ag);
                yield "Obrigado, " + mensagem + ". Agora, por favor, digite o seu CPF (apenas números):";
            }
            case AGUARDANDO_CPF -> {
                ag.setCpf(mensagem);
                ag.setStatus(StatusPreAgendamento.AGUARDANDO_SINTOMAS);
                preAgendamentoRepository.save(ag);
                yield "Recebi o seu CPF. O que você está sentindo no momento?";
            }
            case AGUARDANDO_SINTOMAS -> {
                ag.setSintomas(mensagem);
                ag.setStatus(StatusPreAgendamento.CONCLUIDO);
                preAgendamentoRepository.save(ag);
                logService.registrarLog("PRE_AGENDAMENTO",
                        "Pré-agendamento concluído via WhatsApp: " + ag.getNome());
                yield "Triagem realizada! Dirija-se à recepção e informe seu nome. Estamos à sua espera.";
            }
            default -> "Seu pré-agendamento já foi concluído. Procure a recepção no hospital.";
        };
    }
}