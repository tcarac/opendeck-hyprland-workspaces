# OpenDeck Hyprland Workspaces

An open-source **OpenDeck plugin** for Hyprland and Omarchy. Press a Stream Deck / compatible SOOMFON controller button to switch workspaces. The active workspace gets a **white border**, which also updates when you switch using keyboard shortcuts or other tools.

> **Status:** v0.1.0 preview. Unit-tested, **not yet hardware-tested** on SOOMFON or OpenDeck. The images currently use built-in monitor/number artwork rather than importing your Omarchy `workspace-labels` glyphs. Contributions welcome.

## Features

- Workspace buttons for any positive workspace number (1–999)
- Active workspace highlighted using a white border
- Updates via Hyprland's `.socket2.sock` `workspacev2` events
- Switching via `hyprctl dispatch 'hl.dsp.focus({ workspace = "8" })'` for Lua-dispatch Omarchy builds
- Per-button workspace and label settings in OpenDeck's property inspector
- Reconnects to Hyprland IPC if the socket disconnects
- No direct SOOMFON hardware access: depends on a working OpenDeck device adapter

## Install (Omarchy / Arch)

Requires Node.js 20+, npm, `hyprctl`, and OpenDeck installed natively (recommended). Clone or extract this repository, then:

```sh
npm test
bash scripts/install.sh
```

For Flatpak OpenDeck, try `bash scripts/install.sh --flatpak` (Hyprland socket access from the Flatpak/plugin may need additional permissions).

**Restart OpenDeck.** Add the **Switch Workspace** action from **Hyprland Workspaces** to the first three SOOMFON buttons. Configure them as workspaces **1**, **2**, and **3**. Do not overwrite the existing OpenDeck profile JSON by hand.

## How it works

The plugin talks to OpenDeck over its plugin WebSocket. It runs `hyprctl` on key press, listens to Hyprland's event socket, renders button images as 144×144 PNGs, and sends the image to OpenDeck via `setImage`.

## Limitations

- Verified only by unit tests; actual OpenDeck plugin loading and device rendering need testing.
- Uses `HYPRLAND_INSTANCE_SIGNATURE` inherited from OpenDeck. If OpenDeck was started outside the Hyprland session or in a restrictive sandbox, socket detection may fail.
- The `hl.dsp.focus` dispatcher targets the user's reported Omarchy setup; stock Hyprland may require the legacy `workspace` dispatcher instead.
- `workspacev2` events apply to focus changes; multi-monitor behavior may need refinement.
- SVG/PNG images from your `workspace-labels` plugin are **not** automatically imported yet.
- OpenDeck software compatibility varies across versions. If the inspector does not save settings or the plugin fails to load, see OpenDeck plugin logs.

## Development

```sh
npm install
npm test
```

Project files:
- `plugin/com.community.hyprland-workspaces.sdPlugin/` — Stream Deck plugin manifest, runtime, property inspector
- `tests/` — core tests
- `scripts/install.sh` — native/Flatpak installation

## License

MIT. Not affiliated with OpenDeck, Omarchy, Hyprland, SOOMFON, or Elgato.


## Open-source development and AI-assisted contributions

The repo includes `AGENTS.md` and `.github/copilot-instructions.md` so Copilot, Codex and other agents can follow the same development rules. GitHub Actions runs a Node.js test matrix, CodeQL scanning and PR dependency review; Dependabot proposes dependency and Actions updates. AI agents may prepare PRs, but **human review is required** for merge and releases. See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [RELEASE.md](RELEASE.md).

Maintainers should enable branch rulesets (required CI, review before merge, block force pushes), Dependabot and CodeQL alerts, and private vulnerability reporting in repository settings. For supply-chain hardening, pin third-party GitHub Actions to verified full commit SHAs before a stable release.

### Local repository convention
Clone into `~/Work/opendeck-hyprland-workspaces` on your workstation. No script needs to run as root.
