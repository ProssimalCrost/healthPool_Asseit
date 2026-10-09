import { useQuery } from '@tanstack/react-query';
import { listParameters } from '../api/parameters';
import { getPool, listPools } from '../api/pools';
import { listProducts } from '../api/products';
import { queryKeys } from '../api/queryKeys';

export function usePools() {
  return useQuery({ queryKey: queryKeys.pools, queryFn: listPools });
}

export function usePool(poolId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.pool(poolId ?? ''),
    queryFn: () => getPool(poolId as string),
    enabled: poolId !== undefined,
  });
}

export function useProducts() {
  return useQuery({ queryKey: queryKeys.products, queryFn: listProducts });
}

export function useParameters() {
  return useQuery({ queryKey: queryKeys.parameters, queryFn: listParameters });
}
