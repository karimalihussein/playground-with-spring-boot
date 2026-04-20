# Playground Spring Boot — Backend Fundamentals, Step by Step

## About This Project

This repository is part of a course **I teach** on backend development. I built it so students can learn **Java** and **Spring Boot** from a practical starting point—not by memorizing buzzwords, but by **seeing how things actually work**.

The goal is **real understanding**: what happens when a browser sends a request, how a session differs from a cookie, and why the framework behaves the way it does. Theory matters, but here it always connects to **code you can run and change**.

---

## What I Teach in This Course

In this course, I teach students how to:

- **Ground themselves in Java fundamentals**—enough to read and write server-side code with confidence  
- **Build and run Spring Boot applications**—controllers, configuration, and the pieces that tie an HTTP request to a response  
- **Work with sessions and cookies**—what gets stored where, and how that shapes login flows, preferences, and security  
- **Follow the HTTP lifecycle**—from request headers to response, including redirects, forms, and state  
- **Think in terms of backend fundamentals**—routing, validation, persistence concepts, and error handling  
- **Peek under the hood**—how Spring MVC dispatches requests, how servlets relate to what you write in a `@Controller`, and why defaults exist  

Everything is anchored in **examples you can execute locally**, not slides alone.

---

## Learning Approach

I’m a big believer in **learning by building**:

- **Hands-on exercises**—you change the code, break it, fix it, and internalize the behavior  
- **Real examples**—session pages, cookie-based preferences, REST-style APIs, and security configuration you can trace line by line  
- **Step-by-step explanations**—I walk through *why* a feature works, not only *how* to paste it  
- **Depth over speed**—I’d rather you understand one mechanism clearly than skim ten  

If something feels “magical,” we slow down until it doesn’t.

---

## Who This Is For

This project is a good fit if you are:

- A **beginner** who wants a structured path into Java and Spring Boot  
- A **student** learning backend development and tired of tutorials that skip the “why”  
- **Anyone** who wants to **understand Spring Boot deeply**—not only copy configuration from Stack Overflow  

No ego required—curiosity is enough.

---

## What’s in This Repo (at a Glance)

The codebase evolves with the course. You’ll find practical demos such as:

- Spring MVC controllers and Thymeleaf views  
- **Session** tracking (visits, identifiers, lifecycle)  
- **Cookies** for preferences (theme, language, etc.)  
- Spring Security basics (e.g. logout, CSRF-aware forms)  
- REST endpoints alongside server-rendered pages  

Use it as a **playground**: run it, modify it, and match the code to the concepts we cover in class.

---

## Requirements

- **Java 21** (as configured in the project)  
- **Maven**  
- A **MySQL** instance if you use the default datasource profile (see `application.yml`); tests may use an in-memory database via the test profile  

Clone the repo, configure your environment, and run the Spring Boot application from your IDE or with:

```bash
./mvnw spring-boot:run
```

*(Use `mvnw.cmd` on Windows if applicable.)*

---

## Contribution

I’d love for this repo to grow with the community—especially in ways that help **students**.

- **Fork** the repository  
- **Add improvements**—clearer examples, better comments, fixes, or small features that reinforce the curriculum  
- **Open a pull request** with a short description of what you changed and why  

**I personally review contributions.** If a change is useful for learners and keeps the project clear and teachable, I’ll work with you to get it merged. If something doesn’t fit, I’ll explain why—feedback is part of the process.

---

## License

Add a license file if you distribute this publicly (e.g. MIT). Until then, treat usage as defined by your course and institution’s policies.

---

*Happy learning—and see you in the next lesson.*
