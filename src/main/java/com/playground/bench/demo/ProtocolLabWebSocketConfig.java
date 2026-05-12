package com.playground.bench.demo;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class ProtocolLabWebSocketConfig implements WebSocketConfigurer {

	private final NumbersDemoWebSocketHandler numbersDemoWebSocketHandler;

	public ProtocolLabWebSocketConfig(NumbersDemoWebSocketHandler numbersDemoWebSocketHandler) {
		this.numbersDemoWebSocketHandler = numbersDemoWebSocketHandler;
	}

	@Override
	public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
		registry
				.addHandler(numbersDemoWebSocketHandler, "/demo/ws/numbers")
				.setAllowedOriginPatterns("*");
	}
}
