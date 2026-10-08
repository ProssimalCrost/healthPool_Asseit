# healthPool Asseit: API (NestJS + Prisma)

Veja o README na pasta acima para rodar e publicar.

- Todas as rotas ficam em `/api` e exigem o cabeçalho `x-access-key` (o `ACCESS_KEY` do `.env`).
- Rota pública: `GET /api/health` (confere o servidor e o banco).
- Se existir a pasta `public/` (app web exportado), o servidor também entrega as telas em `/`.
