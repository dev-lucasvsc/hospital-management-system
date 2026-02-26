package com.example.demo.Controller;

import com.example.demo.Model.PreAgendamento;
import com.example.demo.Repository.PreAgendamentoRepository;
import com.example.demo.Service.PreAgendamentoService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/whatsapp")
@CrossOrigin("*")
public class WhatsAppWebhookController {

    @Autowired
    private PreAgendamentoService preAgendamentoService;

    @Autowired
    private PreAgendamentoRepository preAgendamentoRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    // 🔹 CONFIGURAÇÕES
    private static final String GRAPH_VERSION = "v19.0";
    private static final String PHONE_NUMBER_ID = "1009073248953161";
    private static final String VERIFY_TOKEN = "lucas_webhook_2026";

    // 🔐 TOKEN VEM DE VARIÁVEL DE AMBIENTE
    @Value("${WHATSAPP_TOKEN:}")
    private String token;

    private final String WHATSAPP_API_URL =
            "https://graph.facebook.com/" + GRAPH_VERSION + "/" + PHONE_NUMBER_ID + "/messages";

    // =========================
    // 🔹 Validação Webhook
    // =========================
    @GetMapping("/webhook")
    public ResponseEntity<String> validarWebhook(
            @RequestParam("hub.mode") String mode,
            @RequestParam("hub.verify_token") String token,
            @RequestParam("hub.challenge") String challenge) {

        System.out.println("🔍 Validando webhook - Mode: " + mode + ", Token: " + token);

        if ("subscribe".equals(mode) && VERIFY_TOKEN.equals(token)) {
            System.out.println("✅ Webhook validado com sucesso!");
            return ResponseEntity.ok(challenge);
        }

        System.out.println("❌ Falha na validação do webhook");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Token inválido");
    }

    // =========================
    // 🔹 Receber mensagem
    // =========================
    @PostMapping("/webhook")
    public ResponseEntity<Void> receberMensagem(@RequestBody String payload) {

        try {
            System.out.println("📩 Payload recebido: " + payload);

            JsonNode root = objectMapper.readTree(payload);

            // Verificar se é uma mensagem de texto ou status
            JsonNode entry = root.path("entry");
            if (!entry.isArray() || entry.isEmpty()) {
                return ResponseEntity.ok().build();
            }

            JsonNode changes = entry.get(0).path("changes");
            if (!changes.isArray() || changes.isEmpty()) {
                return ResponseEntity.ok().build();
            }

            JsonNode value = changes.get(0).path("value");

            // Verificar se é uma mensagem (não um status)
            JsonNode messages = value.path("messages");

            if (messages.isArray() && !messages.isEmpty()) {
                JsonNode message = messages.get(0);

                // Verificar se é mensagem de texto
                if (message.has("text")) {
                    String telefone = message.path("from").asText();
                    String texto = message.path("text").path("body").asText();
                    String messageId = message.path("id").asText();

                    System.out.println("📩 Recebido de: " + telefone);
                    System.out.println("💬 Texto: " + texto);
                    System.out.println("🆔 Message ID: " + messageId);

                    // Processar mensagem
                    String resposta = preAgendamentoService.processarMensagem(telefone, texto);

                    // Enviar resposta
                    enviarRespostaWhatsApp(telefone, resposta);
                } else {
                    System.out.println("⚠️ Mensagem não é texto: " + message);
                }
            } else {
                // Pode ser um status de entrega
                JsonNode statuses = value.path("statuses");
                if (statuses.isArray() && !statuses.isEmpty()) {
                    System.out.println("📊 Status update: " + statuses.get(0));
                }
            }

        } catch (Exception e) {
            System.err.println("❌ Erro ao processar webhook:");
            e.printStackTrace();
        }

        return ResponseEntity.ok().build();
    }

    // =========================
    // 🔹 Enviar resposta
    // =========================
    private void enviarRespostaWhatsApp(String telefone, String mensagem) {

        // Verificar se o token está configurado
        if (token == null || token.isEmpty()) {
            System.err.println("❌ TOKEN não configurado! Verifique a variável de ambiente WHATSAPP_TOKEN");
            System.err.println("💡 Dica: Configure no IntelliJ: Run > Edit Configurations > Environment variables");
            return;
        }

        try {
            // Formatar número para o padrão internacional
            String telefoneDestino = formatarNumeroWhatsApp(telefone);

            System.out.println("📞 Número original: " + telefone);
            System.out.println("📞 Número formatado: " + telefoneDestino);
            System.out.println("📝 Mensagem a enviar: " + mensagem);
            System.out.println("🔑 Token (primeiros 10 chars): " + token.substring(0, Math.min(10, token.length())) + "...");

            // Construir corpo da mensagem
            Map<String, Object> body = new HashMap<>();
            body.put("messaging_product", "whatsapp");
            body.put("recipient_type", "individual");
            body.put("to", telefoneDestino);
            body.put("type", "text");

            Map<String, String> text = new HashMap<>();
            text.put("body", mensagem);
            body.put("text", text);

            // Configurar headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            System.out.println("🚀 Enviando requisição para API Meta...");
            System.out.println("📤 URL: " + WHATSAPP_API_URL);
            System.out.println("📤 Body: " + objectMapper.writeValueAsString(body));

            // Enviar requisição
            ResponseEntity<String> response = restTemplate.postForEntity(WHATSAPP_API_URL, request, String.class);

            System.out.println("✅ Resposta da Meta - Status: " + response.getStatusCode());
            System.out.println("✅ Resposta da Meta - Body: " + response.getBody());

        } catch (HttpStatusCodeException e) {
            System.err.println("❌ ERRO META - Status: " + e.getStatusCode());
            System.err.println("❌ ERRO META - Headers: " + e.getResponseHeaders());
            System.err.println("❌ ERRO META - Body: " + e.getResponseBodyAsString());

            // Tratamento específico para cada tipo de erro (usando o valor do status code)
            int statusCode = e.getStatusCode().value();

            if (statusCode == 401) {
                System.err.println("🔑 Token inválido ou expirado! Gere um novo token no Meta Developers.");
            } else if (statusCode == 403) {
                System.err.println("🚫 Permissão negada. Verifique se o número de telefone está configurado corretamente.");
            } else if (statusCode == 404) {
                System.err.println("🔍 URL inválida. Verifique PHONE_NUMBER_ID e GRAPH_VERSION.");
            } else if (statusCode == 429) {
                System.err.println("⏳ Muitas requisições. Aguarde um momento e tente novamente.");
            } else {
                System.err.println("❌ Erro HTTP " + statusCode + ": " + e.getMessage());
            }

        } catch (Exception e) {
            System.err.println("❌ Erro inesperado ao enviar mensagem:");
            e.printStackTrace();
        }
    }

    // =========================
    // 🔹 Formatar número WhatsApp
    // =========================
    private String formatarNumeroWhatsApp(String telefone) {
        if (telefone == null || telefone.isEmpty()) {
            return telefone;
        }

        // Remover caracteres não numéricos
        String numeroLimpo = telefone.replaceAll("[^0-9]", "");

        // Se já começa com 55, manter como está (já está no formato internacional)
        if (numeroLimpo.startsWith("55")) {
            return numeroLimpo;
        }

        // Se tem 11 dígitos (com 9) - padrão brasileiro
        if (numeroLimpo.length() == 11) {
            return "55" + numeroLimpo;
        }

        // Se tem 10 dígitos (sem 9)
        if (numeroLimpo.length() == 10) {
            // Adicionar 9 após DDD
            String ddd = numeroLimpo.substring(0, 2);
            String numero = numeroLimpo.substring(2);
            return "55" + ddd + "9" + numero;
        }

        // Se tem 13 dígitos (já com 55 e 9)
        if (numeroLimpo.length() == 13 && numeroLimpo.startsWith("55")) {
            return numeroLimpo;
        }

        // Se tem 12 dígitos (55 + DDD + número sem 9)
        if (numeroLimpo.length() == 12 && numeroLimpo.startsWith("55")) {
            String ddd = numeroLimpo.substring(2, 4);
            String numero = numeroLimpo.substring(4);
            return "55" + ddd + "9" + numero;
        }

        // Se não se encaixa em nenhum padrão, retornar original
        System.out.println("⚠️ Número em formato não reconhecido: " + telefone + " (limpo: " + numeroLimpo + ")");
        return numeroLimpo;
    }

    // =========================
    // 🔹 Testar envio manual
    // =========================
    @PostMapping("/testar-envio")
    public ResponseEntity<String> testarEnvio(@RequestBody Map<String, String> request) {
        try {
            String telefone = request.get("telefone");
            String mensagem = request.get("mensagem");

            if (telefone == null || mensagem == null) {
                return ResponseEntity.badRequest().body("Telefone e mensagem são obrigatórios");
            }

            enviarRespostaWhatsApp(telefone, mensagem);

            return ResponseEntity.ok("Mensagem enviada com sucesso!");

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro: " + e.getMessage());
        }
    }

    // =========================
    // 🔹 Verificar status do token
    // =========================
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> verificarStatus() {
        Map<String, Object> status = new HashMap<>();

        status.put("token_configurado", token != null && !token.isEmpty());
        status.put("phone_number_id", PHONE_NUMBER_ID);
        status.put("api_url", WHATSAPP_API_URL);
        status.put("java_version", System.getProperty("java.version"));

        if (token != null && !token.isEmpty()) {
            status.put("token_prefix", token.substring(0, Math.min(10, token.length())) + "...");
            status.put("token_tamanho", token.length());
        }

        return ResponseEntity.ok(status);
    }

    // =========================
    // 🔹 Endpoint auxiliar
    // =========================
    @GetMapping("/concluidos")
    public List<PreAgendamento> listarTriagensConcluidas() {
        return preAgendamentoRepository.findByStatus("CONCLUIDO");
    }
}