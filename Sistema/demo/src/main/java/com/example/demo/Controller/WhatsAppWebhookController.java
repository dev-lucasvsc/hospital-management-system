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

    private static final String GRAPH_VERSION   = "v19.0";
    private static final String PHONE_NUMBER_ID = "1009073248953161"; // TODO: mover para variável de ambiente
    private static final String VERIFY_TOKEN    = "lucas_webhook_2026"; // TODO: mover para variável de ambiente

    // Token carregado da variável de ambiente WHATSAPP_TOKEN
    @Value("${whatsapp.token:}")
    private String token;

    private final String WHATSAPP_API_URL =
            "https://graph.facebook.com/" + GRAPH_VERSION + "/" + PHONE_NUMBER_ID + "/messages";

    // =========================================================
    // Validação do webhook (chamado uma vez pela Meta ao registrar)
    // =========================================================
    @GetMapping("/webhook")
    public ResponseEntity<String> validarWebhook(
            @RequestParam("hub.mode") String mode,
            @RequestParam("hub.verify_token") String verifyToken,
            @RequestParam("hub.challenge") String challenge) {

        if ("subscribe".equals(mode) && VERIFY_TOKEN.equals(verifyToken)) {
            return ResponseEntity.ok(challenge);
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Token inválido");
    }

    // =========================================================
    // Recebimento de mensagens dos pacientes
    // =========================================================
    @PostMapping("/webhook")
    public ResponseEntity<String> receberMensagem(@RequestBody String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            JsonNode entry = root.path("entry").get(0);
            JsonNode changes = entry.path("changes").get(0);
            JsonNode value = changes.path("value");
            JsonNode messages = value.path("messages");

            if (messages.isArray() && messages.size() > 0) {
                JsonNode msg = messages.get(0);
                String tipo = msg.path("type").asText();

                if ("text".equals(tipo)) {
                    String telefone = msg.path("from").asText();
                    String texto    = msg.path("text").path("body").asText();

                    String resposta = preAgendamentoService.processarMensagem(telefone, texto);
                    enviarMensagem(telefone, resposta);
                }
            }
        } catch (Exception e) {
            // Log de erro sem interromper o fluxo (a Meta espera HTTP 200 sempre)
            System.err.println("Erro ao processar webhook WhatsApp: " + e.getMessage());
        }

        return ResponseEntity.ok("EVENT_RECEIVED");
    }

    // =========================================================
    // Envio de mensagem de texto via API do WhatsApp
    // =========================================================
    private void enviarMensagem(String telefone, String texto) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);

            Map<String, Object> body = new HashMap<>();
            body.put("messaging_product", "whatsapp");
            body.put("to", telefone);
            body.put("type", "text");
            body.put("text", Map.of("body", texto));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(WHATSAPP_API_URL, request, String.class);

        } catch (HttpStatusCodeException e) {
            System.err.println("Erro ao enviar mensagem WhatsApp: " + e.getResponseBodyAsString());
        }
    }
}