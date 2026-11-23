// 1. CLASSES DE DOMÍNIO (PROGRAMAÇÃO ORIENTADA A OBJETOS COM ENCAPSULAMENTO)
class Produto {
  #id;
  #nome;
  #descricao;
  #preco;
  #categoria;
  #imagem;

  constructor(id, nome, descricao, preco, categoria, imagem) {
    this.#id = id;
    this.nome = nome;
    this.descricao = descricao;
    this.preco = preco;
    this.categoria = categoria;
    this.imagem = imagem;
  }

  get id() { return this.#id; }
  get nome() { return this.#nome; }
  get descricao() { return this.#descricao; }
  get preco() { return this.#preco; }
  get categoria() { return this.#categoria; }
  get imagem() { return this.#imagem; }

  set nome(valor) {
    if (!valor || valor.trim().length < 2) {
      throw new Error("O nome do produto deve ter pelo menos 2 caracteres.");
    }
    this.#nome = valor.trim();
  }

  set descricao(valor) {
    if (!valor || valor.trim().length < 5) {
      throw new Error("A descrição deve ter pelo menos 5 caracteres.");
    }
    this.#descricao = valor.trim();
  }

  set preco(valor) {
    const num = Number(valor);
    if (isNaN(num) || num <= 0) {
      throw new Error("O preço do produto deve ser maior que zero.");
    }
    this.#preco = num;
  }

  set categoria(valor) {
    this.#categoria = valor || "Prato Executivo";
  }

  set imagem(valor) {
    this.#imagem = valor.trim();
  }

  toJSON() {
    return {
      id: this.#id,
      nome: this.#nome,
      descricao: this.#descricao,
      preco: this.#preco,
      categoria: this.#categoria,
      imagem: this.#imagem
    };
  }
}

class ItemCarrinho {
  #produto;
  #quantidade;

  constructor(produto, quantidade = 1) {
    if (!(produto instanceof Produto)) {
      throw new Error("ItemCarrinho exige uma instância válida de Produto.");
    }
    this.#produto = produto;
    this.quantidade = quantidade;
  }

  get produto() { return this.#produto; }
  get quantidade() { return this.#quantidade; }

  set quantidade(valor) {
    const qtd = parseInt(valor, 10);
    if (isNaN(qtd) || qtd < 1) {
      throw new Error("A quantidade mínima é 1.");
    }
    this.#quantidade = qtd;
  }

  calcularSubtotal() {
    return this.#produto.preco * this.#quantidade;
  }

  toJSON() {
    return {
      produtoId: this.#produto.id,
      quantidade: this.#quantidade
    };
  }
}

class Carrinho {
  #itens;
  #tipoEntrega;
  static TAXA_ENTREGA_MARMITA = 2.50;

  constructor() {
    this.#itens = [];
    this.#tipoEntrega = "local"; // "local" ou "delivery"
  }

  get itens() { return [...this.#itens]; }
  get tipoEntrega() { return this.#tipoEntrega; }

  set tipoEntrega(valor) {
    this.#tipoEntrega = valor === "delivery" ? "delivery" : "local";
  }

  // CREATE / UPDATE no carrinho
  adicionarItem(produto, quantidade = 1) {
    const existente = this.#itens.find(item => item.produto.id === produto.id);
    if (existente) {
      existente.quantidade += quantidade;
    } else {
      this.#itens.push(new ItemCarrinho(produto, quantidade));
    }
  }

  // UPDATE quantidade
  alterarQuantidade(produtoId, delta) {
    const item = this.#itens.find(i => i.produto.id === produtoId);
    if (!item) return;

    const novaQtd = item.quantidade + delta;
    if (novaQtd <= 0) {
      this.removerItem(produtoId);
    } else {
      item.quantidade = novaQtd;
    }
  }

  // DELETE item
  removerItem(produtoId) {
    this.#itens = this.#itens.filter(i => i.produto.id !== produtoId);
  }

  // DELETE todos
  limpar() {
    this.#itens = [];
  }

  calcularSubtotal() {
    return this.#itens.reduce((acc, item) => acc + item.calcularSubtotal(), 0);
  }

  // Regra de negócio: R$ 2,50 apenas quando houver Marmita e entrega for Delivery
  calcularTaxaEntrega() {
    if (this.#tipoEntrega !== "delivery") return 0;
    const possuiMarmita = this.#itens.some(item => item.produto.categoria === "Marmita");
    return possuiMarmita ? Carrinho.TAXA_ENTREGA_MARMITA : 0;
  }

  calcularTotal() {
    return this.calcularSubtotal() + this.calcularTaxaEntrega();
  }

  getTotalUnidades() {
    return this.#itens.reduce((acc, item) => acc + item.quantidade, 0);
  }
}

class Pedido {
  #id;
  #cliente;
  #itens;
  #tipoEntrega;
  #taxaEntrega;
  #total;
  #status;
  #data;

  constructor({ id, cliente, itens, tipoEntrega, taxaEntrega, total, status = "Confirmado", data = null }) {
    if (!cliente || cliente.trim().length < 2) {
      throw new Error("Informe o nome do cliente para finalizar o pedido.");
    }
    this.#id = id || Date.now();
    this.#cliente = cliente.trim();
    this.#itens = itens;
    this.#tipoEntrega = tipoEntrega;
    this.#taxaEntrega = taxaEntrega;
    this.#total = total;
    this.#status = status;
    this.#data = data || new Date().toLocaleString("pt-BR");
  }

  get id() { return this.#id; }
  get cliente() { return this.#cliente; }
  get itens() { return this.#itens; }
  get tipoEntrega() { return this.#tipoEntrega; }
  get taxaEntrega() { return this.#taxaEntrega; }
  get total() { return this.#total; }
  get status() { return this.#status; }
  get data() { return this.#data; }

  toJSON() {
    return {
      id: this.#id,
      cliente: this.#cliente,
      itens: this.#itens,
      tipoEntrega: this.#tipoEntrega,
      taxaEntrega: this.#taxaEntrega,
      total: this.#total,
      status: this.#status,
      data: this.#data
    };
  }
}

class Gerenciador {
  #produtos;
  #pedidos;
  #proximoId;

  constructor() {
    this.#produtos = [];
    this.#pedidos = [];
    this.#proximoId = 1;
    this.#carregarStorage();
  }

  // Persistência (Bônus localStorage)
  #salvarStorage() {
    localStorage.setItem("restaurante_produtos", JSON.stringify(this.#produtos.map(p => p.toJSON())));
    localStorage.setItem("restaurante_pedidos", JSON.stringify(this.#pedidos.map(p => p.toJSON())));
  }

  #carregarStorage() {
    const salvoProdutos = JSON.parse(localStorage.getItem("restaurante_produtos"));
    const salvoPedidos = JSON.parse(localStorage.getItem("restaurante_pedidos"));

    if (salvoProdutos && salvoProdutos.length > 0) {
      this.#produtos = salvoProdutos.map(
        p => new Produto(p.id, p.nome, p.descricao, p.preco, p.categoria, p.imagem)
      );
      this.#proximoId = Math.max(...this.#produtos.map(p => p.id)) + 1;
    } else {
      this.#popularCardapioInicial();
    }

    if (salvoPedidos && salvoPedidos.length > 0) {
      this.#pedidos = salvoPedidos.map(p => new Pedido(p));
    }
  }

  #popularCardapioInicial() {
    const iniciais = [
      {
        nome: "Marmita Tradicional de Frango Grelhado",
        descricao: "Arroz branco, feijão carioca, filé de frango grelhado, farofa crocante e salada fresca.",
        preco: 22.00,
        categoria: "Marmita",
        imagem: "imagens/FrangoGrelhado.png"
      },
      {
        nome: "Marmita Feijoada Completa",
        descricao: "Feijoada artesanal acompanhada de arroz, couve refogada, torresmo e laranja.",
        preco: 26.90,
        categoria: "Marmita",
        imagem: "imagens/Feijoada.png"
      },
      {
        nome: "Contra-Filé à Parmegiana",
        descricao: "Bife empanado coberto com molho de tomate caseiro e queijo gratinado, arroz e fritas.",
        preco: 38.50,
        categoria: "Prato Executivo",
        imagem: "imagens/Parmegiana.png"
      },
      {
        nome: "Suco Natural de Laranja (500ml)",
        descricao: "Espremido na hora, sem adição de açúcar ou conservantes.",
        preco: 9.50,
        categoria: "Bebida",
        imagem: "imagens/Suco.png"
      },
      {
        nome: "Pudim de Leite Condensado",
        descricao: "Fatia generosa com calda dourada de caramelo artesanal.",
        preco: 11.00,
        categoria: "Sobremesa",
        imagem: "imagens/Pudim.png"
      }
    ];

    iniciais.forEach(item => {
      this.cadastrarProduto(item.nome, item.descricao, item.preco, item.categoria, item.imagem);
    });
  }

  // CRUD PRODUTO: CREATE
  cadastrarProduto(nome, descricao, preco, categoria, imagem) {
    const novo = new Produto(this.#proximoId++, nome, descricao, preco, categoria, imagem);
    this.#produtos.push(novo);
    this.#salvarStorage();
    return novo;
  }

  // CRUD PRODUTO: READ
  listarProdutos(categoria = "Todos") {
    if (categoria === "Todos") return [...this.#produtos];
    return this.#produtos.filter(p => p.categoria === categoria);
  }

  buscarProdutoPorId(id) {
    return this.#produtos.find(p => p.id === Number(id));
  }

  // CRUD PRODUTO: UPDATE
  atualizarProduto(id, dados) {
    const produto = this.buscarProdutoPorId(id);
    if (!produto) throw new Error("Produto não encontrado.");

    produto.nome = dados.nome;
    produto.descricao = dados.descricao;
    produto.preco = dados.preco;
    produto.categoria = dados.categoria;
    produto.imagem = dados.imagem;
    this.#salvarStorage();
    return produto;
  }

  // CRUD PRODUTO: DELETE
  removerProduto(id) {
    this.#produtos = this.#produtos.filter(p => p.id !== Number(id));
    this.#salvarStorage();
  }

  // PEDIDOS
  registrarPedido(cliente, carrinho) {
    if (carrinho.itens.length === 0) {
      throw new Error("Adicione pelo menos um item ao carrinho.");
    }

    const resumoItens = carrinho.itens.map(item => ({
      nome: item.produto.nome,
      quantidade: item.quantidade,
      subtotal: item.calcularSubtotal()
    }));

    const pedido = new Pedido({
      cliente,
      itens: resumoItens,
      tipoEntrega: carrinho.tipoEntrega,
      taxaEntrega: carrinho.calcularTaxaEntrega(),
      total: carrinho.calcularTotal()
    });

    this.#pedidos.unshift(pedido);
    this.#salvarStorage();
    return pedido;
  }

  listarPedidos() {
    return [...this.#pedidos];
  }
}

// ============================================================================
// 2. INTERFACE E CONTROLE DA APLICAÇÃO
// ============================================================================

const gerenciador = new Gerenciador();
const carrinho = new Carrinho();

let categoriaAtiva = "Todos";
let slideAtual = 0;
let intervaloCarrossel = null;

const formatarMoeda = (valor) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function fallbackImagem(img) {
  img.onerror = null;
  img.src = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250">
      <rect width="400" height="250" fill="#E0DDD5"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#5C6360" font-family="sans-serif" font-size="18">Prato Sabor &amp; Brasa</text>
    </svg>`
  );
}

// Feedback Visual (IHC)
function exibirFeedback(mensagem, tipo = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = mensagem;
  toast.className = `toast ${tipo}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add("hidden"), 3200);
}

// Carrossel
function renderizarCarrossel() {
  const produtos = gerenciador.listarProdutos().slice(0, 5);
  const track = document.getElementById("carousel-track");
  const indicators = document.getElementById("carousel-indicators");

  track.innerHTML = "";
  indicators.innerHTML = "";

  if (produtos.length === 0) return;
  if (slideAtual >= produtos.length) slideAtual = 0;

  produtos.forEach((prod, index) => {
    const slide = document.createElement("div");
    slide.className = "carousel-slide";
    slide.innerHTML = `
      <img src="${prod.imagem}" alt="${prod.nome}" onerror="fallbackImagem(this)">
      <div class="carousel-caption">
        <div>
          <span class="badge-cat">${prod.categoria}</span>
          <h2>${prod.nome}</h2>
          <p class="carousel-price">${formatarMoeda(prod.preco)}</p>
        </div>
        <button type="button" class="btn btn-primary" onclick="adicionarAoCarrinho(${prod.id})">
          + Pedir Agora
        </button>
      </div>
    `;
    track.appendChild(slide);

    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `indicator-dot ${index === slideAtual ? "active" : ""}`;
    dot.setAttribute("aria-label", `Ir para prato ${index + 1}`);
    dot.addEventListener("click", () => irParaSlide(index));
    indicators.appendChild(dot);
  });

  atualizarPosicaoCarrossel();
}

function atualizarPosicaoCarrossel() {
  const track = document.getElementById("carousel-track");
  track.style.transform = `translateX(-${slideAtual * 100}%)`;
  document.querySelectorAll(".indicator-dot").forEach((dot, idx) => {
    dot.classList.toggle("active", idx === slideAtual);
  });
}

function irParaSlide(index) {
  const total = document.querySelectorAll(".carousel-slide").length;
  if (total === 0) return;
  slideAtual = (index + total) % total;
  atualizarPosicaoCarrossel();
}

function iniciarAutoPlay() {
  clearInterval(intervaloCarrossel);
  intervaloCarrossel = setInterval(() => irParaSlide(slideAtual + 1), 4500);
}

document.getElementById("carousel-prev").addEventListener("click", () => {
  irParaSlide(slideAtual - 1);
  iniciarAutoPlay();
});

document.getElementById("carousel-next").addEventListener("click", () => {
  irParaSlide(slideAtual + 1);
  iniciarAutoPlay();
});

// Renderização do Cardápio (READ)
function renderizarCardapio() {
  const grid = document.getElementById("menu-grid");
  const lista = gerenciador.listarProdutos(categoriaAtiva);
  grid.innerHTML = "";

  if (lista.length === 0) {
    grid.innerHTML = `<p class="muted">Nenhum item cadastrado nesta categoria.</p>`;
    return;
  }

  lista.forEach(prod => {
    const card = document.createElement("article");
    card.className = "menu-card";
    card.innerHTML = `
      <div>
        <img src="${prod.imagem}" alt="Foto do prato ${prod.nome}" onerror="fallbackImagem(this)">
        <div class="menu-card-body">
          <span class="badge-cat">${prod.categoria}</span>
          <h3>${prod.nome}</h3>
          <p>${prod.descricao}</p>
        </div>
      </div>
      <div class="menu-card-footer">
        <div class="menu-price">${formatarMoeda(prod.preco)}</div>
        <div class="card-btn-group">
          <button type="button" class="btn btn-primary btn-block" onclick="adicionarAoCarrinho(${prod.id})">
            Adicionar ao Pedido
          </button>
          <div class="crud-mini-btns">
            <button type="button" class="btn btn-outline" onclick="carregarEdicaoProduto(${prod.id})">Editar</button>
            <button type="button" class="btn btn-danger-outline" onclick="excluirProduto(${prod.id})">Excluir</button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Filtros do Cardápio
document.querySelectorAll(".chip").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".chip").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    categoriaAtiva = e.target.dataset.cat;
    renderizarCardapio();
  });
});

// CRUD Produto: CREATE / UPDATE
document.getElementById("product-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("prod-id").value;
  const nome = document.getElementById("prod-nome").value;
  const categoria = document.getElementById("prod-categoria").value;
  const preco = document.getElementById("prod-preco").value;
  const imagem = document.getElementById("prod-imagem").value;
  const descricao = document.getElementById("prod-descricao").value;

  try {
    if (id) {
      gerenciador.atualizarProduto(id, { nome, descricao, preco, categoria, imagem });
      exibirFeedback(`"${nome}" atualizado no cardápio!`, "success");
    } else {
      gerenciador.cadastrarProduto(nome, descricao, preco, categoria, imagem);
      exibirFeedback(`"${nome}" cadastrado com sucesso!`, "success");
    }

    resetarFormularioProduto();
    renderizarCardapio();
    renderizarCarrossel();
    renderizarCarrinho();
  } catch (erro) {
    exibirFeedback(erro.message, "error");
  }
});

function carregarEdicaoProduto(id) {
  const prod = gerenciador.buscarProdutoPorId(id);
  if (!prod) return;

  document.getElementById("prod-id").value = prod.id;
  document.getElementById("prod-nome").value = prod.nome;
  document.getElementById("prod-categoria").value = prod.categoria;
  document.getElementById("prod-preco").value = prod.preco;
  document.getElementById("prod-imagem").value = prod.imagem;
  document.getElementById("prod-descricao").value = prod.descricao;

  document.getElementById("btn-save-product").textContent = "Salvar Alterações";
  document.getElementById("btn-cancel-edit").classList.remove("hidden");
  document.getElementById("gerenciar").scrollIntoView({ behavior: "smooth" });
}

function resetarFormularioProduto() {
  document.getElementById("product-form").reset();
  document.getElementById("prod-id").value = "";
  document.getElementById("btn-save-product").textContent = "Cadastrar Produto";
  document.getElementById("btn-cancel-edit").classList.add("hidden");
}

document.getElementById("btn-cancel-edit").addEventListener("click", resetarFormularioProduto);

// CRUD Produto: DELETE (com confirmação de IHC)
function excluirProduto(id) {
  const prod = gerenciador.buscarProdutoPorId(id);
  if (!prod) return;

  if (!confirm(`Tem certeza que deseja remover "${prod.nome}" do cardápio?`)) return;

  gerenciador.removerProduto(id);
  carrinho.removerItem(id);
  renderizarCardapio();
  renderizarCarrossel();
  renderizarCarrinho();
  exibirFeedback(`"${prod.nome}" removido do cardápio.`, "info");
}

// Operações do Carrinho
function adicionarAoCarrinho(id) {
  const prod = gerenciador.buscarProdutoPorId(id);
  if (!prod) return;

  carrinho.adicionarItem(prod, 1);
  renderizarCarrinho();
  exibirFeedback(`"${prod.nome}" adicionado ao pedido!`, "success");
}

function alterarQuantidadeCarrinho(id, delta) {
  carrinho.alterarQuantidade(id, delta);
  renderizarCarrinho();
}

function removerItemCarrinho(id) {
  if (!confirm("Deseja remover este item do carrinho?")) return;
  carrinho.removerItem(id);
  renderizarCarrinho();
  exibirFeedback("Item removido do carrinho.", "info");
}

document.getElementById("btn-clear-cart").addEventListener("click", () => {
  if (carrinho.itens.length === 0) return;
  if (!confirm("Tem certeza que deseja limpar todo o carrinho?")) return;

  carrinho.limpar();
  renderizarCarrinho();
  exibirFeedback("Carrinho esvaziado.", "info");
});

document.getElementById("delivery-type").addEventListener("change", (e) => {
  carrinho.tipoEntrega = e.target.value;
  renderizarCarrinho();
});

function renderizarCarrinho() {
  const container = document.getElementById("cart-items-container");
  const itens = carrinho.itens;

  document.getElementById("cart-badge").textContent = carrinho.getTotalUnidades();

  if (itens.length === 0) {
    container.innerHTML = `<p class="empty-msg muted">Seu carrinho está vazio. Adicione itens do cardápio.</p>`;
  } else {
    container.innerHTML = "";
    itens.forEach(item => {
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <div class="cart-item-info">
          <strong>${item.produto.nome}</strong>
          <small>${item.produto.categoria} • ${formatarMoeda(item.calcularSubtotal())}</small>
        </div>
        <div class="qty-controls">
          <button type="button" class="qty-btn" onclick="alterarQuantidadeCarrinho(${item.produto.id}, -1)" aria-label="Diminuir">-</button>
          <span><strong>${item.quantidade}</strong></span>
          <button type="button" class="qty-btn" onclick="alterarQuantidadeCarrinho(${item.produto.id}, 1)" aria-label="Aumentar">+</button>
          <button type="button" class="btn-danger-link" onclick="removerItemCarrinho(${item.produto.id})" aria-label="Remover item">✕</button>
        </div>
      `;
      container.appendChild(row);
    });
  }

  const subtotal = carrinho.calcularSubtotal();
  const taxa = carrinho.calcularTaxaEntrega();
  const total = carrinho.calcularTotal();

  document.getElementById("cart-subtotal").textContent = formatarMoeda(subtotal);
  document.getElementById("cart-fee").textContent = formatarMoeda(taxa);
  document.getElementById("cart-total").textContent = formatarMoeda(total);
}

// Finalização do Pedido
document.getElementById("checkout-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const cliente = document.getElementById("client-name").value;

  try {
    const pedido = gerenciador.registrarPedido(cliente, carrinho);
    carrinho.limpar();
    e.target.reset();
    renderizarCarrinho();
    renderizarPedidos();
    exibirFeedback(`Pedido #${pedido.id} de ${pedido.cliente} confirmado!`, "success");
  } catch (erro) {
    exibirFeedback(erro.message, "error");
  }
});

function renderizarPedidos() {
  const list = document.getElementById("orders-list");
  const pedidos = gerenciador.listarPedidos();

  document.getElementById("orders-count").textContent = pedidos.length;

  if (pedidos.length === 0) {
    list.innerHTML = `<p class="muted">Nenhum pedido finalizado ainda.</p>`;
    return;
  }

  list.innerHTML = "";
  pedidos.forEach(p => {
    const resumo = p.itens.map(i => `${i.quantidade}x ${i.nome}`).join(", ");
    const card = document.createElement("div");
    card.className = "order-card";
    card.innerHTML = `
      <div class="order-top">
        <span>Pedido #${p.id} — ${p.cliente}</span>
        <span class="order-status">${p.status}</span>
      </div>
      <p class="muted">${p.data} • ${p.tipoEntrega === "delivery" ? "Delivery" : "Retirada/Local"}</p>
      <p style="margin: 0.4rem 0; font-size: 0.9rem;">${resumo}</p>
      <strong>Total: ${formatarMoeda(p.total)}</strong>
    `;
    list.appendChild(card);
  });
}

// Inicialização
renderizarCarrossel();
iniciarAutoPlay();
renderizarCardapio();
renderizarCarrinho();
renderizarPedidos();