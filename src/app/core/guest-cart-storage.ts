const KEY = 'techstore_guest_cart_jwt';
export function readGuestToken(local: Storage = localStorage, session: Storage = sessionStorage): string | null {
  const legacy = session.getItem(KEY);
  try {
    const saved = local.getItem(KEY);
    if (!saved && legacy) local.setItem(KEY, legacy);
    session.removeItem(KEY);
    return saved || legacy;
  } catch { return legacy; }
}
export function saveGuestToken(token: string, local: Storage = localStorage, session: Storage = sessionStorage) {
  try { local.setItem(KEY, token); session.removeItem(KEY); }
  catch { session.setItem(KEY, token); }
}
export function clearGuestToken(local: Storage = localStorage, session: Storage = sessionStorage) {
  try { local.removeItem(KEY); } catch { /* Storage can be disabled by the browser. */ }
  session.removeItem(KEY);
}
