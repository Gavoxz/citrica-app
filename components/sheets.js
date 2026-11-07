import { orderTotal, orderPaid, payStatus, saveOrder, cancelOrder, addPayment, removePayment, setDelivery, removeOrder, addProduction, activeOrders } from '../lib/domain.js';
import { buildBrCode } from '../lib/pix.js';
import { formatBRL as brl, toCents } from '../lib/money.js';
import { buildMessage, shareLink } from '../lib/messages.js';
import { icon, esc, fd, short, today, PAY, DELIVERY } from './ui.js';

const $ = (s, r = document) => r.querySelector(s);
export function ask(msg, fn, label = 'Confirmar') {
  const ov = $('#ask'), box = ov.firstElementChild;
  box.style.borderRadius = '26px'; box.style.margin = 'auto 16px 16px';
  box.innerHTML = `<p>${msg}</p><button class="btn" data-k="1">${label}</button><button class="btn2" data-k="0">Voltar</button>`;
  ov.classList.add('on');
  ov.onclick = (e) => { const b = e.target.closest('[data-k]'); if (!b && e.target !== ov) return; ov.classList.remove('on'); if (b?.dataset.k === '1') fn(); };
}

export function initSheets(ctx) {
  const root = $('#sheet'), box = root.firstElementChild; let D = null, PC = '', MSG = '';
  const open = (h) => { box.innerHTML = h; root.classList.add('on'); box.scrollTop = 0; };
  const close = () => root.classList.remove('on');
  const err = (m) => { const e = $('.err', box); if (e) e.textContent = m; };
  const head = (t, sub = '') => `<h2>${t}</h2><small>${sub}</small>`;
  const flavorOpts = (cur) => ctx.S().flavors.filter((f) => !f.system || f.id === cur).map((f) => `<option value="${f.id}" ${f.id === cur ? 'selected' : ''}>${esc(short(ctx.S(), f.id))}</option>`).join('');
  const total = () => D.items.reduce((n, i) => n + i.qty * i.priceCents, 0);
  const itemsHTML = () => D.items.map((it, i) => `<div class="item"><select data-f="flavor" data-i="${i}" aria-label="Sabor">${flavorOpts(it.flavorId)}</select><div class="step"><button data-s="q" data-i="${i}" data-d="-1" aria-label="Menos">−</button><b>${it.qty}</b><button data-s="q" data-i="${i}" data-d="1" aria-label="Mais">+</button></div><input inputmode="decimal" data-f="price" data-i="${i}" value="${(it.priceCents / 100).toFixed(2).replace('.', ',')}" aria-label="Valor unitário"><button class="xb" data-s="rm" data-i="${i}" aria-label="Remover">${icon('x', 16)}</button></div>`).join('');
  const redrawItems = () => { $('#its', box).innerHTML = itemsHTML(); $('#tot', box).textContent = 'Total ' + brl(total()); };

  function orderForm(id) {
    const S = ctx.S(), o = id ? S.orders.find((x) => x.id === id) : null, f0 = S.flavors.find((f) => !f.system);
    D = o ? { ...o, items: o.items.map((i) => ({ ...i })) } : { id: 'o' + Date.now().toString(36), client: '', phone: '', date: today(), due: '', method: 'Pix', notes: '', delivery: 'a_preparar', payments: [], items: [{ flavorId: f0.id, qty: 1, priceCents: f0.priceCents }] };
    const names = [...new Set(activeOrders(S).map((x) => x.client))];
    open(`${head(o ? 'Editar pedido' : 'Novo pedido')}<label>Cliente<input data-f="client" list="cl" autocomplete="off" value="${esc(D.client)}"></label><datalist id="cl">${names.map((n) => `<option value="${esc(n)}">`).join('')}</datalist>
<label>WhatsApp<input data-f="phone" type="tel" inputmode="tel" placeholder="(21) 90000-0000" value="${esc(D.phone)}"></label><div class="two"><label>Pedido<input data-f="date" type="date" value="${D.date}"></label><label>Entrega prevista<input data-f="due" type="date" value="${D.due}"></label></div>
<label>Sabores</label><div id="its"></div><button class="btn2" data-s="add">Adicionar sabor</button>
<label>Forma de pagamento<select data-f="method">${['Pix', 'Dinheiro', 'Cartão', 'Outro'].map((x) => `<option ${x === D.method ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label>Observações<textarea data-f="notes" rows="2">${esc(D.notes)}</textarea></label>
<p class="tot" id="tot"></p><p class="err"></p><button class="btn" data-s="save">Salvar pedido</button>`);
    redrawItems();
  }

  function detail(id) {
    const S = ctx.S(), o = S.orders.find((x) => x.id === id); if (!o) return close();
    const t = orderTotal(o), p = orderPaid(o), r = Math.max(0, t - p); let code = null, why = '';
    if (!o.cancelled && r > 0) { try { code = buildBrCode({ key: S.settings.pixKey, holder: S.settings.holder, city: S.settings.city, amountCents: r }); } catch (e) { why = e.message; } }
    PC = code || ''; MSG = buildMessage(S, o, code);
    open(`${head(esc(o.client), `${fd(o.date)} · entrega ${fd(o.due)}${o.method ? ' · ' + esc(o.method) : ''}`)}
<section class="panel" style="margin-top:14px">${o.items.map((i) => `<div class="row"><span class="grow">${i.qty}× ${esc(short(S, i.flavorId))}</span><b>${brl(i.qty * i.priceCents)}</b></div>`).join('')}<div class="row"><b class="grow">Total</b><b>${brl(t)}</b></div><div class="row"><span class="grow mut">Recebido${o.cancelled ? '' : ' · ' + PAY[payStatus(o)]}</span><b>${brl(p)}</b></div></section>${o.notes ? `<small style="display:block;margin-top:8px">${esc(o.notes)}</small>` : ''}
${o.items.some((i) => i.flavorId === 'indefinido') && !o.cancelled ? '<p class="err">Complete o sabor em Editar pedido.</p>' : ''}
${o.cancelled ? '<p class="err">Pedido cancelado — as unidades voltaram ao estoque.</p>' : `<label>Entrega</label><div class="dl">${Object.entries(DELIVERY).map(([k, v]) => `<button class="${o.delivery === k ? 'on' : ''}" data-s="del" data-k="${k}">${v}</button>`).join('')}</div>
${r > 0 ? `<label>Valor recebido (R$)<input id="pv" inputmode="decimal" value="${(r / 100).toFixed(2).replace('.', ',')}"></label><button class="btn" data-s="pay">Marcar como pago</button>` : ''}
${o.payments.filter((x) => x.amountCents > 0).map((x) => `<div class="row"><span class="grow mut">Pagamento ${fd(x.date)}</span><b>${brl(x.amountCents)}</b><button class="xb" data-s="rpay" data-p="${x.id}" aria-label="Remover pagamento">${icon('x', 16)}</button></div>`).join('')}
<section class="msg"><h3>Mensagem para o cliente</h3><div class="pv">${esc(MSG)}</div><button class="btn" data-s="copymsg">Copiar mensagem</button><a class="btn2" target="_blank" rel="noopener" href="${shareLink(MSG)}">Compartilhar pelo WhatsApp</a></section>
${r > 0 ? (code ? `<section class="panel" style="margin-top:14px;text-align:center;padding-bottom:18px"><small>Pix · ${brl(r)} · ${esc(S.settings.holder)}</small><div id="qr"></div><div class="code">${code}</div><button class="btn2" data-s="copy">Copiar Copia e Cola</button></section>` : `<section class="panel" style="margin-top:14px;padding-bottom:18px"><small>${esc(why)}</small><button class="btn2" data-s="cfg">Abrir ajustes</button></section>`) : ''}
<button class="btn2" data-s="edit">Editar pedido</button><button class="btn2 d" data-s="cancel">Cancelar pedido</button>`}
<button class="btn2 d" data-s="del-o">Excluir pedido</button>`);
    D = { id };
    const q = $('#qr', box); if (q && code) { try { new window.QRCode(q, { text: code, width: 184, height: 184, correctLevel: window.QRCode.CorrectLevel.M }); } catch { q.textContent = 'QR indisponível offline — use o Copia e Cola'; } }
  }

  function prodForm() {
    open(`${head('Registrar produção')}<label>Data<input id="pd" type="date" value="${today()}"></label><label>Sabor<select id="pf">${flavorOpts('')}</select></label><label>Quantidade<input id="pq" type="number" min="1" inputmode="numeric"></label><p class="err"></p><button class="btn" data-s="saveprod">Salvar</button>`);
  }

  const clip = async (x, m) => { try { await navigator.clipboard.writeText(x); } catch { const a = document.createElement('textarea'); a.value = x; document.body.append(a); a.select(); document.execCommand('copy'); a.remove(); } ctx.toast(m); };
  const run = (fn, msg) => { try { fn(); if (msg) ctx.toast(msg); } catch (e) { err(e.message); ctx.toast(e.message); } };
  const acts = {
    q: (d) => { const i = D.items[+d.i]; i.qty = Math.max(1, i.qty + +d.d); redrawItems(); },
    rm: (d) => { D.items.splice(+d.i, 1); redrawItems(); },
    add: () => { const f = ctx.S().flavors.find((x) => !x.system); D.items.push({ flavorId: f.id, qty: 1, priceCents: f.priceCents }); redrawItems(); },
    save: () => {
      if (!D.client.trim()) return err('Informe o nome do cliente.');
      if (!D.items.length) return err('Adicione ao menos um sabor.');
      if (D.date && D.due && D.due < D.date) return err('A entrega não pode ser antes do pedido.');
      try { ctx.commit(saveOrder(ctx.S(), { ...D, client: D.client.trim(), phone: D.phone.trim(), notes: D.notes.trim() })); close(); ctx.toast('Pedido salvo'); } catch (e) { err(e.message); }
    },
    del: (d) => { ctx.commit(setDelivery(ctx.S(), D.id, d.k)); detail(D.id); },
    pay: () => run(() => { const v = toCents($('#pv', box).value); if (!(v > 0)) throw new Error('Informe um valor válido.'); ctx.commit(addPayment(ctx.S(), D.id, v, today())); detail(D.id); }, 'Pagamento registrado'),
    rpay: (d) => ask('Remover este pagamento?', () => { ctx.commit(removePayment(ctx.S(), D.id, d.p)); detail(D.id); }, 'Remover'),
    copy: () => clip(PC, 'Código copiado'), copymsg: () => clip(MSG, 'Mensagem copiada'),
    edit: () => orderForm(D.id), cfg: () => { close(); ctx.go('cfg'); },
    cancel: () => ask('Cancelar este pedido? As tortinhas voltam ao estoque.', () => { ctx.commit(cancelOrder(ctx.S(), D.id)); close(); ctx.toast('Pedido cancelado'); }, 'Cancelar pedido'),
    'del-o': () => ask('Excluir definitivamente este pedido?', () => { ctx.commit(removeOrder(ctx.S(), D.id)); close(); }, 'Excluir'),
    saveprod: () => run(() => { ctx.commit(addProduction(ctx.S(), { date: $('#pd', box).value, flavorId: $('#pf', box).value, qty: parseInt($('#pq', box).value) })); close(); }, 'Produção registrada'),
  };
  root.addEventListener('click', (e) => { if (e.target === root) return close(); const el = e.target.closest('[data-s]'); if (el) acts[el.dataset.s]?.(el.dataset); });
  root.addEventListener('input', (e) => {
    const el = e.target, f = el.dataset.f; if (!f || !D) return;
    if (f === 'flavor') { const fl = ctx.S().flavors.find((x) => x.id === el.value), it = D.items[+el.dataset.i]; it.flavorId = el.value; it.priceCents = fl.priceCents; redrawItems(); }
    else if (f === 'price') { D.items[+el.dataset.i].priceCents = Math.max(0, toCents(el.value) || 0); $('#tot', box).textContent = 'Total ' + brl(total()); }
    else { D[f] = el.value; if (f === 'client') { const m = ctx.S().orders.find((x) => x.client === el.value && x.phone); const ph = $('[data-f=phone]', box); if (m && !ph.value) { ph.value = m.phone; D.phone = m.phone; } } }
  });
  return { orderForm, detail, prodForm, close };
}
