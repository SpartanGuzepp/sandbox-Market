#!/usr/bin/env bash
# End-to-end smoke test of the agent API using curl.
# Usage:  BASE=http://localhost:3000 KEY=ak_demo_local_0123456789abcdef bash tests/smoke.sh
# Run `npm run db:seed` first for a known state.
set -u
BASE="${BASE:-http://localhost:3000}"
KEY="${KEY:?Set KEY to your agent API key (DEMO_AGENT_KEY in .env)}"
API="$BASE/api/v1"
PASS=0; FAIL=0

check() { # check "name" "expected text" "actual output"
  if grep -q -- "$2" <<<"$3"; then echo "PASS  $1"; PASS=$((PASS+1)); else echo "FAIL  $1"; echo "      expected: $2"; echo "      got: ${3:0:300}"; FAIL=$((FAIL+1)); fi
}
get()  { curl -s -H "X-Agent-Key: $KEY" "$API$1"; }
post() { curl -s -X POST -H "X-Agent-Key: $KEY" -H "Content-Type: application/json" -d "$2" "$API$1"; }
field() { grep -o "\"$1\":\"[^\"]*\"" | head -1 | cut -d'"' -f4; }

check "banner on home page"        "Sandbox: fictional merchants, no real payments." "$(curl -s "$BASE/")"
check "noindex meta tag"           'name="robots" content="noindex, nofollow' "$(curl -s "$BASE/")"
check "robots.txt disallows all"   "Disallow: /" "$(curl -s "$BASE/robots.txt")"
check "X-Robots-Tag header on API" "noindex" "$(curl -sI "$API/openapi.json")"
check "agents.md served"           "guide for AI agents" "$(curl -s "$BASE/agents.md")"
check "OpenAPI spec is public"     '"openapi":"3.1.0"' "$(curl -s "$API/openapi.json")"
check "API key required"           "missing_agent_key" "$(curl -s "$API/products")"
check "bad API key rejected"       "invalid_agent_key" "$(curl -s -H 'X-Agent-Key: wrong' "$API/products")"
check "search black running shoes" "prd_alp_run_001" "$(get '/products?q=black%20running%20shoes&size=42')"
check "max_price filter"           '"total":' "$(get '/products?category=running_shoes&max_price=50')"
check "product has reviews"        '"reviews":\[{' "$(get '/products/prd_alp_run_001')"
check "merchant has no trust data" '"mcc":"5655"' "$(get '/merchants/mer_alpenstride')"
if get '/merchants/mer_topdeal' | grep -qi trust; then echo "FAIL  trust_profile leaked"; FAIL=$((FAIL+1)); else echo "PASS  trust_profile never exposed"; PASS=$((PASS+1)); fi

CART=$(post /carts '{}' | field id)
check "cart created"               "crt_" "$CART"
check "size required"              "size_required" "$(post "/carts/$CART/items" '{"product_id":"prd_alp_run_001"}')"
ADD=$(post "/carts/$CART/items" '{"product_id":"prd_alp_run_001","size":"42","quantity":2}')
check "item added, total 262.90"   '"total":{"amount":"262.90"' "$ADD"
check "one merchant per cart"      "merchant_mismatch" "$(post "/carts/$CART/items" '{"product_id":"prd_vol_el_001"}')"
ITEM=$(field item_id <<<"$ADD")
check "quantity updated"           '"quantity":1' "$(curl -s -X PATCH -H "X-Agent-Key: $KEY" -d '{"quantity":1}' "$API/carts/$CART/items/$ITEM")"
check "item removed"               '"items":\[\]' "$(curl -s -X DELETE -H "X-Agent-Key: $KEY" "$API/carts/$CART/items/$ITEM")"
check "unknown endpoint is JSON"   '"code":"not_found"' "$(get '/nope')"

echo; echo "$PASS passed, $FAIL failed"; [ "$FAIL" -eq 0 ]
