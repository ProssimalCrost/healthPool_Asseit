import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/** Cabeçalho que o app envia em toda requisição. */
export const ACCESS_KEY_HEADER = 'x-access-key';

const IS_PUBLIC = 'asseit:isPublic';
/** Libera a rota sem código de acesso (ex.: /api/health, usado pela nuvem para saber se o app está de pé). */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/**
 * Define o código de acesso. Prioridade:
 *  1. ACCESS_KEY (variável de ambiente), se definida;
 *  2. o código já gerado e salvo em ACCESS_KEY_FILE (padrão: ./data/access-key);
 *  3. senão, gera um aleatório (o mesmo de `randomBytes(18).toString('base64url')`),
 *     salva no arquivo e mostra no log uma única vez, para ser digitado no app.
 */
function resolveAccessKey(): string {
  const fromEnv = process.env.ACCESS_KEY?.trim();
  if (fromEnv) {
    if (fromEnv.length < 12) throw new Error('ACCESS_KEY curta demais (mínimo 12 caracteres). Veja o .env.example.');
    return fromEnv;
  }

  const file = resolve(process.env.ACCESS_KEY_FILE ?? 'data/access-key');
  if (existsSync(file)) {
    const saved = readFileSync(file, 'utf8').trim();
    if (saved.length >= 12) return saved;
  }

  const generated = randomBytes(18).toString('base64url');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${generated}
`, { mode: 0o600 });
  console.log(`🔑 Código de acesso gerado (salvo em ${file}): ${generated}`);
  return generated;
}

const digest = (value: string) => createHash('sha256').update(value).digest();

/**
 * Sem contas, mas também sem deixar a API aberta na internet:
 * toda a equipe usa um único código de acesso (ACCESS_KEY no servidor).
 * O app pede o código uma vez e guarda no aparelho.
 */
@Injectable()
export class AccessKeyGuard implements CanActivate {
  private readonly expected: Buffer;

  constructor(private readonly reflector: Reflector) {
    const key = resolveAccessKey();
    this.expected = digest(key);
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const raw = request.headers[ACCESS_KEY_HEADER];
    const received = typeof raw === 'string' ? raw.trim() : '';

    // Compara os hashes em tempo constante: não dá para descobrir o código pelo tempo de resposta.
    if (received && timingSafeEqual(digest(received), this.expected)) return true;
    throw new UnauthorizedException('Código de acesso inválido.');
  }
}
