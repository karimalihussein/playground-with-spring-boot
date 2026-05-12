#!/usr/bin/env bash
set -euo pipefail
# gRPC streaming harness (see docs/BENCHMARKING.md §9).
MODE="${MODE:-server}"
PORT="${GRPC_PORT:-9090}"
K="${COUNT:-5000}"
S="${STREAMS:-16}"
C="${CONCURRENCY:-8}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT}"
./mvnw -q exec:java -Dexec.mainClass=com.playground.bench.client.GrpcStreamingBenchClient \
  -Dexec.args="-m ${MODE} -p ${PORT} -k ${K} -s ${S} -c ${C}"
