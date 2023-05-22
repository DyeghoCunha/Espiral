const papel = document.getElementById("papel"),
  caneta = papel.getContext("2d");

const obter = seletor => document.getElementById(seletor);

const comandos = {
  som: obter("alternar-som")
}

const cores = [];

const corInicial = [68, 209, 201]; // Cor inicial: rgba(68, 209, 201, 1)
const corFinal = [255, 255, 255]; // Cor final: branco

const passo = [
  (corFinal[0] - corInicial[0]) / 19, // R
  (corFinal[1] - corInicial[1]) / 19, // G
  (corFinal[2] - corInicial[2]) / 19  // B
];

for (let i = 0; i < 21; i++) {
  const cor = [
    Math.round(corInicial[0] + passo[0] * i),
    Math.round(corInicial[1] + passo[1] * i),
    Math.round(corInicial[2] + passo[2] * i)
  ];
  const corRgba = `rgba(${cor[0]}, ${cor[1]}, ${cor[2]}, 1)`;
  cores.push(corRgba);
}


const configuracoes = {
  horaInicio: new Date().getTime(), // Isso pode estar no futuro
  duracao: 900 / 3, // Tempo total para todos os pontos se realinharem no ponto de partida
  maxCiclos: Math.max(cores.length, 100), // Deve ser maior que o tamanho de cores, senão...
  somHabilitado: false, // O usuário ainda precisa interagir com a tela primeiro
  pulsoHabilitado: true, // O pulso só será exibido se o som também estiver habilitado
  instrument: "vibraphone" // "default" | "wave" | "vibraphone"
}

const obterNomeArquivo = index => {
  if (configuracoes.instrument === "default") return `key-${index}`;

  return `${configuracoes.instrument}-key-${index}`;
}

const obterSom = indice => `Som/${obterNomeArquivo(indice)}.wav`;


const alternarSom = (habilitado = !configuracoes.somHabilitado) => {
  configuracoes.somHabilitado = habilitado;
  comandos.som.dataset.toggled = habilitado;
}

document.onvisibilitychange = () => alternarSom(false);

papel.onclick = () => alternarSom();

let arcos = [];

const calcularVelocidade = indice => {
  const numeroCiclos = configuracoes.maxCiclos - indice,
    distanciaPorCiclo = 2 * Math.PI;

  return (numeroCiclos * distanciaPorCiclo) / configuracoes.duracao;
}

const calcularProximoTempoImpacto = (tempoImpactoAtual, velocidade) => {
  return tempoImpactoAtual + (Math.PI / velocidade) * 1000;
}

const calcularOpacidadeDinamica = (tempoAtual, ultimoTempoImpacto, opacidadeBase, opacidadeMaxima, duracao) => {
  const tempoDesdeImpacto = tempoAtual - ultimoTempoImpacto,
    porcentagem = Math.min(tempoDesdeImpacto / duracao, 1),
    deltaOpacidade = opacidadeMaxima - opacidadeBase;

  return opacidadeMaxima - (deltaOpacidade * porcentagem);
}

const determinarOpacidade = (tempoAtual, ultimoTempoImpacto, opacidadeBase, opacidadeMaxima, duracao) => {
  if (!configuracoes.pulsoHabilitado) return opacidadeBase;

  return calcularOpacidadeDinamica(tempoAtual, ultimoTempoImpacto, opacidadeBase, opacidadeMaxima, duracao);
}

const calcularPosicaoNoArco = (centro, raio, angulo) => ({
  x: centro.x + raio * Math.cos(angulo),
  y: centro.y + raio * Math.sin(angulo)
});

const tocarTecla = indice => {
  const audio = new Audio(obterSom(indice));

  audio.volume = 0.15;

  audio.play();
}

const inicializar = () => {
  arcos = cores.map((cor, indice) => {
    const velocidade = calcularVelocidade(indice),
      ultimoTempoImpacto = 0,
      proximoTempoImpacto = calcularProximoTempoImpacto(configuracoes.horaInicio, velocidade);

    return {
      cor,
      velocidade,
      ultimoTempoImpacto,
      proximoTempoImpacto
    }
  });
}

const desenharArco = (x, y, raio, inicio, fim, acao = "contorno") => {
  caneta.beginPath();

  caneta.arc(x, y, raio, inicio, fim);

  if (acao === "contorno") caneta.stroke();
  else caneta.fill();
}

const desenharPontoNoArco = (centro, raioArco, raioPonto, angulo) => {
  const posicao = calcularPosicaoNoArco(centro, raioArco, angulo);

  desenharArco(posicao.x, posicao.y, raioPonto, 0, 2 * Math.PI, "fill");
}

const desenhar = () => { // Definitivamente não está otimizado
  const tempoAtual = new Date().getTime(),
    tempoDecorrido = (tempoAtual - configuracoes.horaInicio) / 1000;

  const comprimento = Math.min(window.innerWidth, window.innerHeight) * 0.8,
    deslocamento = (window.innerWidth - comprimento) / 2;

  const inicio = {
    x: deslocamento,
    y: window.innerHeight / 2
  }

  const fim = {
    x: window.innerWidth - deslocamento,
    y: window.innerHeight / 2
  }

  const centro = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  }

  const base = {
    comprimento: fim.x - inicio.x,
    anguloMinimo: 0,
    anguloInicio: 0,
    anguloMaximo: 2 * Math.PI
  }
  const widthPX = window.innerWidth;
  const heightPX = window.innerHeight;

  document.addEventListener('DOMContentLoaded', function() {
    const widthPX = window.innerWidth;
    const heightPX = window.innerHeight;
  
    const containerExterior = document.getElementById('containerExterior');
    containerExterior.style.width = `${widthPX}px`;
    containerExterior.style.height = `${heightPX}px`;

  });

  base.raioInicial = base.comprimento * 0.1;
  base.raioCirculo = base.comprimento * 0.006;
  base.espacamento = (base.comprimento - base.raioInicial - base.raioCirculo) / 2 / cores.length;

  papel.width = papel.clientWidth;
  papel.height = papel.clientHeight;

  caneta.lineCap = "round";

  arcos.forEach((arco, indice) => {


    const raio = base.raioInicial + (base.espacamento * indice);

    caneta.globalAlpha = determinarOpacidade(tempoAtual, arco.ultimoTempoImpacto, 0.15, 0.65, 1000);
    caneta.lineWidth = base.comprimento * 0.02;
    caneta.strokeStyle = arco.cor;

    const deslocamento = base.raioCirculo * (5 / 2) / raio;

    desenharArco(centro.x, centro.y, raio, Math.PI + deslocamento, (2 * Math.PI) - deslocamento);

    desenharArco(centro.x, centro.y, raio, deslocamento, Math.PI - deslocamento);
  });

  arcos.forEach((arco, indice) => { // Desenhar pontos de impacto
    const raio = base.raioInicial + (base.espacamento * indice);

    caneta.globalAlpha = determinarOpacidade(tempoAtual, arco.ultimoTempoImpacto, 0.15, 0.85, 1000);
    caneta.fillStyle = arco.cor;

    desenharPontoNoArco(centro, raio, base.raioCirculo * 0.75, Math.PI);

    desenharPontoNoArco(centro, raio, base.raioCirculo * 0.75, 2 * Math.PI);
  });

  arcos.forEach((arco, indice) => { // Desenhar círculos em movimento
    const raio = base.raioInicial + (base.espacamento * indice);

    caneta.globalAlpha = 1;
    //caneta.fillStyle = arco.cor;
    caneta.fillStyle = cores[1];

    if (tempoAtual >= arco.proximoTempoImpacto) {
      if (configuracoes.somHabilitado) {
        tocarTecla(indice);
        arco.ultimoTempoImpacto = arco.proximoTempoImpacto;
      }

      arco.proximoTempoImpacto = calcularProximoTempoImpacto(arco.proximoTempoImpacto, arco.velocidade);
    }

    const distancia = tempoDecorrido >= 0 ? (tempoDecorrido * arco.velocidade) : 0,
      angulo = (Math.PI + distancia) % base.anguloMaximo;

    desenharPontoNoArco(centro, raio, base.raioCirculo, angulo);
  });

  requestAnimationFrame(desenhar);
}

inicializar();

desenhar();

var x = 10;
console.log(x + y);
let y = 15;