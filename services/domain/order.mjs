import { createHash } from 'node:crypto';

function required(value, code) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(code);
  return value;
}

/** Prices passed here must already be resolved from the authorized server-side catalog. */
export function prepareOrder(input) {
  const organizationId = required(input?.organizationId, 'INVALID_ORGANIZATION');
  const buyerId = required(input.buyerId, 'INVALID_BUYER');
  if (typeof input.currency !== 'string' || !/^[A-Z]{3}$/.test(input.currency)) throw new Error('INVALID_CURRENCY');
  if (!Array.isArray(input.lines) || input.lines.length === 0) throw new Error('EMPTY_ORDER');
  const skus = new Set();
  let totalMinor = 0;
  const lines = input.lines.map(line => {
    const sku = required(line.sku, 'INVALID_SKU');
    if (skus.has(sku)) throw new Error('DUPLICATE_SKU');
    skus.add(sku);
    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0) throw new Error('INVALID_QUANTITY');
    if (!Number.isSafeInteger(line.unitPriceMinor) || line.unitPriceMinor < 0) throw new Error('INVALID_PRICE');
    const subtotalMinor = line.quantity * line.unitPriceMinor;
    totalMinor += subtotalMinor;
    if (!Number.isSafeInteger(subtotalMinor) || !Number.isSafeInteger(totalMinor)) throw new Error('AMOUNT_OVERFLOW');
    return { sku, quantity: line.quantity, unitPriceMinor: line.unitPriceMinor, subtotalMinor };
  }).sort((a, b) => a.sku.localeCompare(b.sku, 'en'));
  return { organizationId, buyerId, currency: input.currency, lines, totalMinor };
}

/** The repository must persist order and scoped idempotency record in one conditional transaction. */
export function acceptIdempotentOrder(input, command, existingRecord = null) {
  const prepared = prepareOrder(input);
  if (command?.organizationId !== prepared.organizationId || command.buyerId !== prepared.buyerId) throw new Error('FORBIDDEN');
  const key = required(command.idempotencyKey, 'INVALID_IDEMPOTENCY_KEY');
  const fingerprint = createHash('sha256').update(JSON.stringify(prepared)).digest('hex');
  if (existingRecord) {
    if (existingRecord.organizationId !== prepared.organizationId || existingRecord.buyerId !== prepared.buyerId || existingRecord.key !== key) throw new Error('INVALID_IDEMPOTENCY_RECORD');
    if (existingRecord.fingerprint !== fingerprint) throw new Error('IDEMPOTENCY_CONFLICT');
    return { replayed: true, order: structuredClone(existingRecord.order), record: structuredClone(existingRecord) };
  }
  const id = required(command.orderId, 'INVALID_ORDER_ID');
  const order = { ...prepared, id, status: 'submitted', version: 1 };
  return { replayed: false, order, record: { organizationId: prepared.organizationId, buyerId: prepared.buyerId, key, fingerprint, order: structuredClone(order) } };
}
