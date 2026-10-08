'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const sharp = require('sharp');
const {parseIcon} = require('./workspace');

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const home = os.userInfo().homedir;
const omarchyConfig = path.join(home, '.config/omarchy/shell.json');

async function readSmallFile(filename, limit = MAX_FILE_BYTES) {
  if (typeof filename !== 'string' || !path.isAbsolute(filename) || filename.length > 4096 || filename.includes('\0')) return null;
  let file;
  try {
    file = await fs.promises.open(filename, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK);
    const stat = await file.stat();
    if (!stat.isFile() || stat.size < 1 || stat.size > limit) return null;
    return await file.readFile();
  } catch {
    return null;
  } finally {
    await file?.close();
  }
}

function isRasterImage(bytes) {
  const png = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const webp = bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  return png || jpeg || webp;
}

async function imageFromPath(filename) {
  const bytes = await readSmallFile(filename);
  if (!bytes || !isRasterImage(bytes)) return null;
  try {
    const png = await sharp(bytes, {limitInputPixels: 1024 * 1024, failOn: 'error'})
      .resize(96, 80, {fit: 'contain', background: '#00000000'})
      .png().toBuffer();
    return parseIcon(`data:image/png;base64,${png.toString('base64')}`);
  } catch {
    return null;
  }
}

async function imageFromGlyph(glyph) {
  const escaped = glyph.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="120"><text x="72" y="90" fill="#ffffff" text-anchor="middle" font-family="JetBrainsMono Nerd Font" font-size="68">${escaped}</text></svg>`;
  try {
    const {data, info} = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({resolveWithObject: true});
    let left = info.width, top = info.height, right = -1, bottom = -1;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * info.channels + 3] < 16) continue;
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    if (right < left) return null;
    const png = await sharp(data, {raw: info})
      .extract({left, top, width: right - left + 1, height: bottom - top + 1})
      .resize(96, 80, {fit: 'contain', background: '#00000000'})
      .png().toBuffer();
    return parseIcon(`data:image/png;base64,${png.toString('base64')}`);
  } catch {
    return null;
  }
}

function omarchyLabel(config, workspace) {
  const widgets = config?.bar?.layout?.left;
  if (!Array.isArray(widgets)) return null;
  const widget = widgets.find(item => item?.id === 'io.github.wbuf81.workspace-labels');
  const label = widget?.labels?.[String(workspace)];
  if (!label || typeof label !== 'object') return null;
  const icon = typeof label.icon === 'string' ? label.icon : '';
  const name = typeof label.name === 'string' ? label.name.slice(0, 18) : '';
  return {icon, name};
}

async function readOmarchyLabel(workspace, filename = omarchyConfig) {
  const bytes = await readSmallFile(filename, 1024 * 1024);
  if (!bytes) return null;
  try { return omarchyLabel(JSON.parse(bytes.toString('utf8')), workspace); }
  catch { return null; }
}

function appIconPath(name) {
  if (typeof name !== 'string' || !/^[A-Za-z0-9._-]{1,128}$/.test(name) || name === '.' || name === '..') return null;
  const bases = [path.join(home, '.local/share/icons/hicolor'), '/usr/share/icons/hicolor'];
  const sizes = ['scalable', '128x128', '96x96', '64x64', '48x48'];
  const candidates = [path.join(home, '.local/share/pixmaps', `${name}.png`), `/usr/share/pixmaps/${name}.png`];
  for (const base of bases) for (const size of sizes) candidates.push(path.join(base, size, 'apps', `${name}.png`));
  return candidates.find(candidate => fs.existsSync(candidate)) || null;
}

async function iconForSettings(settings, workspace, configPath = omarchyConfig) {
  const mode = settings.iconMode || (settings.icon ? 'upload' : 'default');
  if (mode === 'upload') return {icon: parseIcon(settings.icon), label: null};
  if (mode === 'path') return {icon: await imageFromPath(settings.iconPath), label: null};
  if (mode !== 'omarchy') return {icon: null, label: null};
  const entry = await readOmarchyLabel(workspace, configPath);
  if (!entry) return {icon: null, label: null};
  if (entry.icon.startsWith('app:')) {
    const value = entry.icon.slice(4);
    const filename = path.isAbsolute(value) ? value : appIconPath(value);
    return {icon: filename ? await imageFromPath(filename) : null, label: entry.name};
  }
  const glyph = [...entry.icon];
  return {icon: glyph.length > 0 && glyph.length <= 4 && !/[\x00-\x1f\x7f]/.test(entry.icon) ? await imageFromGlyph(entry.icon) : null, label: entry.name};
}

module.exports = {imageFromPath, imageFromGlyph, readOmarchyLabel, iconForSettings, omarchyConfig};
