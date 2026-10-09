import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

// Precisa existir antes de importar o AppModule (o guard lê o ACCESS_KEY ao ser criado).
try {
  process.loadEnvFile();
} catch {
  // sem arquivo .env: usa as variáveis do ambiente
}
process.env.ACCESS_KEY ??= 'codigo-somente-para-teste';
const KEY = process.env.ACCESS_KEY;

const { AppModule } = await import('../src/app.module.js');
const { configureApp } = await import('../src/app.setup.js');
const { PrismaService } = await import('../src/prisma/prisma.service.js');

/**
 * Roda contra um PostgreSQL de verdade (DATABASE_URL, de preferência com ?schema=asseit_test).
 * Apaga só o que criou, então é seguro em banco de desenvolvimento.
 */
describe('healthPool Asseit (e2e)', () => {
  let app: INestApplication;
  let prisma: InstanceType<typeof PrismaService>;
  let http: ReturnType<typeof request>;
  const poolIds: string[] = [];
  const parameterIds: string[] = [];
  const productIds: string[] = [];
  const tag = crypto.randomUUID().slice(0, 8);

  const key = { 'x-access-key': KEY };
  const name = (label: string) => `${label} ${tag}`;

  async function systemParam(systemKey: string) {
    const row = await prisma.parameterDefinition.findUniqueOrThrow({ where: { systemKey } });
    return row.id;
  }

  async function createPool(body: Record<string, unknown> = {}) {
    const response = await http
      .post('/api/pools')
      .set(key)
      .send({ name: name('Piscina'), ...body })
      .expect(201);
    poolIds.push(response.body.id);
    return response.body as { id: string; name: string; parameters: { id: string; name: string }[] };
  }

  async function createParameter(body: Record<string, unknown>) {
    const response = await http.post('/api/parameters').set(key).send(body).expect(201);
    parameterIds.push(response.body.id);
    return response.body as { id: string; name: string };
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await prisma.pool.deleteMany({ where: { id: { in: poolIds } } });
    await prisma.parameterDefinition.deleteMany({ where: { id: { in: parameterIds } } });
    await prisma.product.deleteMany({ where: { id: { in: productIds } } });
    await app.close();
  });

  describe('código de acesso', () => {
    it('recusa quem não tem o código ou manda o errado', async () => {
      await http.get('/api/pools').expect(401);
      await http.get('/api/parameters').set('x-access-key', 'errado').expect(401);
      await http.post('/api/measurements').send({}).expect(401);
      await http.get('/api/health/access').expect(401);
    });

    it('aceita o código certo', async () => {
      await http.get('/api/health/access').set(key).expect(200, { status: 'ok' });
    });

    it('health check é público e testa o banco', async () => {
      await http.get('/api/health').expect(200, { status: 'ok', database: 'ok' });
    });
  });

  describe('parâmetros', () => {
    it('lista os parâmetros padrão com as faixas de referência', async () => {
      const { body } = await http.get('/api/parameters').set(key).expect(200);
      const ph = body.find((p: { name: string }) => p.name === 'pH');
      expect(ph).toMatchObject({ min: 7.2, max: 7.8, isSystem: true, enabledByDefault: true });
      const hardness = body.find((p: { name: string }) => p.name === 'Dureza cálcica');
      expect(hardness).toMatchObject({ isSystem: true, enabledByDefault: false });
    });

    it('cria parâmetro novo, aparando espaços', async () => {
      const created = await createParameter({ name: `  ${name('Sal')}  `, unit: 'g/L', min: 3, max: 5 });
      expect(created).toMatchObject({ name: name('Sal'), unit: 'g/L', min: 3, max: 5, isSystem: false });
    });

    it('recusa nome repetido, sem diferenciar maiúsculas, inclusive de um padrão', async () => {
      await http.post('/api/parameters').set(key).send({ name: name('sal').toUpperCase() }).expect(409);
      await http.post('/api/parameters').set(key).send({ name: 'PH' }).expect(409);
    });

    it('recusa mínimo maior que máximo e campos inválidos', async () => {
      await http.post('/api/parameters').set(key).send({ name: name('X1'), min: 10, max: 5 }).expect(400);
      await http.post('/api/parameters').set(key).send({ name: name('X2'), min: 'abc' }).expect(400);
      await http.post('/api/parameters').set(key).send({ name: '' }).expect(400);
      await http.post('/api/parameters').set(key).send({ name: name('X3'), userId: 'x' }).expect(400);
    });

    it('não deixa editar nem apagar parâmetro padrão', async () => {
      const ph = await systemParam('ph');
      await http.patch(`/api/parameters/${ph}`).set(key).send({ max: 9 }).expect(403);
      await http.delete(`/api/parameters/${ph}`).set(key).expect(403);
    });

    it('valida a faixa final ao editar só um dos limites', async () => {
      const own = await createParameter({ name: name('Faixa'), min: 5, max: 10 });
      await http.patch(`/api/parameters/${own.id}`).set(key).send({ max: 4 }).expect(400);
      const cleared = await http.patch(`/api/parameters/${own.id}`).set(key).send({ min: null }).expect(200);
      expect(cleared.body).toMatchObject({ min: null, max: 10 });
    });
  });

  describe('piscinas', () => {
    it('sem parameterIds, acompanha os parâmetros padrão', async () => {
      const pool = await createPool({ volumeLiters: 30000 });
      expect(pool.parameters.map((p) => p.name)).toEqual(['pH', 'Cloro livre', 'Alcalinidade total']);
    });

    it('aceita escolher os parâmetros, inclusive um criado pela equipe', async () => {
      const own = await createParameter({ name: name('Turbidez'), unit: 'NTU', max: 1 });
      const ph = await systemParam('ph');
      const pool = await createPool({ parameterIds: [ph, own.id] });
      expect(pool.parameters.map((p) => p.name)).toEqual(['pH', name('Turbidez')]);
    });

    it('recusa parâmetro inexistente ou repetido', async () => {
      await http.post('/api/pools').set(key).send({ name: 'P', parameterIds: [crypto.randomUUID()] }).expect(400);
      const ph = await systemParam('ph');
      await http.post('/api/pools').set(key).send({ name: 'P', parameterIds: [ph, ph] }).expect(400);
    });

    it('edita nome e volume, e limpa o volume com null', async () => {
      const pool = await createPool({ volumeLiters: 1000 });
      const renamed = await http.patch(`/api/pools/${pool.id}`).set(key).send({ name: name('Depois') }).expect(200);
      expect(renamed.body).toMatchObject({ name: name('Depois'), volumeLiters: 1000 });
      const cleared = await http.patch(`/api/pools/${pool.id}`).set(key).send({ volumeLiters: null }).expect(200);
      expect(cleared.body.volumeLiters).toBeNull();
    });

    it('apaga a piscina e as medições dela', async () => {
      const pool = await createPool();
      const ph = await systemParam('ph');
      await http.post('/api/measurements').set(key).send({ poolId: pool.id, readings: [{ parameterId: ph, value: 7.4 }] }).expect(201);
      await http.delete(`/api/pools/${pool.id}`).set(key).expect(204);
      await http.get(`/api/pools/${pool.id}`).set(key).expect(404);
      expect(await prisma.measurement.count({ where: { poolId: pool.id } })).toBe(0);
    });

    it('recusa id que não é UUID', async () => {
      await http.get('/api/pools/nao-e-uuid').set(key).expect(400);
    });
  });

  describe('medições', () => {
    it('registra vários parâmetros de uma vez e devolve o status de cada um', async () => {
      const pool = await createPool();
      const ph = await systemParam('ph');
      const chlorine = await systemParam('free_chlorine');
      const alkalinity = await systemParam('total_alkalinity');

      const { body } = await http
        .post('/api/measurements')
        .set(key)
        .send({
          poolId: pool.id,
          readings: [
            { parameterId: ph, value: 7.9 },
            { parameterId: chlorine, value: 2 },
            { parameterId: alkalinity, value: 70 },
          ],
        })
        .expect(201);

      const statusOf = (id: string) => body.find((m: { parameterId: string }) => m.parameterId === id).status;
      expect(statusOf(ph)).toBe('ABOVE');
      expect(statusOf(chlorine)).toBe('IN_RANGE');
      expect(statusOf(alkalinity)).toBe('BELOW');
    });

    it('recusa parâmetro que a piscina não acompanha, repetido, ou sem leituras', async () => {
      const pool = await createPool();
      const hardness = await systemParam('calcium_hardness');
      const ph = await systemParam('ph');
      await http.post('/api/measurements').set(key).send({ poolId: pool.id, readings: [{ parameterId: hardness, value: 200 }] }).expect(400);
      await http.post('/api/measurements').set(key).send({ poolId: pool.id, readings: [{ parameterId: ph, value: 7 }, { parameterId: ph, value: 8 }] }).expect(400);
      await http.post('/api/measurements').set(key).send({ poolId: pool.id, readings: [] }).expect(400);
    });

    it('recusa data no futuro e aceita data no passado', async () => {
      const pool = await createPool();
      const ph = await systemParam('ph');
      const future = new Date(Date.now() + 3_600_000).toISOString();
      await http.post('/api/measurements').set(key).send({ poolId: pool.id, measuredAt: future, readings: [{ parameterId: ph, value: 7.4 }] }).expect(400);
      const past = new Date(Date.now() - 86_400_000).toISOString();
      const { body } = await http.post('/api/measurements').set(key).send({ poolId: pool.id, measuredAt: past, readings: [{ parameterId: ph, value: 7.4 }] }).expect(201);
      expect(body[0].measuredAt).toBe(past);
    });

    it('mostra na piscina a última medição pela DATA da medição', async () => {
      const pool = await createPool();
      const ph = await systemParam('ph');
      const recent = new Date(Date.now() - 3_600_000).toISOString();
      const old = new Date(Date.now() - 5 * 86_400_000).toISOString();
      await http.post('/api/measurements').set(key).send({ poolId: pool.id, measuredAt: recent, readings: [{ parameterId: ph, value: 7.5 }] }).expect(201);
      await http.post('/api/measurements').set(key).send({ poolId: pool.id, measuredAt: old, readings: [{ parameterId: ph, value: 6.0 }] }).expect(201);

      const detail = await http.get(`/api/pools/${pool.id}`).set(key).expect(200);
      const phEntry = detail.body.parameters.find((p: { name: string }) => p.name === 'pH');
      expect(phEntry.latest).toMatchObject({ value: 7.5, status: 'IN_RANGE' });

      const list = await http.get('/api/pools').set(key).expect(200);
      const fromList = list.body.find((p: { id: string }) => p.id === pool.id);
      expect(fromList.parameters.find((p: { name: string }) => p.name === 'Cloro livre').latest).toBeNull();
    });

    it('filtra por parâmetro e período, ordena do mais novo ao mais antigo e pagina', async () => {
      const pool = await createPool();
      const ph = await systemParam('ph');
      const day = 86_400_000;
      for (let i = 1; i <= 5; i++) {
        await http.post('/api/measurements').set(key).send({
          poolId: pool.id,
          measuredAt: new Date(Date.now() - i * day).toISOString(),
          readings: [{ parameterId: ph, value: 7 + i / 10 }],
        }).expect(201);
      }

      const all = await http.get('/api/measurements').query({ poolId: pool.id, parameterId: ph }).set(key).expect(200);
      expect(all.body.items.map((m: { value: number }) => m.value)).toEqual([7.1, 7.2, 7.3, 7.4, 7.5]);

      const page = await http.get('/api/measurements').query({ poolId: pool.id, skip: 2, take: 2 }).set(key).expect(200);
      expect(page.body.items.map((m: { value: number }) => m.value)).toEqual([7.3, 7.4]);
      expect(page.body.pagination).toMatchObject({ total: 5, skip: 2, take: 2, hasMore: true });

      const recent = await http.get('/api/measurements').query({ poolId: pool.id, from: new Date(Date.now() - 2.5 * day).toISOString() }).set(key).expect(200);
      expect(recent.body.items).toHaveLength(2);
    });

    it('apaga uma medição', async () => {
      const pool = await createPool();
      const ph = await systemParam('ph');
      const { body } = await http.post('/api/measurements').set(key).send({ poolId: pool.id, readings: [{ parameterId: ph, value: 7.4 }] }).expect(201);
      await http.delete(`/api/measurements/${body[0].id}`).set(key).expect(204);
      await http.delete(`/api/measurements/${body[0].id}`).set(key).expect(404);
    });

    it('apagar um parâmetro criado pela equipe apaga as medições dele e tira da piscina', async () => {
      const own = await createParameter({ name: name('Temporário'), max: 5 });
      const ph = await systemParam('ph');
      const pool = await createPool({ parameterIds: [ph, own.id] });
      await http.post('/api/measurements').set(key).send({ poolId: pool.id, readings: [{ parameterId: own.id, value: 9 }, { parameterId: ph, value: 7.5 }] }).expect(201);

      await http.delete(`/api/parameters/${own.id}`).set(key).expect(204);

      const detail = await http.get(`/api/pools/${pool.id}`).set(key).expect(200);
      expect(detail.body.parameters.map((p: { name: string }) => p.name)).toEqual(['pH']);
      const history = await http.get('/api/measurements').query({ poolId: pool.id }).set(key).expect(200);
      expect(history.body.items).toHaveLength(1);
    });
  });
  describe('estoque de produtos', () => {
    async function createProduct(body: Record<string, unknown>) {
      const response = await http.post('/api/products').set(key).send(body).expect(201);
      productIds.push(response.body.id);
      return response.body as { id: string; quantity: number; lowStock: boolean };
    }

    it('cria produto e marca lowStock quando quantidade <= alerta', async () => {
      const ok = await createProduct({ name: name('Cloro'), unit: 'kg', quantity: 10, alertThreshold: 3 });
      expect(ok.lowStock).toBe(false);
      const low = await http.patch(`/api/products/${ok.id}`).set(key).send({ quantity: 3 }).expect(200);
      expect(low.body.lowStock).toBe(true);
      const off = await http.patch(`/api/products/${ok.id}`).set(key).send({ alertThreshold: null }).expect(200);
      expect(off.body.lowStock).toBe(false);
      await http.post('/api/products').set(key).send({ name: name('Cloro'), quantity: 1 }).expect(409);
    });

    it('medição com produtos baixa o estoque (sem ficar negativo) e grava o uso com a data', async () => {
      const ph = await systemParam('ph');
      const pool = await createPool({ parameterIds: [ph] });
      const product = await createProduct({ name: name('Barrilha'), unit: 'kg', quantity: 2, alertThreshold: 1 });
      const measuredAt = new Date(Date.now() - 3600_000).toISOString();

      await http.post('/api/measurements').set(key)
        .send({ poolId: pool.id, measuredAt, readings: [{ parameterId: ph, value: 7.5 }], products: [{ productId: product.id, quantity: 5 }] })
        .expect(201);

      const list = await http.get('/api/products').set(key).expect(200);
      expect(list.body.find((p: { id: string }) => p.id === product.id)).toMatchObject({ quantity: 0, lowStock: true });
      const usages = await http.get('/api/product-usages').query({ poolId: pool.id }).set(key).expect(200);
      expect(usages.body.items).toHaveLength(1);
      expect(usages.body.items[0]).toMatchObject({ productName: name('Barrilha'), quantity: 5, usedAt: measuredAt });

      await http.delete(`/api/products/${product.id}`).set(key).expect(204);
      const after = await http.get('/api/product-usages').query({ poolId: pool.id }).set(key).expect(200);
      expect(after.body.items[0]).toMatchObject({ productId: null, productName: name('Barrilha') });
    });

    it('recusa produto inexistente ou repetido na medição', async () => {
      const ph = await systemParam('ph');
      const pool = await createPool({ parameterIds: [ph] });
      const product = await createProduct({ name: name('Algicida'), quantity: 4 });
      const readings = [{ parameterId: ph, value: 7.5 }];
      await http.post('/api/measurements').set(key).send({ poolId: pool.id, readings, products: [{ productId: crypto.randomUUID(), quantity: 1 }] }).expect(400);
      const dup = { productId: product.id, quantity: 1 };
      await http.post('/api/measurements').set(key).send({ poolId: pool.id, readings, products: [dup, dup] }).expect(400);
    });
  });
});
