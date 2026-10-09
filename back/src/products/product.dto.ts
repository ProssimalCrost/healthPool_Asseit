export interface ProductDto {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  /** Avisa para repor quando quantity <= alertThreshold. Nulo = sem alerta. */
  alertThreshold: number | null;
  lowStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductRow {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  alertThreshold: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export const isLowStock = (quantity: number, alertThreshold: number | null) =>
  alertThreshold !== null && quantity <= alertThreshold;

export function toProductDto(row: ProductRow): ProductDto {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    quantity: row.quantity,
    alertThreshold: row.alertThreshold,
    lowStock: isLowStock(row.quantity, row.alertThreshold),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export interface ProductUsageDto {
  id: string;
  poolId: string;
  productId: string | null;
  productName: string;
  unit: string;
  quantity: number;
  usedAt: Date;
}

export function toProductUsageDto(row: ProductUsageDto): ProductUsageDto {
  return {
    id: row.id,
    poolId: row.poolId,
    productId: row.productId,
    productName: row.productName,
    unit: row.unit,
    quantity: row.quantity,
    usedAt: row.usedAt,
  };
}

export interface ProductUsagePage {
  items: ProductUsageDto[];
  pagination: { total: number; skip: number; take: number; hasMore: boolean };
}
