'use strict';
function parseWorkspace(raw) {
  const value = String(raw ?? '1');
  if (!/^[1-9][0-9]{0,2}$/.test(value)) return 1;
  return Number(value);
}
function parseActiveWorkspace(raw) {
  if (typeof raw !== 'number' && typeof raw !== 'string') return null;
  const value = String(raw);
  if (!/^[1-9][0-9]*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? String(id) : null;
}
function parseIcon(raw) {
  if (typeof raw !== 'string' || raw.length > 180050) return null;
  const match = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(raw);
  if (!match || match[1].length > 180000) return null;
  const png = Buffer.from(match[1], 'base64');
  if (png.length < 24 || png.length > 131072) return null;
  if (!png.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return null;
  if (png.toString('ascii', 12, 16) !== 'IHDR') return null;
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (!width || !height || width > 1024 || height > 1024) return null;
  return raw;
}
function workspaceFromEvent(line) {
  // Hyprland socket2 events: workspacev2>>ID,NAME; focusedmon>>MONITOR,WORKSPACENAME
  if (line.startsWith('workspacev2>>')) {
    const id = line.slice('workspacev2>>'.length).split(',')[0];
    return parseActiveWorkspace(id);
  }
  if (line.startsWith('workspace>>')) return null; // name may be non-numeric; query instead
  return null;
}
function escapeXml(s) {return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
function buttonSvg(workspace, active, label, icon) {
  const text=escapeXml(String(label || `WS ${workspace}`).slice(0,18));
  const artwork = typeof icon === 'string' && parseIcon(icon) ? `<image href="${icon}" x="22" y="20" width="100" height="92" preserveAspectRatio="xMidYMid meet"/>` : '<rect x="39" y="42" width="66" height="48" rx="4" fill="none" stroke="#e5e5e5" stroke-width="4"/><path d="M72 91v12m-24 0h48" stroke="#e5e5e5" stroke-width="4" stroke-linecap="round"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144"><rect width="144" height="144" rx="17" fill="#202127"/><rect x="5" y="5" width="134" height="134" rx="13" fill="none" stroke="${active?'#ffffff':'#202127'}" stroke-width="${active?7:1}"/>${artwork}<text x="72" y="126" fill="#aaaaaa" text-anchor="middle" font-family="sans-serif" font-size="11">${text}</text></svg>`;
}
module.exports={parseWorkspace,parseActiveWorkspace,parseIcon,workspaceFromEvent,buttonSvg};
