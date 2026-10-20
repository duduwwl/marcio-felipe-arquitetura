# Firestore do portfólio Márcio Felipe

O site usa o app Web **Márcio Felipe Arquitetura** no projeto Firebase existente **Zoryon Web Portfolio** (`zoryon-web-portfolio`), plano Spark. A pedido do proprietário, as coleções `_meta`, `projects` (inclusive subcoleções), `services` e `siteSettings` foram excluídas em 20/10/2026. A única coleção raiz remanescente é `marcioFelipeProjects`, com os cinco projetos atuais do site.

As fotos são convertidas para WebP no navegador e limitadas a 600 KiB por imagem. Cada foto nova é gravada em `marcioFelipeProjects/{projectId}/images/{imageId}`; a ordem e o texto alternativo ficam no documento do projeto. Não se usa Firebase Storage.

O usuário administrativo existente é `dudumesquita2004@gmail.com`, UID `eQVwBX6Lt1WjZRxa2NDyLW3OMWJ3`. A senha fictícia `TesteMF2026!` é apenas do modo local e não concede acesso ao Firebase.

As regras em `firestore.rules` são exclusivas dos projetos do Márcio e foram publicadas em 20/10/2026. `firebase.json` aponta para este arquivo. Os cinco documentos iniciais usam `seed` (JSON) e `published: true`; a primeira edição no painel grava os campos estruturados (`title`, `type`, `description`, `images`, `published`, `isDeleted`, `sortOrder`, `updatedAt`, `updatedBy`).

O Cloud Firestore exige App Check. O app Web do Márcio usa uma chave Fraud Defense/reCAPTCHA Enterprise limitada aos domínios `marciofelipearquitetura.com.br`, `duduwwl.github.io` e `marciofelipearqu1.hospedagemdesites.ws`. Para testes em `localhost`, é preciso usar um token de depuração cadastrado no Firebase; a chave de produção não autoriza `localhost`.

O público lê apenas documentos marcados `published: true`; o painel oculta aqueles com `isDeleted: true`. Por serem necessários para sobrepor projetos estáticos e permitir restauração, documentos publicados removidos continuam legíveis diretamente no Firestore. Apenas o UID acima pode criar, editar ou excluir na coleção do Márcio.
