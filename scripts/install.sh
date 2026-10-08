#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAME=com.community.hyprland-workspaces.sdPlugin
DEST="${XDG_CONFIG_HOME:-$HOME/.config}/opendeck/plugins/$NAME"
if [[ "${1:-}" == "--flatpak" ]]; then DEST="$HOME/.var/app/me.amankhanna.opendeck/config/opendeck/plugins/$NAME"; fi
command -v npm >/dev/null || { echo 'Requires Node.js and npm' >&2; exit 1; }
command -v hyprctl >/dev/null || { echo 'Requires Hyprland/hyprctl' >&2; exit 1; }
mkdir -p "$(dirname "$DEST")"
cp -r "$ROOT/plugin/$NAME" "$DEST"
cp "$ROOT/package.json" "$DEST/package.json"
(cd "$DEST" && npm install --omit=dev --no-audit --no-fund)
chmod +x "$DEST/plugin.js"
echo "Installed to $DEST. Restart OpenDeck, then add Hyprland Workspaces → Switch Workspace to your buttons."
