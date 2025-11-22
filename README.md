<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Fluxo - app React/Vite

## Variáveis de ambiente
Crie um `.env.local` (ou use as variáveis direto no provedor) com base em `.env.example`:
- `VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co`
- `VITE_SUPABASE_KEY=<chave-anon-ou-service-role>`
- `VITE_GEMINI_API_KEY=<opcional, caso use Gemini>`

## Rodar local
1) Instale dependências: `npm install`  
2) Crie `.env.local` com as variáveis acima.  
3) Suba o dev server: `npm run dev` (porta 5173 por padrão).

## Deploy no Coolify (Static Site)
1) Novo recurso → “Static Site” e conecte o repositório.  
2) Configuração:
   - Base directory: `.`  
   - Build command: `npm ci && npm run build`  
   - Publish directory: `dist`  
   - Node: 20.x  
3) Variáveis de ambiente no serviço:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_KEY`
   - `VITE_GEMINI_API_KEY` (opcional)
4) Deploy e, se quiser, adicione domínio e HTTPS na aba Domains.

## Docker
Um `Dockerfile` foi adicionado para buildar o app e servir o `dist` com Nginx:
- Build (envs em tempo de build): `docker build --build-arg VITE_SUPABASE_URL=... --build-arg VITE_SUPABASE_KEY=... --build-arg VITE_GEMINI_API_KEY=... -t fluxo .`
- Run: `docker run -p 8080:80 fluxo`
Obs.: Vite injeta variáveis no momento do build; se mudar as chaves, faça um novo build.
