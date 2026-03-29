package com.example.demo.Config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Filtro JWT — executado uma vez por requisição HTTP.
 *
 * Lógica:
 * 1. Lê o header Authorization: Bearer <token>
 * 2. Valida o token com JwtUtil
 * 3. Se válido, injeta a autenticação no SecurityContext do Spring
 * 4. Se inválido ou ausente, a requisição continua sem autenticação
 *    (o SecurityConfig decide se a rota precisa de auth)
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            if (jwtUtil.tokenValido(token)) {
                String cargo = jwtUtil.extrairCargo(token);
                Long matricula = jwtUtil.extrairMatricula(token);

                // Converte cargo para authority do Spring Security
                // Ex: "ADMIN" → "ROLE_ADMIN"
                var auth = new UsernamePasswordAuthenticationToken(
                        matricula,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + cargo))
                );

                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        filterChain.doFilter(request, response);
    }
}
