const test=require('node:test');
const assert=require('node:assert/strict');
const {parseWorkspace,workspaceFromEvent,buttonSvg}=require('../plugin/com.community.hyprland-workspaces.sdPlugin/workspace');
test('validates workspace IDs',()=>{assert.equal(parseWorkspace('8'),8);assert.equal(parseWorkspace('0'),1);assert.equal(parseWorkspace('1;rm -rf /'),1);});
test('decodes Hyprland workspace events',()=>{assert.equal(workspaceFromEvent('workspacev2>>8,8'), '8');assert.equal(workspaceFromEvent('activewindow>>foo'),null);});
test('white border only active',()=>{assert.match(buttonSvg(2,true),/stroke="#ffffff" stroke-width="7"/);assert.match(buttonSvg(2,false),/stroke="#202127" stroke-width="1"/);});
test('escapes labels',()=>{assert.ok(buttonSvg(1,true,'<abc>').includes('&lt;abc&gt;'));});
