import { summary, activeOrders, orderTotal, orderPaid, payStatus, soldUnits, producedTotal, availableUnits } from '../lib/domain.js';
import { formatBRL as brl } from '../lib/money.js';
import { waNumber } from '../lib/messages.js';
import { icon, esc, fd, short, PAY, DELIVERY } from './ui.js';

const COLORS = ['#ebc8e0', '#cadbc7', '#f4eda0', '#d0d2f2', '#ffffff'];
const items = (S, o) => o.items.map((i) => `${i.qty}× ${short(S, i.flavorId)}`).join(' · ');
const status = (o) => o.cancelled ? '<span class="st bd"><i class="dot"></i>Cancelado</span>'
  : `<span class="st ${payStatus(o) === 'pago' ? 'ok' : 'wn'}"><i class="dot"></i>${PAY[payStatus(o)]}</span><span class="st ${o.delivery === 'entregue' ? 'ok' : ''}"><i class="dot"></i>${DELIVERY[o.delivery]}</span>${o.items.some((i) => i.flavorId === 'indefinido') ? '<span class="st bd">Completar sabor</span>' : ''}`;
const orderRow = (S, o) => `<button class="row" data-a="open" data-id="${o.id}"><span class="grow"><b>${esc(o.client)}</b><small>${esc(items(S, o))}</small><span class="sts">${status(o)}</span></span><b class="amt">${brl(orderTotal(o))}</b></button>`;
const line = (label, val, tab) => `<button class="row" data-a="tab" data-t="${tab}"><span class="grow">${label}</span><b>${val}</b>${icon('next', 16)}</button>`;
const mv = (S, m) => `<div class="row"><span class="grow"><b style="text-transform:capitalize">${m.type}</b><small>${new Date(m.at).toLocaleDateString('pt-BR')} · ${esc(short(S, m.flavorId))}${m.ref ? ' · ' + esc(m.ref) : ''}</small></span><b>${m.qty > 0 ? '+' : ''}${m.qty}</b></div>`;
function bars(S, from) {
  const rows = S.flavors.map((f) => ({ f, n: from(f.id) })).filter((r) => r.n || !r.f.system), tot = Math.max(1, rows.reduce((a, r) => a + r.n, 0));
  return `<div class="bars">${rows.map((r, i) => { const p = Math.round(r.n / tot * 100); return `<div class="bc"><em>${p}%</em><i style="height:${p * .8}%;background:${COLORS[i % 5]}"></i></div>`; }).join('')}</div><div class="lg">${rows.map((r, i) => `<span style="--c:${COLORS[i % 5]}">${esc(short(S, r.f.id))} · ${r.n}</span>`).join('')}</div>`;
}

export function home(S) {
  const m = summary(S), L = activeOrders(S), h = new Date().getHours();
  const open = L.filter((o) => o.delivery !== 'entregue' || payStatus(o) !== 'pago').length;
  return `<header class="top"><div><p class="mut">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p><h1>${h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'},<br><b>${esc(S.settings.owner)}</b></h1></div><button class="pill" data-a="tab" data-t="cfg" aria-label="Ajustes">${icon('sliders')}</button></header>
<div class="stack"><section class="hero"><p class="lab">Faturamento</p><p class="big">${brl(m.revenue)}</p><div class="hsub"><div><span>Recebido</span><b>${brl(m.received)}</b></div><div><span>Pendente</span><b>${brl(m.pending)}</b></div></div></section>
<div class="tiles"><button class="tile" data-a="new">${icon('plus')}<span><small>Novo</small><b>Pedido</b></span></button><button class="tile" data-a="prod">${icon('pkg')}<span><small>Registrar</small><b>Produção</b></span></button><button class="tile" data-a="tab" data-t="ord">${icon('check')}<span><small>Ver</small><b>Pedidos</b></span></button></div>
<section class="panel"><h2>Operação</h2>${line('Pedidos em andamento', open, 'ord')}${line('Entregas pendentes', m.awaitingDelivery, 'ord')}${line('Estoque disponível', m.available + ' un', 'stk')}${line('Produção necessária', m.toMake + ' un', 'stk')}</section>
<section class="panel"><h2>Vendas por sabor</h2>${bars(S, (id) => soldUnits(S, id))}</section>
<section class="panel"><h2>Atividade recente</h2>${S.orders.length ? S.orders.slice(0, 5).map((o) => orderRow(S, o)).join('') : '<p class="empty">Nenhum pedido ainda.</p>'}</section></div>`;
}

const FIL = { all: 'Todos', unp: 'Não pagos', paid: 'Pagos', und: 'Não entregues', del: 'Entregues' };
export function orders(S, ui) {
  const t = { unp: (o) => payStatus(o) !== 'pago', paid: (o) => payStatus(o) === 'pago', und: (o) => o.delivery !== 'entregue', del: (o) => o.delivery === 'entregue' };
  const L = S.orders.filter((o) => ui.f === 'all' || (!o.cancelled && t[ui.f](o)));
  return `<header class="top"><h1>Pedidos</h1></header><div class="seg">${Object.entries(FIL).map(([k, v]) => `<button class="${k === ui.f ? 'on' : ''}" data-a="filter" data-k="${k}">${v}</button>`).join('')}</div><section class="panel">${L.length ? L.map((o) => orderRow(S, o)).join('') : '<p class="empty">Nenhum pedido aqui.</p>'}</section>`;
}

export function stock(S) {
  const p = producedTotal(S), s = soldUnits(S), pct = p ? Math.round(s / p * 100) : 0;
  const by = S.flavors.map((f) => ({ f, p: S.production.filter((x) => x.flavorId === f.id).reduce((n, x) => n + x.qty, 0), s: soldUnits(S, f.id) })).filter((r) => r.p || r.s || !r.f.system);
  return `<header class="top"><h1>Estoque</h1></header><div class="stack"><section class="hero"><p class="lab">Disponíveis</p><p class="big">${availableUnits(S)} <span style="font-size:18px;font-weight:400">tortinhas</span></p><div class="prog"><i style="width:${pct}%"></i></div><div class="hsub" style="border:0;padding:0;justify-content:space-between"><span>${s} vendidas de ${p} produzidas · ${pct}%</span></div></section>
<section class="panel"><h2>Produção</h2><div class="row"><span class="grow">A produzir</span><input type="number" min="0" inputmode="numeric" style="width:84px;margin:0;text-align:right" value="${S.toMake}" data-c="tomake"></div><div class="row"><span class="grow">Alerta de estoque baixo</span><input type="number" min="0" inputmode="numeric" style="width:84px;margin:0;text-align:right" value="${S.low}" data-c="low"></div></section><button class="btn" style="margin-top:0" data-a="prod">Registrar produção</button>
<section class="panel"><h2>Por sabor</h2>${by.map((r) => `<div class="row"><span class="grow"><b>${r.f.system ? 'Sabor ainda não definido' : esc(short(S, r.f.id))}</b></span><small>${r.p} produzidas · ${r.s} vendidas</small></div>`).join('')}</section>
<section class="panel"><h2>Movimentações</h2>${S.moves.length ? S.moves.slice(0, 30).map((m) => mv(S, m)).join('') : '<p class="empty">Sem movimentações registradas ainda.</p>'}</section></div>`;
}

const inP = (p, d) => { if (p === 'all') return true; if (!d) return false; const x = new Date(d + 'T00:00'), n = new Date(); n.setHours(0, 0, 0, 0);
  if (p === 'd') return +x === +n; if (p === 'w') { const s = new Date(n); s.setDate(n.getDate() - (n.getDay() + 6) % 7); return x >= s; } return x.getFullYear() === n.getFullYear() && x.getMonth() === n.getMonth(); };
export function finance(S, ui) {
  const L = activeOrders(S).filter((o) => inP(ui.p, o.date)), rev = L.reduce((n, o) => n + orderTotal(o), 0);
  const pays = activeOrders(S).flatMap((o) => o.payments.filter((p) => p.amountCents > 0 && inP(ui.p, p.date)).map((p) => ({ ...p, c: o.client }))).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const rec = pays.reduce((n, p) => n + p.amountCents, 0), due = L.reduce((n, o) => n + Math.max(0, orderTotal(o) - orderPaid(o)), 0), day = {};
  L.forEach((o) => { day[o.date] = (day[o.date] || 0) + orderTotal(o); });
  const fl = (id) => L.reduce((n, o) => n + o.items.filter((i) => i.flavorId === id).reduce((a, i) => a + i.qty, 0), 0);
  return `<header class="top"><h1>Financeiro</h1></header><div class="seg">${[['d', 'Hoje'], ['w', 'Semana'], ['m', 'Mês'], ['all', 'Tudo']].map(([k, v]) => `<button class="${ui.p === k ? 'on' : ''}" data-a="period" data-k="${k}">${v}</button>`).join('')}</div>
<div class="stack"><section class="hero"><p class="lab">Recebido no período</p><p class="big">${brl(rec)}</p><div class="hsub"><div><span>A receber</span><b>${brl(due)}</b></div><div><span>Faturamento</span><b>${brl(rev)}</b></div></div></section>
<section class="panel"><h2>Vendas por sabor</h2>${bars(S, fl)}</section>
<section class="panel"><h2>Vendas por dia</h2>${Object.keys(day).sort().reverse().slice(0, 10).map((k) => `<div class="row"><span class="grow">${fd(k)}</span><b>${brl(day[k])}</b></div>`).join('') || '<p class="empty">Sem vendas datadas no período.</p>'}</section>
<section class="panel"><h2>Histórico de pagamentos</h2>${pays.map((p) => `<div class="row"><span class="grow"><b>${esc(p.c)}</b><small>${fd(p.date)}</small></span><b class="amt">${brl(p.amountCents)}</b></div>`).join('') || '<p class="empty">Nenhum pagamento no período.</p>'}</section></div>`;
}

export function clientsView(S) {
  const m = {};
  activeOrders(S).forEach((o) => { const k = o.client.trim().toLowerCase(); (m[k] ||= { name: o.client.trim(), phone: '', o: [] }); if (o.phone) m[k].phone = o.phone; m[k].o.push(o); });
  const L = Object.values(m).sort((a, b) => a.name.localeCompare(b.name));
  return `<header class="top"><h1>Clientes</h1></header><section class="panel">${L.map((c) => { const last = c.o.map((o) => o.date).filter(Boolean).sort().pop();
    return `<div class="row"><span class="grow"><b>${esc(c.name)}</b><small>${c.o.length} pedido(s) · ${brl(c.o.reduce((n, o) => n + orderTotal(o), 0))} · último ${fd(last)}</small><small>${esc(c.phone) || 'sem telefone'}</small></span>${c.phone ? `<a class="pill" target="_blank" rel="noopener" href="https://wa.me/${waNumber(c.phone)}" aria-label="WhatsApp">${icon('chat')}</a>` : ''}</div>`; }).join('') || '<p class="empty">Os clientes aparecem conforme os pedidos.</p>'}</section>`;
}

export function settings(S) {
  const s = S.settings, f = (l, k, ph = '') => `<label>${l}<input value="${esc(s[k])}" placeholder="${ph}" data-c="set" data-k="${k}"></label>`;
  return `<header class="top"><h1>Ajustes</h1></header><div class="stack"><section class="panel" style="padding-bottom:18px"><h2>Pix</h2>${f('Chave Pix (telefone)', 'pixKey')}${f('Nome do titular', 'holder', 'Como aparece no banco')}${f('Cidade do recebedor', 'city', 'Ex.: Rio de Janeiro')}</section>
<section class="panel" style="padding-bottom:18px"><h2>Sabores e preços</h2>${S.flavors.filter((x) => !x.system).map((x) => `<label>${esc(x.name)}<input inputmode="decimal" value="${(x.priceCents / 100).toFixed(2).replace('.', ',')}" data-c="fprice" data-id="${x.id}"></label>`).join('')}<div class="two"><label>Novo sabor<input id="nf" placeholder="Ex.: Tortinha de morango"></label><label>Preço<input id="np" inputmode="decimal" value="12,00"></label></div><button class="btn2" data-a="addflavor">Adicionar sabor</button></section>
<section class="panel" style="padding-bottom:18px"><h2>Marca</h2>${f('Nome da marca', 'brand')}${f('Seu nome', 'owner')}</section>
<section class="panel" style="padding-bottom:18px"><h2>Backup</h2><small>Os dados ficam só neste aparelho. Exporte um backup de vez em quando.</small><button class="btn2" data-a="export">Exportar backup</button><button class="btn2" data-a="import">Importar backup</button><input type="file" id="imp" accept="application/json" hidden></section></div>`;
}
