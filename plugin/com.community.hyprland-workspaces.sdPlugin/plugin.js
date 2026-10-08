#!/usr/bin/env node
'use strict';
const WebSocket = require('ws');
const sharp = require('sharp');
const { execFile, spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { parseWorkspace, workspaceFromEvent, buttonSvg } = require('./workspace');
const pluginDir = __dirname;
const args = Object.fromEntries(process.argv.slice(2).reduce((out, val, index, arr) => {
  if (val.startsWith('-')) out.push([val, arr[index + 1]]);
  return out;
}, []));
const port = Number(args['-port']);
if (!port || !args['-pluginUUID'] || !args['-registerEvent']) {
  console.error('Missing OpenDeck plugin registration arguments');
  process.exit(1);
}
const ws = new WebSocket(`ws://127.0.0.1:${port}`);
const instances = new Map();
let activeWorkspace = null;
let monitorProcess;
let reconnectDelay = 1000;
let stopped = false;
function send(message) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message)); }
function queryWorkspace() {
  execFile('hyprctl', ['-j', 'activeworkspace'], {timeout:3000}, (err, stdout) => {
    if (err) return console.error('Cannot query Hyprland workspace:', err.message);
    try { updateActive(String(JSON.parse(stdout).id)); } catch (e) { console.error(e.message); }
  });
}
function updateActive(id) {
  if (id === activeWorkspace) return;
  activeWorkspace = id;
  renderAll();
}
async function render(context, settings) {
  const workspace = parseWorkspace(settings.workspace);
  const isActive = String(workspace) === activeWorkspace;
  const svg = buttonSvg(workspace, isActive, settings.label);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  send({event:'setImage',context,payload:{image:`data:image/png;base64,${png.toString('base64')}`,target:0}});
}
function renderAll() {
  for (const [context, settings] of instances) render(context, settings).catch(console.error);
}
function startMonitor() {
  const runtime = process.env.XDG_RUNTIME_DIR || `/run/user/${process.getuid()}`;
  const signature = process.env.HYPRLAND_INSTANCE_SIGNATURE;
  if (!signature) { console.error('HYPRLAND_INSTANCE_SIGNATURE missing; retrying'); return retryMonitor(); }
  const socketPath = path.join(runtime,'hypr',signature,'.socket2.sock');
  if (!fs.existsSync(socketPath)) { console.error('Hyprland socket not available:',socketPath); return retryMonitor(); }
  const net = require('node:net');
  const conn = net.createConnection(socketPath);
  monitorProcess = conn;
  let buffered = '';
  conn.on('connect', () => {reconnectDelay=1000; queryWorkspace();});
  conn.on('data', chunk => {
    buffered += chunk.toString();
    const lines = buffered.split('\n'); buffered = lines.pop();
    for (const line of lines) {
      const next = workspaceFromEvent(line);
      if (next != null) updateActive(next);
    }
  });
  conn.on('error', err=>console.error('Hyprland IPC:',err.message));
  conn.on('close',()=>{if (!stopped) retryMonitor();});
}
function retryMonitor(){if(stopped)return;setTimeout(startMonitor,reconnectDelay).unref(); reconnectDelay=Math.min(15000,reconnectDelay*2);}
function handleMessage(msg){
  const ctx=msg.context;
  if (msg.event==='willAppear' || msg.event==='didReceiveSettings'){
    const existing=instances.get(ctx)||{};
    const settings={...existing,...(msg.payload?.settings||{})};
    instances.set(ctx,settings);
    render(ctx,settings).catch(console.error);
    if (activeWorkspace===null) queryWorkspace();
  } else if (msg.event==='willDisappear') {instances.delete(ctx);}
  else if (msg.event==='keyDown') {
    const settings={...(instances.get(ctx)||{}),...(msg.payload?.settings||{})};
    const workspace=parseWorkspace(settings.workspace);
    execFile('hyprctl',['dispatch',`hl.dsp.focus({ workspace = "${workspace}" })`],{timeout:3000},(err)=>{
      if(err) console.error('Workspace switch failed:',err.message);
      queryWorkspace();
    });
  }
}
ws.on('open',()=>{
  send({event:args['-registerEvent'],uuid:args['-pluginUUID']});
  startMonitor();queryWorkspace();
});
ws.on('message',raw=>{try{handleMessage(JSON.parse(raw.toString()));}catch(e){console.error(e);}});
ws.on('close',()=>{stopped=true;monitorProcess?.destroy();});
ws.on('error',err=>console.error('OpenDeck WebSocket:',err.message));
