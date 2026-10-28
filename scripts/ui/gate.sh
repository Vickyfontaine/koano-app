#!/bin/sh
# UI-sprint commit gate: the same checks as the pre-push hook (full isolated
# production build, which includes type-check + ESLint, then the offline verdict
# fixture replay), runnable before each slice commit.
set -u
cd "$(dirname "$0")/../.."
DIST=.next-gate
KOANO_DIST_DIR="$DIST" npx next build > build-log/gate.log 2>&1
status=$?
rm -rf "$DIST"
git checkout -- tsconfig.json >/dev/null 2>&1 || true
if [ "$status" -ne 0 ]; then echo "GATE: build FAILED"; grep -n "error\|Error" build-log/gate.log | head -20; exit 1; fi
npx tsx scripts/test-fixture.ts >> build-log/gate.log 2>&1
fx=$?
if [ "$fx" -ne 0 ]; then echo "GATE: fixture FAILED"; tail -20 build-log/gate.log; exit 1; fi
npx tsx scripts/test-determinism.ts >> build-log/gate.log 2>&1
dt=$?
if [ "$dt" -ne 0 ]; then echo "GATE: determinism proof FAILED"; tail -20 build-log/gate.log; exit 1; fi
npx tsx scripts/test-dob-jobs.ts >> build-log/gate.log 2>&1 || { echo "GATE: DOB jobs test FAILED"; tail -20 build-log/gate.log; exit 1; }
npx tsx scripts/test-em-dash.ts >> build-log/gate.log 2>&1
ed=$?
if [ "$ed" -ne 0 ]; then echo "GATE: em-dash test FAILED"; tail -20 build-log/gate.log; exit 1; fi
echo "GATE: green (build + fixture + determinism + em dash)"
