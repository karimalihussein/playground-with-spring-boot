package com.playground.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Interactive cookie-based preferences: {@code username}, {@code lang}, {@code theme}.
 * See Jakarta Servlet {@link Cookie}.
 */
@Controller
public class CookieController {

	private static final String COOKIE_USERNAME = "username";
	private static final String COOKIE_THEME = "theme";
	private static final String COOKIE_LANG = "lang";

	private static final int ONE_HOUR_SECONDS = 60 * 60;

	private static final Set<String> ALLOWED_LANGS = Set.of("en", "ar", "fr");

	public record CookieRow(String name, String value) {
	}

	@GetMapping("/cookie")
	public String cookie(HttpServletRequest request, Model model) {
		Cookie[] raw = request.getCookies();
		List<CookieRow> rows = mapCookies(raw);

		String username = findCookieValue(raw, COOKIE_USERNAME).orElse("");
		String lang = findCookieValue(raw, COOKIE_LANG).orElse("en");
		String theme = normalizeTheme(findCookieValue(raw, COOKIE_THEME).orElse("light"));

		model.addAttribute("username", username);
		model.addAttribute("lang", lang);
		model.addAttribute("theme", theme);
		model.addAttribute("cookies", rows);
		model.addAttribute("totalCookies", raw == null ? 0 : raw.length);

		return "cookie";
	}

	@PostMapping("/set-preferences")
	public String setPreferences(
			@RequestParam("username") String username,
			@RequestParam("lang") String lang,
			@RequestParam("theme") String theme,
			HttpServletResponse response) {
		String u = username != null ? username.trim() : "";
		String l = normalizeLang(lang);
		String t = normalizeTheme(theme);

		addCookie(response, COOKIE_USERNAME, u, ONE_HOUR_SECONDS);
		addCookie(response, COOKIE_LANG, l, ONE_HOUR_SECONDS);
		addCookie(response, COOKIE_THEME, t, ONE_HOUR_SECONDS);

		return "redirect:/cookie";
	}

	@GetMapping("/reset-preferences")
	public String resetPreferences(HttpServletResponse response) {
		expireCookie(response, COOKIE_USERNAME);
		expireCookie(response, COOKIE_LANG);
		expireCookie(response, COOKIE_THEME);
		return "redirect:/cookie";
	}

	@GetMapping("/cookie-info")
	public String cookieInfo(HttpServletRequest request, Model model) {
		Cookie[] raw = request.getCookies();
		model.addAttribute("cookies", mapCookies(raw));
		model.addAttribute("totalCookies", raw == null ? 0 : raw.length);
		model.addAttribute("theme", normalizeTheme(findCookieValue(raw, COOKIE_THEME).orElse("light")));
		return "cookie-info";
	}

	private static void addCookie(HttpServletResponse response, String name, String value, int maxAgeSeconds) {
		Cookie c = new Cookie(name, value != null ? value : "");
		c.setMaxAge(maxAgeSeconds);
		c.setPath("/");
		c.setHttpOnly(true);
		response.addCookie(c);
	}

	private static void expireCookie(HttpServletResponse response, String name) {
		Cookie c = new Cookie(name, "");
		c.setMaxAge(0);
		c.setPath("/");
		c.setHttpOnly(true);
		response.addCookie(c);
	}

	private static String normalizeLang(String lang) {
		if (lang == null || lang.isBlank()) {
			return "en";
		}
		String lower = lang.trim().toLowerCase(Locale.ROOT);
		return ALLOWED_LANGS.contains(lower) ? lower : "en";
	}

	private static String normalizeTheme(String theme) {
		if (theme == null || theme.isBlank()) {
			return "light";
		}
		return "dark".equalsIgnoreCase(theme.trim()) ? "dark" : "light";
	}

	private static List<CookieRow> mapCookies(Cookie[] cookies) {
		if (cookies == null || cookies.length == 0) {
			return List.of();
		}
		List<CookieRow> rows = new ArrayList<>(cookies.length);
		for (Cookie c : cookies) {
			rows.add(new CookieRow(c.getName(), c.getValue() != null ? c.getValue() : ""));
		}
		return rows;
	}

	private static Optional<String> findCookieValue(Cookie[] cookies, String name) {
		if (cookies == null) {
			return Optional.empty();
		}
		for (Cookie c : cookies) {
			if (name.equals(c.getName())) {
				return Optional.ofNullable(c.getValue());
			}
		}
		return Optional.empty();
	}

}
