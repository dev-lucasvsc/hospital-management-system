package com.example.demo.Config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Utilitário JWT — gera e valida tokens de autenticação.
 *
 * O token carrega: matricula (subject), nome e cargo do funcionário.
 * Validade: 8 horas (jornada de trabalho padrão).
 *
 * A chave secreta é lida da variável de ambiente JWT_SECRET.
 * Em desenvolvimento, usa o valor padrão definido no application.properties.
 */
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:28800000}") // 8 horas em ms
    private long expiration;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    /**
     * Gera um token JWT com os dados do funcionário.
     */
    public String gerarToken(Long matricula, String nome, String cargo) {
        return Jwts.builder()
                .subject(String.valueOf(matricula))
                .claim("nome", nome)
                .claim("cargo", cargo)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getKey())
                .compact();
    }

    /**
     * Extrai todas as claims de um token válido.
     */
    public Claims extrairClaims(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Retorna a matrícula (subject) do token.
     */
    public Long extrairMatricula(String token) {
        return Long.parseLong(extrairClaims(token).getSubject());
    }

    /**
     * Retorna o cargo do funcionário contido no token.
     */
    public String extrairCargo(String token) {
        return extrairClaims(token).get("cargo", String.class);
    }

    /**
     * Verifica se o token está válido (assinatura correta e não expirado).
     */
    public boolean tokenValido(String token) {
        try {
            Claims claims = extrairClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}
