import test from 'node:test'; import assert from 'node:assert/strict';
import { buildMessage, shareLink } from '../lib/messages.js';
import { seed } from '../lib/seed.js';
import { buildBrCode } from '../lib/pix.js';
const n = (t) => t.replace(/\u00a0/g, ' ');
const base = () => { const s = seed(); return { s, o: { id: 'x', client: 'Gustavo Silva', phone: '', date: '', due: '', delivery: 'a_preparar', payments: [], items: [{ flavorId: 'maracuja', qty: 2, priceCents: 1200 }] } }; };
test('pedido pendente: mensagem natural com chave Pix', () => {
  const { s, o } = base(); const m = n(buildMessage(s, o, null));
  assert.match(m, /^Oii, Gustavo! 😊/); assert.match(m, /🍋 2 tortinhas de maracujá/); assert.match(m, /Total: R\$ 24,00/);
  assert.match(m, /\(21\) 97794-7070/); assert.match(m, /comprovante/); assert.doesNotMatch(m, /Copia e Cola|definir|undefined|null/);
});
test('inclui Copia e Cola com o valor do pedido quando disponível', () => {
  const { s, o } = base(); s.settings.holder = 'Livia'; s.settings.city = 'Rio';
  const code = buildBrCode({ key: s.settings.pixKey, holder: 'Livia', city: 'Rio', amountCents: 2400 });
  assert.ok(buildMessage(s, o, code).includes(code)); assert.ok(code.includes('24.00'));
});
test('sabor indefinido nunca aparece; pago não pede Pix; parcial mostra restante; sem vazios', () => {
  const { s, o } = base(); o.items = [{ flavorId: 'indefinido', qty: 3, priceCents: 1200 }];
  assert.doesNotMatch(buildMessage(s, o, null), /definir|indefinido/); assert.match(buildMessage(s, o, null), /🍋 3 tortinhas/);
  o.payments = [{ id: 'p', date: '', amountCents: 3600 }]; const paid = buildMessage(s, o, null);
  assert.match(paid, /Pagamento recebido/); assert.doesNotMatch(paid, /Pix|comprovante/);
  o.payments = [{ id: 'p', date: '', amountCents: 1200 }]; assert.match(n(buildMessage(s, o, null)), /Já recebi R\$ 12,00, falta R\$ 24,00/);
  s.settings.pixKey = ''; assert.doesNotMatch(buildMessage(s, { ...o, payments: [] }, null), /Pix/);
  assert.doesNotMatch(buildMessage(s, o, null), /Entrega prevista/);
});
test('compartilhar não leva número do cliente', () => assert.ok(shareLink('oi').startsWith('https://wa.me/?text=')));
