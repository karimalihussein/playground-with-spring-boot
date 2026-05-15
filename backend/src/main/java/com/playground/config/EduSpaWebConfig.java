package com.playground.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Single-page educational UI (Vite → {@code classpath:/static/index.html}). These routes are client-managed by React Router;
 * forwarding preserves the browser URL on refresh.
 */
@Configuration
public class EduSpaWebConfig implements WebMvcConfigurer {

	private static final String[] CLIENT_ROUTES = {
		"/protocol-lab",
		"/osi-lab",
		"/grpc-lab",
		"/streaming-lab",
		"/websocket-lab",
		"/http2-lab",
		"/dns-lab",
		"/tls-lab",
	};

	@Override
	public void addViewControllers(ViewControllerRegistry registry) {
		for (String path : CLIENT_ROUTES) {
			registry.addViewController(path).setViewName("forward:/index.html");
			registry.addViewController(path + "/").setViewName("forward:/index.html");
		}
	}
}
