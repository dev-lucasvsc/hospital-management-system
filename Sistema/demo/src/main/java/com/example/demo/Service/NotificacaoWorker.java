package com.example.demo.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class NotificacaoWorker {

    @Autowired private StringRedisTemplate redisTemplate;
    @Autowired private SimpMessagingTemplate websocket;

    /**
     * Executa a cada 1000ms em thread do pool "taskExecutor".
     * Consome todos os eventos pendentes na fila antes de dormir.
     */
    @Async("taskExecutor")
    @Scheduled(fixedDelay = 1000)
    public void processarFila() {
        String evento;

        // Drena todos os eventos acumulados na fila neste ciclo
        while ((evento = redisTemplate.opsForList().rightPop("fila:notificacoes")) != null) {
            System.out.printf("[WORKER] thread=%s evento=%s → notificando WebSocket%n",
                    Thread.currentThread().getName(), evento);

            websocket.convertAndSend("/topic/fila", "ATUALIZAR_FILA");
        }
    }
}