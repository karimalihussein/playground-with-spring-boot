package com.playground.controller;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

@Controller
public class SessionController {

	private static final Logger log = LoggerFactory.getLogger(SessionController.class);

	private static final String ATTR_USER_ID = "userId";
	private static final String ATTR_VISIT_COUNT = "visitCount";
	private static final String UNKNOWN = "Unknown";

	private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
			.withZone(ZoneId.systemDefault());

	@GetMapping({ "/", "/session" })
	public String sessionPage(HttpServletRequest request, HttpSession session, Model model) {
		applySessionState(session);

		String ipAddress = resolveClientIp(request);
		String userAgent = nullToEmpty(request.getHeader("User-Agent"));

		String browser = detectBrowser(userAgent);
		String os = detectOperatingSystem(userAgent);
		String deviceType = detectDeviceType(userAgent);

		model.addAttribute("sessionId", session.getId());
		model.addAttribute("creationTime", formatEpochMillis(session.getCreationTime()));
		model.addAttribute("lastAccessedTime", formatEpochMillis(session.getLastAccessedTime()));
		model.addAttribute("userId", session.getAttribute(ATTR_USER_ID));
		model.addAttribute("visitCount", session.getAttribute(ATTR_VISIT_COUNT));
		model.addAttribute("ipAddress", ipAddress);
		model.addAttribute("userAgent", userAgent.isEmpty() ? UNKNOWN : userAgent);
		model.addAttribute("browser", browser);
		model.addAttribute("os", os);
		model.addAttribute("deviceType", deviceType);

		log.info(
				"Session page access: sessionId={} userId={} visits={} ip={} browser={} os={} device={}",
				session.getId(),
				session.getAttribute(ATTR_USER_ID),
				session.getAttribute(ATTR_VISIT_COUNT),
				ipAddress,
				browser,
				os,
				deviceType);

		return "session";
	}

	private static void applySessionState(HttpSession session) {
		if (session.isNew()) {
			session.setAttribute(ATTR_USER_ID, "USER_" + ThreadLocalRandom.current().nextInt(1, 1_000_000_000));
			session.setAttribute(ATTR_VISIT_COUNT, 1);
		} else {
			Integer visits = (Integer) session.getAttribute(ATTR_VISIT_COUNT);
			session.setAttribute(ATTR_VISIT_COUNT, visits == null ? 1 : visits + 1);
			if (session.getAttribute(ATTR_USER_ID) == null) {
				session.setAttribute(ATTR_USER_ID, "USER_" + ThreadLocalRandom.current().nextInt(1, 1_000_000_000));
			}
		}
	}

	private static String resolveClientIp(HttpServletRequest request) {
		String xff = request.getHeader("X-Forwarded-For");
		if (!isBlank(xff)) {
			int comma = xff.indexOf(',');
			String first = comma >= 0 ? xff.substring(0, comma) : xff;
			return first.trim();
		}
		String addr = request.getRemoteAddr();
		return addr == null ? UNKNOWN : addr.trim();
	}

	private static String detectBrowser(String userAgent) {
		if (isBlank(userAgent)) {
			return UNKNOWN;
		}
		String ua = userAgent;
		if (containsIgnoreCase(ua, "Edg/") || containsIgnoreCase(ua, "Edge/")) {
			return "Edge";
		}
		if (containsIgnoreCase(ua, "OPR/") || containsIgnoreCase(ua, "Opera/")) {
			return "Opera";
		}
		if (containsIgnoreCase(ua, "Chrome") || containsIgnoreCase(ua, "CriOS")) {
			return "Chrome";
		}
		if (containsIgnoreCase(ua, "Firefox") || containsIgnoreCase(ua, "FxiOS")) {
			return "Firefox";
		}
		if (containsIgnoreCase(ua, "Safari/") && !containsIgnoreCase(ua, "Chrome")) {
			return "Safari";
		}
		return UNKNOWN;
	}

	private static String detectOperatingSystem(String userAgent) {
		if (isBlank(userAgent)) {
			return UNKNOWN;
		}
		String ua = userAgent;
		if (containsIgnoreCase(ua, "Windows")) {
			return "Windows";
		}
		if (containsIgnoreCase(ua, "Android")) {
			return "Android";
		}
		if (containsIgnoreCase(ua, "iPhone") || containsIgnoreCase(ua, "iPad") || containsIgnoreCase(ua, "iPod")) {
			return "iOS";
		}
		if (containsIgnoreCase(ua, "Mac OS X") || containsIgnoreCase(ua, "Macintosh")) {
			return "MacOS";
		}
		if (containsIgnoreCase(ua, "Linux")) {
			return "Linux";
		}
		return UNKNOWN;
	}

	private static String detectDeviceType(String userAgent) {
		if (isBlank(userAgent)) {
			return UNKNOWN;
		}
		String u = userAgent.toLowerCase(Locale.ROOT);
		if (u.contains("ipad") || u.contains("tablet") || u.contains("kindle") || u.contains("playbook")
				|| u.contains("silk/")) {
			return "Tablet";
		}
		if (u.contains("iphone") || u.contains("ipod") || u.contains("windows phone") || u.contains("blackberry")) {
			return "Mobile";
		}
		if (u.contains("android")) {
			return u.contains("mobile") ? "Mobile" : "Tablet";
		}
		if (u.contains("mobi")) {
			return "Mobile";
		}
		return "Desktop";
	}

	private static String formatEpochMillis(long epochMillis) {
		return DATE_TIME_FORMATTER.format(Instant.ofEpochMilli(epochMillis));
	}

	private static boolean isBlank(String s) {
		return s == null || s.isBlank();
	}

	private static String nullToEmpty(String s) {
		return s == null ? "" : s;
	}

	private static boolean containsIgnoreCase(String haystack, String needle) {
		return haystack.toLowerCase(Locale.ROOT).contains(needle.toLowerCase(Locale.ROOT));
	}

}
