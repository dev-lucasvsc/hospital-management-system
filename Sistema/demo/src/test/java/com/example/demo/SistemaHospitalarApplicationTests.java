package com.example.demo;

import com.example.demo.Model.*;
import com.example.demo.Repository.*;
import com.example.demo.Service.ConsultaService;
import com.example.demo.Service.LogService;
import com.example.demo.Service.PreAgendamentoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;


@ExtendWith(MockitoExtension.class)
class SistemaHospitalarApplicationTests {

	// ── ConsultaService ────────────────────────────────────────────────────
	@Mock private ConsultaRepository consultaRepository;
	@Mock private PacienteRepository pacienteRepository;
	@Mock private SimpMessagingTemplate messagingTemplate;
	@Mock private LogService logService;

	@InjectMocks private ConsultaService consultaService;

	// ── PreAgendamentoService ──────────────────────────────────────────────
	@Mock private PreAgendamentoRepository preAgendamentoRepository;

	@InjectMocks private PreAgendamentoService preAgendamentoService;

	@BeforeEach
	void configurarMocks() {
		// LogService sempre retorna CompletableFuture vazio (não bloqueia os testes)
		when(logService.registrarLog(anyString(), anyString()))
				.thenReturn(CompletableFuture.completedFuture(null));
		when(logService.registrarLog(anyString(), anyString(), anyString()))
				.thenReturn(CompletableFuture.completedFuture(null));
	}

	// ── Testes de contexto ─────────────────────────────────────────────────

	@Test
	@DisplayName("Contexto Spring inicializa sem erros")
	void contextLoads() {
		assertNotNull(consultaService);
		assertNotNull(preAgendamentoService);
	}

	// ── Testes de geração de senha ─────────────────────────────────────────

	@Test
	@DisplayName("Agendamento Normal gera senha com prefixo S")
	void agendamentoNormalGerarSenhaComPrefixoS() {
		Consulta consulta = criarConsulta("S");
		when(consultaRepository.countByConsultorioAndStatus(anyString(), any())).thenReturn(0L);
		when(consultaRepository.save(any())).thenAnswer(i -> i.getArgument(0));

		Consulta resultado = consultaService.realizarAgendamento(consulta);

		assertTrue(resultado.getSenha().startsWith("S-"), "Senha deve começar com S-");
	}

	@Test
	@DisplayName("Agendamento Preferencial gera senha com prefixo P")
	void agendamentoPreferencialGerarSenhaComPrefixoP() {
		Consulta consulta = criarConsulta("P");
		when(consultaRepository.countByConsultorioAndStatus(anyString(), any())).thenReturn(0L);
		when(consultaRepository.save(any())).thenAnswer(i -> i.getArgument(0));

		Consulta resultado = consultaService.realizarAgendamento(consulta);

		assertTrue(resultado.getSenha().startsWith("P-"), "Senha deve começar com P-");
	}

	@Test
	@DisplayName("Agendamento Urgente gera senha com prefixo U")
	void agendamentoUrgenteGerarSenhaComPrefixoU() {
		Consulta consulta = criarConsulta("U");
		when(consultaRepository.countByConsultorioAndStatus(anyString(), any())).thenReturn(0L);
		when(consultaRepository.save(any())).thenAnswer(i -> i.getArgument(0));

		Consulta resultado = consultaService.realizarAgendamento(consulta);

		assertTrue(resultado.getSenha().startsWith("U-"), "Senha deve começar com U-");
	}

	@Test
	@DisplayName("Senhas geradas são únicas e incrementais")
	void senhasGeradasSaoUnicasEIncrementais() {
		when(consultaRepository.countByConsultorioAndStatus(anyString(), any())).thenReturn(0L);
		when(consultaRepository.save(any())).thenAnswer(i -> i.getArgument(0));

		Consulta c1 = consultaService.realizarAgendamento(criarConsulta("S"));
		Consulta c2 = consultaService.realizarAgendamento(criarConsulta("S"));

		assertNotEquals(c1.getSenha(), c2.getSenha(), "Senhas não podem ser iguais");
	}

	// ── Testes de status ───────────────────────────────────────────────────

	@Test
	@DisplayName("Agendamento define status AGUARDANDO")
	void agendamentoDefineStatusAguardando() {
		Consulta consulta = criarConsulta("S");
		when(consultaRepository.countByConsultorioAndStatus(anyString(), any())).thenReturn(0L);
		when(consultaRepository.save(any())).thenAnswer(i -> i.getArgument(0));

		Consulta resultado = consultaService.realizarAgendamento(consulta);

		assertEquals(StatusConsulta.AGUARDANDO, resultado.getStatus());
	}

	@Test
	@DisplayName("ConcluirAtendimento define status CONCLUIDO")
	void concluirAtendimentoDefineStatusConcluido() {
		Consulta consulta = criarConsulta("S");
		consulta.setId(1L);
		consulta.setStatus(StatusConsulta.AGUARDANDO);
		consulta.setDataHora(LocalDateTime.now());
		when(consultaRepository.findById(1L)).thenReturn(Optional.of(consulta));
		when(consultaRepository.save(any())).thenAnswer(i -> i.getArgument(0));

		consultaService.concluirAtendimento(1L, "Paciente estável.");

		assertEquals(StatusConsulta.CONCLUIDO, consulta.getStatus());
		assertNotNull(consulta.getDataHoraConclusao());
	}

	// ── Testes de distribuição de consultórios ─────────────────────────────

	@Test
	@DisplayName("Paciente é direcionado ao consultório com menor fila")
	void pacienteDirecionadoAoConsultorioComMenorFila() {
		// Sala 03 tem a menor fila
		when(consultaRepository.countByConsultorioAndStatus(eq("01"), any())).thenReturn(5L);
		when(consultaRepository.countByConsultorioAndStatus(eq("02"), any())).thenReturn(3L);
		when(consultaRepository.countByConsultorioAndStatus(eq("03"), any())).thenReturn(1L);
		when(consultaRepository.countByConsultorioAndStatus(eq("04"), any())).thenReturn(4L);
		when(consultaRepository.countByConsultorioAndStatus(eq("05"), any())).thenReturn(2L);
		when(consultaRepository.save(any())).thenAnswer(i -> i.getArgument(0));

		Consulta resultado = consultaService.realizarAgendamento(criarConsulta("S"));

		assertEquals("03", resultado.getConsultorio(),
				"Deve direcionar para sala 03 (menor fila)");
	}

	// ── Testes de ordenação por prioridade ─────────────────────────────────

	@Test
	@DisplayName("Fila ordena Urgente > Preferencial > Normal")
	void filaOrdenadaPorPrioridade() {
		Consulta cS = criarConsultaComStatus("S", StatusConsulta.AGUARDANDO, LocalDateTime.now());
		Consulta cP = criarConsultaComStatus("P", StatusConsulta.AGUARDANDO, LocalDateTime.now());
		Consulta cU = criarConsultaComStatus("U", StatusConsulta.AGUARDANDO, LocalDateTime.now());

		when(consultaRepository.findByStatusOrderByIdDesc(StatusConsulta.AGUARDANDO))
				.thenReturn(List.of(cS, cP, cU));

		List<Consulta> fila = consultaService.buscarFila();

		assertEquals("U", fila.get(0).getPrioridade(), "Urgente deve ser primeiro");
		assertEquals("P", fila.get(1).getPrioridade(), "Preferencial deve ser segundo");
		assertEquals("S", fila.get(2).getPrioridade(), "Normal deve ser terceiro");
	}

	// ── Testes PreAgendamentoService (máquina de estados WhatsApp) ─────────

	@Test
	@DisplayName("Novo número inicia fluxo com AGUARDANDO_NOME")
	void novoNumeroIniciaFluxo() {
		when(preAgendamentoRepository.findByTelefoneAndStatusNot(anyString(), any()))
				.thenReturn(Optional.empty());
		when(preAgendamentoRepository.save(any())).thenAnswer(i -> i.getArgument(0));

		String resposta = preAgendamentoService.processarMensagem("+5561999999999", "oi");

		assertTrue(resposta.toLowerCase().contains("nome"),
				"Bot deve pedir o nome no primeiro contato");
	}

	@Test
	@DisplayName("Estado AGUARDANDO_NOME salva nome e avança para AGUARDANDO_CPF")
	void estadoAguardandoNomeSalvaNomeEAvanca() {
		PreAgendamento ag = new PreAgendamento();
		ag.setStatus(StatusPreAgendamento.AGUARDANDO_NOME);
		ag.setTelefone("+5561999999999");

		when(preAgendamentoRepository.findByTelefoneAndStatusNot(anyString(), any()))
				.thenReturn(Optional.of(ag));
		when(preAgendamentoRepository.save(any())).thenAnswer(i -> i.getArgument(0));

		preAgendamentoService.processarMensagem("+5561999999999", "João Silva");

		assertEquals("João Silva", ag.getNome());
		assertEquals(StatusPreAgendamento.AGUARDANDO_CPF, ag.getStatus());
	}

	@Test
	@DisplayName("Estado AGUARDANDO_CPF salva CPF e avança para AGUARDANDO_SINTOMAS")
	void estadoAguardandoCpfSalvaCpfEAvanca() {
		PreAgendamento ag = new PreAgendamento();
		ag.setStatus(StatusPreAgendamento.AGUARDANDO_CPF);
		ag.setNome("João Silva");

		when(preAgendamentoRepository.findByTelefoneAndStatusNot(anyString(), any()))
				.thenReturn(Optional.of(ag));
		when(preAgendamentoRepository.save(any())).thenAnswer(i -> i.getArgument(0));

		preAgendamentoService.processarMensagem("+5561999999999", "12345678901");

		assertEquals("12345678901", ag.getCpf());
		assertEquals(StatusPreAgendamento.AGUARDANDO_SINTOMAS, ag.getStatus());
	}

	@Test
	@DisplayName("Estado AGUARDANDO_SINTOMAS conclui o pré-agendamento")
	void estadoAguardandoSintomasConclui() {
		PreAgendamento ag = new PreAgendamento();
		ag.setStatus(StatusPreAgendamento.AGUARDANDO_SINTOMAS);
		ag.setNome("João Silva");
		ag.setCpf("12345678901");

		when(preAgendamentoRepository.findByTelefoneAndStatusNot(anyString(), any()))
				.thenReturn(Optional.of(ag));
		when(preAgendamentoRepository.save(any())).thenAnswer(i -> i.getArgument(0));

		String resposta = preAgendamentoService.processarMensagem("+5561999999999", "Dor de cabeça");

		assertEquals("Dor de cabeça", ag.getSintomas());
		assertEquals(StatusPreAgendamento.CONCLUIDO, ag.getStatus());
		assertTrue(resposta.toLowerCase().contains("recepção"),
				"Mensagem final deve mencionar a recepção");
	}

	// ── Helpers ────────────────────────────────────────────────────────────

	private Consulta criarConsulta(String prioridade) {
		Consulta c = new Consulta();
		c.setPrioridade(prioridade);
		return c;
	}

	private Consulta criarConsultaComStatus(String prioridade, StatusConsulta status, LocalDateTime dataHora) {
		Consulta c = new Consulta();
		c.setPrioridade(prioridade);
		c.setStatus(status);
		c.setDataHora(dataHora);
		return c;
	}
}