#!/usr/bin/env bash
# Post-deploy smoke test — read-only HTTP checks against a running TEKMESIS
# deployment (preview or production). Never mutates data: no checkout is
# started, no admin login is attempted. See docs/SMOKE_TESTS.md for the
# manual (non-scriptable) checks this deliberately doesn't cover.
#
# Usage: BASE_URL=https://tekmesis.com bash scripts/smoke-test.sh
#        bash scripts/smoke-test.sh https://your-preview.vercel.app

set -u

BASE_URL="${1:-${BASE_URL:-http://localhost:3000}}"
BASE_URL="${BASE_URL%/}"

pass_count=0
fail_count=0

check() {
  local description="$1"
  local path="$2"
  local expected_status="$3"
  local expected_body_grep="${4:-}"

  local response
  response=$(curl -sS -o /tmp/smoke-test-body.$$ -w "%{http_code}" "${BASE_URL}${path}" 2>/tmp/smoke-test-err.$$)
  local status="$response"

  if [ "$status" != "$expected_status" ]; then
    echo "FAIL  ${description} — expected HTTP ${expected_status}, got ${status} (${BASE_URL}${path})"
    fail_count=$((fail_count + 1))
    rm -f /tmp/smoke-test-body.$$ /tmp/smoke-test-err.$$
    return
  fi

  if [ -n "$expected_body_grep" ] && ! grep -q "$expected_body_grep" /tmp/smoke-test-body.$$; then
    echo "FAIL  ${description} — HTTP ${status} OK, but body did not contain '${expected_body_grep}' (${BASE_URL}${path})"
    fail_count=$((fail_count + 1))
    rm -f /tmp/smoke-test-body.$$ /tmp/smoke-test-err.$$
    return
  fi

  echo "PASS  ${description}"
  pass_count=$((pass_count + 1))
  rm -f /tmp/smoke-test-body.$$ /tmp/smoke-test-err.$$
}

check_header() {
  local description="$1"
  local path="$2"
  local header_name="$3"

  local headers
  headers=$(curl -sS -D - -o /dev/null "${BASE_URL}${path}" 2>/tmp/smoke-test-err.$$)

  if echo "$headers" | grep -qi "^${header_name}:"; then
    echo "PASS  ${description}"
    pass_count=$((pass_count + 1))
  else
    echo "FAIL  ${description} — header '${header_name}' missing (${BASE_URL}${path})"
    fail_count=$((fail_count + 1))
  fi
  rm -f /tmp/smoke-test-err.$$
}

echo "Smoke-testing ${BASE_URL}"
echo "---"

check "home page loads"                    "/"                      "200" "TEKMESIS"
check "/topics loads"                      "/topics"                "200"
check "/methodology loads"                 "/methodology"           "200"
check "/sources loads"                     "/sources"               "200"
check "/privacy loads"                     "/privacy"               "200"
check "/legal loads"                       "/legal"                 "200"
check "/about loads"                       "/about"                 "200"
check "/example-report loads"              "/example-report"        "200"
check "/checkout/success loads"            "/checkout/success"      "200"
check "/checkout/cancel loads"             "/checkout/cancel"       "200"
check "/search with no question shows the no-question state" "/search" "200"
check "admin is gated (redirects unauthenticated requests)" "/admin" "307"

check_header "CSP header present"                     "/" "Content-Security-Policy"
check_header "X-Frame-Options present"                "/" "X-Frame-Options"
check_header "X-Content-Type-Options present"         "/" "X-Content-Type-Options"
check_header "Strict-Transport-Security present"      "/" "Strict-Transport-Security"

check "cron route rejects an unauthorized request" "/api/cron/expire-reports" "401"

echo "---"
echo "${pass_count} passed, ${fail_count} failed"

if [ "$fail_count" -gt 0 ]; then
  exit 1
fi
