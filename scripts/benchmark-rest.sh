#!/usr/bin/env bash
set -euo pipefail
# ApacheBench against the REST endpoint (HTTP/1.1-style exercise; compare with GrpcBenchClient).
# Install ab via your OS package manager (often httpd or apache2-utils).
BASE_URL="${BASE_URL:-http://localhost:8080}"
COUNT="${COUNT:-1000}"
N="${N:-1000}"
C="${C:-100}"
ab -n "${N}" -c "${C}" "${BASE_URL}/rest/unary/${COUNT}"
