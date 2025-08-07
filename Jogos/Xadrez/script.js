// Variáveis do jogo que não dependem do HTML
let pecaSendoArrastada = null;
let casaOrigemArrastada = null;
let turnoAtual = '';
let jogoTerminado = true;
let podeRoqueBrancas = { grande: true, pequeno: true };
let podeRoquePretas = { grande: true, pequeno: true };
let casaEnPassant = null;
let casaPromocao = null;
let pecasCapturadas = { b: [], p: [] };
let perspectiva = 'b';
let casaSelecionada = null;
let destacarMovimentosAtivo = true; // Destaque de movimentos sempre ativo
let modoDeJogo = 'humano';
let corJogador = 'b';

const matrizInicial = [
    ['torre-p', 'cavalo-p', 'bispo-p', 'dama-p', 'rei-p', 'bispo-p', 'cavalo-p', 'torre-p'],
    ['peao-p', 'peao-p', 'peao-p', 'peao-p', 'peao-p', 'peao-p', 'peao-p', 'peao-p'],
    ['vazio', 'vazio', 'vazio', 'vazio', 'vazio', 'vazio', 'vazio', 'vazio'],
    ['vazio', 'vazio', 'vazio', 'vazio', 'vazio', 'vazio', 'vazio', 'vazio'],
    ['vazio', 'vazio', 'vazio', 'vazio', 'vazio', 'vazio', 'vazio', 'vazio'],
    ['vazio', 'vazio', 'vazio', 'vazio', 'vazio', 'vazio', 'vazio', 'vazio'],
    ['peao-b', 'peao-b', 'peao-b', 'peao-b', 'peao-b', 'peao-b', 'peao-b', 'peao-b'],
    ['torre-b', 'cavalo-b', 'bispo-b', 'dama-b', 'rei-b', 'bispo-b', 'cavalo-b', 'torre-b']
];
let tabuleiro = matrizInicial.map(row => [...row]);

const pecaEmojis = {
    'torre-p': '♜', 'cavalo-p': '♞', 'bispo-p': '♝', 'dama-p': '♛', 'rei-p': '♚', 'peao-p': '♟',
    'torre-b': '♖', 'cavalo-b': '♘', 'bispo-b': '♗', 'dama-b': '♕', 'rei-b': '♔', 'peao-b': '♙',
    'vazio': ''
};

const somInicio = new Audio('inicio.mp3');
const somMovimento = new Audio('movimento.mp3');
const somCaptura = new Audio('captura.mp3');

const pecaValor = {
    'peao': 1,
    'cavalo': 3,
    'bispo': 3,
    'torre': 5,
    'dama': 9,
    'rei': 100 // Valor alto para o rei
};

let tabuleiroDiv, capturasBrancasDiv, capturasPretasDiv, statusElemento, opcoesBtn, novoJogoBtn;
const DELAY_BOT = 800;


function iniciarJogo() {
    tabuleiroDiv = document.getElementById('tabuleiro');
    capturasBrancasDiv = document.getElementById('capturas-brancas');
    capturasPretasDiv = document.getElementById('capturas-pretas');
    opcoesBtn = document.getElementById('opcoes-btn');
    novoJogoBtn = document.getElementById('novo-jogo-btn');
    statusElemento = document.getElementById('status');
    
    criarTabuleiro();
    mostrarMenuEscolhaCor();
    
    opcoesBtn.addEventListener('click', mostrarMenuOpcoes);
    novoJogoBtn.addEventListener('click', mostrarMenuEscolhaCor);
}

function mostrarMenuEscolhaCor() {
    tabuleiroDiv.innerHTML = '';
    statusElemento.textContent = ``;
    atualizarCapturas();
    alternarVisibilidadeBotoes(false);

    const escolhaCorMenu = document.createElement('div');
    escolhaCorMenu.id = 'escolha-cor-menu';
    escolhaCorMenu.innerHTML = `
        <h2>Escolha o modo de jogo e sua cor:</h2>
        <div class="opcoes-cor">
            <button id="btn-humano-brancas">Brancas (Jogador vs. Jogador)</button>
            <button id="btn-humano-pretas">Pretas (Jogador vs. Jogador)</button>
            <button id="btn-bot-brancas">Brancas (Jogador vs. Bot)</button>
            <button id="btn-bot-pretas">Pretas (Jogador vs. Bot)</button>
        </div>
    `;
    document.body.appendChild(escolhaCorMenu);
    
    document.getElementById('btn-humano-brancas').addEventListener('click', () => {
        perspectiva = 'b';
        escolhaCorMenu.remove();
        novoJogo('b', 'humano');
    });
    document.getElementById('btn-humano-pretas').addEventListener('click', () => {
        perspectiva = 'p';
        escolhaCorMenu.remove();
        novoJogo('p', 'humano');
    });
    document.getElementById('btn-bot-brancas').addEventListener('click', () => {
        perspectiva = 'b';
        escolhaCorMenu.remove();
        novoJogo('b', 'bot');
    });
    document.getElementById('btn-bot-pretas').addEventListener('click', () => {
        perspectiva = 'p';
        escolhaCorMenu.remove();
        novoJogo('p', 'bot');
    });
}

function mostrarMenuOpcoes() {
    if (document.getElementById('promocao-menu') || document.getElementById('escolha-cor-menu') || document.getElementById('opcoes-menu')) return;

    const opcoesMenu = document.createElement('div');
    opcoesMenu.id = 'opcoes-menu';

    const textoBotao = destacarMovimentosAtivo ? 'Desativar Destaque' : 'Ativar Destaque';

    opcoesMenu.innerHTML = `
        <h2>Opções do Jogo</h2>
        <button id="alternar-destaque">${textoBotao}</button>
        <button id="fechar-opcoes">Fechar</button>
    `;
    document.body.appendChild(opcoesMenu);

    document.getElementById('alternar-destaque').addEventListener('click', () => {
        destacarMovimentosAtivo = !destacarMovimentosAtivo;
        document.getElementById('alternar-destaque').textContent = destacarMovimentosAtivo ? 'Desativar Destaque' : 'Ativar Destaque';
        limparDestaques();
    });
    document.getElementById('fechar-opcoes').addEventListener('click', () => opcoesMenu.remove());
}

function alternarVisibilidadeBotoes(mostrar) {
    const botoesContainer = document.getElementById('botoes-container');
    if(botoesContainer) {
        if (mostrar) {
            botoesContainer.classList.remove('oculto');
        } else {
            botoesContainer.classList.add('oculto');
        }
    }
}


function criarTabuleiro() {
    tabuleiroDiv.innerHTML = '';
    
    const [linhaInicio, linhaFim, passo] = (perspectiva === 'b') ? [0, 8, 1] : [7, -1, -1];

    for (let i = linhaInicio; i !== linhaFim; i += passo) {
        for (let j = 0; j < 8; j++) {
            const casa = document.createElement('div');
            casa.classList.add('casa');
            const corCasa = ((i + j) % 2 === 0) ? 'clara' : 'escura';
            casa.classList.add(corCasa);
            casa.dataset.linha = i;
            casa.dataset.coluna = j;

            const pecaNome = tabuleiro[i][j];
            const pecaEmoji = pecaEmojis[pecaNome];

            if (pecaEmoji) {
                const peca = document.createElement('span');
                peca.classList.add('peca');
                peca.textContent = pecaEmoji;
                peca.draggable = true;

                const corPeca = pecaNome.split('-')[1];
                if (corPeca === 'b') {
                    peca.classList.add('peca-branca');
                } else if (corPeca === 'p') {
                    peca.classList.add('peca-preta');
                }
                
                casa.appendChild(peca);
            }
            
            casa.addEventListener('dragover', (e) => e.preventDefault());
            casa.addEventListener('drop', (e) => lidarComSoltar(e, casa));
            casa.addEventListener('click', (e) => lidarComClique(e, casa));

            tabuleiroDiv.appendChild(casa);
        }
    }

    document.querySelectorAll('.peca').forEach(peca => {
        peca.addEventListener('dragstart', (e) => lidarComArrastar(e, peca));
    });

    if (reiEmXeque(turnoAtual)) {
        destacarXeque(turnoAtual);
    }
    atualizarCapturas();
}

function lidarComClique(e, casa) {
    if (jogoTerminado || casaPromocao || (modoDeJogo === 'bot' && turnoAtual !== corJogador)) {
        return;
    }
    
    const linha = parseInt(casa.dataset.linha);
    const coluna = parseInt(casa.dataset.coluna);
    const pecaNaCasa = tabuleiro[linha][coluna];
    
    if(pecaNaCasa !== 'vazio' && pecaNaCasa.split('-')[1] === turnoAtual) {
        limparDestaques();
        casaSelecionada = casa;
        casa.classList.add('selecionada');
        if (destacarMovimentosAtivo) {
            destacarMovimentos(linha, coluna);
        }
    } else if (casaSelecionada && casa.classList.contains('casa-movimento-valido')) {
        const linhaOrigem = parseInt(casaSelecionada.dataset.linha);
        const colunaOrigem = parseInt(casaSelecionada.dataset.coluna);
        const pecaArrastada = tabuleiro[linhaOrigem][colunaOrigem];
        
        executarMovimento(pecaArrastada, linhaOrigem, colunaOrigem, linha, coluna);
    } else {
        limparDestaques();
    }
}


function lidarComArrastar(e, pecaArrastada) {
    if (jogoTerminado || casaPromocao || (modoDeJogo === 'bot' && turnoAtual !== corJogador)) {
        e.preventDefault();
        return;
    }
    const casaOrigem = pecaArrastada.parentNode;
    const linhaOrigem = parseInt(casaOrigem.dataset.linha);
    const colunaOrigem = parseInt(casaOrigem.dataset.coluna);
    
    const corPeca = tabuleiro[linhaOrigem][colunaOrigem].split('-')[1];
    if (corPeca !== turnoAtual) {
        e.preventDefault();
        return;
    }

    limparDestaques();
    casaSelecionada = casaOrigem;
    casaOrigem.classList.add('selecionada');
    if (destacarMovimentosAtivo) {
        destacarMovimentos(linhaOrigem, colunaOrigem);
    }

    pecaSendoArrastada = tabuleiro[linhaOrigem][colunaOrigem];
    casaOrigemArrastada = [linhaOrigem, colunaOrigem];
}

function lidarComSoltar(e, casaDestino) {
    if (!pecaSendoArrastada || jogoTerminado || casaPromocao) return;

    const linhaDestino = parseInt(casaDestino.dataset.linha);
    const colunaDestino = parseInt(casaDestino.dataset.coluna);
    const [linhaOrigem, colunaOrigem] = casaOrigemArrastada;

    const movimentoValidoEncontrado = [...document.querySelectorAll('.casa-movimento-valido')]
        .some(casa => parseInt(casa.dataset.linha) === linhaDestino && parseInt(casa.dataset.coluna) === colunaDestino);
    
    if (movimentoValidoEncontrado) {
        executarMovimento(pecaSendoArrastada, linhaOrigem, colunaOrigem, linhaDestino, colunaDestino);
    } else {
        limparDestaques();
    }
}

function executarMovimento(peca, linhaOrigem, colunaOrigem, linhaDestino, colunaDestino) {
    const tipoPeca = peca.split('-')[0];
    const corPeca = peca.split('-')[1];

    let movimentoExecutado = false;
    let pecaCapturada = tabuleiro[linhaDestino][colunaDestino];

    if (tipoPeca === 'rei' && Math.abs(colunaDestino - colunaOrigem) === 2) {
        if (movimentoRoque(corPeca, linhaOrigem, colunaOrigem, linhaDestino, colunaDestino)) {
            tabuleiro[linhaDestino][colunaDestino] = peca;
            tabuleiro[linhaOrigem][colunaOrigem] = 'vazio';
            const colunaTorre = (colunaDestino > colunaOrigem) ? 7 : 0;
            const novaColunaTorre = (colunaDestino > colunaOrigem) ? 5 : 3;
            const nomeTorre = tabuleiro[linhaOrigem][colunaTorre];
            tabuleiro[linhaOrigem][novaColunaTorre] = nomeTorre;
            tabuleiro[linhaOrigem][colunaTorre] = 'vazio';
            somRoque.play();
            movimentoExecutado = true;
        }
    }
    else if (tipoPeca === 'peao' && (linhaDestino + '-' + colunaDestino) === casaEnPassant && Math.abs(colunaDestino - colunaOrigem) === 1) {
        if (movimentoValido(peca, linhaOrigem, colunaOrigem, linhaDestino, colunaDestino) && !movimentoColocaReiEmXeque(peca, linhaOrigem, colunaOrigem, linhaDestino, colunaDestino)) {
            const linhaCapturada = corPeca === 'b' ? linhaDestino + 1 : linhaDestino - 1;
            pecasCapturadas[tabuleiro[linhaCapturada][colunaDestino].split('-')[1]].push(tabuleiro[linhaCapturada][colunaDestino]);
            tabuleiro[linhaCapturada][colunaDestino] = 'vazio';
            tabuleiro[linhaDestino][colunaDestino] = peca;
            tabuleiro[linhaOrigem][colunaOrigem] = 'vazio';
            somCaptura.play();
            movimentoExecutado = true;
        }
    }
    else {
        if (movimentoValido(peca, linhaOrigem, colunaOrigem, linhaDestino, colunaDestino) && !movimentoColocaReiEmXeque(peca, linhaOrigem, colunaOrigem, linhaDestino, colunaDestino)) {
            if (pecaCapturada !== 'vazio') {
                pecasCapturadas[pecaCapturada.split('-')[1]].push(pecaCapturada);
                somCaptura.play();
            } else {
                somMovimento.play();
            }
            tabuleiro[linhaDestino][colunaDestino] = peca;
            tabuleiro[linhaOrigem][colunaOrigem] = 'vazio';
            movimentoExecutado = true;
        }
    }

    if (movimentoExecutado) {
        if (tipoPeca === 'peao' && ((corPeca === 'b' && linhaDestino === 0) || (corPeca === 'p' && linhaDestino === 7))) {
            casaPromocao = [linhaDestino, colunaDestino];
            mostrarMenuPromocao(corPeca);
            return;
        }

        casaEnPassant = null;
        if (tipoPeca === 'peao' && Math.abs(linhaDestino - linhaOrigem) === 2) {
            casaEnPassant = `${corPeca === 'b' ? linhaDestino + 1 : linhaDestino - 1}-${colunaDestino}`;
        }
        
        if (tipoPeca === 'rei') {
            if (corPeca === 'b') { podeRoqueBrancas.grande = false; podeRoqueBrancas.pequeno = false; }
            else { podeRoquePretas.grande = false; podeRoquePretas.pequeno = false; }
        }
        if (tipoPeca === 'torre' && colunaOrigem === 0) {
            if (corPeca === 'b') { podeRoqueBrancas.grande = false; }
            else { podeRoquePretas.grande = false; }
        }
        if (tipoPeca === 'torre' && colunaOrigem === 7) {
            if (corPeca === 'b') { podeRoqueBrancas.pequeno = false; }
            else { podeRoquePretas.pequeno = false; }
        }
        
        turnoAtual = turnoAtual === 'b' ? 'p' : 'b';
        statusElemento.textContent = `Turno das ${turnoAtual === 'b' ? 'Brancas' : 'Pretas'}`;

        pecaSendoArrastada = null;
        casaOrigemArrastada = null;
        limparDestaques();
        criarTabuleiro();

        if (estaEmXequeMate(turnoAtual)) {
            const vencedor = turnoAtual === 'b' ? 'Pretas' : 'Brancas';
            statusElemento.textContent = `Xeque-mate! ${vencedor} venceram!`;
            jogoTerminado = true;
        } else if (modoDeJogo === 'bot' && turnoAtual !== corJogador) {
            setTimeout(jogadaDoBot, DELAY_BOT);
        }
    } else {
        limparDestaques();
    }
}

function jogadaDoBot() {
    const corBot = turnoAtual;
    let melhorJogada = null;
    let melhorPontuacao = -Infinity;
    const melhoresJogadas = [];

    for (let lo = 0; lo < 8; lo++) {
        for (let co = 0; co < 8; co++) {
            const peca = tabuleiro[lo][co];
            if (peca !== 'vazio' && peca.split('-')[1] === corBot) {
                for (let ld = 0; ld < 8; ld++) {
                    for (let cd = 0; cd < 8; cd++) {
                        if (movimentoValido(peca, lo, co, ld, cd) && !movimentoColocaReiEmXeque(peca, lo, co, ld, cd)) {
                            let pontuacao = 0;
                            const pecaCapturada = tabuleiro[ld][cd];

                            if (pecaCapturada !== 'vazio') {
                                const tipoPecaCapturada = pecaCapturada.split('-')[0];
                                pontuacao += pecaValor[tipoPecaCapturada];
                            }

                            const valorPecaMovida = pecaValor[peca.split('-')[0]];

                            const tempPeca = tabuleiro[ld][cd];
                            tabuleiro[ld][cd] = peca;
                            tabuleiro[lo][co] = 'vazio';

                            const valorAmeaca = estaSobAtaqueValor(ld, cd, corBot);
                            pontuacao -= valorAmeaca;

                            if (estaEmXequeMate(corJogador)) {
                                pontuacao = 10000;
                            }

                            tabuleiro[lo][co] = peca;
                            tabuleiro[ld][cd] = tempPeca;

                            if (pontuacao > melhorPontuacao) {
                                melhorPontuacao = pontuacao;
                                melhoresJogadas.length = 0;
                                melhoresJogadas.push({ peca, linhaOrigem: lo, colunaOrigem: co, linhaDestino: ld, colunaDestino: cd });
                            } else if (pontuacao === melhorPontuacao) {
                                melhoresJogadas.push({ peca, linhaOrigem: lo, colunaOrigem: co, linhaDestino: ld, colunaDestino: cd });
                            }
                        }
                    }
                }
            }
        }
    }

    if (melhoresJogadas.length > 0) {
        const jogadaEscolhida = melhoresJogadas[Math.floor(Math.random() * melhoresJogadas.length)];
        const { peca, linhaOrigem, colunaOrigem, linhaDestino, colunaDestino } = jogadaEscolhida;

        const pecaCapturada = tabuleiro[linhaDestino][colunaDestino];
        if (pecaCapturada !== 'vazio') {
            pecasCapturadas[pecaCapturada.split('-')[1]].push(pecaCapturada);
            somCaptura.play();
        } else {
            somMovimento.play();
        }
        
        tabuleiro[linhaDestino][colunaDestino] = peca;
        tabuleiro[linhaOrigem][colunaOrigem] = 'vazio';

        turnoAtual = turnoAtual === 'b' ? 'p' : 'b';
        statusElemento.textContent = `Turno das ${turnoAtual === 'b' ? 'Brancas' : 'Pretas'}`;
        criarTabuleiro();
        
        if (estaEmXequeMate(turnoAtual)) {
            const vencedor = turnoAtual === 'b' ? 'Pretas' : 'Brancas';
            statusElemento.textContent = `Xeque-mate! ${vencedor} venceram!`;
            jogoTerminado = true;
        }
    }
}

function estaSobAtaqueValor(linha, coluna, corAmeaca) {
    const corOponente = corAmeaca === 'b' ? 'p' : 'b';
    let valorAmeaca = 0;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const peca = tabuleiro[i][j];
            if (peca !== 'vazio' && peca.split('-')[1] === corOponente) {
                if (movimentoValidoSemXeque(peca, i, j, linha, coluna)) {
                    valorAmeaca = Math.max(valorAmeaca, pecaValor[peca.split('-')[0]]);
                }
            }
        }
    }
    return valorAmeaca;
}

function atualizarCapturas() {
    if (!capturasBrancasDiv || !capturasPretasDiv) return;

    capturasBrancasDiv.innerHTML = '';
    capturasPretasDiv.innerHTML = '';

    const capturasPretas = pecasCapturadas.p.filter(p => p);
    const capturasBrancas = pecasCapturadas.b.filter(p => p);

    capturasPretas.forEach(peca => {
        const pecaSpan = document.createElement('span');
        pecaSpan.classList.add('peca-capturada');
        if (peca.split('-')[1] === 'p') pecaSpan.classList.add('peca-preta');
        pecaSpan.textContent = pecaEmojis[peca];
        capturasBrancasDiv.appendChild(pecaSpan);
    });

    capturasBrancas.forEach(peca => {
        const pecaSpan = document.createElement('span');
        pecaSpan.classList.add('peca-capturada');
        if (peca.split('-')[1] === 'b') pecaSpan.classList.add('peca-branca');
        pecaSpan.textContent = pecaEmojis[peca];
        capturasPretasDiv.appendChild(pecaSpan);
    });
}

function mostrarMenuPromocao(cor) {
    const promocaoMenu = document.createElement('div');
    promocaoMenu.id = 'promocao-menu';

    const pecasPromocao = cor === 'b' ? ['dama-b', 'torre-b', 'bispo-b', 'cavalo-b'] : ['dama-p', 'torre-p', 'bispo-p', 'cavalo-p'];

    pecasPromocao.forEach(pecaNome => {
        const peca = document.createElement('span');
        peca.classList.add('peca', cor === 'b' ? 'peca-branca' : 'peca-preta');
        peca.textContent = pecaEmojis[pecaNome];
        peca.addEventListener('click', () => {
            promoverPeao(pecaNome);
        });
        promocaoMenu.appendChild(peca);
    });

    document.body.appendChild(promocaoMenu);
}

function promoverPeao(pecaNome) {
    const [linha, coluna] = casaPromocao;
    tabuleiro[linha][coluna] = pecaNome;

    const promocaoMenu = document.getElementById('promocao-menu');
    if (promocaoMenu) {
        promocaoMenu.remove();
    }
    
    casaPromocao = null;
    
    turnoAtual = turnoAtual === 'b' ? 'p' : 'b';
    statusElemento.textContent = `Turno das ${turnoAtual === 'b' ? 'Brancas' : 'Pretas'}`;
    
    pecaSendoArrastada = null;
    casaOrigemArrastada = null;
    criarTabuleiro();

    if (estaEmXequeMate(turnoAtual)) {
        const vencedor = turnoAtual === 'b' ? 'Pretas' : 'Brancas';
        statusElemento.textContent = `Xeque-mate! ${vencedor} venceram!`;
        jogoTerminado = true;
    }
}


function encontrarRei(cor) {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (tabuleiro[i][j] === `rei-${cor}`) {
                return [i, j];
            }
        }
    }
    return null;
}

function estaSobAtaque(linha, coluna, corAtaque) {
    const corOponente = corAtaque === 'b' ? 'p' : 'b';
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const peca = tabuleiro[i][j];
            if (peca !== 'vazio' && peca.split('-')[1] === corOponente) {
                if (movimentoValidoSemXeque(peca, i, j, linha, coluna)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function reiEmXeque(cor) {
    const reiCoords = encontrarRei(cor);
    if (!reiCoords) return false;
    
    const [reiLinha, reiColuna] = reiCoords;
    return estaSobAtaque(reiLinha, reiColuna, cor);
}

function movimentoColocaReiEmXeque(peca, lo, co, ld, cd) {
    const pecaCapturada = tabuleiro[ld][cd];
    
    tabuleiro[ld][cd] = peca;
    tabuleiro[lo][co] = 'vazio';

    const meuReiEmXeque = reiEmXeque(peca.split('-')[1]);
    
    tabuleiro[lo][co] = peca;
    tabuleiro[ld][cd] = pecaCapturada;
    
    return meuReiEmXeque;
}

function destacarXeque(cor) {
    const reiCoords = encontrarRei(cor);
    if (reiCoords) {
      const [reiLinha, reiColuna] = reiCoords;
      const casaDoRei = tabuleiroDiv.querySelector(`[data-linha="${reiLinha}"][data-coluna="${reiColuna}"]`);
      if (casaDoRei) {
          casaDoRei.classList.add('em-xeque');
      }
    }
}

function limparDestaques() {
    if (casaSelecionada) {
        casaSelecionada.classList.remove('selecionada');
    }
    const casasDestaque = document.querySelectorAll('.casa-movimento-valido');
    casasDestaque.forEach(casa => {
        casa.classList.remove('casa-movimento-valido');
    });
    casaSelecionada = null;
}

function destacarMovimentos(linha, coluna) {
    const peca = tabuleiro[linha][coluna];
    if (peca === 'vazio') return;

    for (let ld = 0; ld < 8; ld++) {
        for (let cd = 0; cd < 8; cd++) {
            if (movimentoValido(peca, linha, coluna, ld, cd) && !movimentoColocaReiEmXeque(peca, linha, coluna, ld, cd)) {
                const casaDestino = tabuleiroDiv.querySelector(`[data-linha="${ld}"][data-coluna="${cd}"]`);
                if (casaDestino) {
                    casaDestino.classList.add('casa-movimento-valido');
                }
            }
        }
    }
}

function movimentoValido(peca, linhaOrigem, colunaOrigem, linhaDestino, colunaDestino) {
    const tipoPeca = peca.split('-')[0];
    const corPeca = peca.split('-')[1];
    const casaDestino = tabuleiro[linhaDestino][colunaDestino];

    if (casaDestino !== 'vazio' && casaDestino.split('-')[1] === corPeca) {
        return false;
    }

    switch (tipoPeca) {
        case 'torre':
            return movimentoTorre(linhaOrigem, colunaOrigem, linhaDestino, colunaDestino);
        case 'bispo':
            return movimentoBispo(linhaOrigem, colunaOrigem, linhaDestino, colunaDestino);
        case 'dama':
            return movimentoTorre(linhaOrigem, colunaOrigem, linhaDestino, colunaDestino) ||
                   movimentoBispo(linhaOrigem, colunaOrigem, linhaDestino, colunaDestino);
        case 'rei':
            if (Math.abs(colunaDestino - colunaOrigem) === 2) {
                return movimentoRoque(corPeca, linhaOrigem, colunaOrigem, linhaDestino, colunaDestino);
            }
            if (movimentoRei(linhaOrigem, colunaOrigem, linhaDestino, colunaDestino)) {
                const corOponente = (corPeca === 'b') ? 'p' : 'b';
                const [reiOponenteLinha, reiOponenteColuna] = encontrarRei(corOponente);
                if (reiOponenteLinha !== null && Math.abs(linhaDestino - reiOponenteLinha) <= 1 && Math.abs(colunaDestino - reiOponenteColuna) <= 1) {
                    return false;
                }
                return true;
            }
            return false;
        case 'cavalo':
            return movimentoCavalo(linhaOrigem, colunaOrigem, linhaDestino, colunaDestino);
        case 'peao':
            return movimentoPeao(corPeca, linhaOrigem, colunaOrigem, linhaDestino, colunaDestino, casaDestino);
        default:
            return false;
    }
}

function movimentoValidoSemXeque(peca, lo, co, ld, cd) {
    const tipoPeca = peca.split('-')[0];
    const corPeca = peca.split('-')[1];
    const casaDestino = tabuleiro[ld][cd];

    if (casaDestino !== 'vazio' && casaDestino.split('-')[1] === corPeca) {
        return false;
    }
    
    switch (tipoPeca) {
        case 'torre':
            return movimentoTorre(lo, co, ld, cd);
        case 'bispo':
            return movimentoBispo(lo, co, ld, cd);
        case 'dama':
            return movimentoTorre(lo, co, ld, cd) || movimentoBispo(lo, co, ld, cd);
        case 'rei':
            return movimentoRei(lo, co, ld, cd);
        case 'cavalo':
            return movimentoCavalo(lo, co, ld, cd);
        case 'peao':
            const direcao = corPeca === 'b' ? -1 : 1;
            if (ld === lo + direcao && Math.abs(co - cd) === 1) {
                return true;
            }
            return false;
        default:
            return false;
    }
}

function movimentoTorre(lo, co, ld, cd) {
    if (lo !== ld && co !== cd) return false;
    const passoLinha = ld > lo ? 1 : (ld < lo ? -1 : 0);
    const passoColuna = cd > co ? 1 : (cd < co ? -1 : 0);
    let i = lo + passoLinha;
    let j = co + passoColuna;
    while (i !== ld || j !== cd) {
        if (tabuleiro[i][j] !== 'vazio') return false;
        i += passoLinha;
        j += passoColuna;
    }
    return true;
}

function movimentoBispo(lo, co, ld, cd) {
    if (Math.abs(lo - ld) !== Math.abs(co - cd)) return false;
    const passoLinha = ld > lo ? 1 : -1;
    const passoColuna = cd > co ? 1 : -1;
    let i = lo + passoLinha;
    let j = co + passoColuna;
    while (i !== ld) {
        if (tabuleiro[i][j] !== 'vazio') return false;
        i += passoLinha;
        j += passoColuna;
    }
    return true;
}

function movimentoRei(lo, co, ld, cd) {
    return Math.abs(lo - ld) <= 1 && Math.abs(co - cd) <= 1;
}

function movimentoCavalo(lo, co, ld, cd) {
    const dLinha = Math.abs(lo - ld);
    const dColuna = Math.abs(co - cd);
    return (dLinha === 2 && dColuna === 1) || (dLinha === 1 && dColuna === 2);
}

function movimentoPeao(corPeca, lo, co, ld, cd, casaDestino) {
    const direcao = corPeca === 'b' ? -1 : 1;
    const primeiraLinha = corPeca === 'b' ? 6 : 1;

    if (co === cd) {
        if (casaDestino !== 'vazio') return false;
        if (ld === lo + direcao) return true;
        if (lo === primeiraLinha && ld === lo + 2 * direcao && tabuleiro[lo + direcao][co] === 'vazio') {
            return true;
        }
    }
    else if (Math.abs(co - cd) === 1 && ld === lo + direcao) {
        if (casaDestino !== 'vazio' && casaDestino.split('-')[1] !== corPeca) {
            return true;
        }
        if (casaEnPassant === `${ld}-${cd}`) {
            return true;
        }
    }
    return false;
}

function movimentoRoque(corPeca, lo, co, ld, cd) {
    const direcaoRoque = (cd > co) ? 1 : -1;
    const ladoRoque = (direcaoRoque === 1) ? 'pequeno' : 'grande';
    const roqueDireitos = (corPeca === 'b') ? podeRoqueBrancas : podeRoquePretas;
    
    if (!roqueDireitos[ladoRoque]) return false;
    if (reiEmXeque(corPeca)) return false;

    const colunaTorre = (ladoRoque === 'pequeno') ? 7 : 0;
    const torre = tabuleiro[lo][colunaTorre];
    if (torre === 'vazio' || torre.split('-')[0] !== 'torre') return false;

    for (let j = co + direcaoRoque; j !== colunaTorre; j += direcaoRoque) {
        if (tabuleiro[lo][j] !== 'vazio') return false;
    }

    const casasCheck = [co, co + direcaoRoque];
    for (const colunaCheck of casasCheck) {
        if (estaSobAtaque(lo, colunaCheck, corPeca)) return false;
    }

    return true;
}

function estaEmXequeMate(cor) {
    if (!reiEmXeque(cor)) {
        return false;
    }

    for (let lo = 0; lo < 8; lo++) {
        for (let co = 0; co < 8; co++) {
            const peca = tabuleiro[lo][co];
            if (peca !== 'vazio' && peca.split('-')[1] === cor) {
                for (let ld = 0; ld < 8; ld++) {
                    for (let cd = 0; cd < 8; cd++) {
                        if (movimentoValido(peca, lo, co, ld, cd) && !movimentoColocaReiEmXeque(peca, lo, co, ld, cd)) {
                            return false;
                        }
                    }
                }
            }
        }
    }

    return true;
}

function novoJogo(corInicial, modo) {
    somInicio.play();

    tabuleiro = matrizInicial.map(row => [...row]);
    perspectiva = corInicial;
    modoDeJogo = modo;
    corJogador = corInicial;
    
    turnoAtual = 'b';
    jogoTerminado = false;
    podeRoqueBrancas = { grande: true, pequeno: true };
    podeRoquePretas = { grande: true, pequeno: true };
    casaEnPassant = null;
    casaPromocao = null;
    pecaSendoArrastada = null;
    pecasCapturadas = { b: [], p: [] };

    statusElemento.textContent = `Turno das Brancas`;
    
    const escolhaCorMenu = document.getElementById('escolha-cor-menu');
    if (escolhaCorMenu) {
        escolhaCorMenu.remove();
    }
    
    alternarVisibilidadeBotoes(true);
    criarTabuleiro();
    if(modoDeJogo === 'bot' && turnoAtual !== corJogador) {
        setTimeout(jogadaDoBot, DELAY_BOT);
    }
}

function alternarVisibilidadeBotoes(mostrar) {
    const botoesContainer = document.getElementById('botoes-container');
    if(botoesContainer) {
        if (mostrar) {
            botoesContainer.classList.remove('oculto');
        } else {
            botoesContainer.classList.add('oculto');
        }
    }
}


document.addEventListener('DOMContentLoaded', iniciarJogo);