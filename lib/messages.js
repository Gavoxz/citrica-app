import { formatBRL } from './money.js';
import { orderTotal, orderPaid } from './domain.js';

export const waNumber = (p) => { const d = String(p || '').replace(/\D/g, ''); return d.length >= 12 ? d : d ? '55' + d : ''; };
// Sem número: o WhatsApp abre com o texto pronto e a Lívia escolhe o contato. Nada é enviado automaticamente.
export const shareLink = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;

const withQty = (n, name) => {
  const l = name.toLowerCase();
  return /^tortinha\b/.test(l) ? `${n} ${n > 1 ? l.replace(/^tortinha/, 'tortinhas') : l}` : `${n} ${l}`;
};
const ddmm = (d) => d.split('-').reverse().slice(0, 2).join('/');

// Só inclui o que está confirmado: sem sabor "a definir", sem campos vazios.
export function buildMessage(s, o, code) {
  const first = o.client.trim().split(/\s+/)[0];
  const nameOf = (id) => s.flavors.find((f) => f.id === id)?.name;
  const lines = o.items.filter((i) => i.flavorId !== 'indefinido' && i.qty > 0 && nameOf(i.flavorId)).map((i) => `🍋 ${withQty(i.qty, nameOf(i.flavorId))}`);
  const undef = o.items.filter((i) => i.flavorId === 'indefinido').reduce((n, i) => n + i.qty, 0);
  if (undef) lines.push(`🍋 ${undef} ${undef > 1 ? 'tortinhas' : 'tortinha'}`);

  const total = orderTotal(o), paid = orderPaid(o), rest = Math.max(0, total - paid), key = (s.settings.pixKey || '').trim();
  const parts = [`Oii, ${first}! 😊`, 'Seu pedido foi registrado!'];
  if (lines.length) parts.push(lines.join('\n'));
  if (total > 0) parts.push(`💰 Total: ${formatBRL(total)}`);
  if (o.due) parts.push(`📅 Entrega prevista: ${ddmm(o.due)}`);
  if (total > 0 && rest === 0 && o.payments.length) parts.push('Pagamento recebido, está tudo certo por aqui! ✅');
  else if (rest > 0) {
    if (paid > 0) parts.push(`Já recebi ${formatBRL(paid)}, falta ${formatBRL(rest)}.`);
    if (key) {
      parts.push(`Para realizar o pagamento, segue minha chave Pix:\n${key}`);
      if (code) parts.push(`Se preferir, é só copiar o Pix Copia e Cola abaixo, já com o valor certinho:\n${code}`);
      parts.push('Assim que fizer o pagamento, pode me enviar o comprovante por aqui.');
    }
  }
  parts.push('Muito obrigada pelo pedido! 🍋');
  return parts.join('\n\n');
}
