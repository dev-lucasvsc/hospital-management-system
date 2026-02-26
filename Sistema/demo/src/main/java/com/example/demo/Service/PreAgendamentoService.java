package com.example.demo.Service;

import com.example.demo.Model.PreAgendamento;
import com.example.demo.Repository.PreAgendamentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class PreAgendamentoService {

    @Autowired
    private PreAgendamentoRepository preAgendamentoRepository;

    public String processarMensagem(String telefone, String mensagem) {
        // Busca se já existe um atendimento em curso para este número
        Optional<PreAgendamento> atual = preAgendamentoRepository.findByTelefoneAndStatusNot(telefone, "CONCLUIDO");

        if (atual.isEmpty()) {
            return iniciarNovoAtendimento(telefone);
        }

        return continuarAtendimento(atual.get(), mensagem);
    }

    private String iniciarNovoAtendimento(String telefone) {
        PreAgendamento novo = new PreAgendamento();
        novo.setTelefone(telefone);
        novo.setStatus("AGUARDANDO_NOME");
        preAgendamentoRepository.save(novo);
        return "Olá! Sou o assistente virtual do hospital. Para começar, qual o seu nome completo?";
    }

    private String continuarAtendimento(PreAgendamento agendamento, String mensagem) {
        switch (agendamento.getStatus()) {
            case "AGUARDANDO_NOME":
                agendamento.setNome(mensagem);
                agendamento.setStatus("AGUARDANDO_CPF");
                preAgendamentoRepository.save(agendamento);
                return "Obrigado, " + mensagem + ". Agora, por favor, digite o seu CPF (apenas números):";

            case "AGUARDANDO_CPF":
                agendamento.setCpf(mensagem);
                agendamento.setStatus("AGUARDANDO_SINTOMAS");
                preAgendamentoRepository.save(agendamento);
                return "Recebi o seu CPF. O que você está sentindo no momento? (Descreva brevemente seus sintomas)";

            case "AGUARDANDO_SINTOMAS":
                agendamento.setSintomas(mensagem);
                agendamento.setStatus("CONCLUIDO");
                preAgendamentoRepository.save(agendamento);
                return "Triagem realizada com sucesso! Por favor, dirija-se à recepção e informe o seu nome. Estamos à sua espera.";

            default:
                return "Seu pré-agendamento já foi concluído. Procure a recepção no hospital.";
        }
    }
}