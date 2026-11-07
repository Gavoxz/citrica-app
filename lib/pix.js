// Pix estático — BR Code (EMV) do Banco Central. Sem intermediário.
const tlv = (id, v) => id + String(v.length).padStart(2, '0') + v;
const ascii = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();

export function crc16(str) {
  let c = 0xffff;
  for (let i = 0; i < str.length; i++) {
    c ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff;
  }
  return c.toString(16).toUpperCase().padStart(4, '0');
}

export function normalizePhoneKey(raw) {
  const d = String(raw).replace(/\D/g, '');
  if (d.length === 10 || d.length === 11) return '+55' + d;
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return '+' + d;
  return null;
}

export function buildBrCode({ key, holder, city, amountCents = 0 }) {
  const k = normalizePhoneKey(key);
  if (!k) throw new Error('Chave Pix (telefone) inválida.');
  const name = ascii(holder || '').slice(0, 25), town = ascii(city || '').slice(0, 15);
  if (!name || !town) throw new Error('Informe o nome do titular e a cidade do recebedor.');
  const body =
    tlv('00', '01') + tlv('01', '11') +
    tlv('26', tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', k)) +
    tlv('52', '0000') + tlv('53', '986') +
    (amountCents > 0 ? tlv('54', (amountCents / 100).toFixed(2)) : '') +
    tlv('58', 'BR') + tlv('59', name) + tlv('60', town) + tlv('62', tlv('05', '***')) + '6304';
  return body + crc16(body);
}
