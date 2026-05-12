#!/usr/bin/env bash
set -euo pipefail
# gRPC unary load driver (prints ApacheBench-shaped summary lines).
# Requires the Spring app running with matching bench.grpc.port (default 9090).
PORT="${GRPC_PORT:-9090}"
N="${N:-1000}"
C="${C:-100}"
K="${COUNT:-1000}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT}"
./mvnw -q exec:java -Dexec.args="-n ${N} -c ${C} -p ${PORT} -k ${K}"
