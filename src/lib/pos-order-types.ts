export const posOrderTypeOptions = [
  { key: 'dine-in', label: 'Dine In' },
  { key: 'takeaway', label: 'Takeaway' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'walk-in', label: 'Walk In' },
  { key: 'quotation', label: 'Quotation' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'quick-sale', label: 'Quick Sale' },
] as const;

export type PosOrderType = (typeof posOrderTypeOptions)[number]['key'];

export const getDefaultPosOrderTypes = (
  tenantType: 'bakery' | 'restaurant' | 'hardware' | 'cake_shop',
  enabledModules: string[]
): PosOrderType[] => {
  if (enabledModules.includes('kds')) {
    return ['dine-in', 'takeaway', 'delivery'];
  }

  if (tenantType === 'hardware') {
    return ['walk-in', 'delivery', 'quotation', 'invoice'];
  }

  if (tenantType === 'cake_shop') {
    return ['walk-in', 'delivery', 'invoice'];
  }

  return ['quick-sale', 'delivery', 'invoice'];
};

export const normalizePosOrderTypes = (
  requestedTypes: unknown,
  tenantType: 'bakery' | 'restaurant' | 'hardware' | 'cake_shop',
  enabledModules: string[]
): PosOrderType[] => {
  const allowedKeys = new Set(posOrderTypeOptions.map((item) => item.key));
  const parsed = Array.isArray(requestedTypes)
    ? requestedTypes.filter((item): item is PosOrderType => typeof item === 'string' && allowedKeys.has(item as PosOrderType))
    : [];

  return parsed.length > 0 ? Array.from(new Set(parsed)) : getDefaultPosOrderTypes(tenantType, enabledModules);
};

export const getPosOrderTypeLabel = (orderType: string) =>
  posOrderTypeOptions.find((item) => item.key === orderType)?.label || orderType;
