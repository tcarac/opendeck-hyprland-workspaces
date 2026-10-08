const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');

test('reinstall updates the plugin without nesting it or changing profiles', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'opendeck-install-'));
  t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
  const bin = path.join(dir, 'bin');
  const config = path.join(dir, 'config');
  fs.mkdirSync(bin);
  for (const command of ['npm', 'hyprctl']) {
    const filename = path.join(bin, command);
    fs.writeFileSync(filename, '#!/bin/sh\nexit 0\n', {mode:0o755});
  }
  const env = {...process.env, XDG_CONFIG_HOME:config, PATH:`${bin}:${process.env.PATH}`};
  const install = () => execFileSync('bash', ['scripts/install.sh'], {cwd:path.join(__dirname,'..'),env});
  install();
  const target = path.join(config, 'opendeck/plugins/com.community.hyprland-workspaces.sdPlugin');
  fs.writeFileSync(path.join(target, 'plugin.js'), 'stale');
  const profile = path.join(config, 'opendeck/profiles/keep.json');
  fs.mkdirSync(path.dirname(profile), {recursive:true});
  fs.writeFileSync(profile, 'unchanged');
  install();
  assert.equal(fs.readFileSync(path.join(target, 'plugin.js'), 'utf8'), fs.readFileSync(path.join(__dirname, '../plugin/com.community.hyprland-workspaces.sdPlugin/plugin.js'), 'utf8'));
  assert.equal(fs.existsSync(path.join(target, 'icons.js')), true);
  assert.equal(fs.existsSync(path.join(target, 'com.community.hyprland-workspaces.sdPlugin')), false);
  assert.equal(fs.readFileSync(profile, 'utf8'), 'unchanged');
});
