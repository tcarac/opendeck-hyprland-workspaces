const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const sharp = require('sharp');
const {imageFromPath, imageFromGlyph, readOmarchyLabel, iconForSettings} = require('../plugin/com.community.hyprland-workspaces.sdPlugin/icons');
const {parseIcon, buttonSvg} = require('../plugin/com.community.hyprland-workspaces.sdPlugin/workspace');

test('resolves image paths and Omarchy workspace glyphs', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-icons-'));
  t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
  const imagePath = path.join(dir, 'icon.png');
  const configPath = path.join(dir, 'shell.json');
  fs.writeFileSync(imagePath, await sharp({create:{width:16,height:16,channels:4,background:'#ff0000'}}).png().toBuffer());
  fs.writeFileSync(configPath, JSON.stringify({bar:{layout:{left:[{id:'io.github.wbuf81.workspace-labels',labels:{'2':{icon:'',name:'Home'},'4':{icon:`app:${imagePath}`,name:'Music'}}}]}}}));
  assert.equal(await imageFromPath('relative/icon.png'), null);
  assert.equal(parseIcon(await imageFromPath(imagePath)) !== null, true);
  assert.deepEqual(await readOmarchyLabel(2, configPath), {icon:'',name:'Home'});
  const home = await iconForSettings({iconMode:'omarchy'}, 2, configPath);
  assert.equal(parseIcon(home.icon) !== null, true);
  assert.equal(home.label, 'Home');
  const app = await iconForSettings({iconMode:'omarchy'}, 4, configPath);
  assert.equal(parseIcon(app.icon) !== null, true);
  assert.equal(app.label, 'Music');
  const rendered = await sharp(Buffer.from(buttonSvg(2,true,'', home.icon))).metadata();
  assert.equal(rendered.width,144);
  assert.equal(rendered.height,144);
});

test('centers visible Omarchy glyph pixels in the button artwork area', async () => {
  for (const glyph of ['󰚩', '', '']) {
    const icon = await imageFromGlyph(glyph);
    assert.ok(icon);
    const {data, info} = await sharp(Buffer.from(buttonSvg(1, false, 'Code', icon))).raw().toBuffer({resolveWithObject: true});
    let left = 144, right = -1, top = 144, bottom = -1;
    for (let y = 15; y < 110; y++) for (let x = 15; x < 129; x++) {
      const index = (y * info.width + x) * info.channels;
      if (data[index] < 180 || data[index + 1] < 180 || data[index + 2] < 180) continue;
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    assert.ok(Math.abs((left + right) / 2 - 72) <= 2, `${glyph} horizontal center`);
    assert.ok(Math.abs((top + bottom) / 2 - 66) <= 2, `${glyph} vertical center`);
  }
});

test('invalid path images and Omarchy data fall back to built-in artwork', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-icons-'));
  t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
  const textFile = path.join(dir, 'not-an-image.png');
  const configPath = path.join(dir, 'shell.json');
  fs.writeFileSync(textFile, 'not an image');
  fs.writeFileSync(configPath, 'not json');
  assert.equal(await imageFromPath(textFile), null);
  assert.equal(await readOmarchyLabel(1, configPath), null);
  assert.deepEqual(await iconForSettings({iconMode:'omarchy'}, 1, configPath), {icon:null,label:null});
});
