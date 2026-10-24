#!/bin/bash
# macOS: double-click in Finder. First time: right-click > Open if Gatekeeper complains.
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20+ is required."
  if command -v brew >/dev/null 2>&1; then
    read -r -p "Install it with Homebrew now? [Y/n] " a
    case "$a" in [nN]*) exit 1;; esac
    brew install node || exit 1
  else
    echo "Install it from https://nodejs.org (LTS) and run this again."; read -r -p "Press Enter to close"; exit 1
  fi
fi
node tools/launch.mjs "$@" || { echo; echo "The portal stopped with an error - see above."; read -r -p "Press Enter to close"; }
