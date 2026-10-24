#!/bin/sh
# Linux / WSL / any POSIX shell: ./start-uit-portal.sh
cd "$(dirname "$0")" || exit 1
command -v node >/dev/null 2>&1 || { echo "Node.js 20+ is required: https://nodejs.org"; exit 1; }
exec node tools/launch.mjs "$@"
