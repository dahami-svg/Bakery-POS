import { Model } from 'mongoose';

export const DEFAULT_BARCODE_TYPE = 'CODE128' as const;

export type BarcodeType = typeof DEFAULT_BARCODE_TYPE | 'EAN13' | 'QR';

type ResolveCodesInput = {
  model: Model<any>;
  tenantId: string;
  name: string;
  prefix: 'PRD' | 'INV';
  sku?: string | null;
  barcode?: string | null;
  excludeId?: string | null;
};

export function normalizeCode(value: string | null | undefined) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-');
}

function compactName(value: string) {
  const cleaned = normalizeCode(value).replace(/[^A-Z0-9]/g, '');
  return cleaned.slice(0, 6) || 'ITEM';
}

function buildSkuCandidate(prefix: 'PRD' | 'INV', name: string) {
  return `${prefix}-${compactName(name)}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function buildBarcodeCandidate(prefix: 'PRD' | 'INV') {
  const timestamp = Date.now().toString().slice(-10);
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${timestamp}${randomPart}`;
}

async function isCodeTaken(
  model: Model<any>,
  tenantId: string,
  field: 'sku' | 'barcode' | 'orderNumber',
  value: string,
  excludeId?: string | null
) {
  const query: Record<string, unknown> = {
    tenantId,
    [field]: value,
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return Boolean(await model.exists(query));
}

async function resolveUniqueCode(
  model: Model<any>,
  tenantId: string,
  field: 'sku' | 'barcode' | 'orderNumber',
  preferred: string,
  fallbackFactory: () => string,
  excludeId?: string | null
) {
  let candidate = normalizeCode(preferred);

  if (candidate && !(await isCodeTaken(model, tenantId, field, candidate, excludeId))) {
    return candidate;
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    candidate = normalizeCode(fallbackFactory());
    if (!(await isCodeTaken(model, tenantId, field, candidate, excludeId))) {
      return candidate;
    }
  }

  throw new Error(`Could not generate a unique ${field}. Please try again.`);
}

export async function resolveEntityCodes({
  model,
  tenantId,
  name,
  prefix,
  sku,
  barcode,
  excludeId,
}: ResolveCodesInput) {
  const resolvedSku = await resolveUniqueCode(
    model,
    tenantId,
    'sku',
    normalizeCode(sku),
    () => buildSkuCandidate(prefix, name),
    excludeId
  );

  const resolvedBarcode = await resolveUniqueCode(
    model,
    tenantId,
    'barcode',
    normalizeCode(barcode),
    () => buildBarcodeCandidate(prefix),
    excludeId
  );

  return {
    sku: resolvedSku,
    barcode: resolvedBarcode,
    barcodeType: DEFAULT_BARCODE_TYPE,
  };
}

export async function resolveOrderCodes(model: Model<any>, tenantId: string, excludeId?: string | null) {
  const orderNumber = await resolveUniqueCode(
    model,
    tenantId,
    'orderNumber',
    '',
    () => `ORD-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
    excludeId
  );

  const barcode = await resolveUniqueCode(
    model,
    tenantId,
    'barcode',
    '',
    () => `ORD${Date.now().toString().slice(-10)}${Math.floor(100000 + Math.random() * 900000)}`,
    excludeId
  );

  return {
    orderNumber,
    barcode,
    barcodeType: DEFAULT_BARCODE_TYPE,
  };
}
