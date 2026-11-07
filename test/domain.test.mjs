import test from 'node:test'; import assert from 'node:assert/strict';
import { crc16, buildBrCode } from '../lib/pix.js';
import { seed } from '../lib/seed.js';
import { summary, saveOrder, cancelOrder, addPayment, availableUnits } from '../lib/domain.js';

test('CRC16 vetor padrão', () => assert.equal(crc16('123456789'), '29B1'));
test('BR Code válido e com CRC consistente', () => {
  const c = buildBrCode({ key: '(21) 97794-7070', holder: 'Lívia Teste', city: 'Rio de Janeiro', amountCents: 2400 });
  assert.ok(c.includes('5405') && c.includes('24.00') && c.includes('+5521977947070'));
  assert.equal(c.slice(-4), crc16(c.slice(0, -4)));
  assert.throws(() => buildBrCode({ key: '(21) 97794-7070', holder: '', city: '' }));
});
test('seed bate com os números informados', () => {
  const s = summary(seed());
  assert.deepEqual([s.revenue, s.received, s.pending, s.sold, s.available, s.toMake], [10800, 6000, 4800, 9, 15, 26]);
});
test('editar não desconta de novo; cancelar devolve; excesso é bloqueado', () => {
  let s = seed();
  const o = { id: 'n1', client: 'João', phone: '', date: '', due: '', method: 'Pix', notes: '', delivery: 'a_preparar', payments: [], items: [{ flavorId: 'limao', qty: 2, priceCents: 1200 }] };
  s = saveOrder(s, o); assert.equal(availableUnits(s), 13);
  s = saveOrder(s, { ...o, notes: 'editado' }); assert.equal(availableUnits(s), 13);
  s = addPayment(s, 'n1', 2400, '2026-11-06'); assert.equal(availableUnits(s), 13);
  s = cancelOrder(s, 'n1'); assert.equal(availableUnits(s), 15);
  assert.equal(s.moves.filter((m) => m.ref === 'João').reduce((n, m) => n + m.qty, 0), 0);
  assert.throws(() => saveOrder(s, { ...o, id: 'n2', items: [{ flavorId: 'limao', qty: 16, priceCents: 1200 }] }), /insuficiente/);
});
