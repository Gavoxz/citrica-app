# Cítrica e Doce — gestão (PWA local)

App estático, sem build e sem backend. Dados no `localStorage` do aparelho; instalável no iPhone.

## Rodar
    npx serve .        # ou: python3 -m http.server 8000
    npm test           # regras de negócio e Pix (node:test)

## Publicar (HTTPS é obrigatório para PWA)
Suba a pasta como site estático (Vercel, Netlify ou GitHub Pages).

## Instalar no iPhone
Abra o endereço no Safari → Compartilhar → Adicionar à Tela de Início. Use SEMPRE o ícone instalado:
os dados do Safari e do app instalado são separados. Faça backup em Ajustes → Exportar backup.

## Estrutura
- `lib/` regras puras: `money` (centavos), `pix` (BR Code), `domain` (pedidos, estoque, caixa), `seed`, `messages`
- `services/storage.js` persistência local + backup
- `components/` `views` (telas), `sheets` (pedido, Pix, produção), `ui` (ícones/helpers)
- `app/main.js` rotas e ações · `styles/app.css` design system · `sw.js` offline · `icons/` ícone do limão
