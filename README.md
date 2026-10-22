# Márcio Felipe — Arquitetura & Interiores

Portfólio profissional de Márcio Felipe, com projetos de arquitetura, design de interiores e iluminação.

## Site

O site estático está em `dist/`. A publicação de contingência é feita pelo GitHub Pages e a hospedagem definitiva é a instalação independente do Márcio na Locaweb. Veja `LOCAWEB.md`.

O painel administrativo entra com uma senha definida no Firebase Authentication e grava projetos na coleção `marcioFelipeProjects` do Firestore do projeto Firebase `zoryon-web-portfolio`. A pedido do proprietário, as coleções antigas desse banco foram excluídas em 20/10/2026. A configuração pública do app Web está em `dist/firebase-config.js`; nenhuma senha ou chave privada fica no navegador. As regras exclusivas do Márcio estão em `firestore.rules`. As fotos novas são compactadas para WebP e salvas em documentos Firestore, sem Firebase Storage.

## Segurança

O Firestore exige Firebase Authentication, UID administrativo fixo, App Check/Fraud Defense e validação estrita de campos, URLs e imagens. A hospedagem Locaweb usa `dist/.htaccess` para recusar métodos de escrita, impedir listagem/execução, bloquear arquivos sensíveis, forçar a origem HTTPS definitiva e aplicar CSP, anti-framing, `nosniff`, política de permissões e cache. Scripts externos têm versão fixa e Subresource Integrity. O código do painel renderiza conteúdo com APIs de texto, sem `innerHTML`, `eval` ou execução de conteúdo enviado.

## Prévia local

Sirva a pasta `dist` com qualquer servidor HTTP estático.

## Contato

- Instagram: [@arquitettomarcio](https://www.instagram.com/arquitettomarcio/)
- WhatsApp: [(35) 99935-1307](https://wa.me/5535999351307)
