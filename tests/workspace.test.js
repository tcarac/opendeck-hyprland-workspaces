const test=require('node:test');
const assert=require('node:assert/strict');
const sharp=require('sharp');
const {parseWorkspace,parseActiveWorkspace,parseIcon,workspaceFromEvent,buttonSvg}=require('../plugin/com.community.hyprland-workspaces.sdPlugin/workspace');
test('validates workspace IDs',()=>{assert.equal(parseWorkspace('8'),8);assert.equal(parseWorkspace('0'),1);assert.equal(parseWorkspace('1;rm -rf /'),1);});
test('decodes Hyprland workspace events',()=>{assert.equal(workspaceFromEvent('workspacev2>>8,8'), '8');assert.equal(workspaceFromEvent('activewindow>>foo'),null);});
test('rejects invalid active workspace IDs from Hyprland',()=>{
  for (const value of [0,-1,1.5,'0','-1','1.5','Infinity','9007199254740992',null,{},'1;echo unsafe']) {
    assert.equal(parseActiveWorkspace(value),null);
  }
  assert.equal(parseActiveWorkspace(8),'8');
  assert.equal(parseActiveWorkspace('1000'),'1000');
  assert.equal(workspaceFromEvent('workspacev2>>0,0'),null);
  assert.equal(workspaceFromEvent('workspacev2>>-2,special'),null);
  assert.equal(workspaceFromEvent('workspacev2>>9007199254740992,huge'),null);
});
test('white border only active',()=>{assert.match(buttonSvg(2,true),/stroke="#ffffff" stroke-width="7"/);assert.match(buttonSvg(2,false),/stroke="#202127" stroke-width="1"/);});
test('escapes labels',()=>{assert.ok(buttonSvg(1,true,'<abc>').includes('&lt;abc&gt;'));});
test('renders a custom icon inside the active border',async()=>{
  const png=await sharp({create:{width:16,height:16,channels:4,background:'#ff0000'}}).png().toBuffer();
  const icon=`data:image/png;base64,${png.toString('base64')}`;
  assert.equal(parseIcon(icon),icon);
  const {data,info}=await sharp(Buffer.from(buttonSvg(2,true,'Home',icon))).raw().toBuffer({resolveWithObject:true});
  const pixel=(x,y)=>[...data.subarray((y*info.width+x)*info.channels,(y*info.width+x)*info.channels+3)];
  assert.deepEqual(pixel(72,50),[255,0,0]);
  assert.deepEqual(pixel(5,72),[255,255,255]);
  assert.deepEqual(pixel(72,115),[32,33,39]);
  assert.equal(buttonSvg(2,true,'Home',icon).includes('>2</text>'),false);
});
test('rejects malformed or oversized icon settings',()=>{
  for(const icon of [null,'/home/user/icon.png','data:image/svg+xml;base64,PHN2Zz4=','data:image/png;base64,AAAA','data:image/png;base64,'+'A'.repeat(180004)])assert.equal(parseIcon(icon),null);
});
