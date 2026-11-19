import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareOrder, acceptIdempotentOrder } from './order.mjs';

const draft = () => ({ organizationId: 'org-a', buyerId: 'buyer-1', currency: 'MXN', lines: [{ sku: 'SKU-1', quantity: 3, unitPriceMinor: 1299 }, { sku: 'SKU-2', quantity: 2, unitPriceMinor: 50 }] });
const command = () => ({ organizationId: 'org-a', buyerId: 'buyer-1', idempotencyKey: 'request-1', orderId: 'order-1' });

test('calculates exact totals in minor units without mutating the input', () => {
  const input = draft();
  const prepared = prepareOrder(input);
  assert.equal(prepared.totalMinor, 3997);
  assert.equal(prepared.lines[0].subtotalMinor, 3897);
  assert.equal(input.lines[0].subtotalMinor, undefined);
  assert.notEqual(prepared.lines[0], input.lines[0]);
});

test('rejects decimals, unsafe totals, duplicate SKUs and unsupported currency formats', () => {
  assert.throws(() => prepareOrder({ ...draft(), lines: [{ sku: 'x', quantity: 0.5, unitPriceMinor: 10 }] }), /INVALID_QUANTITY/);
  assert.throws(() => prepareOrder({ ...draft(), lines: [{ sku: 'x', quantity: 1, unitPriceMinor: 1.2 }] }), /INVALID_PRICE/);
  assert.throws(() => prepareOrder({ ...draft(), lines: [{ sku: 'x', quantity: 2, unitPriceMinor: Number.MAX_SAFE_INTEGER }] }), /AMOUNT_OVERFLOW/);
  assert.throws(() => prepareOrder({ ...draft(), lines: [{ sku: 'x', quantity: 1, unitPriceMinor: 1 }, { sku: 'x', quantity: 1, unitPriceMinor: 1 }] }), /DUPLICATE_SKU/);
  assert.throws(() => prepareOrder({ ...draft(), currency: 'mxn' }), /INVALID_CURRENCY/);
  assert.throws(() => prepareOrder({ ...draft(), lines: [] }), /EMPTY_ORDER/);
});

test('returns the same order on a retry with the same key and payload', () => {
  const prepared = prepareOrder(draft());
  const accepted = acceptIdempotentOrder(prepared, command());
  const retried = acceptIdempotentOrder(prepared, command(), accepted.record);
  assert.equal(accepted.replayed, false);
  assert.equal(retried.replayed, true);
  assert.equal(retried.order.id, 'order-1');
  assert.deepEqual(retried.order, accepted.order);
});

test('rejects reuse of a key with a different payload and rejects mismatched records', () => {
  const accepted = acceptIdempotentOrder(prepareOrder(draft()), command());
  const changed = prepareOrder({ ...draft(), lines: [{ sku: 'SKU-1', quantity: 4, unitPriceMinor: 1299 }] });
  assert.throws(() => acceptIdempotentOrder(changed, command(), accepted.record), /IDEMPOTENCY_CONFLICT/);
  assert.throws(() => acceptIdempotentOrder(prepareOrder(draft()), { ...command(), idempotencyKey: 'request-2' }, accepted.record), /INVALID_IDEMPOTENCY_RECORD/);
});

test('checks organization and buyer scope before accepting or replaying orders', () => {
  const prepared = prepareOrder(draft());
  assert.throws(() => acceptIdempotentOrder(prepared, { ...command(), organizationId: 'org-b' }), /FORBIDDEN/);
  assert.throws(() => acceptIdempotentOrder(prepared, { ...command(), buyerId: 'buyer-2' }), /FORBIDDEN/);
  const accepted = acceptIdempotentOrder(prepared, command());
  assert.throws(() => acceptIdempotentOrder(prepared, command(), { ...accepted.record, organizationId: 'org-b' }), /INVALID_IDEMPOTENCY_RECORD/);
});

test('a new key creates a distinct repeat order with current prices', () => {
  const previous = acceptIdempotentOrder(prepareOrder(draft()), command());
  const repriced = prepareOrder({ ...draft(), lines: [{ sku: 'SKU-1', quantity: 3, unitPriceMinor: 1399 }] });
  const repeat = acceptIdempotentOrder(repriced, { ...command(), idempotencyKey: 'repeat-1', orderId: 'order-2' });
  assert.equal(repeat.replayed, false);
  assert.equal(repeat.order.id, 'order-2');
  assert.equal(repeat.order.totalMinor, 4197);
  assert.equal(previous.order.totalMinor, 3997);
});
