#!/bin/sh
# KOANO pre-push build gate.
#
# Runs a FULL production build (`next build` — which includes ESLint, type
# checking, AND static generation), so a lint/type/build error can never reach a
# Vercel deploy again. tsc + the doc harnesses alone are NOT enough: the ESLint
# no-unused-vars rule that broke a deploy is only caught by the build.
#
# Builds to an ISOLATED dir so it never corrupts a running `next dev` server's
# .next. Non-zero exit blocks the push.
set -u
DIST=.next-prepush
echo "[prepush] full production build gate (isolated: $DIST) …"
KOANO_DIST_DIR="$DIST" npx next build
status=$?
rm -rf "$DIST"
# Next appends the isolated dir's types to tsconfig `include` on build; restore
# it so the gate leaves zero working-tree churn. (tsconfig is not hand-edited.)
git checkout -- tsconfig.json >/dev/null 2>&1 || true
if [ "$status" -ne 0 ]; then
  echo "[prepush] ✗ BUILD FAILED — push blocked. Fix the build, then push again."
else
  echo "[prepush] ✓ build clean — push may proceed."
fi
exit "$status"
