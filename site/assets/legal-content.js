/*
 * Legal pages. English and Portuguese are provided; other languages fall back to English.
 * Placeholders in {braces} are filled from config.js.
 * This is a solid starting template, not legal advice — have it reviewed before scaling up.
 */
window.LEGAL = {
  en: {
    notice: {
      title: "Legal notice",
      body: `
<p>This online shop is operated by:</p>
<p><strong>{legalName}</strong><br>{address}<br>Tax ID (NIF/VAT): {taxId}<br>Email: <a href="mailto:{email}">{email}</a></p>
<h2>Complaints and dispute resolution</h2>
<p>If you have a complaint, please write to us first at {email}; we answer within one business day.</p>
<p>You may also use the Portuguese electronic complaints book: <a href="{complaints}" rel="noopener">livroreclamacoes.pt</a>.</p>
<p>In case of a dispute, you may turn to an alternative consumer dispute resolution entity, such as CNIACC – Centro Nacional de Informação e Arbitragem de Conflitos de Consumo (<a href="https://www.cniacc.pt" rel="noopener">cniacc.pt</a>). More entities are listed on the Portal do Consumidor (<a href="https://www.consumidor.gov.pt" rel="noopener">consumidor.gov.pt</a>).</p>`,
    },
    terms: {
      title: "Terms of sale",
      body: `
<h2>1. Seller</h2>
<p>Sales on this website are made by {legalName}, {address}, Tax ID {taxId} ("we"). Contact: {email}.</p>
<h2>2. Products and prices</h2>
<p>Prices are in euros and include VAT. Shipping within the countries listed at checkout is free. The product photos are illustrative; small colour differences may occur.</p>
<h2>3. Order and contract</h2>
<p>The contract is concluded when your payment is confirmed and you receive the confirmation email. We may cancel an order and refund it in full if the product becomes unavailable.</p>
<h2>4. Payment</h2>
<p>Payment is processed securely by Stripe. We never see or store your card details.</p>
<h2>5. Delivery</h2>
<p>Orders are shipped by our logistics partner from a warehouse in the European Union and are usually delivered within {min}–{max} business days. See the <a href="shipping.html">shipping page</a>.</p>
<h2>6. Right of withdrawal</h2>
<p>You may withdraw from the contract within 14 days of delivery without giving any reason. Details and the model withdrawal form are on the <a href="returns.html">returns page</a>.</p>
<h2>7. Legal guarantee</h2>
<p>You benefit from the legal guarantee of conformity for consumer goods (3 years under Portuguese law, Decree-Law 84/2021). If the product is defective, contact us and we will repair, replace or refund it.</p>
<h2>8. Complaints</h2>
<p>See the <a href="legal-notice.html">legal notice</a> for complaint and dispute resolution options. Portuguese law applies, without prejudice to the mandatory consumer protection rules of your country of residence.</p>`,
    },
    privacy: {
      title: "Privacy policy",
      body: `
<p>We collect only what we need to deliver your order.</p>
<h2>Who is responsible</h2>
<p>{legalName}, {address}, {email}.</p>
<h2>What we collect and why</h2>
<ul>
<li><strong>Order data</strong> (name, email, phone, delivery address, items bought): to process and deliver your order and to meet tax obligations. Legal basis: performance of the contract and legal obligation.</li>
<li><strong>Payment data</strong>: handled directly by Stripe Payments Europe Ltd. (Ireland). We do not receive your card number.</li>
<li><strong>Website statistics</strong>: if enabled, we use GoatCounter, a privacy-friendly service that does not use cookies and does not collect personal data.</li>
</ul>
<h2>Who receives your data</h2>
<ul>
<li>Stripe (payments).</li>
<li>Our fulfilment partner CJ Dropshipping and the carrier, which receive your name, address, phone and the items ordered so the parcel can be delivered. CJ Dropshipping is based outside the EU; the transfer is necessary to perform the contract you request (Art. 49(1)(b) GDPR).</li>
<li>GitHub (website hosting), which processes technical access logs such as IP addresses.</li>
</ul>
<h2>How long we keep it</h2>
<p>Order and invoice data is kept for 10 years as required by Portuguese tax law. Nothing else is kept.</p>
<h2>Your rights</h2>
<p>You may ask for access, correction, deletion, restriction, portability or object to processing by writing to {email}. You may also complain to the Portuguese data protection authority, CNPD (<a href="https://www.cnpd.pt" rel="noopener">cnpd.pt</a>).</p>
<h2>Cookies</h2>
<p>This website does not set cookies. Your language choice is remembered in your browser's local storage only.</p>`,
    },
    shipping: {
      title: "Shipping",
      body: `
<ul>
<li><strong>Cost:</strong> free to all countries offered at checkout.</li>
<li><strong>Origin:</strong> a warehouse inside the European Union, so no customs fees or import VAT.</li>
<li><strong>Handling time:</strong> 1–2 business days.</li>
<li><strong>Delivery time:</strong> usually {min}–{max} business days after the order.</li>
<li><strong>Tracking:</strong> you receive a tracking link by email once the parcel ships.</li>
</ul>
<p>If your parcel has not arrived after {max} business days, write to {email} and we will sort it out.</p>`,
    },
    returns: {
      title: "Returns & right of withdrawal",
      body: `
<h2>Right of withdrawal</h2>
<p>You have the right to withdraw from this contract within <strong>{days} days</strong> without giving any reason. The period expires {days} days after the day you, or a person you name, receive the goods.</p>
<p>To exercise it, tell us clearly by email to <a href="mailto:{email}">{email}</a> (you may use the model form below, but you do not have to). It is enough to send it before the period ends.</p>
<h2>Effects of withdrawal</h2>
<p>We will refund all payments received from you, including the standard delivery cost, within 14 days of receiving your withdrawal, using the same payment method. We may withhold the refund until we have received the goods back or you have supplied proof of having sent them.</p>
<p>Please send the goods back within 14 days of telling us, to the return address we give you by email. You pay the direct cost of returning the goods. You are only liable for any loss in value resulting from handling beyond what is necessary to check the product.</p>
<h2>Defective or wrong item</h2>
<p>Write to us with a photo. We will send a replacement or refund you in full, and you do not pay any return costs.</p>
<h2>Model withdrawal form</h2>
<pre>To: {legalName}, {address}, {email}
I hereby give notice that I withdraw from my contract for the sale of the following goods:
Ordered on / received on:
Order number:
Name:
Address:
Date:
(Signature, only if this form is sent on paper)</pre>`,
    },
  },

  pt: {
    notice: {
      title: "Aviso legal",
      body: `
<p>Esta loja online é explorada por:</p>
<p><strong>{legalName}</strong><br>{address}<br>NIF: {taxId}<br>Email: <a href="mailto:{email}">{email}</a></p>
<h2>Reclamações e resolução de litígios</h2>
<p>Se tiver alguma reclamação, escreva-nos primeiro para {email}; respondemos em 1 dia útil.</p>
<p>Pode também usar o Livro de Reclamações Eletrónico: <a href="{complaints}" rel="noopener">livroreclamacoes.pt</a>.</p>
<p>Em caso de litígio, pode recorrer a uma entidade de Resolução Alternativa de Litígios de consumo, como o CNIACC – Centro Nacional de Informação e Arbitragem de Conflitos de Consumo (<a href="https://www.cniacc.pt" rel="noopener">cniacc.pt</a>). Mais entidades em <a href="https://www.consumidor.gov.pt" rel="noopener">consumidor.gov.pt</a>.</p>`,
    },
    terms: {
      title: "Termos de venda",
      body: `
<h2>1. Vendedor</h2>
<p>As vendas neste site são feitas por {legalName}, {address}, NIF {taxId} ("nós"). Contacto: {email}.</p>
<h2>2. Produtos e preços</h2>
<p>Os preços estão em euros e incluem IVA. O envio para os países disponíveis no checkout é grátis. As fotografias são ilustrativas; podem existir pequenas diferenças de cor.</p>
<h2>3. Encomenda e contrato</h2>
<p>O contrato fica concluído quando o pagamento é confirmado e recebe o email de confirmação. Podemos cancelar uma encomenda e reembolsá-la na totalidade se o produto deixar de estar disponível.</p>
<h2>4. Pagamento</h2>
<p>O pagamento é processado em segurança pela Stripe. Nunca vemos nem guardamos os dados do seu cartão.</p>
<h2>5. Entrega</h2>
<p>As encomendas são enviadas pelo nosso parceiro logístico a partir de um armazém na União Europeia e chegam normalmente em {min}–{max} dias úteis. Ver a <a href="shipping.html">página de envios</a>.</p>
<h2>6. Direito de livre resolução</h2>
<p>Pode desistir do contrato no prazo de 14 dias após a entrega, sem indicar motivo. Detalhes e formulário na <a href="returns.html">página de devoluções</a>.</p>
<h2>7. Garantia legal</h2>
<p>Beneficia da garantia legal de conformidade de 3 anos (Decreto-Lei n.º 84/2021). Se o produto tiver defeito, contacte-nos e reparamos, substituímos ou reembolsamos.</p>
<h2>8. Reclamações</h2>
<p>Ver o <a href="legal-notice.html">aviso legal</a> para reclamações e resolução de litígios. Aplica-se a lei portuguesa, sem prejuízo das normas imperativas de proteção do consumidor do seu país de residência.</p>`,
    },
    privacy: {
      title: "Política de privacidade",
      body: `
<p>Recolhemos apenas o necessário para entregar a sua encomenda.</p>
<h2>Responsável</h2>
<p>{legalName}, {address}, {email}.</p>
<h2>Que dados e para quê</h2>
<ul>
<li><strong>Dados da encomenda</strong> (nome, email, telefone, morada, artigos): para processar e entregar a encomenda e cumprir obrigações fiscais. Fundamento: execução do contrato e obrigação legal.</li>
<li><strong>Dados de pagamento</strong>: tratados diretamente pela Stripe Payments Europe Ltd. (Irlanda). Não recebemos o número do seu cartão.</li>
<li><strong>Estatísticas do site</strong>: se ativas, usamos o GoatCounter, que não usa cookies nem recolhe dados pessoais.</li>
</ul>
<h2>Quem recebe os dados</h2>
<ul>
<li>Stripe (pagamentos).</li>
<li>O nosso parceiro logístico CJ Dropshipping e a transportadora, que recebem nome, morada, telefone e artigos para entregar a encomenda. A CJ Dropshipping está sediada fora da UE; a transferência é necessária para executar o contrato que pediu (art. 49.º, n.º 1, al. b) do RGPD).</li>
<li>GitHub (alojamento do site), que trata registos técnicos de acesso como endereços IP.</li>
</ul>
<h2>Durante quanto tempo</h2>
<p>Os dados de encomendas e faturas são guardados 10 anos, como exige a lei fiscal portuguesa. Não guardamos mais nada.</p>
<h2>Os seus direitos</h2>
<p>Pode pedir acesso, retificação, apagamento, limitação, portabilidade ou opor-se ao tratamento escrevendo para {email}. Pode também apresentar queixa à CNPD (<a href="https://www.cnpd.pt" rel="noopener">cnpd.pt</a>).</p>
<h2>Cookies</h2>
<p>Este site não usa cookies. A escolha de idioma fica guardada apenas no armazenamento local do seu navegador.</p>`,
    },
    shipping: {
      title: "Envios",
      body: `
<ul>
<li><strong>Custo:</strong> grátis para todos os países disponíveis no checkout.</li>
<li><strong>Origem:</strong> armazém dentro da União Europeia, sem alfândega nem IVA de importação.</li>
<li><strong>Preparação:</strong> 1–2 dias úteis.</li>
<li><strong>Prazo de entrega:</strong> normalmente {min}–{max} dias úteis após a encomenda.</li>
<li><strong>Seguimento:</strong> recebe um link de seguimento por email quando a encomenda é enviada.</li>
</ul>
<p>Se a encomenda não chegar ao fim de {max} dias úteis, escreva para {email} e resolvemos.</p>`,
    },
    returns: {
      title: "Devoluções e direito de livre resolução",
      body: `
<h2>Direito de livre resolução</h2>
<p>Tem o direito de desistir deste contrato no prazo de <strong>{days} dias</strong>, sem indicar qualquer motivo. O prazo termina {days} dias a contar do dia em que o consumidor, ou alguém por si indicado, recebe os bens.</p>
<p>Para o exercer, informe-nos de forma inequívoca por email para <a href="mailto:{email}">{email}</a> (pode usar o modelo abaixo, mas não é obrigatório). Basta enviar antes de o prazo terminar.</p>
<h2>Efeitos da livre resolução</h2>
<p>Reembolsamos todos os pagamentos recebidos, incluindo o custo de entrega normal, no prazo de 14 dias a contar da sua comunicação, pelo mesmo meio de pagamento. Podemos reter o reembolso até recebermos os bens ou até apresentar prova do seu envio.</p>
<p>Devolva os bens no prazo de 14 dias após nos informar, para a morada de devolução que lhe indicarmos por email. O custo direto da devolução fica a seu cargo. Só é responsável pela depreciação resultante de manipulação além do necessário para verificar o produto.</p>
<h2>Artigo com defeito ou errado</h2>
<p>Escreva-nos com uma fotografia. Enviamos um novo ou reembolsamos na totalidade, sem custos de devolução para si.</p>
<h2>Modelo de formulário de livre resolução</h2>
<pre>Para: {legalName}, {address}, {email}
Pela presente comunico que desisto do contrato de compra e venda do seguinte bem:
Encomendado em / recebido em:
Número da encomenda:
Nome:
Morada:
Data:
(Assinatura, apenas se o formulário for enviado em papel)</pre>`,
    },
  },
};
