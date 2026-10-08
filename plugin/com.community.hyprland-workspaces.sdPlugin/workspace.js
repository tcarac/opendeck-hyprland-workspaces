'use strict';
function parseWorkspace(raw) {
  const value = String(raw ?? '1');
  if (!/^[1-9][0-9]{0,2}$/.test(value)) return 1;
  return Number(value);
}
function workspaceFromEvent(line) {
  // Hyprland socket2 events: workspacev2>>ID,NAME; focusedmon>>MONITOR,WORKSPACENAME
  if (line.startsWith('workspacev2>>')) {
    const id = line.slice('workspacev2>>'.length).split(',')[0];
    return /^-?\d+$/.test(id) ? String(Number(id)) : null;
  }
  if (line.startsWith('workspace>>')) return null; // name may be non-numeric; query instead
  return null;
}
function escapeXml(s) {return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
function buttonSvg(workspace, active, label) {
  const number=escapeXml(workspace);
  const text=escapeXml(String(label || `WS ${workspace}`).slice(0,18));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144"><rect width="144" height="144" rx="17" fill="#202127"/><rect x="5" y="5" width="134" height="134" rx="13" fill="none" stroke="${active?'#ffffff':'#202127'}" stroke-width="${active?7:1}"/><rect x="44" y="28" width="56" height="43" rx="4" fill="none" stroke="#e5e5e5" stroke-width="4"/><path d="M72 72v9m-19 0h38" stroke="#e5e5e5" stroke-width="4" stroke-linecap="round"/><text x="72" y="105" fill="#ffffff" text-anchor="middle" font-family="sans-serif" font-size="17" font-weight="bold">${number}</text><text x="72" y="125" fill="#aaaaaa" text-anchor="middle" font-family="sans-serif" font-size="11">${text}</text></svg>`;
}
module.exports={parseWorkspace,workspaceFromEvent,buttonSvg};
