import { load, save, requestPersist, exportData, importData } from '../services/storage.js';
import { home, orders, stock, finance, clientsView, settings } from '../components/views.js';
import { initSheets, ask } from '../components/sheets.js';
import { icon, today } from '../components/ui.js';
import { toCents } from '../lib/money.js';

let S = load();
const ui = { tab: 'home', f: 'all', p: 'all' }, $ = (s) => document.querySelector(s);
const VIEWS = { home, ord: orders, stk: stock, fin: finance, cli: clientsView, cfg: settings };
const TABS = [['home', 'Início', 'house'], ['ord', 'Pedidos', 'bag'], ['new', 'Novo pedido', 'plus'], ['stk', 'Estoque', 'pkg'], ['fin', 'Caixa', 'wallet'], ['cli', 'Clientes', 'users']];
let tt; const toast = (m) => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2000); };
function render() { $('#view').innerHTML = VIEWS[ui.tab](S, ui); $('#bar').querySelectorAll('[data-t]').forEach((b) => b.classList.toggle('on', b.dataset.t === ui.tab)); }
function commit(next, redraw = true) { S = next; if (!save(S)) toast('Não foi possível salvar neste aparelho'); if (redraw) render(); }
const go = (t) => { ui.tab = t; render(); scrollTo(0, 0); $('#view').style.animation = 'none'; void $('#view').offsetWidth; $('#view').style.animation = ''; };
const sh = initSheets({ S: () => S, commit, toast, go });

$('#bar').innerHTML = TABS.map(([t, l, i]) => t === 'new' ? `<button class="fab" data-a="new" aria-label="Novo pedido">${icon(i, 24)}<span>${l}</span></button>` : `<button data-a="tab" data-t="${t}">${icon(i, 22)}<span>${l}</span></button>`).join('');
const A = {
  tab: (d) => go(d.t), new: () => sh.orderForm(), open: (d) => sh.detail(d.id), prod: () => sh.prodForm(),
  filter: (d) => { ui.f = d.k; render(); }, period: (d) => { ui.p = d.k; render(); },
  addflavor: () => { const n = $('#nf').value.trim(), p = toCents($('#np').value); if (!n) return toast('Informe o nome do sabor'); if (!(p >= 0)) return toast('Preço inválido');
    commit({ ...S, flavors: [...S.flavors, { id: 'f' + Date.now().toString(36), name: n, priceCents: p }] }); toast('Sabor adicionado'); },
  export: () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([exportData(S)], { type: 'application/json' })); a.download = `citrica-e-doce-backup-${today()}.json`; a.click(); },
  import: () => $('#imp').click(),
};
document.addEventListener('click', (e) => { const el = e.target.closest('[data-a]'); if (el) A[el.dataset.a]?.(el.dataset); });
document.addEventListener('change', (e) => {
  const el = e.target, c = el.dataset.c; if (!c) return;
  if (c === 'set') commit({ ...S, settings: { ...S.settings, [el.dataset.k]: el.value.trim() } }, false);
  else if (c === 'fprice') commit({ ...S, flavors: S.flavors.map((f) => f.id === el.dataset.id ? { ...f, priceCents: Math.max(0, toCents(el.value) || 0) } : f) }, false);
  else if (c === 'tomake') commit({ ...S, toMake: Math.max(0, parseInt(el.value) || 0) });
  else if (c === 'low') commit({ ...S, low: Math.max(0, parseInt(el.value) || 0) });
});
document.addEventListener('change', (e) => { if (e.target.id !== 'imp' || !e.target.files[0]) return; const r = new FileReader();
  r.onload = () => { try { const next = importData(r.result); ask('Substituir todos os dados atuais pelo backup?', () => { commit(next); toast('Backup importado'); }, 'Importar'); } catch (x) { toast(x.message); } }; r.readAsText(e.target.files[0]); e.target.value = ''; });

render(); requestPersist();
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
