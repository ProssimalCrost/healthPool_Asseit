// Tem que ser o primeiro import: carrega o .env antes de qualquer outro módulo
// ler process.env (o AccessKeyGuard, por exemplo, lê ACCESS_KEY ao ser criado).
import 'dotenv/config';

import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);

  // App web (Expo exportado para web). Na nuvem, o mesmo endereço serve o app e a API:
  //   https://seu-app.onrender.com/      -> telas
  //   https://seu-app.onrender.com/api/  -> API
  const webDir = resolve(process.env.WEB_DIR ?? join(process.cwd(), 'public'));
  const indexHtml = join(webDir, 'index.html');
  if (existsSync(indexHtml)) {
    app.useStaticAssets(webDir, { index: false });
    // Qualquer GET fora de /api devolve o app (ele mesmo decide a tela).
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
      res.sendFile(indexHtml);
    });
    console.log(`🌐 App web servido de ${webDir}`);
  }

  const port = Number(process.env.PORT) || 5000;
  // 0.0.0.0: aceita conexões de outros aparelhos da rede e de dentro do container.
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 healthPool Asseit API em http://localhost:${port}/api`);
}

void bootstrap();
