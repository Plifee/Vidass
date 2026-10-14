/* LEAF CHASE — ETAPAS 7 E 8: FASE LATERAL E AMBIENTAÇÃO */

const canvas = document.getElementById("canvasJogo");

const ctx = canvas.getContext("2d");

const $ = id => document.getElementById(id);

const pastaSprites = "../assets/plataforma/";

function carregarImagem(nome) { const img = new Image(); img.src = pastaSprites + nome; return img; }

const sprites = {

  parado: carregarImagem("gatinho_parado.png"),

  andando1: carregarImagem("gatinho_andando1.png"),

  andando2: carregarImagem("gatinho_andando2.png"),

  pulando: carregarImagem("gatinho_pulando.png")

};



// Cada classe tem atributos e ataques próprios. Desbloqueio: níveis 1, 2, 3 e 4.

const classes = {

  guerreiro: { nome:"Guerreiro", icone:"⚔️", nivel:1, vidaMaxima:100, manaMaxima:50, velocidade:5, danos:[20,25,35], custo:20, danoEspecial:60, alcance:210, nomeEspecial:"Corte Lunar", cor:"#c27aff" },

  mago:     { nome:"Mago", icone:"🪄", nivel:2, vidaMaxima:75, manaMaxima:120, velocidade:4, danos:[14,18,23], custo:30, danoEspecial:75, alcance:350, nomeEspecial:"Bola de Fogo", cor:"#ff9345" },

  arqueiro: { nome:"Arqueiro", icone:"🏹", nivel:3, vidaMaxima:85, manaMaxima:75, velocidade:6, danos:[16,19,24], custo:25, danoEspecial:65, alcance:450, nomeEspecial:"Flecha Mágica", cor:"#8bf3a5" },

  lutador:  { nome:"Lutador", icone:"🐾", nivel:4, vidaMaxima:120, manaMaxima:45, velocidade:6, danos:[22,27,40], custo:20, danoEspecial:80, alcance:145, nomeEspecial:"Combo Selvagem", cor:"#ffd36b" }

};

let chaveClasse = "guerreiro";

const classeAtual = () => classes[chaveClasse];

const GRAVIDADE = .65, FORCA_PULO = -14, LARGURA_MUNDO = 6200;

const DURACAO_GOLPE = 220, TEMPO_COMBO = 650, RECUPERACAO_MANA = 4;

let cameraX = 0, ultimoTempo = 0, jogoEncerrado = false, menuAberto = false;

let golpeAtual = 0, ultimoGolpe = -Infinity, efeitoEspecial = 0, recargaEspecial = 0, rodada = 1;

let faseConcluida = false, chefeAtivado = false;

const INICIO_ARENA = 5570;

const plataformas = [{x:840,y:155,w:180},{x:1460,y:135,w:190},{x:2200,y:155,w:190},{x:2770,y:125,w:190},{x:3650,y:160,w:220},{x:4230,y:140,w:200},{x:4880,y:155,w:230}];

const espinhos = [{x:1070,w:85},{x:1800,w:105},{x:2540,w:100},{x:3120,w:95},{x:3920,w:90},{x:4560,w:110},{x:5160,w:95}];

const vagaLumes = Array.from({length:95},(_,i)=>({x:(i*197+113)%LARGURA_MUNDO,y:100+(i*83)%380,offset:i*1.7}));

let tempoAviso = 0;

const leaf = {x:100,y:0,largura:145,altura:145,velocidadeY:0,noChao:true,direcao:1,andando:false,vida:100,mana:50,nivel:1,experiencia:0,experienciaNecessaria:50,atacando:false,tempoAtaque:0,tempoAnimacao:0,invulneravel:0};

const controles = {esquerda:false,direita:false,pular:false};

const posicoesInimigos = [550,950,1390,1760,2150,2590,3030,3370,3720,4050,4400,4750,5070,5330];

const inimigos = posicoesInimigos.map((x,i) => ({xInicial:x,x,y:0,largura:65,altura:65,vidaMaxima:60+i*10,vida:60+i*10,velocidade:1.2+i*.2,direcao:i===1?-1:1,alcance:130+i*15,vivo:true}));

// Chefe desenhado em Canvas, sem necessidade de imagens extras.

const chefe = {x:5820,y:0,largura:165,altura:175,vida:480,vidaMaxima:480,vivo:false,

  chefe:true,direcao:-1,tempoAtaque:1300,fase:1,invocacoes:0};

const bolasSombrias = [];

let chefesDerrotados = 0;

const particulas = [];

// Projéteis reais para Mago e Arqueiro. Cada um acerta no máximo um inimigo.

const projeteis = [];

let efeitoCorpo = 0;

let tipoEfeito = "";

let avisoGolpe = "";



const alturaChao = () => canvas.height-100;

function ajustarCanvas(){const anterior=canvas.height;canvas.width=innerWidth;canvas.height=innerHeight;ctx.imageSmoothingEnabled=false;if(anterior && leaf.noChao)leaf.y+=canvas.height-anterior;}

window.addEventListener("resize",ajustarCanvas);ajustarCanvas();

leaf.y=alturaChao()-leaf.altura;

function avisar(msg,ms=2000){$("aviso").textContent=msg;tempoAviso=ms;}

function criarParticulas(x,y,cor,quantidade=12){for(let i=0;i<quantidade;i++)particulas.push({x,y,vx:(Math.random()-.5)*8,vy:(Math.random()-.5)*8,tamanho:2+Math.random()*5,vida:500,cor});}

function atualizarParticulas(dt){for(let i=particulas.length-1;i>=0;i--){const p=particulas[i];p.x+=p.vx*dt/16.67;p.y+=p.vy*dt/16.67;p.vy+=.15*dt/16.67;p.vida-=dt;if(p.vida<=0)particulas.splice(i,1);}}

function desenharParticulas(){ctx.save();for(const p of particulas){ctx.globalAlpha=Math.max(0,p.vida/500);ctx.fillStyle=p.cor;ctx.fillRect(p.x-cameraX,p.y,p.tamanho,p.tamanho);}ctx.restore();}

function colidiu(a,b){return a.x<b.x+b.largura&&a.x+a.largura>b.x&&a.y<b.y+b.altura&&a.y+a.altura>b.y;}

function caixaLeaf(){return{x:leaf.x+35,y:leaf.y+25,largura:leaf.largura-70,altura:leaf.altura-30};}

function caixaGolpe(alcance){return{x:leaf.direcao===1?leaf.x+leaf.largura-15:leaf.x-alcance+15,y:leaf.y+25,largura:alcance,altura:115};}

function aplicarDano(area,dano,cor){for(const inimigo of [...inimigos,chefe]){if(!inimigo.vivo||!colidiu(area,inimigo))continue;inimigo.vida-=dano;criarParticulas(inimigo.x+32,inimigo.y+32,cor,18);if(inimigo.vida<=0)derrotarInimigo(inimigo);}}

function dispararProjetil(tipo, especial, dano) {

  const c = classeAtual();

  const velo = tipo === "fogo" ? 10 : 15;

  projeteis.push({

    x: leaf.x + leaf.largura / 2 + leaf.direcao * 55,

    y: leaf.y + 75,

    vx: leaf.direcao * velo,

    tipo, especial, dano, cor: c.cor,

    raio: especial ? 17 : 10,

    distancia: 0,

    alcance: especial ? c.alcance : 310

  });

}

function atacar(){

  if(jogoEncerrado||menuAberto||leaf.atacando)return;

  const agora=performance.now();

  golpeAtual=agora-ultimoGolpe>TEMPO_COMBO?0:(golpeAtual+1)%3;

  ultimoGolpe=agora;

  leaf.atacando=true;

  leaf.tempoAtaque=DURACAO_GOLPE;

  const c=classeAtual();

  const dano=c.danos[golpeAtual];

  if(chaveClasse==="mago"){

    dispararProjetil("fogo",false,dano);

  }else if(chaveClasse==="arqueiro"){

    dispararProjetil("flecha",false,dano);

  }else{

    aplicarDano(caixaGolpe(chaveClasse==="lutador"?110:90),dano,c.cor);

    efeitoCorpo=200;

    tipoEfeito="normal";

    criarParticulas(leaf.x+leaf.largura/2+leaf.direcao*60,leaf.y+65,c.cor,8);

  }

}

function usarEspecial(){

  if(jogoEncerrado||menuAberto||leaf.atacando||recargaEspecial>0)return;

  const c=classeAtual();

  if(leaf.mana<c.custo){avisar("🔵 Mana insuficiente!");return;}

  leaf.mana-=c.custo;

  leaf.atacando=true;

  leaf.tempoAtaque=450;

  recargaEspecial=900;

  if(chaveClasse==="mago"){

    dispararProjetil("fogo",true,c.danoEspecial);

    efeitoEspecial=0;

  }else if(chaveClasse==="arqueiro"){

    dispararProjetil("flecha",true,c.danoEspecial);

    efeitoEspecial=0;

  }else{

    efeitoEspecial=450;

    aplicarDano(caixaGolpe(c.alcance),c.danoEspecial,c.cor);

    criarParticulas(leaf.x+leaf.largura/2,leaf.y+70,c.cor,30);

  }

  avisar(`${c.icone} ${c.nomeEspecial}!`,900);

}

function atualizarProjeteis(dt){

  if(jogoEncerrado||menuAberto)return;

  const fator=dt/16.67;

  for(let i=projeteis.length-1;i>=0;i--){

    const p=projeteis[i];

    const dx=p.vx*fator;

    p.x+=dx;

    p.distancia+=Math.abs(dx);

    const area={x:p.x-p.raio,y:p.y-p.raio,largura:p.raio*2,altura:p.raio*2};

    let acertou=false;

    for(const e of [...inimigos,chefe]){

      if(!e.vivo||!colidiu(area,e))continue;

      e.vida-=p.dano;

      criarParticulas(e.x+32,e.y+32,p.cor,p.especial?28:14);

      if(e.vida<=0)derrotarInimigo(e);

      acertou=true;

      break;

    }

    if(acertou||p.distancia>=p.alcance||p.x<0||p.x>LARGURA_MUNDO){projeteis.splice(i,1);}

  }

}

function desenharProjeteis(){

  for(const p of projeteis){

    const x=p.x-cameraX,y=p.y;

    ctx.save();

    ctx.shadowColor=p.cor;

    ctx.shadowBlur=p.especial?26:14;

    if(p.tipo==="fogo"){

      ctx.fillStyle=p.especial?"#ff5a20":"#ffad46";

      ctx.beginPath();ctx.arc(x,y,p.raio,0,Math.PI*2);ctx.fill();

      ctx.fillStyle="#fff1a3";

      ctx.beginPath();ctx.arc(x,y,p.raio*.45,0,Math.PI*2);ctx.fill();

    }else{

      ctx.strokeStyle=p.cor;ctx.lineWidth=p.especial?7:4;

      const dir=Math.sign(p.vx);

      ctx.beginPath();ctx.moveTo(x-dir*25,y);ctx.lineTo(x+dir*18,y);ctx.stroke();

      ctx.fillStyle="#f0fff5";

      ctx.beginPath();ctx.moveTo(x+dir*25,y);ctx.lineTo(x+dir*12,y-8);ctx.lineTo(x+dir*12,y+8);ctx.closePath();ctx.fill();

    }

    ctx.restore();

  }

}

function ganharExperiencia(qtd){leaf.experiencia+=qtd;while(leaf.experiencia>=leaf.experienciaNecessaria){leaf.experiencia-=leaf.experienciaNecessaria;leaf.nivel++;leaf.experienciaNecessaria+=30;leaf.vida=classeAtual().vidaMaxima;leaf.mana=classeAtual().manaMaxima;criarParticulas(leaf.x+70,leaf.y+70,"#ffe477",35);avisar(`🆙 Nível ${leaf.nivel}! Novas classes podem estar disponíveis.`,3500);}}

// Etapa 7: os inimigos são fixos nesta fase; o chefe aguarda na arena.

function iniciarRodada(){

  chefe.vivo=false; chefeAtivado=false; faseConcluida=false;

  chefe.x=5820;chefe.y=alturaChao()-chefe.altura;chefe.vidaMaxima=480;chefe.vida=480;chefe.fase=1;chefe.tempoAtaque=1300;

  bolasSombrias.length=0;

  inimigos.forEach((e,i)=>{e.x=e.xInicial;e.y=alturaChao()-e.altura;e.vidaMaxima=60+i*10;e.vida=e.vidaMaxima;e.vivo=true;});$("painelVitoria").classList.add("escondido");

  avisar("🌲 Fase 1 — Floresta dos Esquecidos",3200);

}

function derrotarInimigo(inimigo){

  if(!inimigo.vivo)return;

  inimigo.vivo=false;

  criarParticulas(inimigo.x+inimigo.largura/2,inimigo.y+inimigo.altura/2,"#ffcc55",35);

  if(inimigo.chefe){

    ganharExperiencia(130);

    leaf.vida=classeAtual().vidaMaxima;

    leaf.mana=classeAtual().manaMaxima;

    bolasSombrias.length=0;

    faseConcluida=true;

    jogoEncerrado=true;

    controles.esquerda=controles.direita=controles.pular=false;

    $("painelVitoria").classList.remove("escondido");

    avisar("🏆 Fase 1 concluída!",5000);

  }else{

    ganharExperiencia(25);

    if(inimigos.every(e=>!e.vivo))avisar("🚪 Caminho livre! Vá até a arena do chefe.",4000);

  }

}

function verificarArena(){

  if(chefeAtivado||faseConcluida)return;

  if(leaf.x+leaf.largura>=INICIO_ARENA){

    if(inimigos.some(e=>e.vivo)){

      leaf.x=INICIO_ARENA-leaf.largura-8;

      avisar("🔒 Derrote todos os inimigos para abrir a arena!",2200);

    }else{

      chefeAtivado=true;chefe.vivo=true;

      chefe.x=5820;chefe.y=alturaChao()-chefe.altura;

      chefe.vida=chefe.vidaMaxima;chefe.fase=1;

      avisar("👑 O GUARDIÃO DAS SOMBRAS DESPERTOU!",3500);

    }

  }

}

function atualizarChefe(dt){

  if(!chefe.vivo||jogoEncerrado||menuAberto)return;

  const f=dt/16.67;

  chefe.y=alturaChao()-chefe.altura;

  chefe.fase=chefe.vida<=chefe.vidaMaxima/2?2:1;

  chefe.direcao=leaf.x<chefe.x?-1:1;

  const distancia=Math.abs(leaf.x-chefe.x);

  if(distancia>145)chefe.x+=chefe.direcao*(chefe.fase===2?2.1:1.25)*f;

  chefe.x=Math.max(0,Math.min(LARGURA_MUNDO-chefe.largura,chefe.x));

  if(colidiu(caixaLeaf(),chefe))receberDano(chefe.fase===2?16:12);

  chefe.tempoAtaque-=dt;

  if(chefe.tempoAtaque<=0){

    chefe.tempoAtaque=chefe.fase===2?900:1500;

    const origemX=chefe.x+chefe.largura/2,origemY=chefe.y+60;

    const alvoX=leaf.x+leaf.largura/2,alvoY=leaf.y+75;

    const angulo=Math.atan2(alvoY-origemY,alvoX-origemX);

    const total=chefe.fase===2?3:1;

    for(let i=0;i<total;i++){

      const a=angulo+(i-(total-1)/2)*.22;

      bolasSombrias.push({x:origemX,y:origemY,vx:Math.cos(a)*5.5,vy:Math.sin(a)*5.5,vida:2700});

    }

  }

  for(let i=bolasSombrias.length-1;i>=0;i--){

    const b=bolasSombrias[i];b.x+=b.vx*f;b.y+=b.vy*f;b.vida-=dt;

    if(colidiu({x:b.x-13,y:b.y-13,largura:26,altura:26},caixaLeaf())){

      receberDano(chefe.fase===2?14:10);b.vida=0;

    }

    if(b.vida<=0)bolasSombrias.splice(i,1);

  }

}

// Sprites dos 3 slimes e das 2 fases do Guardião.
const pastaSpritesMonstros = "../assets/leaf-chase/";
const spritesMonstros = {};
for (const tipo of ["slime_sombrio", "slime_arcano", "slime_corrompido", "guardiao_fase1", "guardiao_fase2"]) {
  spritesMonstros[tipo] = {};
  for (const movimento of ["parado", "andando1", "andando2", "pulando"]) {
    const img = new Image();
    img.src = `${pastaSpritesMonstros}${tipo}/${movimento}.png`;
    img.onerror = () => console.warn("Imagem do monstro não encontrada:", img.src);
    spritesMonstros[tipo][movimento] = img;
  }
}
function imagemMonstroPronta(img) {
  return img && img.complete && img.naturalWidth > 0;
}
function desenharSpriteMonstro(img, x, y, largura, altura, direcao) {
  if (!imagemMonstroPronta(img)) return false;
  ctx.save();
  ctx.translate(x + largura / 2, y + altura);
  ctx.scale(direcao < 0 ? -1 : 1, 1);
  ctx.drawImage(img, -largura / 2, -altura, largura, altura);
  ctx.restore();
  return true;
}

function desenharChefe(tempo){

  if(!chefe.vivo)return;

  const x=chefe.x-cameraX,y=chefe.y+Math.sin(tempo/230)*4;

  if(x<-220||x>canvas.width+220)return;

  ctx.save();
  const tipo = chefe.fase === 2 ? "guardiao_fase2" : "guardiao_fase1";
  const andando = Math.abs(leaf.x - chefe.x) > 145;
  const movimento = andando ? (Math.floor(tempo / 180) % 2 ? "andando1" : "andando2") : "parado";
  const img = spritesMonstros[tipo][movimento];
  const fallback = spritesMonstros[tipo].parado;
  if (!desenharSpriteMonstro(imagemMonstroPronta(img) ? img : fallback,
      x, y, chefe.largura, chefe.altura, chefe.direcao)) {
    ctx.fillStyle = chefe.fase === 2 ? "#612040" : "#3c236d";
    ctx.fillRect(x + 12, y + 18, chefe.largura - 24, chefe.altura - 18);
  }
  ctx.shadowBlur=0;

  ctx.fillStyle="#150d25";ctx.fillRect(x-25,y-43,215,17);

  ctx.fillStyle=chefe.fase===2?"#ff4067":"#bd79ff";

  ctx.fillRect(x-25,y-43,215*Math.max(0,chefe.vida/chefe.vidaMaxima),17);

  ctx.fillStyle="white";ctx.font="bold 14px Arial";

  ctx.fillText(`👑 GUARDIÃO DAS SOMBRAS — FASE ${chefe.fase}`,x-37,y-55);

  ctx.restore();

  for(const b of bolasSombrias){

    ctx.save();ctx.shadowColor="#b269ff";ctx.shadowBlur=18;ctx.fillStyle="#d6a2ff";

    ctx.beginPath();ctx.arc(b.x-cameraX,b.y,13,0,Math.PI*2);ctx.fill();ctx.restore();

  }

}

function receberDano(valor){if(leaf.invulneravel>0||jogoEncerrado)return;leaf.vida=Math.max(0,leaf.vida-valor);leaf.invulneravel=1100;criarParticulas(leaf.x+70,leaf.y+70,"#ff5577",20);if(leaf.vida===0){jogoEncerrado=true;$("painelFim").classList.remove("escondido");}}

function atualizarLeaf(dt){if(jogoEncerrado||menuAberto)return;const f=dt/16.67,c=classeAtual();leaf.mana=Math.min(c.manaMaxima,leaf.mana+RECUPERACAO_MANA*dt/1000);efeitoEspecial=Math.max(0,efeitoEspecial-dt);efeitoCorpo=Math.max(0,efeitoCorpo-dt);recargaEspecial=Math.max(0,recargaEspecial-dt);leaf.andando=false;if(controles.esquerda!==controles.direita){leaf.direcao=controles.direita?1:-1;leaf.x+=leaf.direcao*c.velocidade*f;leaf.andando=true;}leaf.x=Math.max(0,Math.min(LARGURA_MUNDO-leaf.largura,leaf.x));verificarArena();if(controles.pular&&leaf.noChao){leaf.velocidadeY=FORCA_PULO;leaf.noChao=false;}const pesAntes=leaf.y+leaf.altura;if(leaf.velocidadeY>=0)leaf.noChao=false;leaf.velocidadeY+=GRAVIDADE*f;leaf.y+=leaf.velocidadeY*f;if(leaf.velocidadeY>=0){for(const p of plataformas){const topo=alturaChao()-p.y;if(leaf.x+leaf.largura-35>p.x&&leaf.x+35<p.x+p.w&&pesAntes<=topo+8&&leaf.y+leaf.altura>=topo){leaf.y=topo-leaf.altura;leaf.velocidadeY=0;leaf.noChao=true;break;}}}if(leaf.y>=alturaChao()-leaf.altura){leaf.y=alturaChao()-leaf.altura;leaf.velocidadeY=0;leaf.noChao=true;}if(leaf.atacando){leaf.tempoAtaque-=dt;if(leaf.tempoAtaque<=0)leaf.atacando=false;}leaf.invulneravel=Math.max(0,leaf.invulneravel-dt);for(const a of espinhos){if(leaf.x+leaf.largura-35>a.x&&leaf.x+35<a.x+a.w&&leaf.y+leaf.altura>alturaChao()-24)receberDano(8);}leaf.tempoAnimacao+=dt;cameraX=Math.max(0,Math.min(Math.max(0,LARGURA_MUNDO-canvas.width),leaf.x-canvas.width*.35));}

function atualizarInimigos(dt){if(jogoEncerrado||menuAberto||chefe.vivo)return;for(const e of inimigos){if(!e.vivo)continue;e.y=alturaChao()-e.altura;e.x+=e.velocidade*e.direcao*dt/16.67;if(e.x>=e.xInicial+e.alcance)e.direcao=-1;if(e.x<=e.xInicial-e.alcance)e.direcao=1;if(colidiu(caixaLeaf(),e))receberDano(10);}}

function desenharCenario(tempo=0){

  const h=alturaChao(), t=tempo/1000;

  const g=ctx.createLinearGradient(0,0,0,canvas.height);g.addColorStop(0,"#0b1024");g.addColorStop(.6,"#292045");g.addColorStop(1,"#49365a");ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);

  // Lua, estrelas e montanhas distantes (paralaxe)

  ctx.fillStyle="#d8d1e7";ctx.beginPath();ctx.arc(canvas.width*.76-cameraX*.035,110,38,0,Math.PI*2);ctx.fill();

  ctx.fillStyle="#9e8cb4";for(let i=0;i<42;i++){const x=((i*157-cameraX*.07)%(canvas.width+100)+(canvas.width+100))%(canvas.width+100);ctx.fillRect(x,(i*67)%Math.max(180,h-120),2,2);}

  ctx.fillStyle="#201a37";const deslocamento=(cameraX*.18)%380;for(let x=-380-deslocamento;x<canvas.width+380;x+=380){ctx.beginPath();ctx.moveTo(x,h);ctx.lineTo(x+185,h-260);ctx.lineTo(x+380,h);ctx.fill();}

  // Silhuetas de árvores distribuídas pelo mundo

  for(let i=0;i<70;i++){const wx=90+i*97, x=wx-cameraX*.75;if(x< -130||x>canvas.width+130)continue;const alto=115+(i*43)%105;ctx.fillStyle="#17192b";ctx.fillRect(x,h-alto,15,alto);ctx.beginPath();ctx.moveTo(x-40,h-alto+65);ctx.lineTo(x+8,h-alto-55);ctx.lineTo(x+58,h-alto+65);ctx.closePath();ctx.fill();}

  // Chão contínuo da fase

  ctx.fillStyle="#2e2942";ctx.fillRect(0,h,canvas.width,canvas.height-h);

  ctx.fillStyle="#76618a";ctx.fillRect(0,h,canvas.width,12);

  for(let x=-(cameraX%70);x<canvas.width;x+=70){ctx.fillStyle="#453b53";ctx.fillRect(x,h+18,32,8);}

  // Plataformas suspensas

  for(const p of plataformas){const x=p.x-cameraX,y=h-p.y;if(x+p.w<0||x>canvas.width)continue;ctx.fillStyle="#4e405d";ctx.fillRect(x,y,p.w,19);ctx.fillStyle="#8d789f";ctx.fillRect(x,y,p.w,7);ctx.fillStyle="#292239";ctx.fillRect(x+8,y+19,p.w-16,8);}

  // Espinhos: obstáculos que causam dano, mas não encerram a fase imediatamente

  for(const a of espinhos){const x=a.x-cameraX;for(let j=0;j<a.w;j+=17){ctx.fillStyle="#a58cbd";ctx.beginPath();ctx.moveTo(x+j,h+4);ctx.lineTo(x+j+8,h-23);ctx.lineTo(x+j+17,h+4);ctx.fill();}}

  // Portal e limite da arena

  const portaX=INICIO_ARENA-cameraX;ctx.fillStyle=inimigos.every(e=>!e.vivo)?"#9e68d7":"#74334f";ctx.fillRect(portaX,h-180,12,180);ctx.fillStyle="#d9b7ff";ctx.fillRect(portaX-14,h-185,40,10);

  if(portaX>-100&&portaX<canvas.width+100){ctx.font="bold 15px Arial";ctx.fillStyle="white";ctx.fillText("ARENA DO GUARDIÃO",portaX-78,h-205);}

  // Vaga-lumes e neblina suave

  for(const v of vagaLumes){const x=v.x-cameraX;if(x<0||x>canvas.width)continue;ctx.globalAlpha=.25+.5*(.5+.5*Math.sin(t*2+v.offset));ctx.fillStyle="#d8c0ff";ctx.fillRect(x,v.y+Math.sin(t+v.offset)*7,3,3);}ctx.globalAlpha=1;

  for(let i=0;i<3;i++){const y=h-65-i*47+Math.sin(t*.6+i)*12;const fog=ctx.createLinearGradient(0,y-35,0,y+35);fog.addColorStop(0,"#b89bc000");fog.addColorStop(.5,"#b89bc018");fog.addColorStop(1,"#b89bc000");ctx.fillStyle=fog;ctx.fillRect(0,y-35,canvas.width,70);}

  // Pedras, cogumelos e cristais para dar profundidade à floresta.
  for(let i=0;i<105;i++){
    const wx=85+i*59, x=wx-cameraX;
    if(x < -40 || x > canvas.width+40)continue;
    if(i%3===0){
      ctx.fillStyle="#473d59";ctx.beginPath();ctx.ellipse(x,h-3,15,8,0,Math.PI,Math.PI*2);ctx.fill();
    }else if(i%3===1){
      ctx.fillStyle="#9b57d8";ctx.fillRect(x,h-16,4,16);
      ctx.fillStyle="#d5a7ff";ctx.beginPath();ctx.arc(x+2,h-18,10,Math.PI,Math.PI*2);ctx.fill();
    }else{
      ctx.fillStyle="#64d2bd";ctx.beginPath();ctx.moveTo(x,h);ctx.lineTo(x+8,h-24);ctx.lineTo(x+15,h);ctx.fill();
    }
  }

}

// Os 14 inimigos alternam entre as três espécies, sem mudar combate ou vida.
function desenharInimigos(tempo) {
  const tipos = ["slime_sombrio", "slime_arcano", "slime_corrompido"];
  for (let i = 0; i < inimigos.length; i++) {
    const e = inimigos[i];
    if (!e.vivo) continue;
    const x = e.x - cameraX;
    if (x < -100 || x > canvas.width + 100) continue;
    const tipo = tipos[i % tipos.length];
    const movimento = Math.floor(tempo / 200 + i) % 2 ? "andando1" : "andando2";
    const img = spritesMonstros[tipo][movimento];
    const fallback = spritesMonstros[tipo].parado;
    if (!desenharSpriteMonstro(imagemMonstroPronta(img) ? img : fallback,
        x, e.y, e.largura, e.altura, e.direcao)) {
      ctx.fillStyle = ["#824bd0", "#43adff", "#c24a55"][i % 3];
      ctx.beginPath();
      ctx.ellipse(x + e.largura / 2, e.y + e.altura / 2,
        e.largura / 2, e.altura / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#160e2a";
    ctx.fillRect(x, e.y - 23, e.largura, 10);
    ctx.fillStyle = ["#d86dff", "#57baff", "#ff807b"][i % 3];
    ctx.fillRect(x, e.y - 23, e.largura * Math.max(0, e.vida / e.vidaMaxima), 10);
  }
}

// Sprites exclusivos por classe, já separados em pastas.
// Caminho: M-GATO/assets/leaf-chase/<classe>/<movimento>.png
const pastaSpritesClasses = "../assets/leaf-chase/";
const movimentosLeaf = ["parado", "andando1", "andando2", "pulando"];
const spritesClasses = {};
for (const nomeClasse of Object.keys(classes)) {
  spritesClasses[nomeClasse] = {};
  for (const movimento of movimentosLeaf) {
    const img = new Image();
    img.src = `${pastaSpritesClasses}${nomeClasse}/${movimento}.png`;
    img.onerror = () => console.warn("Sprite não encontrado:", img.src);
    spritesClasses[nomeClasse][movimento] = img;
  }
}

function spriteCarregado(img) {
  return !!img && img.complete && img.naturalWidth > 0;
}

function desenharLeaf(){
  if (leaf.invulneravel > 0 && Math.floor(leaf.invulneravel / 100) % 2 === 0) return;

  const movimento = !leaf.noChao ? "pulando" : leaf.andando
    ? (Math.floor(leaf.tempoAnimacao / 130) % 2 ? "andando2" : "andando1")
    : "parado";

  // Fallback para o sprite parado da classe ou os sprites antigos.
  let sprite = spritesClasses[chaveClasse]?.[movimento];
  if (!spriteCarregado(sprite)) sprite = spritesClasses[chaveClasse]?.parado;
  if (!spriteCarregado(sprite)) sprite = sprites[movimento];
  if (!spriteCarregado(sprite)) sprite = sprites.parado;

  const x = leaf.x - cameraX;
  if (spriteCarregado(sprite)) {
    ctx.save();
    ctx.translate(x + leaf.largura / 2, leaf.y);
    ctx.scale(leaf.direcao, 1);
    ctx.drawImage(sprite, -leaf.largura / 2, 0, leaf.largura, leaf.altura);
    ctx.restore();
  } else {
    ctx.fillStyle = "#e4b6fa";
    ctx.fillRect(x + 35, leaf.y + 25, 75, 110);
  }

  // Os sprites já incluem roupa e arma: não desenhar roupas por cima.
  if (leaf.atacando && efeitoEspecial <= 0) desenharAtaque();
}

function desenharAtaque(){

  if(chaveClasse==="mago"||chaveClasse==="arqueiro")return;

  const c=classeAtual();

  const alcance=chaveClasse==="lutador"?110:90;

  const area=caixaGolpe(alcance);

  ctx.save();

  ctx.strokeStyle=c.cor;

  ctx.lineWidth=7+golpeAtual*2;

  ctx.shadowBlur=18;ctx.shadowColor=c.cor;

  ctx.beginPath();

  const x=leaf.direcao===1?area.x-cameraX:area.x+area.largura-cameraX;

  if(chaveClasse==="lutador"){

    const offset=(golpeAtual-1)*18;

    ctx.moveTo(x,area.y+30+offset);

    ctx.lineTo(x+leaf.direcao*48,area.y+60+offset);

    ctx.moveTo(x,area.y+55+offset);

    ctx.lineTo(x+leaf.direcao*48,area.y+85+offset);

  }else{

    ctx.arc(x,area.y+52,42,leaf.direcao===1?-Math.PI/2:Math.PI/2,leaf.direcao===1?Math.PI/2:Math.PI*1.5);

  }

  ctx.stroke();ctx.restore();

}

function desenharEspecial(){

  if(efeitoEspecial<=0)return;

  const c=classeAtual();

  ctx.save();

  ctx.globalAlpha=efeitoEspecial/450;

  ctx.translate(leaf.x-cameraX+leaf.largura/2,leaf.y+leaf.altura/2);

  ctx.scale(leaf.direcao,1);

  ctx.strokeStyle=c.cor;

  ctx.lineWidth=chaveClasse==="lutador"?8:14;

  ctx.shadowColor=c.cor;ctx.shadowBlur=30;

  if(chaveClasse==="lutador"){

    for(let i=0;i<4;i++){

      ctx.beginPath();ctx.moveTo(10+i*17,-60);ctx.lineTo(100+i*7,65);ctx.stroke();

    }

  }else{

    ctx.beginPath();ctx.ellipse(c.alcance/2,0,c.alcance/2,75,0,-Math.PI/2,Math.PI/2);ctx.stroke();

    ctx.strokeStyle="#fff";ctx.lineWidth=4;ctx.stroke();

  }

  ctx.restore();

}

function atualizarHUD(){const c=classeAtual();$("barraVida").style.width=(leaf.vida/c.vidaMaxima*100)+"%";$("barraMana").style.width=(leaf.mana/c.manaMaxima*100)+"%";$("barraExp").style.width=(leaf.experiencia/leaf.experienciaNecessaria*100)+"%";$("textoVida").textContent=`${Math.ceil(leaf.vida)}/${c.vidaMaxima}`;$("textoMana").textContent=`${Math.floor(leaf.mana)}/${c.manaMaxima}`;$("textoExp").textContent=`${leaf.experiencia}/${leaf.experienciaNecessaria}`;$("classeInfo").textContent=`${c.icone} ${c.nome} | Nível ${leaf.nivel}`;}

function desenharInformacoes(){ctx.save();ctx.fillStyle="rgba(10,5,25,.75)";ctx.fillRect(15,150,225,75);ctx.fillStyle="white";ctx.font="bold 15px Arial";ctx.fillText(`⭐ Nível: ${leaf.nivel}  •  Fase: 1 — Floresta`,25,177);ctx.fillText(`✨ EXP: ${leaf.experiencia}/${leaf.experienciaNecessaria}`,25,204);ctx.restore();}

function renderizarClasses(){const lista=$("listaClasses");lista.innerHTML="";for(const [chave,c] of Object.entries(classes)){const liberada=leaf.nivel>=c.nivel,ativa=chave===chaveClasse;const card=document.createElement("article");card.className="cartaoClasse"+(ativa?" ativa":"");const titulo=document.createElement("h3");titulo.textContent=`${c.icone} ${c.nome}`;card.appendChild(titulo);const info=document.createElement("p");info.textContent=`❤️ ${c.vidaMaxima} | 🔵 ${c.manaMaxima} | ⚡ Velocidade ${c.velocidade}`;card.appendChild(info);const especial=document.createElement("p");especial.textContent=`✨ ${c.nomeEspecial} — ${c.danoEspecial} de dano`;card.appendChild(especial);const botao=document.createElement("button");botao.textContent=ativa?"✓ Classe atual":liberada?"Selecionar":`🔒 Libera no nível ${c.nivel}`;botao.disabled=ativa||!liberada;botao.addEventListener("click",()=>selecionarClasse(chave));card.appendChild(botao);lista.appendChild(card);}}

function abrirClasses(){if(jogoEncerrado)return;menuAberto=true;controles.esquerda=controles.direita=controles.pular=false;renderizarClasses();$("painelClasses").classList.remove("escondido");}

function fecharClasses(){menuAberto=false;$("painelClasses").classList.add("escondido");}

function selecionarClasse(chave){const nova=classes[chave];if(!nova||leaf.nivel<nova.nivel)return;const antiga=classeAtual();const proporcaoVida=leaf.vida/antiga.vidaMaxima,proporcaoMana=leaf.mana/antiga.manaMaxima;chaveClasse=chave;leaf.vida=Math.max(1,Math.round(nova.vidaMaxima*proporcaoVida));leaf.mana=Math.min(nova.manaMaxima,Math.round(nova.manaMaxima*proporcaoMana));leaf.atacando=false;efeitoEspecial=0;recargaEspecial=0;projeteis.length=0;golpeAtual=0;ultimoGolpe=-Infinity;fecharClasses();avisar(`${nova.icone} Classe ${nova.nome} selecionada!`,2000);}

$("abrirClasses").addEventListener("click",abrirClasses);$("fecharClasses").addEventListener("click",fecharClasses);

function reiniciarJogo(){jogoEncerrado=false;menuAberto=false;chaveClasse="guerreiro";Object.assign(leaf,{x:100,y:alturaChao()-leaf.altura,velocidadeY:0,noChao:true,direcao:1,andando:false,vida:100,mana:50,nivel:1,experiencia:0,experienciaNecessaria:50,atacando:false,tempoAtaque:0,tempoAnimacao:0,invulneravel:0});cameraX=0;chefe.vivo=false;chefeAtivado=false;faseConcluida=false;bolasSombrias.length=0;golpeAtual=0;ultimoGolpe=-Infinity;efeitoEspecial=0;recargaEspecial=0;particulas.length=0;projeteis.length=0;efeitoCorpo=0;controles.esquerda=controles.direita=controles.pular=false;inimigos.forEach((e,i)=>{e.x=e.xInicial;e.y=alturaChao()-e.altura;e.vidaMaxima=60+i*10;e.vida=e.vidaMaxima;e.vivo=true;});$("painelVitoria").classList.add("escondido");$("painelFim").classList.add("escondido");$("painelClasses").classList.add("escondido");avisar("⚔️ Boa sorte, Leaf!",1600);}

$("reiniciarChase").addEventListener("click",reiniciarJogo);

$("jogarNovamente").addEventListener("click",reiniciarJogo);

window.addEventListener("keydown",e=>{const k=e.code;if(["ArrowLeft","ArrowRight","ArrowUp","Space"].includes(k))e.preventDefault();if(k==="KeyC"&&!e.repeat){menuAberto?fecharClasses():abrirClasses();return;}if(menuAberto)return;if(k==="ArrowLeft"||k==="KeyA")controles.esquerda=true;if(k==="ArrowRight"||k==="KeyD")controles.direita=true;if(k==="ArrowUp"||k==="KeyW"||k==="Space")controles.pular=true;if(k==="KeyZ"&&!e.repeat)atacar();if(k==="KeyX"&&!e.repeat)usarEspecial();});

window.addEventListener("keyup",e=>{const k=e.code;if(k==="ArrowLeft"||k==="KeyA")controles.esquerda=false;if(k==="ArrowRight"||k==="KeyD")controles.direita=false;if(k==="ArrowUp"||k==="KeyW"||k==="Space")controles.pular=false;});

window.addEventListener("blur",()=>{controles.esquerda=controles.direita=controles.pular=false;});

function configurarBotao(id,acao){const b=$(id);b.addEventListener("pointerdown",e=>{e.preventDefault();if(acao==="atacar")return atacar();if(acao==="especial")return usarEspecial();controles[acao]=true;b.setPointerCapture(e.pointerId);});const soltar=()=>{if(acao in controles)controles[acao]=false;};b.addEventListener("pointerup",soltar);b.addEventListener("pointercancel",soltar);b.addEventListener("lostpointercapture",soltar);}

["esquerda","direita","pular","atacar","especial"].forEach(id=>configurarBotao(id,id));

function atualizar(tempo){const dt=Math.min(tempo-ultimoTempo||16.67,33);ultimoTempo=tempo;if(!menuAberto){atualizarLeaf(dt);atualizarInimigos(dt);atualizarChefe(dt);atualizarProjeteis(dt);atualizarParticulas(dt);if(tempoAviso>0){tempoAviso-=dt;if(tempoAviso<=0)$("aviso").textContent="";}}ctx.clearRect(0,0,canvas.width,canvas.height);desenharCenario(tempo);desenharInimigos(tempo);desenharChefe(tempo);desenharLeaf();desenharEspecial();desenharProjeteis();desenharParticulas();desenharInformacoes();atualizarHUD();requestAnimationFrame(atualizar);}

requestAnimationFrame(atualizar);
