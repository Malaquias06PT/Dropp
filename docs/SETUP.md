# Guia de arranque — da loja pronta à primeira venda

O site já está feito. Este guia explica, por ordem, as ligações que só tu podes fazer, porque exigem contas em teu nome: Stripe, CJ, Cloudflare e Finanças.
Tudo o que está aqui é **grátis**. Só pagas a mercadoria quando vendes e a comissão da Stripe sobre cada venda.

Tempo estimado: 2–3 horas, sem contar com a amostra do produto.

---

## 0. Antes de vender (obrigatório em Portugal)

1. **Abrir atividade nas Finanças** (grátis, no Portal das Finanças → Atividade → Declaração de Início). Atividade: comércio a retalho pela internet (CAE 47910). Pede conselho a um contabilista sobre o regime de IVA. Se as vendas para outros países da UE passarem os 10 000 €/ano, tens de usar o balcão único **OSS**.
2. **Faturas.** Tens de emitir fatura por cada venda. Dá para fazer grátis no Portal das Finanças (Faturas e Recibos).
3. **Livro de Reclamações Eletrónico.** Regista a loja em [livroreclamacoes.pt](https://www.livroreclamacoes.pt). O link já está no rodapé do site.
4. **Segurança do produto (GPSR).** Como vendedor na UE, és tu o responsável. Pede à CJ a etiqueta de composição, a identificação do fabricante e as instruções de lavagem do produto que escolheres.
5. **Preenche os teus dados** em `site/config.js` → `seller` (nome, NIF, morada, email). Aparecem no aviso legal, nos termos e na política de devoluções.

> O site **não tem avaliações inventadas nem preços "antes/depois" falsos**. Na UE, a Diretiva Omnibus obriga a que um preço riscado seja o mais baixo dos últimos 30 dias. Mantém assim.

---

## 1. Pôr o site online (GitHub Pages)

1. No GitHub, abre o repositório → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Junta (merge) o ramo `claude/dropshipping-website-free-h4u4y1` ao `main`.
3. A Action "Check & deploy site" publica o site em **https://malaquias06pt.github.io/Dropp/**.

Cada alteração enviada para o `main` volta a publicar o site sozinha.

---

## 2. Fornecedor: CJ Dropshipping

1. Cria conta grátis em [cjdropshipping.com](https://cjdropshipping.com).
2. Pesquisa por **"wearable blanket hoodie"** ou **"sherpa blanket hoodie"**. Filtra por **armazém na Europa** (Alemanha, Espanha, etc.) para evitar alfândega e ter entrega em 4–8 dias.
3. Escolhe uma listagem com cores parecidas com as do site (cinza, creme, azul-escuro), muitas encomendas e boas notas.
4. **Encomenda uma amostra para ti.** Assim confirmas a qualidade e o tempo de entrega, e tens fotos e vídeos teus para o site e para as redes sociais.
5. Anota para cada cor o **VID** (o ID da variante). Anota também o nome do **método de envio** (ex.: "CJPacket Ordinary") que a calculadora de portes mostra para PT, ES, FR e DE.
6. Confirma as contas. Exemplo a verificar com os preços reais:

   | | Valor |
   |---|---|
   | Preço de venda (1 unidade, IVA incl.) | 39,90 € |
   | IVA 23 % | −7,46 € |
   | Comissão Stripe (~1,5 % + 0,25 €) | −0,85 € |
   | Produto + envio CJ (estimativa) | −15 a −20 € |
   | **Margem por venda** | **~12–17 €** |

   Se o custo real na CJ for mais alto, ajusta `price` em `site/config.js`.

---

## 3. Pagamentos: Stripe Payment Links

1. Cria conta em [stripe.com](https://stripe.com) (Portugal, particular ou empresa). Não há mensalidade.
2. **Settings → Payment methods.** Ativa Cartões, Apple Pay, Google Pay, **MB WAY**, **Multibanco**, iDEAL, Bancontact e Klarna, ou os que preferires.
3. **Product catalog → Add product**, uma vez por cor:
   - "CloudHood – Cinza pedra" com dois preços: **39,90 €** e **69,90 €** (pack de 2)
   - "CloudHood – Creme aveia", igual
   - "CloudHood – Azul meia-noite", igual
> **Atalho:** em vez dos passos 3–5, corre `python scripts/stripe-setup.py` com a variável `STRIPE_API_KEY` definida no teu terminal. O script cria os produtos, os preços e os 6 links já configurados, e escreve-os no `site/config.js` e no `worker/wrangler.toml`. Podes corrê-lo mais de uma vez sem duplicar nada.

4. **Payment Links → New**, um por cada preço (6 no total). Em cada um:
   - **Collect customers' addresses → Shipping addresses**, com os países da lista `shipsTo` do `config.js`
   - **Require customers to provide a phone number** (a transportadora precisa)
   - **After payment → Don't show confirmation page → Redirect** para `https://malaquias06pt.github.io/Dropp/thanks.html`
5. Copia cada link (`https://buy.stripe.com/...`) para `site/config.js`, em `offers[].stripeLinks`, na cor certa.
6. **Settings → Customer emails.** Ativa os recibos de pagamento.
7. Testa primeiro em **modo de teste** (cartão `4242 4242 4242 4242`) e depois passa para modo real.

Quando o link está preenchido, o botão "Continuar para o pagamento seguro" fica ativo sozinho. O site junta ao link a cor e o pack escolhidos (`client_reference_id`, ex. `duo-grey`), por isso vês em cada pagamento na Stripe o que tens de encomendar.

---

## 4. Cumprir encomendas

### Opção A — manual (para começar)
1. A Stripe manda-te um email a cada venda.
2. Na CJ: **Create Order → Manual**. Copia a morada e o telefone do cliente (Stripe → Pagamento → Cliente) e escolhe a variante e a quantidade indicadas pelo `client_reference_id`.
3. Paga a encomenda na CJ. Quando houver código de seguimento, envia-o ao cliente.

### Opção B — automática (Cloudflare Worker grátis, pasta `worker/`)
O Worker recebe o aviso da Stripe e **cria a encomenda na CJ sozinho**, com morada, telefone e variante. A encomenda fica **por pagar** na CJ (`payType: 3`), para a reveres antes de pagar.
Os campos seguem a documentação oficial da CJ (`createOrderV2`), verificada a 27/11/2026. A automação não precisa da chave secreta da Stripe.

1. Na CJ: **My CJ → Authorization → API** → gera a **API Key**.
2. Em `worker/wrangler.toml`:
   - `LINK_MAP`: preenchido sozinho pelo `scripts/stripe-setup.py`. Só tens de trocar cada `"TODO"` pelo VID da CJ da cor certa (a chave `key` diz qual é, ex. `duo-grey`).
   - `CJ_LOGISTIC_NAME` e `CJ_FROM_COUNTRY`: os valores que anotaste no passo 2.
3. Cria conta grátis na [Cloudflare](https://dash.cloudflare.com/sign-up) e publica:
   ```bash
   cd worker
   npx wrangler login
   npx wrangler deploy
   ```
   Fica com um URL do tipo `https://dropp-order-sync.<conta>.workers.dev`.
4. Na Stripe: **Developers → Webhooks → Add endpoint**:
   - URL: `https://dropp-order-sync.<conta>.workers.dev/stripe-webhook`
   - Eventos: `checkout.session.completed` e `checkout.session.async_payment_succeeded`
   - Copia o *Signing secret* (`whsec_...`).
5. Na Cloudflare: **Workers & Pages → dropp-order-sync → Settings → Variables and Secrets → Add**, do tipo **Secret**:
   - `STRIPE_WEBHOOK_SECRET` = o `whsec_...`
   - `CJ_API_KEY` = a API Key da CJ
6. Faz uma compra de teste e vê os registos com `npx wrangler tail` ou no painel da Cloudflare (**Logs**).

Os pagamentos por Multibanco só criam a encomenda na CJ quando o cliente paga de facto.

---

## 5. Estatísticas grátis (sem cookies, sem banner)
1. Cria conta em [goatcounter.com](https://www.goatcounter.com) com um código, ex. `dropp`.
2. Põe `goatcounterCode: "dropp"` em `site/config.js`.
3. Também ficam contados os cliques no botão de pagamento (`checkout-duo-grey`, etc.).

---

## 6. Fotografias reais
O site mostra uma ilustração até teres fotos. Põe as fotos em `site/images/` (ex. `grey.jpg`) e indica-as em `config.js` → `colors[].image: "images/grey.jpg"`.
As fotos da tua amostra vendem mais do que as do fornecedor.

---

## 7. Divulgação grátis
- **TikTok, Instagram Reels e YouTube Shorts.** Vídeos curtos com a amostra: "aqueço-me a mim e não a casa", "a fatura da luz baixou", reações ao oferecer. Põe o link na bio.
- **Pinterest.** Pins de "ideias de prendas de inverno" com link direto para o site.
- Usa `?lang=pt`, `?lang=de`, etc. nos links para cada país.

---

## 8. Domínio próprio (opcional, ~10 €/ano)
É a única coisa paga. Compra o domínio (ex. `cloudhood.eu`), aponta-o em **Settings → Pages → Custom domain** e atualiza `siteUrl` em `config.js`, `robots.txt` e `sitemap.xml`.

---

## Verificação rápida
```bash
node scripts/check.mjs     # avisa o que ainda falta preencher (TODO, links Stripe)
cd worker && npm test      # testes da automação
```
