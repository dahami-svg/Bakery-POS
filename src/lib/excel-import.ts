export type InventoryImportRow = {
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  bestBefore: string;
};

export type ProductImportRow = {
  name: string;
  category: string;
  price: number;
  unit: string;
  image: string;
};

const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop';

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getCellValue(row: Record<string, unknown>, aliases: string[]) {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [normalizeHeader(key), value] as const);

  for (const alias of aliases) {
    const match = normalizedEntries.find(([key]) => key === normalizeHeader(alias));
    if (match) {
      return match[1];
    }
  }

  return undefined;
}

function asTrimmedString(value: unknown) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function asNumber(value: unknown) {
  if (typeof value === 'number') return value;
  const parsed = Number(String(value ?? '').trim());
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function mapInventoryImportRows(rows: Record<string, unknown>[]) {
  const mappedRows: InventoryImportRow[] = [];

  rows.forEach((row, index) => {
    const name = asTrimmedString(getCellValue(row, ['name', 'itemname', 'ingredientname', 'item']));
    const category = asTrimmedString(getCellValue(row, ['category', 'group']));
    const currentStock = asNumber(getCellValue(row, ['currentstock', 'stock', 'qty', 'quantity']));
    const unit = asTrimmedString(getCellValue(row, ['unit', 'uom']));
    const bestBefore = asTrimmedString(getCellValue(row, ['bestbefore', 'expiry', 'expiration', 'expirydate'])) || 'N/A';

    if (!name && !category && Number.isNaN(currentStock) && !unit) {
      return;
    }

    if (!name || !category || Number.isNaN(currentStock) || !unit) {
      throw new Error(`Inventory sheet row ${index + 2} is missing required values.`);
    }

    mappedRows.push({
      name,
      category,
      currentStock,
      unit,
      bestBefore,
    });
  });

  return mappedRows;
}

export function mapProductImportRows(rows: Record<string, unknown>[]) {
  const mappedRows: ProductImportRow[] = [];

  rows.forEach((row, index) => {
    const name = asTrimmedString(getCellValue(row, ['name', 'productname', 'itemname', 'product']));
    const category = asTrimmedString(getCellValue(row, ['category', 'group']));
    const price = asNumber(getCellValue(row, ['price', 'sellingprice', 'amount']));
    const unit = asTrimmedString(getCellValue(row, ['unit', 'uom']));
    const image = asTrimmedString(getCellValue(row, ['image', 'imageurl', 'photo', 'photourl'])) || DEFAULT_PRODUCT_IMAGE;

    if (!name && !category && Number.isNaN(price) && !unit) {
      return;
    }

    if (!name || !category || Number.isNaN(price) || !unit) {
      throw new Error(`Product sheet row ${index + 2} is missing required values.`);
    }

    mappedRows.push({
      name,
      category,
      price,
      unit,
      image,
    });
  });

  return mappedRows;
}

export { DEFAULT_PRODUCT_IMAGE };
