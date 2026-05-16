package com.example.demo.Config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

        @Configuration
        @EnableWebSecurity
        public class SecurityConfig {

            @Autowired
            private JwtAuthFilter jwtAuthFilter;

            @Bean
            public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                        .csrf(AbstractHttpConfigurer::disable)
                        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                        .authorizeHttpRequests(auth -> auth

                                // Rotas públicas
                                .requestMatchers(HttpMethod.POST, "/funcionarios/login").permitAll()
                                .requestMatchers("/ws-hospital/**").permitAll()
                                .requestMatchers("/api/whatsapp/**").permitAll() // webhook da Meta

                                // Visualização da fila — qualquer funcionário autenticado
                                .requestMatchers(HttpMethod.GET, "/consultas/fila/**").authenticated()
                                .requestMatchers(HttpMethod.GET, "/consultas/historico/**").authenticated()

                                // Recepção — cadastrar paciente
                                .requestMatchers(HttpMethod.POST, "/consultas/agendar")
                                .hasAnyRole("RECEPCAO", "ADMIN")

                                // Médico — concluir atendimento
                                .requestMatchers(HttpMethod.PUT, "/consultas/*/concluir")
                                .hasAnyRole("MEDICO", "ADMIN")

                                // WhatsApp — importar pré-agendamento (recepção)
                                .requestMatchers("/consultas/whatsapp/**")
                                .hasAnyRole("RECEPCAO", "ADMIN")

                                // Gestão de equipe — somente admin
                                .requestMatchers(HttpMethod.GET,  "/funcionarios").hasRole("ADMIN")
                                .requestMatchers(HttpMethod.POST, "/funcionarios/cadastrar").hasRole("ADMIN")

                                // Qualquer outra rota exige autenticação
                                .anyRequest().authenticated()
                        )
                        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
            }

            /**
             * CORS configurado para aceitar requisições do frontend React.
             * Em produção, substituir "*" pelo domínio real do frontend.
             */
            @Bean
            public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();
                config.setAllowedOriginPatterns(List.of("*"));
                config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                config.setAllowedHeaders(List.of("*"));
                config.setAllowCredentials(true);
                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", config);
                return source;
            }
        }
