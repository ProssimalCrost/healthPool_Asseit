// Chaves hierárquicas: invalidar ['pools'] atualiza a lista e todos os detalhes de uma vez.
export const queryKeys = {
  pools: ['pools'] as const,
  pool: (id: string) => ['pools', id] as const,
  parameters: ['parameters'] as const,
  products: ['products'] as const,
  productUsages: (poolId: string) => ['products', 'usages', poolId] as const,
  measurements: ['measurements'] as const,
  history: (poolId: string, parameterId: string, days: number) =>
    ['measurements', poolId, parameterId, days] as const,
};
