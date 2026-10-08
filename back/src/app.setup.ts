import { ValidationPipe, type INestApplication } from '@nestjs/common';

/** Configuração compartilhada entre main.ts e os testes e2e, para não divergirem. */
export function configureApp(app: INestApplication): void {
  // Todas as rotas da API ficam em /api; o resto é o app web (quando existe a pasta public).
  app.setGlobalPrefix('api');

  // whitelist remove campos desconhecidos; forbidNonWhitelisted rejeita; transform converte query/params.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  // Autenticação é por cabeçalho (x-access-key), não por cookie: CORS aberto não expõe nada.
  app.enableCors({ origin: true });
}
