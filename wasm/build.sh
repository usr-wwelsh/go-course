#!/usr/bin/env bash
# Builds the browser WASM binary and stages it with wasm_exec.js for the site.
set -euo pipefail
cd "$(dirname "$0")"

out_dir="../site/public"
mkdir -p "$out_dir"

GOOS=js GOARCH=wasm go build -o "$out_dir/runner.wasm" .
cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" "$out_dir/wasm_exec.js" 2>/dev/null \
  || cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" "$out_dir/wasm_exec.js"

echo "built $out_dir/runner.wasm ($(du -h "$out_dir/runner.wasm" | cut -f1))"
