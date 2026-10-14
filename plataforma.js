window.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       CONFIGURAÇÕES PRINCIPAIS
    ========================================= */

    const canvas = document.getElementById("canvasAventura");

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const telaAventura = document.getElementById("telaAventura");

    const MUNDO = 7000;

    const GRAVIDADE = 0.65;
    const VELOCIDADE = 4.5;
    const PULO = -13;

    const CHAO_ALTURA = 110;

    let cameraX = 0;

    let rodando = false;
    let idAnimacao = null;
    let tempoAnterior = 0;

    let vidas = 3;
    let coletadas = 0;
    let resultado = "";

    /* =========================================
       CARREGAMENTO DAS IMAGENS
    ========================================= */

    const pasta = "assets/plataforma/";

    function carregar(nome) {

        const imagem = new Image();

        imagem.src = pasta + nome;

        imagem.onerror = function () {
            console.warn("Imagem não encontrada:", imagem.src);
        };

        return imagem;

    }

    const img = {

        fundo: carregar("cenario_fundo.png"),

        chao: carregar("chao_grande.png"),

        plataforma: carregar("plataforma.png"),

        moeda: carregar("moedas.png"),

        bandeira: carregar("bandeira_final.png"),

        parado: carregar("gatinho_parado.png"),

        andando1: carregar("gatinho_andando1.png"),

        andando2: carregar("gatinho_andando2.png"),

        pulando: carregar("gatinho_pulando.png"),

        derrotado: carregar("gatinho_derrotado.png"),

        morcegos: [
            carregar("morcego_voando1.png"),
            carregar("morcego_voando2.png"),
            carregar("morcego_voando3.png"),
            carregar("morcego_voando4.png")
        ]

    };

    function imagemDisponivel(imagem) {

        return imagem.complete && imagem.naturalWidth > 0;

    }

    /* =========================================
       MÚSICAS
    ========================================= */

    const musicaFundo = new Audio(
        pasta + "musicas/floresta.mp3"
    );

    musicaFundo.loop = true;
    musicaFundo.volume = 0.30;

    const musicaFail = new Audio(
        pasta + "musicas/fail.mp3"
    );

    musicaFail.volume = 0.75;

    function tocar(audio) {

        audio.currentTime = 0;

        audio.play().catch(function () {
            console.log("Reprodução de áudio bloqueada.");
        });

    }

    function parar(audio) {

        audio.pause();
        audio.currentTime = 0;

    }

    /* =========================================
       PERSONAGEM LEAF
    ========================================= */

    const gato = {

        x: 100,
        y: 0,

        largura: 145,
        altura: 145,

        vy: 0,

        noChao: true,

        direcao: 1,

        andando: false,

        anim: 0,

        invulneravel: 0,

        impacto: 0,

        tempoNoAr: 0

    };

    /* =========================================
       CONTROLES
    ========================================= */

    const teclas = {

        esquerda: false,
        direita: false,
        pular: false

    };

    /* =========================================
       ELEMENTOS DA FASE
    ========================================= */

    const buracos = [

        { x: 650, largura: 135 },

        { x: 1450, largura: 150 },

        { x: 2400, largura: 165 },

        { x: 3650, largura: 150 },

        { x: 4650, largura: 165 },

        { x: 5700, largura: 170 }

    ];

    const plataformas = [

        { x: 350, altura: 85, largura: 200 },

        { x: 850, altura: 130, largura: 230 },

        { x: 1200, altura: 80, largura: 180 },

        { x: 1700, altura: 120, largura: 220 },

        { x: 2050, altura: 170, largura: 200 },

        { x: 2650, altura: 110, largura: 230 },

        { x: 3150, altura: 90, largura: 200 },

        { x: 3850, altura: 135, largura: 220 },

        { x: 4250, altura: 175, largura: 210 },

        { x: 4900, altura: 110, largura: 230 },

        { x: 5400, altura: 155, largura: 210 },

        { x: 6000, altura: 105, largura: 240 },

        { x: 6450, altura: 150, largura: 200 }

    ];

    const moedas = [

        [200, 70],
        [430, 160],
        [900, 210],
        [1050, 210],
        [1280, 160],

        [1750, 200],
        [1850, 200],
        [2130, 250],
        [2720, 190],
        [3100, 80],

        [3250, 170],
        [3900, 215],
        [4010, 215],
        [4340, 255],
        [4950, 190],

        [5100, 190],
        [5500, 235],
        [6070, 185],
        [6200, 185],
        [6550, 230],

        [6770, 80]

    ].map(function (dados) {

        return {

            x: dados[0],
            altura: dados[1],
            coletada: false

        };

    });

    const inimigos = [

        { base: 1080, alcance: 100, altura: 75, fase: 0 },

        { base: 1950, alcance: 90, altura: 95, fase: 1 },

        { base: 2920, alcance: 100, altura: 70, fase: 2 },

        { base: 4050, alcance: 110, altura: 95, fase: 3 },

        { base: 5200, alcance: 90, altura: 75, fase: 4 },

        { base: 6300, alcance: 110, altura: 90, fase: 5 }

    ].map(function (inimigo) {

        return {

            ...inimigo,

            x: inimigo.base,

            vivo: true

        };

    });

    const bandeira = {

        x: 6800,
        largura: 75,
        altura: 170

    };

    /* =========================================
       ETAPA 7 — VAGA-LUMES
    ========================================= */

    const vagaLumes = [];

    for (let i = 0; i < 90; i++) {

        vagaLumes.push({

            x: Math.random() * MUNDO,

            altura: 70 + Math.random() * 340,

            tamanho: 1.5 + Math.random() * 3,

            fase: Math.random() * Math.PI * 2,

            velocidade: 0.5 + Math.random() * 1.5

        });

    }

    function desenharVagaLumes(tempo) {

        ctx.save();

        for (const luz of vagaLumes) {

            const x = luz.x - cameraX;

            if (x < -30 || x > canvas.width + 30) {
                continue;
            }

            const movimento =
                Math.sin(tempo * 0.001 * luz.velocidade + luz.fase) * 12;

            const y = yChao() - luz.altura + movimento;

            const brilho =
                0.35 + Math.sin(tempo * 0.003 + luz.fase) * 0.3;

            ctx.globalAlpha = Math.max(0.1, brilho);

            const gradiente = ctx.createRadialGradient(
                x, y, 0,
                x, y, 18
            );

            gradiente.addColorStop(
                0,
                "rgba(255,245,130,0.9)"
            );

            gradiente.addColorStop(
                1,
                "rgba(255,245,130,0)"
            );

            ctx.fillStyle = gradiente;

            ctx.beginPath();

            ctx.arc(x, y, 18, 0, Math.PI * 2);

            ctx.fill();

            ctx.fillStyle = "#fff6a0";

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                luz.tamanho,
                0,
                Math.PI * 2
            );

            ctx.fill();

        }

        ctx.restore();

    }

    /* =========================================
       ETAPA 7 — NÉVOA ANIMADA
    ========================================= */

    function desenharNevoa(tempo) {

        ctx.save();

        for (let camada = 0; camada < 3; camada++) {

            const velocidade = 0.004 + camada * 0.003;

            const deslocamento =
                (tempo * velocidade) % 500;

            const altura =
                yChao() - 45 - camada * 65;

            for (
                let x = -500 + deslocamento;
                x < canvas.width + 500;
                x += 350
            ) {

                const gradiente = ctx.createRadialGradient(
                    x,
                    altura,
                    10,
                    x,
                    altura,
                    220
                );

                gradiente.addColorStop(
                    0,
                    "rgba(155,125,215,0.11)"
                );

                gradiente.addColorStop(
                    1,
                    "rgba(155,125,215,0)"
                );

                ctx.fillStyle = gradiente;

                ctx.beginPath();

                ctx.ellipse(
                    x,
                    altura,
                    220,
                    55,
                    0,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

            }

        }

        ctx.restore();

    }

    /* =========================================
       ETAPA 7 — VEGETAÇÃO DECORATIVA
    ========================================= */

    const vegetacao = [];

    for (let x = 0; x < MUNDO; x += 170) {

        vegetacao.push({

            x: x + Math.random() * 65,

            altura: 12 + Math.random() * 22,

            largura: 18 + Math.random() * 20

        });

    }

    function desenharVegetacao() {

        ctx.save();

        for (const planta of vegetacao) {

            if (!temChao(planta.x)) continue;

            const x = planta.x - cameraX;

            if (x < -50 || x > canvas.width + 50) {
                continue;
            }

            const y = yChao();

            ctx.fillStyle = "#213c39";

            ctx.beginPath();

            ctx.moveTo(x, y);

            ctx.quadraticCurveTo(
                x - planta.largura,
                y - planta.altura,
                x - 5,
                y - planta.altura
            );

            ctx.quadraticCurveTo(
                x + 5,
                y - planta.altura * 0.5,
                x,
                y
            );

            ctx.fill();

            ctx.fillStyle = "#31564a";

            ctx.beginPath();

            ctx.moveTo(x + 4, y);

            ctx.quadraticCurveTo(
                x + planta.largura,
                y - planta.altura,
                x + 8,
                y - planta.altura
            );

            ctx.quadraticCurveTo(
                x,
                y - planta.altura * 0.4,
                x + 4,
                y
            );

            ctx.fill();

        }

        ctx.restore();

    }

    /* =========================================
       PARTÍCULAS
    ========================================= */

    const particulas = [];

    function criarParticulas(x, y, cor, quantidade = 14) {

        for (let i = 0; i < quantidade; i++) {

            const angulo = Math.random() * Math.PI * 2;

            const impulso = 1 + Math.random() * 4;

            particulas.push({

                x: x,
                y: y,

                vx: Math.cos(angulo) * impulso,

                vy: Math.sin(angulo) * impulso - 1,

                vida: 600 + Math.random() * 350,

                tamanho: 2 + Math.random() * 4,

                cor: cor

            });

        }

    }

    function atualizarParticulas(delta) {

        const fator = delta / 16.67;

        for (let i = particulas.length - 1; i >= 0; i--) {

            const p = particulas[i];

            p.x += p.vx * fator;

            p.y += p.vy * fator;

            p.vy += 0.12 * fator;

            p.vida -= delta;

            if (p.vida <= 0) {
                particulas.splice(i, 1);
            }

        }

    }

    function desenharParticulas() {

        ctx.save();

        for (const p of particulas) {

            ctx.globalAlpha = Math.min(1, p.vida / 450);

            ctx.fillStyle = p.cor;

            ctx.fillRect(
                p.x - cameraX,
                p.y,
                p.tamanho,
                p.tamanho
            );

        }

        ctx.restore();

    }

    /* =========================================
       CANVAS E COLISÕES
    ========================================= */

    function yChao() {

        return canvas.height - CHAO_ALTURA;

    }

    function ajustarCanvas() {

        const alturaAnterior = canvas.height;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        ctx.imageSmoothingEnabled = false;

        if (rodando && gato.noChao) {

            gato.y += canvas.height - alturaAnterior;

        }

    }

    window.addEventListener("resize", ajustarCanvas);

    function temChao(x) {

        return !buracos.some(function (buraco) {

            return (
                x >= buraco.x &&
                x < buraco.x + buraco.largura
            );

        });

    }

    function intersecao(a, b) {

        return (
            a.x < b.x + b.largura &&
            a.x + a.largura > b.x &&
            a.y < b.y + b.altura &&
            a.y + a.altura > b.y
        );

    }

    /* =========================================
       DESENHAR CENÁRIO
    ========================================= */

    function desenharFundo() {

        ctx.fillStyle = "#100c25";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        if (!imagemDisponivel(img.fundo)) return;

        const largura = Math.max(
            canvas.width,
            img.fundo.width * canvas.height / img.fundo.height
        );

        const deslocamento = (cameraX * 0.25) % largura;

        for (
            let x = -deslocamento;
            x < canvas.width;
            x += largura
        ) {

            ctx.drawImage(
                img.fundo,
                x,
                0,
                largura,
                canvas.height
            );

        }

    }

    function desenharChao() {

        let inicio = 0;

        const segmentos = [
            ...buracos,
            { x: MUNDO, largura: 0 }
        ];

        for (const buraco of segmentos) {

            const fim = buraco.x;

            if (fim > inicio) {

                const esquerda = Math.max(inicio, cameraX);

                const direita = Math.min(
                    fim,
                    cameraX + canvas.width
                );

                for (
                    let x = esquerda;
                    x < direita;
                    x += 100
                ) {

                    const largura = Math.min(
                        100,
                        direita - x
                    );

                    const telaX = x - cameraX;

                    if (imagemDisponivel(img.chao)) {

                        ctx.drawImage(
                            img.chao,
                            telaX,
                            yChao(),
                            largura,
                            CHAO_ALTURA
                        );

                    } else {

                        ctx.fillStyle = "#423057";

                        ctx.fillRect(
                            telaX,
                            yChao(),
                            largura,
                            CHAO_ALTURA
                        );

                    }

                }

            }

            inicio = buraco.x + buraco.largura;

        }

    }

    function desenharPlataformas() {

        for (const p of plataformas) {

            const x = p.x - cameraX;

            const y = yChao() - p.altura;

            if (x + p.largura < 0 || x > canvas.width) {
                continue;
            }

            if (imagemDisponivel(img.plataforma)) {

                ctx.drawImage(
                    img.plataforma,
                    x,
                    y,
                    p.largura,
                    35
                );

            } else {

                ctx.fillStyle = "#65507c";

                ctx.fillRect(
                    x,
                    y,
                    p.largura,
                    35
                );

            }

        }

    }

    function desenharMoedas() {

        for (const m of moedas) {

            if (m.coletada) continue;

            const x = m.x - cameraX;

            const y = yChao() - m.altura;

            if (imagemDisponivel(img.moeda)) {

                ctx.drawImage(
                    img.moeda,
                    x,
                    y,
                    35,
                    35
                );

            } else {

                ctx.fillStyle = "#ffd447";

                ctx.beginPath();

                ctx.arc(
                    x + 17,
                    y + 17,
                    17,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

            }

        }

    }

    /* =========================================
       MORCEGOS ANIMADOS
    ========================================= */

    function desenharInimigos(tempo) {

        for (const e of inimigos) {

            if (!e.vivo) continue;

            const x = e.x - cameraX;

            const y = yChao() - e.altura;

            if (x < -110 || x > canvas.width + 110) {
                continue;
            }

            const indice =
                Math.floor(tempo / 120 + e.fase * 2) % 4;

            const sprite = img.morcegos[indice];

            const flutuacao =
                Math.sin(tempo / 260 + e.fase) * 5;

            const largura = 90;
            const altura = 70;

            const centroX = x + 24;

            const centroY = y + 17 + flutuacao;

            if (imagemDisponivel(sprite)) {

                ctx.save();

                ctx.imageSmoothingEnabled = false;

                ctx.drawImage(
                    sprite,
                    centroX - largura / 2,
                    centroY - altura / 2,
                    largura,
                    altura
                );

                ctx.restore();

            } else {

                ctx.fillStyle = "#21122f";

                ctx.beginPath();

                ctx.ellipse(
                    centroX,
                    centroY,
                    24,
                    16,
                    0,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

                ctx.fillStyle = "#d78aff";

                ctx.fillRect(
                    centroX - 10,
                    centroY - 3,
                    5,
                    5
                );

                ctx.fillRect(
                    centroX + 5,
                    centroY - 3,
                    5,
                    5
                );

            }

        }

    }

    function desenharBandeira() {

        const x = bandeira.x - cameraX;

        const y = yChao() - bandeira.altura;

        if (imagemDisponivel(img.bandeira)) {

            ctx.drawImage(
                img.bandeira,
                x,
                y,
                bandeira.largura,
                bandeira.altura
            );

        } else {

            ctx.fillStyle = "#dddddd";

            ctx.fillRect(
                x,
                y,
                7,
                bandeira.altura
            );

            ctx.fillStyle = "#a87bff";

            ctx.fillRect(
                x + 7,
                y,
                60,
                40
            );

        }

    }

    /* =========================================
       ETAPA 6 — ANIMAÇÃO DO LEAF
    ========================================= */

    function desenharGato() {

        if (
            gato.invulneravel > 0 &&
            Math.floor(gato.invulneravel / 100) % 2 === 0
        ) {
            return;
        }

        let sprite = img.parado;

        if (resultado === "derrota") {

            sprite = img.derrotado;

        } else if (!gato.noChao) {

            sprite = img.pulando;

        } else if (gato.andando) {

            sprite = Math.floor(gato.anim / 125) % 2
                ? img.andando2
                : img.andando1;

        }

        if (!imagemDisponivel(sprite)) {

            sprite = img.parado;

        }

        if (!imagemDisponivel(sprite)) return;

        const x = Math.round(gato.x - cameraX);

        const y = Math.round(gato.y);

        const centroX = x + gato.largura / 2;

        const peY = y + gato.altura;

        const aterrissagem = Math.max(
            0,
            gato.impacto / 180
        );

        let escalaX = 1 + aterrissagem * 0.13;

        let escalaY = 1 - aterrissagem * 0.12;

        if (!gato.noChao && resultado !== "derrota") {

            escalaX *= 0.94;

            escalaY *= 1.06;

        }

        const inclinacao =
            !gato.noChao && resultado !== "derrota"
                ? Math.max(
                    -0.09,
                    Math.min(0.09, gato.vy * 0.006)
                ) * gato.direcao
                : 0;

        ctx.save();

        ctx.imageSmoothingEnabled = false;

        ctx.translate(centroX, peY);

        ctx.rotate(inclinacao);

        ctx.scale(
            gato.direcao * escalaX,
            escalaY
        );

        ctx.drawImage(
            sprite,
            -gato.largura / 2,
            -gato.altura,
            gato.largura,
            gato.altura
        );

        ctx.restore();

    }

    /* =========================================
       HUD
    ========================================= */

    function desenharHUD() {

        ctx.save();

        ctx.fillStyle = "rgba(15,10,35,0.82)";

        ctx.fillRect(14, 70, 200, 89);

        ctx.fillStyle = "#ffffff";

        ctx.font = "bold 19px Arial";

        ctx.fillText(
            "🪙 Moedas: " + coletadas,
            26,
            104
        );

        ctx.fillText(
            "❤️ Vidas: " + vidas,
            26,
            137
        );

        ctx.restore();

    }

    /* =========================================
       PAINEL DE RESULTADO
    ========================================= */

    const painel = document.createElement("div");

    painel.id = "painelResultadoLeaf";

    painel.style.cssText = `
        display: none;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 30;
        width: min(85vw, 390px);
        padding: 28px 20px;
        border-radius: 22px;
        border: 2px solid #a46bff;
        background: rgba(20, 10, 45, 0.96);
        color: white;
        text-align: center;
        box-shadow: 0 0 35px rgba(160, 90, 255, 0.4);
    `;

    painel.innerHTML = `
        <h2 id="tituloResultadoLeaf"></h2>

        <p id="detalhesResultadoLeaf"></p>

        <button id="reiniciarLeaf" type="button">
            🔄 JOGAR NOVAMENTE
        </button>
    `;

    telaAventura.appendChild(painel);

    const botaoReiniciar =
        document.getElementById("reiniciarLeaf");

    botaoReiniciar.style.cssText = `
        margin-top: 15px;
        padding: 14px 24px;
        border: none;
        border-radius: 14px;
        background: #9229dc;
        color: white;
        font-size: 17px;
        font-weight: bold;
        cursor: pointer;
    `;

    function atualizarPainel() {

        painel.style.display =
            resultado ? "block" : "none";

        document.getElementById(
            "tituloResultadoLeaf"
        ).textContent = resultado === "vitoria"
            ? "🏆 FASE CONCLUÍDA!"
            : "💔 FIM DE JOGO";

        document.getElementById(
            "detalhesResultadoLeaf"
        ).textContent =
            `🪙 Moedas: ${coletadas}/${moedas.length} • ❤️ Vidas: ${vidas}`;

    }

    /* =========================================
       POSIÇÃO E VIDAS
    ========================================= */

    function reposicionar() {

        gato.x = 100;

        gato.y = yChao() - gato.altura;

        gato.vy = 0;

        gato.noChao = true;

        gato.direcao = 1;

        gato.invulneravel = 1400;

        gato.impacto = 0;

        gato.tempoNoAr = 0;

        cameraX = 0;

    }

    function perderVida() {

        if (resultado) return;

        criarParticulas(
            gato.x + 70,
            gato.y + 75,
            "#ff557d",
            26
        );

        vidas--;

        if (vidas <= 0) {

            resultado = "derrota";

            parar(musicaFundo);

            tocar(musicaFail);

            atualizarPainel();

        } else {

            reposicionar();

        }

    }

    /* =========================================
       FÍSICA DO PERSONAGEM
    ========================================= */

    function atualizarFisica(delta) {

        if (resultado) return;

        const fator = delta / 16.67;

        const anteriorY = gato.y;

        const estavaApoiado = gato.noChao;

        gato.andando =
            teclas.esquerda !== teclas.direita;

        if (teclas.esquerda) {

            gato.x -= VELOCIDADE * fator;

            gato.direcao = -1;

        }

        if (teclas.direita) {

            gato.x += VELOCIDADE * fator;

            gato.direcao = 1;

        }

        gato.x = Math.max(
            0,
            Math.min(MUNDO - gato.largura, gato.x)
        );

        /* PULO */

        if (teclas.pular && gato.noChao) {

            criarParticulas(
                gato.x + gato.largura / 2,
                gato.y + gato.altura,
                "#c6a3f5",
                9
            );

            gato.vy = PULO;

            gato.noChao = false;

        }

        /* GRAVIDADE */

        gato.vy += GRAVIDADE * fator;

        gato.y += gato.vy * fator;

        gato.noChao = false;

        /* PLATAFORMAS */

        if (gato.vy >= 0) {

            for (const p of plataformas) {

                const topo = yChao() - p.altura;

                const sobreposicao =
                    gato.x + gato.largura > p.x &&
                    gato.x < p.x + p.largura;

                const estavaAcima =
                    anteriorY + gato.altura <= topo + 8;

                const atravessou =
                    gato.y + gato.altura >= topo;

                if (
                    sobreposicao &&
                    estavaAcima &&
                    atravessou
                ) {

                    gato.y = topo - gato.altura;

                    gato.vy = 0;

                    gato.noChao = true;

                }

            }

            /* CHÃO */

            const peEsquerdo =
                gato.x + gato.largura * 0.25;

            const peDireito =
                gato.x + gato.largura * 0.75;

            if (
                (temChao(peEsquerdo) || temChao(peDireito)) &&
                gato.y + gato.altura >= yChao()
            ) {

                gato.y = yChao() - gato.altura;

                gato.vy = 0;

                gato.noChao = true;

            }

        }

        /* CAIU NO BURACO */

        if (gato.y > canvas.height + 100) {

            perderVida();

            return;

        }

        /* ATERRISSAGEM */

        if (
            !estavaApoiado &&
            gato.noChao &&
            gato.tempoNoAr > 110
        ) {

            gato.impacto = 180;

            criarParticulas(
                gato.x + gato.largura / 2,
                gato.y + gato.altura - 4,
                "#b69dd9",
                7
            );

        }

        gato.tempoNoAr = gato.noChao
            ? 0
            : gato.tempoNoAr + delta;

        gato.impacto = Math.max(
            0,
            gato.impacto - delta
        );

        gato.anim = gato.andando
            ? gato.anim + delta
            : 0;

        gato.invulneravel = Math.max(
            0,
            gato.invulneravel - delta
        );

        /* MORCEGOS */

        const tempo = performance.now() / 1000;

        for (const e of inimigos) {

            if (!e.vivo) continue;

            e.x =
                e.base +
                Math.sin(tempo * 1.6 + e.fase) * e.alcance;

            const caixa = {

                x: e.x,

                y: yChao() - e.altura,

                largura: 48,

                altura: 34

            };

            const corpo = {

                x: gato.x + 35,

                y: gato.y + 25,

                largura: gato.largura - 70,

                altura: gato.altura - 35

            };

            if (!intersecao(corpo, caixa)) continue;

            const pulouEmCima =
                gato.vy > 0 &&
                anteriorY + gato.altura - 12 <= caixa.y + 15;

            if (pulouEmCima) {

                e.vivo = false;

                gato.vy = -9;

                gato.noChao = false;

                criarParticulas(
                    e.x + 24,
                    yChao() - e.altura + 17,
                    "#c66bff",
                    22
                );

            } else if (gato.invulneravel <= 0) {

                perderVida();

                return;

            }

        }

        /* MOEDAS */

        for (const m of moedas) {

            if (m.coletada) continue;

            const corpo = {

                x: gato.x + 25,

                y: gato.y + 20,

                largura: gato.largura - 50,

                altura: gato.altura - 20

            };

            const moeda = {

                x: m.x,

                y: yChao() - m.altura,

                largura: 35,

                altura: 35

            };

            if (intersecao(corpo, moeda)) {

                m.coletada = true;

                coletadas++;

                criarParticulas(
                    m.x + 17,
                    moeda.y + 17,
                    "#ffdc56",
                    16
                );

            }

        }

        /* VITÓRIA */

        if (
            gato.x + gato.largura >= bandeira.x &&
            gato.x <= bandeira.x + bandeira.largura
        ) {

            resultado = "vitoria";

            parar(musicaFundo);

            criarParticulas(
                bandeira.x + 30,
                yChao() - 130,
                "#a7f36b",
                55
            );

            atualizarPainel();

        }

        /* CÂMERA */

        cameraX = Math.max(
            0,
            Math.min(
                Math.max(0, MUNDO - canvas.width),
                gato.x - canvas.width * 0.35
            )
        );

    }

    /* =========================================
       LOOP PRINCIPAL
    ========================================= */

    function quadro(tempo) {

        if (!rodando) return;

        const delta = Math.min(
            tempo - tempoAnterior || 16.67,
            33
        );

        tempoAnterior = tempo;

        atualizarFisica(delta);

        atualizarParticulas(delta);

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        /* ORDEM DOS ELEMENTOS */

        desenharFundo();

        // Etapa 7: névoa atrás do personagem
        desenharNevoa(tempo);

        desenharVagaLumes(tempo);

        desenharChao();

        desenharPlataformas();

        desenharMoedas();

        desenharVegetacao();

        desenharInimigos(tempo);

        desenharBandeira();

        // Etapa 6: animação melhorada
        desenharGato();

        desenharParticulas();

        desenharHUD();

        if (resultado) {

            ctx.fillStyle = "rgba(0,0,0,0.35)";

            ctx.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

        }

        idAnimacao = requestAnimationFrame(quadro);

    }

    /* =========================================
       REINICIAR
    ========================================= */

    function reiniciar() {

        vidas = 3;

        coletadas = 0;

        resultado = "";

        particulas.length = 0;

        atualizarPainel();

        moedas.forEach(function (m) {
            m.coletada = false;
        });

        inimigos.forEach(function (e) {
            e.vivo = true;
        });

        teclas.esquerda = false;
        teclas.direita = false;
        teclas.pular = false;

        gato.anim = 0;
        gato.andando = false;

        reposicionar();

        parar(musicaFail);

        parar(musicaFundo);

        tocar(musicaFundo);

    }

    botaoReiniciar.addEventListener(
        "click",
        reiniciar
    );

    /* =========================================
       INICIAR AVENTURA
    ========================================= */

    window.iniciarAventura = function () {

        if (rodando) return;

        ajustarCanvas();

        reiniciar();

        rodando = true;

        tempoAnterior = 0;

        idAnimacao = requestAnimationFrame(quadro);

    };

    /* =========================================
       PARAR AVENTURA
    ========================================= */

    window.pararAventura = function () {

        rodando = false;

        if (idAnimacao !== null) {

            cancelAnimationFrame(idAnimacao);

            idAnimacao = null;

        }

        teclas.esquerda = false;
        teclas.direita = false;
        teclas.pular = false;

        parar(musicaFundo);

        parar(musicaFail);

        painel.style.display = "none";

    };

    /* =========================================
       TECLADO
    ========================================= */

    window.addEventListener("keydown", function (e) {

        if (!rodando) return;

        if (e.code === "KeyR" && resultado) {

            reiniciar();

            return;

        }

        const controles = [
            "ArrowLeft",
            "KeyA",
            "ArrowRight",
            "KeyD",
            "ArrowUp",
            "KeyW",
            "Space"
        ];

        if (controles.includes(e.code)) {

            e.preventDefault();

        }

        if (
            e.code === "ArrowLeft" ||
            e.code === "KeyA"
        ) {

            teclas.esquerda = true;

        }

        if (
            e.code === "ArrowRight" ||
            e.code === "KeyD"
        ) {

            teclas.direita = true;

        }

        if (
            e.code === "ArrowUp" ||
            e.code === "KeyW" ||
            e.code === "Space"
        ) {

            teclas.pular = true;

        }

    });

    window.addEventListener("keyup", function (e) {

        if (
            e.code === "ArrowLeft" ||
            e.code === "KeyA"
        ) {

            teclas.esquerda = false;

        }

        if (
            e.code === "ArrowRight" ||
            e.code === "KeyD"
        ) {

            teclas.direita = false;

        }

        if (
            e.code === "ArrowUp" ||
            e.code === "KeyW" ||
            e.code === "Space"
        ) {

            teclas.pular = false;

        }

    });

    window.addEventListener("blur", function () {

        teclas.esquerda = false;
        teclas.direita = false;
        teclas.pular = false;

    });

    /* =========================================
       CONTROLES DO CELULAR
    ========================================= */

    function configurarBotao(id, controle) {

        const elemento = document.getElementById(id);

        if (!elemento) return;

        elemento.addEventListener(
            "pointerdown",
            function (e) {

                if (!rodando || resultado) return;

                e.preventDefault();

                teclas[controle] = true;

                elemento.setPointerCapture(e.pointerId);

            }
        );

        const eventos = [
            "pointerup",
            "pointercancel",
            "lostpointercapture"
        ];

        for (const evento of eventos) {

            elemento.addEventListener(
                evento,
                function () {

                    teclas[controle] = false;

                }
            );

        }

    }

    configurarBotao(
        "controleEsquerda",
        "esquerda"
    );

    configurarBotao(
        "controleDireita",
        "direita"
    );

    configurarBotao(
        "controlePular",
        "pular"
    );

});