// Persistência 100% local (localStorage). Sem backend, sem login.
import { seed } from '../lib/seed.js';
const KEY = 'citrica-e-doce:v2';

export function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch {}
  return seed();
}
export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch { return false; }
}
export const requestPersist = async () => { try { await navigator.storage?.persist?.(); } catch {} };
export const exportData = (state) => JSON.stringify({ app: 'citrica-e-doce', exportedAt: new Date().toISOString(), state }, null, 2);
export function importData(text) {
  const d = JSON.parse(text), s = d.state || d;
  if (!Array.isArray(s.orders) || !Array.isArray(s.flavors) || !Array.isArray(s.production) || !s.settings) throw new Error('Arquivo de backup inválido.');
  return { moves: [], toMake: 0, low: 5, ...s };
}
