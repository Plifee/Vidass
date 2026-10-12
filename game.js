window.addEventListener("DOMContentLoaded", function () {

    /* =====================================
       ELEMENTOS PRINCIPAIS
    ===================================== */

    const telaInicial = document.getElementById("telaInicial");
    const jogo = document.getElementById("jogo");

    const botaoJogar = document.getElementById("botaoJogar");

    const gatinho = document.getElementById("gatinho");
    const imagemGatinho = gatinho.querySelector("img");

    const mensagem = document.getElementById("mensagem");

    const botaoComida = document.getElementById("botaoComida");
    const botaoBrincar = document.getElementById("botaoBrincar");
    const botaoBanho = document.getElementById("botaoBanho");
    const botaoDormir = document.getElementById("botaoDormir");


    /* =====================================
       STATUS
    ===================================== */

    let felicidade = 80;
    let fome = 60;
    let energia = 70;
    let higiene = 75;

    const barraFelicidade =
        document.getElementById("barraFelicidade");

    const barraFome =
        document.getElementById("barraFome");

    const barraEnergia =
        document.getElementById("barraEnergia");

    const barraHigiene =
        document.getElementById("barraHigiene");


    function atualizarAparencia() {

        let novaImagem = "assets/personagem.png";

        if (energia === 0 || higiene === 0) {
            novaImagem = "assets/gatinho_triste.png";
        }

        else if (fome <= 30) {
            novaImagem = "assets/gatinho_fome.png";
        }

        else if (energia <= 30) {
            novaImagem = "assets/gatinho_cansado.png";
        }

        else if (higiene <= 30) {
            novaImagem = "assets/gatinho_sujo.png";
        }

        if (imagemGatinho.getAttribute("src") !== novaImagem) {
            imagemGatinho.src = novaImagem;
        }
    }


    function atualizarStatus() {

        barraFelicidade.style.width = felicidade + "%";
        barraFome.style.width = fome + "%";
        barraEnergia.style.width = energia + "%";
        barraHigiene.style.width = higiene + "%";

        atualizarAparencia();
    }


    function verificarNecessidades() {

        if (energia === 0 || higiene === 0) {
            return "⚠️ Meu gatinho não está bem! Cuide de mim!";
        }

        if (fome <= 30) {
            return "🍗 Miau... estou com fominha!";
        }

        if (energia <= 30) {
            return "😴 Estou com soninho!";
        }

        if (higiene <= 30) {
            return "🛁 Preciso de um banho!";
        }

        if (felicidade <= 30) {
            return "❤️ Estou tristinho... vamos brincar?";
        }

        return null;
    }


    let temporizadorMensagem;
    let temporizadorAnimacao;


    function reagirGatinho(texto) {

        const aviso = verificarNecessidades();

        mensagem.textContent = aviso !== null ? aviso : texto;

        mensagem.classList.remove("escondido");

        gatinho.classList.remove("reagindo");

        void gatinho.offsetWidth;

        gatinho.classList.add("reagindo");

        clearTimeout(temporizadorMensagem);
        clearTimeout(temporizadorAnimacao);

        temporizadorAnimacao = setTimeout(function () {
            gatinho.classList.remove("reagindo");
        }, 500);

        temporizadorMensagem = setTimeout(function () {

            if (verificarNecessidades() === null) {
                mensagem.classList.add("escondido");
            }

        }, 3000);
    }


    /* =====================================
       COMEÇAR
    ===================================== */

    botaoJogar.addEventListener("click", function () {

        telaInicial.classList.add("escondido");

        jogo.classList.remove("escondido");

        reagirGatinho("Miau! Que bom que você chegou! ❤️");
    });


    gatinho.addEventListener("click", function () {
        reagirGatinho("Miau! Estou feliz com você! ❤️");
    });


    /* =====================================
       CUIDADOS
    ===================================== */

    botaoComida.addEventListener("click", function () {

        fome = Math.min(100, fome + 20);
        felicidade = Math.min(100, felicidade + 5);

        atualizarStatus();

        reagirGatinho("Miau! Que delícia! 😋");
    });


    botaoBrincar.addEventListener("click", function () {

        felicidade = Math.min(100, felicidade + 20);

        energia = Math.max(0, energia - 15);

        higiene = Math.max(0, higiene - 10);

        atualizarStatus();

        reagirGatinho("Miau! Adoro brincar! 🎾");
    });


    botaoBanho.addEventListener("click", function () {

        higiene = Math.min(100, higiene + 25);
        felicidade = Math.min(100, felicidade + 5);

        atualizarStatus();

        reagirGatinho("Miau! Estou limpinho! 🫧");
    });


    botaoDormir.addEventListener("click", function () {

        energia = Math.min(100, energia + 30);
        felicidade = Math.min(100, felicidade + 5);

        atualizarStatus();

        reagirGatinho("Zzz... Estou descansando! 😴");
    });


    /* =====================================
       MÚSICAS
    ===================================== */

    const botaoMusica = document.getElementById("botaoMusica");
    const menuMusicas = document.getElementById("menuMusicas");

    const fecharMenuMusicas =
        document.getElementById("fecharMenuMusicas");

    const telaMusica = document.getElementById("telaMusica");

    const videoRock = document.getElementById("videoRock");
    const audioMusica = document.getElementById("audioMusica");

    const voltarCasa = document.getElementById("voltarCasa");

    const nomeMusica = document.getElementById("nomeMusica");


    botaoMusica.addEventListener("click", function () {
        menuMusicas.classList.remove("escondido");
    });


    fecharMenuMusicas.addEventListener("click", function () {
        menuMusicas.classList.add("escondido");
    });


    menuMusicas.addEventListener("click", function (evento) {

        if (evento.target === menuMusicas) {
            menuMusicas.classList.add("escondido");
        }

    });


    document.querySelectorAll(".escolhaMusica").forEach(function (botao) {

        botao.addEventListener("click", function () {

            const arquivo = botao.dataset.arquivo;

            const arquivoVideo =
                arquivo.replace(/\.mp3$/i, ".mp4");

            nomeMusica.textContent = botao.textContent.trim();

            menuMusicas.classList.add("escondido");

            jogo.classList.add("escondido");
            telaMusica.classList.remove("escondido");


            videoRock.pause();

            videoRock.src = "assets/videos/" + arquivoVideo;

            videoRock.load();

            videoRock.muted = true;
            videoRock.loop = true;

            videoRock.play().catch(function (erro) {
                console.error("Erro no vídeo:", erro);
            });


            audioMusica.pause();

            audioMusica.src = "assets/musicas/" + arquivo;

            audioMusica.currentTime = 0;

            audioMusica.play().catch(function (erro) {

                console.error("Erro na música:", erro);

                alert("Não foi possível reproduzir a música.");

            });

        });

    });


    voltarCasa.addEventListener("click", function () {

        audioMusica.pause();
        audioMusica.currentTime = 0;

        videoRock.pause();
        videoRock.currentTime = 0;

        telaMusica.classList.add("escondido");
        jogo.classList.remove("escondido");

        atualizarStatus();
    });


    /* =====================================
       NOVO MODO AVENTURA
    ===================================== */

    const botaoAventura =
        document.getElementById("botaoAventura");

    const telaAventura =
        document.getElementById("telaAventura");

    const voltarAventura =
        document.getElementById("voltarAventura");


    botaoAventura.addEventListener("click", function () {

        jogo.classList.add("escondido");

        telaAventura.classList.remove("escondido");

        if (window.iniciarAventura) {
            window.iniciarAventura();
        }

    });


    voltarAventura.addEventListener("click", function () {

        if (window.pararAventura) {
            window.pararAventura();
        }

        telaAventura.classList.add("escondido");

        jogo.classList.remove("escondido");

        atualizarStatus();
    });


    atualizarStatus();

});