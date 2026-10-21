# Publicação na Locaweb e domínio Registro.br

## Conteúdo preparado

O site é estático e pronto para ser servido pela hospedagem de sites Linux da Locaweb. Publique o **conteúdo** da pasta `dist/` na raiz do domínio (`public_html` em hospedagem Linux; `Web` em hospedagem Windows). Não envie esta pasta do projeto inteiro como raiz pública.

Inclua todos os arquivos e subpastas de `dist/`, incluindo o arquivo oculto `.htaccess`, `assets/`, `admin.js`, `firebase-config.js`, `robots.txt` e `sitemap.xml`. O Firebase está configurado para a coleção exclusiva `marcioFelipeProjects` dentro do projeto Zoryon; nenhuma chave privada deve ser colocada no site.

## Sequência segura para domínio

1. No painel Locaweb, instale `marciofelipearquitetura.com.br` como **site independente** na hospedagem correta, sem `www`, e confirme que a configuração foi concluída. Não o adicione como domínio alternativo de `zoryonweb.com.br`, pois o tipo “Apontamento” exibiria o conteúdo de Zoryon.
2. Obtenha o destino de hospedagem informado pelo painel (IP para registro A ou instrução de nameserver). Não invente o IP nem reutilize o destino do GitHub Pages.
3. Na zona DNS atual do Registro.br, configure o domínio raiz e `www` para a Locaweb, mantendo eventuais registros de e-mail (MX, SPF, DKIM e DMARC). Só altere os nameservers para `ns1.locaweb.com.br`, `ns2.locaweb.com.br` e `ns3.locaweb.com.br` se todos os registros que precisam continuar ativos já tiverem sido recriados na zona Locaweb.
4. Ative o certificado SSL/Let's Encrypt no painel Locaweb; depois confirme que tanto o domínio raiz quanto `www` servem o site em HTTPS.
5. Envie o conteúdo da pasta `dist/` via WebFTP ou SFTP/FTP e confira o site no domínio. A Locaweb documenta `public_html` (Linux) e `Web` (Windows) como pastas raiz.
6. Confirme as credenciais Firebase, login administrativo, leitura pública apenas de projetos publicados e escrita apenas para a conta do arquiteto. Só então remova a hospedagem de teste do fluxo de publicação, se desejado.

## Estado observado em 20/10/2026

O Registro.br confirma `marciofelipearquitetura.com.br` publicado, com DNS do Registro.br. Consulta DNS somente de leitura encontrou nameservers automáticos (`a.auto.dns.br` e `b.auto.dns.br`), nenhum registro A, um MX nulo (`.`) e nenhum `www`. O domínio ainda não aponta para o site. O acesso ao Registro.br ainda depende de novo login do proprietário.

A conta Locaweb mostra três instalações independentes, `lovepets.app.br`, `marciofelipearquitetura.com.br` e `zoryonweb.com.br`, todas “Hospedagem I Linux”. A instalação do Márcio está **Ativa**. O conteúdo do site foi enviado para a `public_html` vazia da conta FTP `marciofelipearqu1`, e o endereço temporário `http://marciofelipearqu1.hospedagemdesites.ws/` já renderiza a página. Imagens PNG acima de 1 MiB falharam no WebFTP; as duas imagens PNG efetivamente usadas na página foram convertidas para JPEG de alta qualidade, referenciadas no HTML e enviadas. As outras PNGs não são usadas na página atual. O assistente erroneamente exibiu o domínio como “disponível para registro”, mas avançou diretamente para a ativação da hospedagem, sem página de preço, contratação ou novo registro de domínio. A Central do Cliente mostra os três sites dentro de **um único plano ativo**, Hospedagem Compartilhada I Linux, R$ 113,70 por trimestre, sem adicionais, e nenhuma fatura em aberto no momento da consulta. Isso não garante que a próxima fatura permanecerá igual; conferir antes de qualquer operação paga. O painel do Márcio mostra IP compartilhado `179.188.55.21`. Não use Mundix.

## Dependências de acesso pendentes

O Firestore contém os cinco projetos atuais do Márcio, inclusive as galerias revisadas da Academia Integrada e da Residência Contemporânea. O app Web está registrado no App Check/Fraud Defense e o CMS foi testado no modo local. O envio inicial à hospedagem existe, mas a versão final reforçada ainda precisa substituir os arquivos em `public_html`; depois faltam o apontamento DNS e o teste HTTPS definitivo. Não envie senhas de Registro.br, Locaweb, Firebase ou Google nesta conversa; use diretamente as abas do navegador integrado.
