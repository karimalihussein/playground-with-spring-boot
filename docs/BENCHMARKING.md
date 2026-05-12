# Benchmarking: REST (JSON / HTTP) vs gRPC (Protobuf / HTTP/2)

This project exposes **the same business logic** two ways:

- **REST:** `GET http://localhost:8080/rest/unary/{count}` — JSON body, typical Spring MVC + Jackson stack  
- **gRPC:** unary RPC `NumberBench/GenerateNumbers` on **port `9090`** (configurable) — Protobuf messages over **HTTP/2**

The service computes a deterministic array: squares \((i+1)^2\) for \(i \in [0..count-1]\).

**Authoritative references (read these alongside the code):**

- gRPC concepts + HTTP/2 framing: [gRPC Core Concepts](https://grpc.io/docs/what-is-grpc/core-concepts/)  
- HTTP/2 streams & multiplexing: [RFC 9113 (HTTP/2)](https://www.rfc-editor.org/rfc/rfc9113.html)  
- Protobuf encoding (varints, length-delimited records): [Protocol Buffers Encoding](https://protobuf.dev/programming-guides/encoding/)  
- ApacheBench (`ab`) manual: [Apache HTTP Server docs — ab](https://httpd.apache.org/docs/current/programs/ab.html)  

---

## 1) One-time setup

```bash
cd /path/to/playground-spring-boot
./mvnw -DskipTests compile
```

Protobuf/gRPC Java sources are generated into `target/generated-sources/protobuf/**` by `protobuf-maven-plugin`.

### Run without MySQL (recommended for the benchmark lesson)

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=bench
```

### Run with the repo’s default MySQL settings

Ensure MySQL matches `src/main/resources/application.yml`, then:

```bash
./mvnw spring-boot:run
```

---

## 2) REST load test with ApacheBench (`ab`)

Example (matches the style you asked for):

```bash
ab -n 1000 -c 100 http://localhost:8080/rest/unary/1000
```

**Flags (from Apache’s `ab` documentation):**

- `-n` total requests  
- `-c` concurrency (number of multiple requests to perform at a time)  

### How to read `ab` output (typical sections)

You’ll usually see:

- **Requests per second** — mean throughput  
- **Time per request** — mean latency across *all* requests (and often a “across all concurrent requests” line)  
- **Failed requests** — non-2xx responses or socket/read errors  
- **Transfer rate** — bytes/sec as measured by `ab`  

**Interpret carefully:** `ab` is HTTP/1.1-oriented in behavior (keep-alive depends on flags and server). It is still excellent for *classroom* comparisons against a hand-written gRPC driver, but it is not a substitute for production SRE-style load testing.

---

## 3) gRPC load testing (why `ab` is not used)

`ab` cannot speak gRPC because gRPC uses **HTTP/2** plus **length-prefixed frames** and **Protobuf payloads** on the wire (see gRPC “protocol” discussion in [gRPC Core Concepts](https://grpc.io/docs/what-is-grpc/core-concepts/)).

This repository includes **`GrpcBenchClient`**, which prints **`ab`-like summary lines**:

```bash
./mvnw -q exec:java -Dexec.args="-n 1000 -c 100 -p 9090 -k 1000"
```

**Flags:**

- `-h` host (default `localhost`)  
- `-p` gRPC port (default `9090`, must match `bench.grpc.port`)  
- `-n` total unary RPCs  
- `-c` concurrent worker threads  
- `-k` the `{count}` parameter (same meaning as REST path `{count}`)  

### Optional: benchmark like a production engineer with `ghz`

If you install [`ghz`](https://ghz.sh/), you can drive protos directly. (You still need a running server and the `.proto` path or reflection; this repo keeps it simple by shipping `GrpcBenchClient`.)

---

## 4) “Visualizing internals” (what to log / measure)

### Log small demos, not huge runs

Per-request DEBUG logs exist in:

- `com.playground.bench.rest.UnaryNumbersRestController`  
- `com.playground.bench.grpc.NumberBenchGrpcService`  
- `com.playground.bench.rest.StreamNumbersRestController` (SSE events are noisy — keep INFO)  

For large `-n`, set:

```yaml
logging.level.com.playground.bench: INFO
```

### Compare payload sizes (conceptual)

- **JSON** grows quickly: field names (`"squares":[...]`) plus decimal text for numbers is verbose.  
- **Protobuf** packs numeric fields with compact wire types; repeated `int64` is still a list, but without repeated ASCII field names per element. See [Protobuf Encoding](https://protobuf.dev/programming-guides/encoding/).

---

## 5) Mental model cheat sheet (for teaching)

| Topic | REST example in this repo | gRPC example in this repo |
| --- | --- | --- |
| **Thread model** | Servlet / Tomcat threads handling requests | Netty event loops + gRPC executors (implementation details vary by server) |
| **Framing** | HTTP headers + body bytes | HTTP/2 frames carrying gRPC messages (see RFC 9113 + gRPC docs) |
| **Serialization** | Jackson → UTF-8 JSON (`tools.jackson.databind.ObjectMapper`) | `GeneratedMessage#getSerializedSize()` reflects Protobuf wire size |
| **Multiplexing** | HTTP/1.1: limited multiplexing per connection; HTTP/2 improves this | HTTP/2 streams multiplex concurrent RPCs on **one TCP/TLS connection** |

---

## 6) Docker (optional)

```bash
./mvnw -DskipTests package
docker build -t playground-bench .
docker run --rm -p 8080:8080 -p 9090:9090 -e SPRING_PROFILES_ACTIVE=bench playground-bench
```

---

## 7) Debugging tips

- **Port already in use:** change `server.port` / `bench.grpc.port`.  
- **Huge payloads:** lower `{count}` for laptops; increase JVM heap only if you truly need giant arrays.  
- **Apple Silicon / protoc classifier:** build uses `os-maven-plugin` to pick `osx-aarch_64` artifacts automatically.

---

## 8) When gRPC is *not* the right tool

Common reasons to prefer REST/OpenAPI instead:

- **Browser-first public APIs** (gRPC in browsers is non-trivial compared to JSON HTTP)  
- **Caching layers** that assume URLs + HTTP verbs + JSON everywhere  
- **Broad ecosystem** of curl/Ajax tools that “just work” with JSON  

gRPC shines for **efficient service-to-service** RPC with strong contracts (`.proto`) and high concurrency on HTTP/2.

---

## 9) Streaming module (SSE REST vs gRPC streaming)

This section adds **three gRPC streaming patterns** on the same `NumberBench` service:

| RPC | Proto | Teaching mnemonic |
| --- | --- | --- |
| Server streaming | `GenerateNumbersStream` → `stream NumberChunk` | “One question, many answers” (live feed) |
| Client streaming | `UploadNumbers` ← `stream NumberChunk` | “Many parcels, one receipt” (ingest/aggregate) |
| Bidirectional | `ChatStream` ↔ `stream ChatMessage` | “Phone call” (two independent write halves) |

Authoritative reading:

- gRPC streaming overview: [gRPC Core Concepts](https://grpc.io/docs/what-is-grpc/core-concepts/)  
- HTTP/2 streams + flow control: [RFC 9113](https://www.rfc-editor.org/rfc/rfc9113.html)  
- Protobuf on-wire encoding: [Protobuf Encoding](https://protobuf.dev/programming-guides/encoding/)  

### 9.1 What “streaming” means on the wire (short)

- **REST unary** (this repo): one HTTP request → one HTTP response → connection may be reused (`keep-alive`).  
- **REST SSE** (`text/event-stream` here): one HTTP request → **one long response** where the server **chunks** many `data:` events — still **HTTP**, not gRPC.  
- **gRPC unary**: one client message + one server message (still one logical RPC “stream” in HTTP/2 terms, then it ends).  
- **gRPC streaming**: **many gRPC messages** on the **same RPC / HTTP/2 stream** (same TCP connection can carry **many** independent HTTP/2 streams via **multiplexing**).

**Frames:** HTTP/2 moves bytes in frames (`HEADERS`, `DATA`, `WINDOW_UPDATE`, …). gRPC messages are **length-prefixed** payloads inside `DATA` frames. See [RFC 9113](https://www.rfc-editor.org/rfc/rfc9113.html) + [gRPC protocol description](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md).

### 9.2 REST SSE endpoint / `ab` caveat (path alias)

We expose SSE on **both**:

- `GET /rest/stream/{count}` (clear naming)  
- `GET /grpc/stream/{count}` (**alias only** — still port **8080** + HTTP; it is *not* the gRPC port)

Example (your requested style):

```bash
ab -n 100 -c 10 http://localhost:8080/grpc/stream/1000
```

**Why this is imperfect for “streaming science”:** `ab` measures **completed HTTP responses**, not individual SSE events. It also tends to focus on **HTTP/1.1**-style clients. For observing events live, prefer:

```bash
curl -N http://localhost:8080/rest/stream/200
```

### 9.3 gRPC streaming benchmarks (why `ab` cannot work)

`ab` cannot speak **HTTP/2+gRPC framing+Protobuf**. Use the included harness or professional tools:

```bash
# Server streaming: parallel server-stream RPCs
./mvnw -q exec:java -Dexec.mainClass=com.playground.bench.client.GrpcStreamingBenchClient \
  -Dexec.args="-m server -p 9090 -s 16 -c 8 -k 5000"

# Client streaming: one RPC uploading many chunks
./mvnw -q exec:java -Dexec.mainClass=com.playground.bench.client.GrpcStreamingBenchClient \
  -Dexec.args="-m client -p 9090 -k 20000"

# Bidirectional: N chat messages on one stream
./mvnw -q exec:java -Dexec.mainClass=com.playground.bench.client.GrpcStreamingBenchClient \
  -Dexec.args="-m bidi -p 9090 -k 5000"
```

Interactive **bidirectional** demo (terminal):

```bash
./mvnw -q exec:java -Dexec.mainClass=com.playground.bench.client.GrpcStreamInteractiveDemo -Dexec.args="-p 9090"
```

### 9.4 `grpcurl` (exploration / inspection)

[`grpcurl`](https://github.com/fullstorydev/grpcurl) is excellent for **calling** RPCs with protos on disk (this repo: `src/main/proto/numbers.proto`).  
This project does **not** enable gRPC reflection, so you typically pass `-import-path` / `-proto` flags (see `grpcurl` README examples).

### 9.5 `ghz` (serious RPC throughput experiments)

[`ghz`](https://ghz.sh/) is closer to how engineers load-test gRPC services (unary *and* streaming templates depending on version/config). Treat it as complementary to this educational harness.

### 9.6 Interpreting metrics (requests/s vs “messages/s”)

- **Unary** benchmarks speak in **RPCs/sec**.  
- **Streaming** benchmarks speak in **messages/sec** or **chunks/sec** *within* one or many RPCs.  
- **Latency** for streaming is often multi-modal: time-to-first-message vs time-to-complete entire stream.  
- **Memory** risks: **fast producer / slow consumer** buffers more in-process bytes unless **flow control** slows the producer — this is the same *idea* as TCP backpressure, implemented at HTTP/2 **stream/window** granularity ([RFC 9113 flow control](https://www.rfc-editor.org/rfc/rfc9113.html#name-flow-control)).

### 9.7 When streaming becomes dangerous (teaching checklist)

- **Unbounded in-memory queues** on either side (OOM) if you “fire-hose” `onNext` without reading.  
- **Head-of-line effects** still matter at **TCP** if data backs up — HTTP/2 helps at the **HTTP layer**, not magically at every layer.  
- **Turning DEBUG logging on** (`logging.level.com.playground.bench=DEBUG`) can **destroy throughput** — observe with sampling / metrics instead in real systems.

### 9.8 WebSocket vs gRPC streaming vs log/event brokers (conceptual)

| Mechanism | What problem it optimizes | How it differs |
| --- | --- | --- |
| **WebSocket** | Browser-friendly full-duplex over HTTP upgrade | Framing + ecosystem differs; common for UI dashboards ([RFC 6455](https://www.rfc-editor.org/rfc/rfc6455.html)). |
| **gRPC streaming** | Contracted, typed service RPCs over HTTP/2 | Strong `.proto` APIs + efficient binary payloads; not “browser default”. |
| **Kafka** | Durable **log** + consumer groups + replay | Brokered storage & partitioning; different failure model than a live RPC stream. |
| **RabbitMQ push** | Broker queues + routing | Message broker semantics (acks, DLQs) vs direct stream between two apps. |

---

## 10) JVM memory / throughput debugging (optional)

Quick, local-only ideas (not a production APM story):

```bash
jcmd <pid> VM.native_memory summary
jstat -gc <pid> 1s
```

Compare runs with the same `-Xmx` to avoid confusing GC effects with protocol effects.
