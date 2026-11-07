// Dados iniciais informados. Sabores da Raquel e datas NÃO foram informados: ficam em aberto.
const P = 1200, o = (id, client, flavorId, qty, paid) => ({
  id, client, phone: '', date: '', due: '', method: '', notes: '', delivery: 'a_preparar', cancelled: false,
  items: [{ flavorId, qty, priceCents: P }],
  payments: paid ? [{ id: id + '-p', date: '', amountCents: qty * P }] : [],
});
export const seed = () => ({
  settings: { brand: 'Cítrica e Doce', owner: 'Lívia', pixKey: '(21) 97794-7070', holder: '', city: '' },
  flavors: [{ id: 'limao', name: 'Tortinha de limão', priceCents: P }, { id: 'maracuja', name: 'Tortinha de maracujá', priceCents: P }, { id: 'indefinido', name: 'Sabor a definir', priceCents: P, system: true }],
  toMake: 26, low: 5,
  production: [{ id: 'prod-0', date: '', flavorId: 'indefinido', qty: 24 }],
  orders: [o('o1', 'Flávia', 'maracuja', 1, 1), o('o2', 'Juliana', 'limao', 1, 1), o('o3', 'Raquel', 'indefinido', 3, 1),
           o('o4', 'Clayton', 'maracuja', 1), o('o5', 'Pedro', 'maracuja', 1), o('o6', 'Ana Paula', 'maracuja', 2)],
  moves: [],
});
