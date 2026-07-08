#!/usr/bin/env bash
# Baseline latency — checklist §1.3 (Prod-v2)
# Usage: ./scripts/baseline-latency.sh [BASE_URL]
BASE="${1:-http://localhost:8080}"
echo "Baseline latency — $BASE"
echo "Date: $(date -Iseconds)"
echo ""

endpoints=(
  "/api/search?q=pharmacie"
  "/api/search?q=restaurant+douala"
  "/api/search/autocomplete?q=ph"
  "/api/search/near-me?q=restaurant&latitude=3.848&longitude=11.502"
  "/api/search/ai?q=restaurant+douala"
  "/api/search/health"
)

for path in "${endpoints[@]}"; do
  total=$(LC_NUMERIC=C curl -s -o /dev/null -w "%{time_total}" "$BASE$path")
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$path")
  ms=$(LC_NUMERIC=C awk -v t="$total" 'BEGIN { printf "%.0f", t * 1000 }')
  printf "%s  %5sms  %s\n" "$code" "$ms" "$path"
done
