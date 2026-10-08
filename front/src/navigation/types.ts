export type AppStackParamList = {
  Home: undefined;
  /** Sem poolId = cadastrar piscina nova; com poolId = editar. */
  PoolForm: { poolId?: string } | undefined;
  PoolDetail: { poolId: string; name: string };
  MeasurementForm: { poolId: string };
  History: { poolId: string; parameterId?: string };
  /** Sem parameterId = criar parâmetro novo; com parameterId = editar. */
  ParameterForm: { parameterId?: string } | undefined;
};
