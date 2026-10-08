# healthPool Asseit

Versão interna e simplificada do healthPool: **sem contas, sem planos, sem anúncios**.
Mesmas funções de piscina: cadastro, parâmetros (pH, cloro…), medições com verde/vermelho,
histórico com gráfico e parâmetros criados pela equipe.

Em vez de login, a equipe toda usa **um código de acesso** (`ACCESS_KEY`). O app pede o código
uma vez e guarda no aparelho. Sem isso, qualquer pessoa que descobrisse o endereço na internet
poderia ver e apagar os dados.

```
healthPool_Asseit/
├── back/            API NestJS + Prisma (porta 5000, rotas em /api)
├── front/           App Expo (React Native + NativeWind), roda no celular e no navegador
├── Dockerfile       Monta a API + a versão web do app numa imagem só
├── render.yaml      Configuração para publicar no Render
└── docker-compose.yml  Roda tudo no seu computador, igual à nuvem
```

## O que mudou em relação ao healthPool original

| Original | Asseit |
|---|---|
| Cadastro, login, JWT, senha | Código de acesso único da equipe |
| Cada usuário vê só as suas piscinas | Todos veem todas as piscinas |
| Planos FREE/PRO/NO_ADS, assinatura, anúncios | Removidos |
| Telas de conta e admin | Removidas |
| Parâmetros "do usuário" | Parâmetros "da equipe" (os padrão continuam travados) |
| Só app | App no celular **e** no navegador (mesmo código) |

## Rodar no seu computador

### Opção A: com Docker (mais simples)

```bash
docker compose up --build
```

Abra http://localhost:5000 e use o código `codigo-local-de-teste`.

### Opção B: back e front separados (para programar)

```bash
# 1) Banco: use o PostgreSQL que você já tem (o mesmo do healthPool original serve)
cd back
cp .env.example .env        # ajuste DATABASE_URL e ACCESS_KEY
npm install
npx prisma migrate deploy   # cria as tabelas no schema "asseit"
npm run start:dev           # http://localhost:5000/api

# 2) App (outro terminal)
cd front
cp .env.example .env
npm install
npx expo start -c           # "w" abre no navegador; QR code abre no Expo Go
```

Teste rápido da API: `curl http://localhost:5000/api/health` deve responder `{"status":"ok","database":"ok"}`.

## Publicar na nuvem (Render + Neon)

Escolha: **Neon** para o banco e **Render** para o servidor.
- O banco grátis do Render **expira 30 dias** depois de criado. O do Neon não expira.
- O servidor grátis do Render **dorme após 15 minutos sem uso** e leva cerca de 1 minuto para acordar.
  Para uso interno costuma ser aceitável; se incomodar, troque o `plan` por um pago.

### 1. Banco no Neon

1. Crie uma conta em https://neon.com e um projeto (região **AWS US East**, perto do Render "virginia").
2. Em **Connect**, copie a connection string **direta** (desmarque "Connection pooling").
3. Acrescente `&schema=asseit` no final. Fica assim:
   `postgresql://usuario:senha@ep-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require&schema=asseit`
   - Se a string tiver `&channel_binding=require` e o Prisma reclamar ao conectar, apague esse trecho.

### 2. Código no GitHub

Suba a pasta `healthPool_Asseit` para um repositório (pode ser privado). O `.env` não vai junto (está no `.gitignore`).

### 3. Servidor no Render

1. Crie uma conta em https://render.com e conecte o GitHub.
2. **New > Blueprint** e escolha o repositório. O Render lê o `render.yaml`.
3. Ele pede dois valores:
   - `DATABASE_URL`: a string do Neon do passo 1.
   - `ACCESS_KEY`: o código da equipe (mínimo 12 caracteres). Para gerar um:
     `node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))"`
4. Espere o deploy. O endereço fica algo como `https://healthpool-asseit.onrender.com`.
   - O servidor aplica as migrations sozinho ao subir.
   - Abra `https://SEU-ENDERECO/api/health` para conferir.

### 4. Usar

- **Navegador (qualquer lugar):** abra `https://SEU-ENDERECO` e digite o código.
  No celular, use "Adicionar à tela inicial" para ter um ícone como app.
- **Expo Go / APK:** no `front/.env`, use `EXPO_PUBLIC_API_URL=https://SEU-ENDERECO/api`.

Trocar o código: mude `ACCESS_KEY` no Render. Todo mundo volta para a tela do código.

## Compartilhar com o healthPool original

**Banco:** sim, dá para usar o mesmo PostgreSQL (o mesmo projeto do Neon), sem misturar dados.
O `?schema=asseit` na `DATABASE_URL` coloca as tabelas do Asseit num schema próprio.
O original continua no schema `public`. As migrations de um nunca tocam no outro.

```
Neon (um projeto, um banco "neondb")
├── schema public   ← healthPool original (users, pools, measurements...)
└── schema asseit   ← healthPool Asseit   (pools, measurements...)
```

Cuidados:
- O plano grátis do Neon tem limite de armazenamento e de horas de processamento **por projeto**. Os dois apps dividem esse limite.
- Os dados ficam separados: uma piscina cadastrada no Asseit não aparece no original, e vice-versa.

**Nuvem:** sim. O back do original pode virar um segundo serviço no mesmo Render, apontando para o
mesmo Neon com `?schema=public`. Ele precisa de um `Dockerfile` próprio e das variáveis `JWT_SECRET` e `JWT_EXPIRES_IN`.

## Testes

```bash
cd back
npm test            # regra verde/vermelho das medições
npm run test:e2e    # API completa contra um PostgreSQL de verdade (use um schema de teste)
```
