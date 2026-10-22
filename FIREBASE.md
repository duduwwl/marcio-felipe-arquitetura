# Firestore do portfólio Márcio Felipe

O site usa o app Web **Márcio Felipe Arquitetura** no projeto Firebase existente **Zoryon Web Portfolio** (`zoryon-web-portfolio`), plano Spark. A pedido do proprietário, as coleções `_meta`, `projects` (inclusive subcoleções), `services` e `siteSettings` foram excluídas em 20/10/2026. A única coleção raiz remanescente é `marcioFelipeProjects`, com os cinco projetos atuais do site.

As fotos são convertidas para WebP no navegador e limitadas a 600 KiB por imagem. Cada foto nova é gravada em `marcioFelipeProjects/{projectId}/images/{imageId}`; a ordem e o texto alternativo ficam no documento do projeto. Não se usa Firebase Storage.

O acesso administrativo é autorizado pelo UID configurado nas regras e no app Web. O formulário pede apenas a senha; o e-mail identificador da conta fica no módulo JavaScript público, sem senha embutida. A senha é definida no Firebase Authentication e não existe mais modo local de demonstração.

As regras em `firestore.rules` são exclusivas dos projetos do Márcio. `firebase.json` aponta para este arquivo. Os cinco documentos iniciais usam `seed` (JSON) e `published: true`; a primeira edição no painel grava os campos estruturados (`title`, `type`, `description`, `images`, `published`, `isDeleted`, `sortOrder`, `updatedAt`, `updatedBy`). A versão reforçada valida cada referência de imagem, limita comprimentos e aceita no conteúdo binário apenas Data URLs WebP dentro do teto definido.

O Cloud Firestore exige App Check. O app Web **Márcio Felipe Arquitetura** foi registrado no App Check com Fraud Defense/reCAPTCHA Enterprise em 20/10/2026. A chave é limitada aos domínios `marciofelipearquitetura.com.br`, `duduwwl.github.io` e `marciofelipearqu1.hospedagemdesites.ws`. Para testes em `localhost`, é preciso usar um token de depuração cadastrado no Firebase; a chave de produção não autoriza `localhost`.

O público lê apenas documentos marcados `published: true`; o painel oculta aqueles com `isDeleted: true`. Por serem necessários para sobrepor projetos estáticos e permitir restauração, documentos publicados removidos continuam legíveis diretamente no Firestore. Apenas o UID acima pode criar, editar ou excluir na coleção do Márcio.
