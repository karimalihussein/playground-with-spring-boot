#!/usr/bin/env bash
set -euo pipefail
# ApacheBench against the REST *streaming* endpoint (SSE). Each completed response downloads all events.
# For true event-by-event viewing, use: curl -N http://localhost:8080/rest/stream/200
BASE_URL="${BASE_URL:-http://localhost:8080}"
COUNT="${COUNT:-1000}"
N="${N:-100}"
C="${C:-10}"
ab -n "${N}" -c "${C}" "${BASE_URL}/grpc/stream/${COUNT}"
