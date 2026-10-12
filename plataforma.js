window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("canvasAventura");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const MUNDO = 7000; // Antes: 3500. Agora: o dobro.
    const GRAVIDADE = 0.65, VELOCIDADE = 4.5, PULO = -13;
    const CHAO_ALTURA = 110;
    const pasta = "assets/plataforma/";
    const carregar = nome => {
        const img = new Image();
        img.src = pasta + nome;
        img.onerror = () => console.warn("Imagem não encontrada:", img.src);
        return img;
    };
    const img = {
        fundo: carregar("cenario_fundo.png"), chao: carregar("chao_grande.png"),
        plataforma: carregar("plataforma.png"), moeda: carregar("moedas.png"),
        bandeira: carregar("bandeira_final.png"), parado: carregar("gatinho_parado.png"),
        andando1: carregar("gatinho_andando1.png"), andando2: carregar("gatinho_andando2.png"),
        pulando: carregar("gatinho_pulando.png"), derrotado: carregar("gatinho_derrotado.png")
    };
    const disponivel = imagem => imagem.complete && imagem.naturalWidth > 0;

    // Coloque os arquivos MP3 na pasta assets/plataforma/musicas/.
    const musicaFundo = new Audio(pasta + "musicas/floresta.mp3");
    musicaFundo.loop = true;
    musicaFundo.volume = 0.30;
    const musicaFail = new Audio(pasta + "musicas/fail.mp3");
    musicaFail.volume = 0.75;
    const tocar = audio => {
        audio.currentTime = 0;
        audio.play().catch(() => console.info("O navegador bloqueou a reprodução de áudio."));
    };
    const parar = audio => { audio.pause(); audio.currentTime = 0; };

    const gato = { x: 100, y: 0, largura: 145, altura: 145,
        vy: 0, noChao: true, direcao: 1, andando: false, anim: 0, invulneravel: 0 };
    const teclas = { esquerda: false, direita: false, pular: false };
    let cameraX = 0, rodando = false, idAnimacao = null, tempoAnterior = 0;
    let vidas = 3, coletadas = 0, resultado = "";
    const buracos = [
        { x: 650, largura: 135 }, { x: 1450, largura: 150 },
        { x: 2400, largura: 165 }, { x: 3650, largura: 150 },
        { x: 4650, largura: 165 }, { x: 5700, largura: 170 }
    ];
    const plataformas = [
        { x: 350, altura: 85, largura: 200 }, { x: 850, altura: 130, largura: 230 },
        { x: 1200, altura: 80, largura: 180 }, { x: 1700, altura: 120, largura: 220 },
        { x: 2050, altura: 170, largura: 200 }, { x: 2650, altura: 110, largura: 230 },
        { x: 3150, altura: 90, largura: 200 }, { x: 3850, altura: 135, largura: 220 },
        { x: 4250, altura: 175, largura: 210 }, { x: 4900, altura: 110, largura: 230 },
        { x: 5400, altura: 155, largura: 210 }, { x: 6000, altura: 105, largura: 240 },
        { x: 6450, altura: 150, largura: 200 }
    ];
    const moedas = [
        [200,70],[430,160],[900,210],[1050,210],[1280,160],
        [1750,200],[1850,200],[2130,250],[2720,190],[3100,80],
        [3250,170],[3900,215],[4010,215],[4340,255],[4950,190],
        [5100,190],[5500,235],[6070,185],[6200,185],[6550,230],[6770,80]
    ].map(([x, altura]) => ({ x, altura, coletada: false }));
    // Morcegos desenhados no próprio canvas; não exigem imagem extra.
    const inimigos = [
        { x: 1080, base: 1080, alcance: 100, altura: 75, fase: 0 },
        { x: 1950, base: 1950, alcance: 90, altura: 95, fase: 1 },
        { x: 2920, base: 2920, alcance: 100, altura: 70, fase: 2 },
        { x: 4050, base: 4050, alcance: 110, altura: 95, fase: 3 },
        { x: 5200, base: 5200, alcance: 90, altura: 75, fase: 4 },
        { x: 6300, base: 6300, alcance: 110, altura: 90, fase: 5 }
    ].map(e => ({ ...e, vivo: true }));
    const bandeira = { x: 6800, largura: 75, altura: 170 };

    const yChao = () => canvas.height - CHAO_ALTURA;
    function ajustarCanvas() {
        const antes = canvas.height;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.imageSmoothingEnabled = false;
        if (rodando && gato.noChao) gato.y += canvas.height - antes;
    }
    window.addEventListener("resize", ajustarCanvas);
    const temChao = x => !buracos.some(b => x >= b.x && x < b.x + b.largura);
    const intersecao = (a, b) => a.x < b.x + b.largura && a.x + a.largura > b.x &&
        a.y < b.y + b.altura && a.y + a.altura > b.y;

    function fundo() {
        ctx.fillStyle = "#100c25";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (!disponivel(img.fundo)) return;
        const largura = Math.max(canvas.width, img.fundo.width * canvas.height / img.fundo.height);
        const deslocamento = (cameraX * .25) % largura;
        for (let x = -deslocamento; x < canvas.width; x += largura)
            ctx.drawImage(img.fundo, x, 0, largura, canvas.height);
    }
    function chao() {
        // Segmentos são cortados nas bordas dos buracos, evitando chão invisível.
        let inicio = 0;
        const segmentos = [...buracos, { x: MUNDO, largura: 0 }];
        for (const buraco of segmentos) {
            const fim = buraco.x;
            if (fim > inicio) {
                const esquerda = Math.max(inicio, cameraX);
                const direita = Math.min(fim, cameraX + canvas.width);
                for (let x = esquerda; x < direita; x += 100) {
                    const largura = Math.min(100, direita - x);
                    const sx = x - cameraX;
                    if (disponivel(img.chao)) ctx.drawImage(img.chao, sx, yChao(), largura, CHAO_ALTURA);
                    else { ctx.fillStyle = "#423057"; ctx.fillRect(sx, yChao(), largura, CHAO_ALTURA); }
                }
            }
            inicio = buraco.x + buraco.largura;
        }
    }
    function desenharPlataformas() {
        for (const p of plataformas) {
            const x = p.x - cameraX, y = yChao() - p.altura;
            if (x + p.largura < 0 || x > canvas.width) continue;
            if (disponivel(img.plataforma)) ctx.drawImage(img.plataforma, x, y, p.largura, 35);
            else { ctx.fillStyle = "#65507c"; ctx.fillRect(x, y, p.largura, 35); }
        }
    }
    function desenharMoedas() {
        for (const m of moedas) {
            if (m.coletada) continue;
            const x = m.x - cameraX, y = yChao() - m.altura;
            if (disponivel(img.moeda)) ctx.drawImage(img.moeda, x, y, 35, 35);
            else { ctx.fillStyle = "#ffd447"; ctx.beginPath(); ctx.arc(x+17, y+17, 17, 0, Math.PI*2); ctx.fill(); }
        }
    }
    function desenharInimigos() {
        for (const e of inimigos) {
            if (!e.vivo) continue;
            const x = e.x - cameraX, y = yChao() - e.altura;
            if (x < -60 || x > canvas.width + 60) continue;
            ctx.save(); ctx.translate(x + 24, y + 17);
            ctx.fillStyle = "#3b2355";
            ctx.beginPath(); ctx.ellipse(-17, 0, 22, 12, -.3, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(17, 0, 22, 12, .3, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#24102f"; ctx.beginPath(); ctx.ellipse(0, 0, 17, 14, 0, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#ffdf6e"; ctx.fillRect(-9, -4, 5, 5); ctx.fillRect(4, -4, 5, 5);
            ctx.restore();
        }
    }
    function desenharBandeira() {
        const x = bandeira.x - cameraX, y = yChao() - bandeira.altura;
        if (disponivel(img.bandeira)) ctx.drawImage(img.bandeira, x, y, bandeira.largura, bandeira.altura);
        else { ctx.fillStyle = "#ddd"; ctx.fillRect(x, y, 7, bandeira.altura);
            ctx.fillStyle = "#a87bff"; ctx.fillRect(x+7, y, 60, 40); }
    }
    function desenharGato() {
        if (gato.invulneravel > 0 && Math.floor(gato.invulneravel / 100) % 2 === 0) return;
        let sprite = resultado === "derrota" ? img.derrotado :
            !gato.noChao ? img.pulando : gato.andando ?
            (Math.floor(gato.anim / 160) % 2 ? img.andando2 : img.andando1) : img.parado;
        if (!disponivel(sprite)) sprite = img.parado;
        if (!disponivel(sprite)) return;
        const x = Math.round(gato.x - cameraX), y = Math.round(gato.y);
        ctx.save();
        if (gato.direcao < 0) { ctx.translate(x + gato.largura, y); ctx.scale(-1, 1);
            ctx.drawImage(sprite, 0, 0, gato.largura, gato.altura); }
        else ctx.drawImage(sprite, x, y, gato.largura, gato.altura);
        ctx.restore();
    }
    function hud() {
        ctx.fillStyle = "rgba(15,10,35,.82)"; ctx.fillRect(14, 70, 200, 89);
        ctx.fillStyle = "#fff"; ctx.font = "bold 19px Arial";
        ctx.fillText("🪙 Moedas: " + coletadas, 26, 104);
        ctx.fillText("❤️ Vidas: " + vidas, 26, 137);
    }
    function resultadoTela() {
        if (!resultado) return;
        ctx.fillStyle = "rgba(0,0,0,.78)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white"; ctx.textAlign = "center";
        ctx.font = `bold ${Math.min(34, canvas.width / 13)}px Arial`;
        ctx.fillText(resultado === "vitoria" ? "🏆 FASE CONCLUÍDA!" : "💔 FIM DE JOGO", canvas.width/2, canvas.height/2-50);
        ctx.font = "20px Arial";
        ctx.fillText("Moedas: " + coletadas + " / " + moedas.length, canvas.width/2, canvas.height/2-9);
        ctx.font = "16px Arial";
        ctx.fillText("R: jogar novamente", canvas.width/2, canvas.height/2+35);
        ctx.fillText("No celular, toque na tela para reiniciar", canvas.width/2, canvas.height/2+63);
        ctx.textAlign = "left";
    }
    function reposicionar() {
        gato.x = 100; gato.y = yChao() - gato.altura;
        gato.vy = 0; gato.noChao = true; gato.direcao = 1; gato.invulneravel = 1400;
        cameraX = 0;
    }
    function perderVida() {
        if (resultado) return;
        vidas--;
        if (vidas <= 0) {
            resultado = "derrota";
            parar(musicaFundo);
            tocar(musicaFail);
        } else reposicionar();
    }
    function atualizarFisica(delta) {
        if (resultado) return;
        const fator = delta / 16.67;
        const anteriorY = gato.y;
        gato.andando = teclas.esquerda !== teclas.direita;
        if (teclas.esquerda) { gato.x -= VELOCIDADE*fator; gato.direcao = -1; }
        if (teclas.direita) { gato.x += VELOCIDADE*fator; gato.direcao = 1; }
        gato.x = Math.max(0, Math.min(MUNDO-gato.largura, gato.x));
        if (teclas.pular && gato.noChao) { gato.vy = PULO; gato.noChao = false; }
        gato.vy += GRAVIDADE*fator;
        gato.y += gato.vy*fator;
        gato.noChao = false;
        if (gato.vy >= 0) {
            for (const p of plataformas) {
                const topo = yChao()-p.altura;
                if (gato.x+gato.largura > p.x && gato.x < p.x+p.largura &&
                    anteriorY+gato.altura <= topo+8 && gato.y+gato.altura >= topo) {
                    gato.y = topo-gato.altura; gato.vy = 0; gato.noChao = true;
                }
            }
            // Apoio se alguma parte relevante dos pés ainda toca o chão.
            const peEsquerdo = gato.x+gato.largura*.25;
            const peDireito = gato.x+gato.largura*.75;
            if ((temChao(peEsquerdo) || temChao(peDireito)) && gato.y+gato.altura >= yChao()) {
                gato.y = yChao()-gato.altura; gato.vy = 0; gato.noChao = true;
            }
        }
        if (gato.y > canvas.height+100) { perderVida(); return; }
        gato.anim = gato.andando ? gato.anim+delta : 0;
        gato.invulneravel = Math.max(0, gato.invulneravel-delta);
        const t = performance.now()/1000;
        for (const e of inimigos) {
            if (!e.vivo) continue;
            e.x = e.base + Math.sin(t*1.6+e.fase)*e.alcance;
            const caixa = { x: e.x, y: yChao()-e.altura, largura: 48, altura: 34 };
            // Caixa de colisão menor que o PNG transparente.
            const corpo = { x: gato.x+35, y: gato.y+25, largura: gato.largura-70, altura: gato.altura-35 };
            if (!intersecao(corpo, caixa)) continue;
            const pulouEmCima = gato.vy > 0 && anteriorY+gato.altura-12 <= caixa.y+15;
            if (pulouEmCima) { e.vivo = false; gato.vy = -9; gato.noChao = false; }
            else if (gato.invulneravel <= 0) { perderVida(); return; }
        }
        for (const m of moedas) {
            if (m.coletada) continue;
            if (intersecao({ x:gato.x+25,y:gato.y+20,largura:gato.largura-50,altura:gato.altura-20 },
                { x:m.x,y:yChao()-m.altura,largura:35,altura:35 })) {
                m.coletada = true; coletadas++;
            }
        }
        if (gato.x+gato.largura >= bandeira.x && gato.x <= bandeira.x+bandeira.largura) {
            resultado = "vitoria"; parar(musicaFundo);
        }
        cameraX = Math.max(0, Math.min(Math.max(0, MUNDO-canvas.width), gato.x-canvas.width*.35));
    }
    function quadro(tempo) {
        if (!rodando) return;
        const delta = Math.min(tempo-tempoAnterior || 16.67, 33);
        tempoAnterior = tempo;
        atualizarFisica(delta);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        fundo(); chao(); desenharPlataformas(); desenharMoedas();
        desenharInimigos(); desenharBandeira(); desenharGato(); hud(); resultadoTela();
        idAnimacao = requestAnimationFrame(quadro);
    }
    function reiniciar() {
        vidas = 3; coletadas = 0; resultado = "";
        moedas.forEach(m => m.coletada = false);
        inimigos.forEach(e => e.vivo = true);
        teclas.esquerda = teclas.direita = teclas.pular = false;
        gato.anim = 0; gato.andando = false;
        reposicionar();
        parar(musicaFail); parar(musicaFundo); tocar(musicaFundo);
    }
    window.iniciarAventura = () => {
        if (rodando) return;
        ajustarCanvas(); reiniciar();
        rodando = true; tempoAnterior = 0;
        idAnimacao = requestAnimationFrame(quadro);
    };
    window.pararAventura = () => {
        rodando = false;
        if (idAnimacao !== null) cancelAnimationFrame(idAnimacao);
        idAnimacao = null;
        teclas.esquerda = teclas.direita = teclas.pular = false;
        parar(musicaFundo); parar(musicaFail);
    };
    window.addEventListener("keydown", e => {
        if (!rodando) return;
        if (e.code === "KeyR" && resultado) { reiniciar(); return; }
        if (["ArrowLeft","KeyA","ArrowRight","KeyD","ArrowUp","KeyW","Space"].includes(e.code)) e.preventDefault();
        if (e.code === "ArrowLeft" || e.code === "KeyA") teclas.esquerda = true;
        if (e.code === "ArrowRight" || e.code === "KeyD") teclas.direita = true;
        if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") teclas.pular = true;
    });
    window.addEventListener("keyup", e => {
        if (e.code === "ArrowLeft" || e.code === "KeyA") teclas.esquerda = false;
        if (e.code === "ArrowRight" || e.code === "KeyD") teclas.direita = false;
        if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") teclas.pular = false;
    });
    window.addEventListener("blur", () => {
        teclas.esquerda = teclas.direita = teclas.pular = false;
    });
    function botao(id, controle) {
        const elemento = document.getElementById(id);
        if (!elemento) return;
        elemento.addEventListener("pointerdown", e => {
            if (!rodando || resultado) return;
            e.preventDefault(); teclas[controle] = true;
            elemento.setPointerCapture(e.pointerId);
        });
        for (const evento of ["pointerup", "pointercancel", "lostpointercapture"])
            elemento.addEventListener(evento, () => { teclas[controle] = false; });
    }
    botao("controleEsquerda", "esquerda");
    botao("controleDireita", "direita");
    botao("controlePular", "pular");
    canvas.addEventListener("pointerdown", () => { if (rodando && resultado) reiniciar(); });
});
