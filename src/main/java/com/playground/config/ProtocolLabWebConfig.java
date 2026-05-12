package com.playground.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Vite builds the lab to {@code classpath:/static/protocol-lab/index.html}. Spring’s default static handler
 * resolves {@code /protocol-lab/index.html} but not the directory URL {@code /protocol-lab/} — browsers and
 * redirects use the latter, producing 404 without this mapping.
 */
@Configuration
public class ProtocolLabWebConfig implements WebMvcConfigurer {

	@Override
	public void addViewControllers(ViewControllerRegistry registry) {
		registry.addRedirectViewController("/protocol-lab", "/protocol-lab/index.html");
		registry.addRedirectViewController("/protocol-lab/", "/protocol-lab/index.html");
	}
}
