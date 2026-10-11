window.addEventListener("DOMContentLoaded", function () {

    // ========================================
    // ELEMENTOS PRINCIPAIS
    // ========================================

    const telaInicial = document.getElementById("telaInicial");
    const jogo = document.getElementById("jogo");
    const botaoJogar = document.getElementById("botaoJogar");

    const gatinho = document.getElementById("gatinho");
    const imagemGatinho = gatinho.querySelector("img");
    const mensagem = document.getElementById("mensagem");


    // ========================================
    // BOTÕES DE AÇÃO
    // ========================================

    const botaoComida = document.getElementById("botaoComida");
    const botaoBrincar = document.getElementById("botaoBrincar");
    const botaoBanho = document.getElementById("botaoBanho");
    const botaoDormir = document.getElementById("botaoDormir");


    // ========================================
    // STATUS INICIAIS
    // ========================================

    let felicidade = 80;
    let fome = 60;
    let energia = 70;
    let higiene = 75;


    // ========================================
    // BARRAS DE STATUS
    // ========================================

    const barraFelicidade = document.getElementById("barraFelicidade");
    const barraFome = document.getElementById("barraFome");
    const barraEnergia = document.getElementById("barraEnergia");
    const barraHigiene = document.getElementById("barraHigiene");


    // ========================================
    // ATUALIZAR APARÊNCIA DO GATINHO
    // ========================================

    function atualizarAparencia() {

        let novaImagem = "assets/personagem.png";

        if (energia === 0 || higiene === 0) {

            novaImagem = "assets/gatinho_triste.png";

        } else if (fome <= 30) {

            novaImagem = "assets/gatinho_fome.png";

        } else if (energia <= 30) {

            novaImagem = "assets/gatinho_cansado.png";

        } else if (higiene <= 30) {

            novaImagem = "assets/gatinho_sujo.png";

        }

        if (imagemGatinho.getAttribute("src") !== novaImagem) {

            imagemGatinho.src = novaImagem;

        }

    }


    // ========================================
    // ATUALIZAR STATUS
    // ========================================

    function atualizarStatus() {

        barraFelicidade.style.width = felicidade + "%";
        barraFome.style.width = fome + "%";
        barraEnergia.style.width = energia + "%";
        barraHigiene.style.width = higiene + "%";

        atualizarAparencia();

    }


    // ========================================
    // VERIFICAR NECESSIDADES
    // ========================================

    function verificarNecessidades() {

        if (energia === 0 || higiene === 0) {

            return "⚠️ Meu gatinho não está bem! Verifique os status e cuide de mim!";

        }

        if (fome <= 30) {

            return "🍗 Miau... estou com fominha! Pode me dar comida?";

        }

        if (energia <= 30) {

            return "😴 Estou com soninho... vamos descansar?";

        }

        if (higiene <= 30) {

            return "🛁 Preciso de um banho! Estou ficando sujinho.";

        }

        if (felicidade <= 30) {

            return "❤️ Estou tristinho... vamos brincar um pouco?";

        }

        return null;

    }


    // ========================================
    // MENSAGENS E ANIMAÇÃO
    // ========================================

    let temporizadorMensagem;
    let temporizadorAnimacao;

    function reagirGatinho(texto) {

        const aviso = verificarNecessidades();

        if (aviso !== null) {

            mensagem.textContent = aviso;

        } else {

            mensagem.textContent = texto;

        }

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


    // ========================================
    // INICIAR JOGO
    // ========================================

    botaoJogar.addEventListener("click", function () {

        telaInicial.classList.add("escondido");

        jogo.classList.remove("escondido");

        reagirGatinho("Miau! Que bom que você chegou! ❤️");

    });


    // ========================================
    // CLICAR NO GATINHO
    // ========================================

    gatinho.addEventListener("click", function () {

        reagirGatinho("Miau! Estou feliz com você! ❤️");

    });


    // ========================================
    // DAR COMIDA
    // ========================================

    botaoComida.addEventListener("click", function () {

        fome = Math.min(100, fome + 20);

        felicidade = Math.min(100, felicidade + 5);

        atualizarStatus();

        reagirGatinho("Miau! Que delícia! 😋");

    });


    // ========================================
    // BRINCAR
    // ========================================

    botaoBrincar.addEventListener("click", function () {

        felicidade = Math.min(100, felicidade + 20);

        energia = Math.max(0, energia - 15);

        higiene = Math.max(0, higiene - 10);

        atualizarStatus();

        reagirGatinho("Miau! Adoro brincar! 🎾");

    });


    // ========================================
    // DAR BANHO
    // ========================================

    botaoBanho.addEventListener("click", function () {

        higiene = Math.min(100, higiene + 25);

        felicidade = Math.min(100, felicidade + 5);

        atualizarStatus();

        reagirGatinho("Miau! Estou limpinho! 🫧");

    });


    // ========================================
    // DORMIR
    // ========================================

    botaoDormir.addEventListener("click", function () {

        energia = Math.min(100, energia + 30);

        felicidade = Math.min(100, felicidade + 5);

        atualizarStatus();

        reagirGatinho("Zzz... Estou descansando! 😴");

    });


    // ========================================
    // MODO MÚSICA
    // ========================================

    const botaoMusica = document.getElementById("botaoMusica");

    const menuMusicas = document.getElementById("menuMusicas");

    const fecharMenuMusicas = document.getElementById("fecharMenuMusicas");

    const telaMusica = document.getElementById("telaMusica");

    const videoRock = document.getElementById("videoRock");

    const audioMusica = document.getElementById("audioMusica");

    const voltarCasa = document.getElementById("voltarCasa");

    const nomeMusica = document.getElementById("nomeMusica");


    // ========================================
    // ABRIR MENU DE MÚSICAS
    // ========================================

    botaoMusica.addEventListener("click", function () {

        menuMusicas.classList.remove("escondido");

    });


    // ========================================
    // FECHAR MENU DE MÚSICAS
    // ========================================

    fecharMenuMusicas.addEventListener("click", function () {

        menuMusicas.classList.add("escondido");

    });


    // ========================================
    // FECHAR MENU CLICANDO FORA
    // ========================================

    menuMusicas.addEventListener("click", function (evento) {

        if (evento.target === menuMusicas) {

            menuMusicas.classList.add("escondido");

        }

    });


    // ========================================
    // ESCOLHER UMA MÚSICA
    // CADA MÚSICA POSSUI SEU PRÓPRIO VÍDEO
    // ========================================

    document.querySelectorAll(".escolhaMusica").forEach(function (botao) {

        botao.addEventListener("click", function () {

            // Nome do arquivo MP3 selecionado
            const arquivo = botao.dataset.arquivo;

            // Transforma o nome do MP3 no nome do MP4
            const arquivoVideo = arquivo.replace(/\.mp3$/i, ".mp4");

            // Exibe o nome da música na tela
            nomeMusica.textContent = botao.textContent.trim();


            // ========================================
            // TROCAR DE TELA
            // ========================================

            // Fecha o menu de músicas
            menuMusicas.classList.add("escondido");

            // Esconde a casa do gatinho
            jogo.classList.add("escondido");

            // Abre a tela musical
            telaMusica.classList.remove("escondido");


            // ========================================
            // CONFIGURAR VÍDEO DA MÚSICA
            // ========================================

            // Interrompe o vídeo anterior
            videoRock.pause();

            // Define o vídeo correspondente ao MP3
            videoRock.src = "assets/videos/" + arquivoVideo;

            // Carrega o novo vídeo
            videoRock.load();

            // Desativa o áudio original do vídeo
            videoRock.muted = true;

            // Mantém o vídeo em looping
            videoRock.loop = true;

            // Inicia a reprodução do vídeo
            videoRock.play().catch(function (erro) {

                console.error(
                    "Erro ao reproduzir o vídeo:",
                    erro
                );

            });


            // ========================================
            // CONFIGURAR MÚSICA
            // ========================================

            // Interrompe qualquer música anterior
            audioMusica.pause();

            // Define o arquivo MP3
            audioMusica.src = "assets/musicas/" + arquivo;

            // Reinicia a reprodução
            audioMusica.currentTime = 0;

            // Inicia a música selecionada
            audioMusica.play().catch(function (erro) {

                console.error(
                    "Erro ao reproduzir a música:",
                    erro
                );

                alert(
                    "Não foi possível reproduzir a música. Confira se o arquivo MP3 está na pasta correta."
                );

            });

        });

    });


    // ========================================
    // VOLTAR PARA CASA
    // ========================================

    voltarCasa.addEventListener("click", function () {

        // Interrompe a música
        audioMusica.pause();

        // Reinicia o tempo da música
        audioMusica.currentTime = 0;


        // Interrompe o vídeo
        videoRock.pause();

        // Reinicia o tempo do vídeo
        videoRock.currentTime = 0;


        // Esconde a tela musical
        telaMusica.classList.add("escondido");


        // Retorna para a casa do gatinho
        jogo.classList.remove("escondido");

        // Atualiza a aparência e as barras
        atualizarStatus();

    });


    // ========================================
    // INICIALIZAR JOGO
    // ========================================

    atualizarStatus();

});