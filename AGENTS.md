# Agent instructions

This repository is a small OpenDeck plugin connecting Stream Deck-compatible controllers to Hyprland.

## Ground rules
- Never invent protocol fields: consult the OpenDeck Stream Deck plugin protocol and test with captured messages.
- Treat Hyprland socket payloads, settings and process environment as untrusted input. Only accept positive integer workspace IDs.
- Never shell-interpolate user input; use `execFile` with argument arrays.
- Preserve compatibility with Omarchy's Lua dispatcher and explain stock Hyprland differences.
- Do not silently change unrelated OpenDeck profile buttons or icons.
- AI changes require human review; never auto-merge, auto-publish, or run untrusted PR code with privileged tokens.

## Validation
- `npm install`, then `npm test`
- `node --check plugin/com.community.hyprland-workspaces.sdPlugin/plugin.js`
- Test the actual OpenDeck and SOOMFON device before claiming hardware compatibility.

## Architecture
- `plugin/**/plugin.js`: OpenDeck WebSocket connection + Hyprland IPC + button rendering.
- `plugin/**/workspace.js`: validation, event parsing, SVG generation.
- `plugin/**/inspector.html`: button settings inspector.
- `scripts/install.sh`: local install helper.
- `tests/`: no hardware required.

## PR expectations
Explain behavior, test output, compatibility impact, security considerations, and manual hardware test status. Keep changes narrowly scoped and add tests for behavioral changes.
