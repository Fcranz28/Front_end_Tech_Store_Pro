const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/app/core/guest-cart-storage.ts'), 'utf8');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
const { readGuestToken, saveGuestToken, clearGuestToken } = context.exports;
const key = 'techstore_guest_cart_jwt';
function storage() {
  const data = new Map();
  return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k) };
}
test('an existing guest cart survives a new browser session', () => {
  const local = storage(), oldSession = storage();
  oldSession.setItem(key, 'signed-guest-cart');
  assert.equal(readGuestToken(local, oldSession), 'signed-guest-cart');
  assert.equal(oldSession.getItem(key), null);
  assert.equal(readGuestToken(local, storage()), 'signed-guest-cart');
});
test('a current persisted cart takes precedence over stale session data', () => {
  const local = storage(), session = storage();
  local.setItem(key, 'new-cart'); session.setItem(key, 'old-cart');
  assert.equal(readGuestToken(local, session), 'new-cart');
  assert.equal(session.getItem(key), null);
});
test('successful transfer removes guest copies without persisting or deleting the login JWT', () => {
  const local = storage(), session = storage();
  session.setItem('techstore_token', 'login-session');
  saveGuestToken('guest-cart', local, session);
  clearGuestToken(local, session);
  assert.equal(readGuestToken(local, session), null);
  assert.equal(session.getItem('techstore_token'), 'login-session');
  assert.equal(local.getItem('techstore_token'), null);
});
test('restricted persistent storage falls back to the current session', () => {
  const unavailable = { getItem() { throw Error(); }, setItem() { throw Error(); }, removeItem() { throw Error(); } };
  const session = storage();
  saveGuestToken('guest-cart', unavailable, session);
  assert.equal(readGuestToken(unavailable, session), 'guest-cart');
});
