// Regras de negócio puras (sem UI, sem armazenamento). Tudo em centavos.
export const orderTotal = (o) => o.items.reduce((s, i) => s + i.qty * i.priceCents, 0);
export const orderPaid = (o) => o.payments.reduce((s, p) => s + p.amountCents, 0);
export const payStatus = (o) => {
  const paid = orderPaid(o);
  return o.payments.length && paid >= orderTotal(o) ? 'pago' : paid > 0 ? 'parcial' : 'pendente';
};
export const activeOrders = (s) => s.orders.filter((o) => !o.cancelled);
export const producedTotal = (s) => s.production.reduce((n, p) => n + p.qty, 0);
export const soldUnits = (s, flavorId) =>
  activeOrders(s).reduce((n, o) => n + o.items.filter((i) => !flavorId || i.flavorId === flavorId).reduce((a, i) => a + i.qty, 0), 0);
export const availableUnits = (s) => producedTotal(s) - soldUnits(s);

export function summary(s) {
  const L = activeOrders(s);
  const revenue = L.reduce((n, o) => n + orderTotal(o), 0);
  const received = L.reduce((n, o) => n + orderPaid(o), 0);
  return { revenue, received, pending: Math.max(0, revenue - received), sold: soldUnits(s), available: availableUnits(s),
    awaitingDelivery: L.filter((o) => o.delivery !== 'entregue').length, toMake: s.toMake };
}

// Movimentações rastreáveis: só registra a DIFERENÇA, então editar/pagar nunca desconta duas vezes.
export function diffMoves(oldItems, newItems, type, ref, now = Date.now()) {
  const m = {};
  oldItems.forEach((i) => (m[i.flavorId] = (m[i.flavorId] || 0) - i.qty));
  newItems.forEach((i) => (m[i.flavorId] = (m[i.flavorId] || 0) + i.qty));
  return Object.entries(m).filter(([, d]) => d).map(([flavorId, d]) => ({ flavorId, qty: -d, type, ref, at: now }));
}

export function saveOrder(s, order, now = Date.now()) {
  const idx = s.orders.findIndex((o) => o.id === order.id);
  const old = idx >= 0 ? s.orders[idx] : null;
  const need = order.items.reduce((n, i) => n + i.qty, 0);
  const free = availableUnits(s) + (old && !old.cancelled ? old.items.reduce((n, i) => n + i.qty, 0) : 0);
  if (need > free) throw new Error(`Estoque insuficiente: restam ${free} tortinha(s).`);
  const next = { ...order, cancelled: false };
  const moves = diffMoves(old && !old.cancelled ? old.items : [], next.items, old ? 'ajuste' : 'venda', order.client, now);
  return { ...s, orders: idx >= 0 ? s.orders.map((o, i) => (i === idx ? next : o)) : [next, ...s.orders], moves: [...moves, ...s.moves] };
}

export function cancelOrder(s, id, now = Date.now()) {
  const o = s.orders.find((x) => x.id === id);
  if (!o || o.cancelled) return s;
  return { ...s, orders: s.orders.map((x) => (x.id === id ? { ...x, cancelled: true } : x)), moves: [...diffMoves(o.items, [], 'cancelamento', o.client, now), ...s.moves] };
}

export function addPayment(s, id, amountCents, date) {
  if (!(amountCents > 0)) throw new Error('Informe um valor válido.');
  return { ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, payments: [...o.payments, { id: crypto.randomUUID(), date, amountCents }] } : o)) };
}

export function removePayment(s, id, paymentId) {
  return { ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, payments: o.payments.filter((p) => p.id !== paymentId) } : o)) };
}
export function setDelivery(s, id, delivery) {
  return { ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, delivery } : o)) };
}
export function removeOrder(s, id, now = Date.now()) {
  const o = s.orders.find((x) => x.id === id);
  if (!o) return s;
  const moves = o.cancelled ? [] : diffMoves(o.items, [], 'exclusão', o.client, now);
  return { ...s, orders: s.orders.filter((x) => x.id !== id), moves: [...moves, ...s.moves] };
}
export function addProduction(s, { date, flavorId, qty }, now = Date.now()) {
  if (!(qty > 0)) throw new Error('Informe uma quantidade válida.');
  return { ...s, production: [{ id: 'p' + now.toString(36), date, flavorId, qty }, ...s.production],
    toMake: Math.max(0, s.toMake - qty), moves: [{ flavorId, qty, type: 'produção', ref: '', at: now }, ...s.moves] };
}
