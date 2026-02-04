let carrinho = [];
let sistemaAtivo = true;
let descontoAplicado = 0; // Ex: 0.10 para 10%

/* ==================== SELETORES ==================== */
const selecionar = (s, el = document) => el.querySelector(s);
const selecionarTodos = (s, el = document) => el.querySelectorAll(s);

const paginas = selecionarTodos('.pagina');
const listaItensPedido = selecionar('#lista-itens-pedido');
const elementoValorTotalFinal = selecionar('#valor-total-final');

/* ==================== NAVEGAÇÃO COM ANIMAÇÃO ==================== */
function navegarPara(destinoId) {
    // Esconde todas as páginas
    paginas.forEach(p => {
        p.classList.remove('ativa');
        p.style.display = 'none';
    });

    const destino = document.getElementById(destinoId);
    if (destino) {
        // Ajuste de display para manter o layout
        destino.style.display = (destinoId === 'cardapio' || destinoId === 'home') ? 'block' : 'flex';

        // Força o reflow para reiniciar animações CSS
        void destino.offsetWidth;
        destino.classList.add('ativa');
    }
window.addEventListener('load', () => {
    const loader = document.getElementById('loader-overlay');
    if (loader) {
        loader.style.display = 'none'; // Esconde o loader
    }
    navegarPara('home'); // Garante que a home seja a primeira página visível
});
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (destinoId === 'checkout-page') {
        sistemaAtivo = false; // Bloqueia novas adições durante o pagamento
        atualizarResumoPedido();
        configurarMetodoPagamento();
    } else {
        sistemaAtivo = true;
    }
}
function filtrarMenu(categoria) {
    const itens = document.querySelectorAll('.cartao-cardapio');
    const botoes = document.querySelectorAll('.tab-btn');

    // Atualiza botão ativo
    botoes.forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText.toLowerCase() === categoria || (categoria === 'todos' && btn.innerText === 'Todos')) {
            btn.classList.add('active');
        }
    });

    // Filtra os itens com animação
    itens.forEach(item => {
        item.style.display = 'none';
        if (categoria === 'todos' || item.getAttribute('data-categoria') === categoria) {
            item.style.display = 'block';
            item.animate([
                { opacity: 0, transform: 'scale(0.9)' },
                { opacity: 1, transform: 'scale(1)' }
            ], { duration: 400 });
        }
    });
}
/* ==================== LÓGICA DO CARRINHO ==================== */
const formatarMoedaBR = valor => `R$ ${valor.toFixed(2).replace('.', ',')}`;

function adicionarItemAoCarrinho(nome, preco, urlImagem) {
    if (!sistemaAtivo) return;
    const itemExistente = carrinho.find(i => i.nome === nome);
    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({ nome, preco, quantidade: 1, urlImagem });
    }
    atualizarCarrinhoFlutuante();
}

function alterarQuantidade(index, delta) {
    if (carrinho[index].quantidade + delta > 0) {
        carrinho[index].quantidade += delta;
    } else {
        carrinho.splice(index, 1);
    }

    atualizarCarrinhoFlutuante();

    // Se estiver no checkout, atualiza o resumo também
    if (document.getElementById('checkout-page').classList.contains('ativa')) {
        atualizarResumoPedido();
    }
}

function atualizarCarrinhoFlutuante() {
    const container = selecionar('#itens-carrinho');
    const indicador = selecionar('#indicador-carrinho');
    const totalTxt = selecionar('#total-carrinho');

    // Seletores do Desconto no Carrinho (Novos)
    const caixaDesconto = selecionar('#caixa-desconto-carrinho');
    const valorDescontoTxt = selecionar('#valor-desconto-carrinho');

    container.innerHTML = '';
    selecionar('#painel-carrinho').classList.add('ativo');

    if (carrinho.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#666; padding: 20px;">Carrinho vazio.</p>';
        indicador.textContent = '0';
        totalTxt.textContent = 'R$ 0,00';
        if (caixaDesconto) caixaDesconto.style.display = 'none';
        return;
    }

    let subtotal = 0;
    let qtdTotal = 0;

    carrinho.forEach((item, index) => {
        subtotal += item.preco * item.quantidade;
        qtdTotal += item.quantidade;

        container.innerHTML += `
            <div class="item-carrinho">
                <img src="${item.urlImagem}">
                <div class="info-item-carrinho">
                    <p>${item.nome}</p>
                    <span>${formatarMoedaBR(item.preco)}</span>
                </div>
                <div class="controle-quantidade">
                    <button class="botao-qtd" onclick="alterarQuantidade(${index}, -1)">-</button>
                    <span class="valor-quantidade">${item.quantidade}</span>
                    <button class="botao-qtd" onclick="alterarQuantidade(${index}, 1)">+</button>
                </div>
            </div>`;
    });

    // Cálculos de Desconto
    const valorDesconto = subtotal * descontoAplicado;
    const totalFinal = subtotal - valorDesconto;

    indicador.textContent = qtdTotal;
    totalTxt.textContent = formatarMoedaBR(totalFinal);

    // Exibe o desconto no carrinho lateral se existir
    if (descontoAplicado > 0 && caixaDesconto) {
        caixaDesconto.style.display = 'flex';
        valorDescontoTxt.textContent = `- ${formatarMoedaBR(valorDesconto)}`;
    } else if (caixaDesconto) {
        caixaDesconto.style.display = 'none';
    }
}

/* ==================== CUPOM E CHECKOUT ==================== */
function aplicarCupom() {
    const input = selecionar('#input-cupom');
    const msg = selecionar('#mensagem-cupom');
    const cod = input.value.toUpperCase().trim();

    if (cod === 'DOCE5') {
        descontoAplicado = 0.05;
        msg.textContent = "Cupom de 5% aplicado!";
        msg.style.color = "green";
    } else if (cod === 'TIANA10') {
        descontoAplicado = 0.10;
        msg.textContent = "Cupom de 10% aplicado! ✨";
        msg.style.color = "green";
    } else {
        descontoAplicado = 0;
        msg.textContent = "Cupom inválido.";
        msg.style.color = "red";
    }

    msg.style.display = "block";
    atualizarCarrinhoFlutuante(); // Atualiza o carrinho lateral
    if (selecionar('#checkout-page').classList.contains('ativa')) {
        atualizarResumoPedido(); // Atualiza a tela de pagamento
    }
}
function buscarPrato() {
    const input = document.getElementById('input-busca').value.toLowerCase();
    const itens = document.querySelectorAll('.cartao-cardapio');

    itens.forEach(item => {
        const nomePrato = item.querySelector('h3').innerText.toLowerCase();

        if (nomePrato.includes(input)) {
            item.style.display = "flex"; // Mostra se combinar

            // Se o usuário digitou algo, adiciona um brilho nos resultados
            if (input.length > 0) {
                item.classList.add('highlight');
            } else {
                item.classList.remove('highlight');
            }
        } else {
            item.style.display = "none"; // Esconde se não combinar
            item.classList.remove('highlight');
        }
    });
}
function atualizarResumoPedido() {
    listaItensPedido.innerHTML = '';
    let bruto = 0;

    carrinho.forEach(item => {
        bruto += item.preco * item.quantidade;
        listaItensPedido.innerHTML += `
            <div class="cartao-item">
                <img src="${item.urlImagem}" class="imagem-item">
                <div class="detalhes-item">
                    <p>${item.nome}</p>
                    <p>${formatarMoedaBR(item.preco)} <span class="quantidade">x${item.quantidade}</span></p>
                </div>
            </div>`;
    });

    let totalFinal = bruto * (1 - descontoAplicado);
    elementoValorTotalFinal.innerHTML = `Total: ${formatarMoedaBR(totalFinal)} ${descontoAplicado > 0 ? '<br><small style="color:#1f6f5b;">Desconto aplicado com sucesso!</small>' : ''}`;
}

/* ==================== MÉTODOS DE PAGAMENTO ==================== */
function configurarMetodoPagamento() {
    const opcoes = selecionarTodos('.caixa-opcao');
    const detPix = selecionar('#detalhes-pix');
    const detCartao = selecionar('#detalhes-cartao');

    opcoes.forEach(opt => {
        opt.onclick = function () {
            opcoes.forEach(o => o.classList.remove('opcao-ativa'));
            this.classList.add('opcao-ativa');
            const metodo = this.getAttribute('data-metodo');

            if (metodo === 'pix') {
                detPix.classList.remove('metodo-oculto');
                detCartao.classList.add('metodo-oculto');
            } else {
                detPix.classList.add('metodo-oculto');
                detCartao.classList.remove('metodo-oculto');
            }
        };
    });
}

/* ==================== COZINHA AO VIVO ==================== */
function iniciarCozinhaAoVivo() {
    const TEMPO_TOTAL_SEGUNDOS = 5 * 60;
    let segundosRestantes = TEMPO_TOTAL_SEGUNDOS;

    const barra = selecionar('#barra-progresso-ativa');
    const status = selecionar('#status-texto');
    const substatus = selecionar('#substatus-texto');
    const cronoElemento = selecionar('#cronometro');

    const etapas = [
        { porce: 0, msg: "Recebemos seu pedido!", sub: "Tiana está separando os ingredientes...", icone: "👩‍🍳" },
        { porce: 25, msg: "Fogo aceso!", sub: "O caldeirão de Gumbo está fervendo!", icone: "🔥" },
        { porce: 50, msg: "Caprichando no tempero!", sub: "Quase tudo pronto por aqui...", icone: "🌿" },
        { porce: 75, msg: "Pedido na bandeja!", sub: "O Ray está iluminando o caminho.", icone: "✨" },
        { porce: 100, msg: "Saiu para entrega!", sub: "A magia chegou na sua porta!", icone: "🛵" }
    ];

    const intervaloMestre = setInterval(() => {
        segundosRestantes--;
        const porcentagem = ((TEMPO_TOTAL_SEGUNDOS - segundosRestantes) / TEMPO_TOTAL_SEGUNDOS) * 100;

        if (barra) barra.style.width = porcentagem + "%";

        const m = Math.floor(segundosRestantes / 60);
        const s = segundosRestantes % 60;
        if (cronoElemento) cronoElemento.innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

        const etapaAtual = [...etapas].reverse().find(e => porcentagem >= e.porce);
        if (etapaAtual && status.innerText !== etapaAtual.msg) {
            status.innerText = etapaAtual.msg;
            substatus.innerText = etapaAtual.sub;
        }

        if (segundosRestantes <= 0) {
            clearInterval(intervaloMestre);
            status.innerText = "Bom apetite! 👑";
        }
    }, 1000);
}

/* ==================== INICIALIZAÇÃO ==================== */
document.addEventListener('DOMContentLoaded', () => {
    // Loader
    const loader = selecionar('#loader-overlay');
    if (loader) setTimeout(() => loader.classList.add('loader-hidden'), 2000);

    // Modal Cupom Automático
    const modalCupom = selecionar('#modal-cupom');
    if (modalCupom) setTimeout(() => modalCupom.style.display = 'flex', 3500);

    selecionar('#fechar-modal-cupom').onclick = () => modalCupom.style.display = 'none';

    selecionar('#btn-copiar-cupom').onclick = function () {
        const texto = selecionar('#codigo-texto').innerText;
        navigator.clipboard.writeText(texto).then(() => {
            this.innerText = "Copiado! ✨";
            setTimeout(() => this.innerText = "Copiar", 2000);
        });
    };

    // Botões Adicionar
    selecionarTodos('.botao-adicionar').forEach(btn => {
        btn.onclick = () => {
            const card = btn.closest('.cartao-cardapio');
            const nome = btn.dataset.nome;
            const preco = parseFloat(btn.dataset.preco);
            const img = card.querySelector('img').src;
            adicionarItemAoCarrinho(nome, preco, img);
        };
    });

    // Links Navegação
    selecionarTodos('.link-navegacao').forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            navegarPara(link.dataset.destino);
        };
    });

    // Eventos de Botões
    selecionar('#btn-aplicar-cupom').onclick = aplicarCupom;
    selecionar('#botao-finalizar').onclick = () => navegarPara('checkout-page');
    selecionar('#botao-ir-checkout').onclick = () => navegarPara('checkout-page');
    selecionar('#botao-fechar-carrinho').onclick = () => selecionar('#painel-carrinho').classList.remove('ativo');
    selecionar('#botao-carrinho').onclick = () => selecionar('#painel-carrinho').classList.toggle('ativo');

    // Pagamento para Entrega
    selecionar('#botao-pix').onclick = () => navegarPara('entrega-page');
    selecionar('#form-cartao').onsubmit = (e) => {
        e.preventDefault();
        navegarPara('entrega-page');
    };

    // Entrega para Finalizado
    selecionar('.botao-ver-pedido').onclick = () => {
        navegarPara('finalizado-page');
        iniciarCozinhaAoVivo();
        carrinho = [];
        descontoAplicado = 0;
        atualizarCarrinhoFlutuante();
    };
});
// Lógica da Aba Secreta Mama Odie
const estrelaEvangeline = document.getElementById('evangeline-trigger');
const abaSecreta = document.getElementById('aba-secreta-mama');
const btnFecharSecreto = document.getElementById('fechar-secreto');

estrelaEvangeline.addEventListener('click', () => {
    abaSecreta.classList.add('ativa');
    document.body.classList.add('magic-mode');

    // Pequeno detalhe de som (opcional)
    const audio = new Audio('https://www.soundjay.com/magic/magic-chime-01.mp3');
    audio.volume = 0.2;
    audio.play();
});

btnFecharSecreto.addEventListener('click', () => {
    abaSecreta.classList.remove('ativa');
    document.body.classList.remove('magic-mode');
});
const gramofone = document.getElementById('player-musica-tiana');
const audio = document.getElementById('audio-tiana');
const legenda = gramofone.querySelector('.legenda-musica');

gramofone.addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
        gramofone.classList.add('tocando');
        legenda.innerText = "Pausar Jazz";
    } else {
        audio.pause();
        gramofone.classList.remove('tocando');
        legenda.innerText = "Tocar Jazz";
    }
});

// Opcional: Volume mais baixo para não assustar
audio.volume = 0.4;

