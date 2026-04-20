package com.playground.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;

import jakarta.servlet.http.HttpSession;

/**
 * Security is open (all requests permitted). Logout is handled entirely by Spring Security
 * ({@link org.springframework.security.web.authentication.logout.LogoutFilter}), not by MVC
 * controllers, to avoid duplicate routes and default {@code /login?logout} redirects.
 * <p>
 * <strong>CSRF:</strong> Enabled globally. HTML forms must submit the CSRF token (see
 * {@code session.html}). {@code /api/**} is ignored for CSRF so JSON clients can call the API
 * without a token (adjust if APIs must be protected differently).
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

	private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
				.csrf(csrf -> csrf.ignoringRequestMatchers("/api/**"))
				.authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
				.formLogin(AbstractHttpConfigurer::disable)
				.httpBasic(AbstractHttpConfigurer::disable)
				.logout(logout -> logout
						.logoutRequestMatcher(PathPatternRequestMatcher.pathPattern(HttpMethod.POST, "/logout"))
						.logoutSuccessUrl("/session")
						.invalidateHttpSession(true)
						.clearAuthentication(true)
						.addLogoutHandler((request, response, authentication) -> {
							HttpSession session = request.getSession(false);
							if (session != null) {
								log.info("Logout: sessionId={} userId={}", session.getId(),
										session.getAttribute("userId"));
							}
						})
						.deleteCookies("JSESSIONID")
						.permitAll());
		return http.build();
	}

}
