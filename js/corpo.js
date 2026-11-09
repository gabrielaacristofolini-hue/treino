// Mapa muscular a partir da ilustração em img/corpo.webp (frente e costas).
// A ilustração é pintada em planos de cor chapada com contorno escuro. No navegador,
// cada músculo é encontrado preenchendo a área de cor a partir de "sementes"
// (pontos dentro dele) e a figura é repintada: cinza no tema escuro e com a cor do treino
// nos músculos trabalhados.
(function () {
  "use strict";

  // Recorte da imagem original (1125 x 2000) onde estão as duas figuras.
  var RECORTE = { x: 70, y: 340, w: 982, h: 1420 };
  var ESCALA = 0.7; // resolução de trabalho (suficiente para telas 2x)

  // Sementes em coordenadas do recorte (pixels da imagem original - 70, - 340).
  // Frente: x < 470. Costas: x > 500.
  var SEMENTES = {
    trapezio: [[130, 225], [300, 225], [700, 280], [800, 280], [750, 350], [760, 150]],
    ombro: [[85, 295], [365, 285], [610, 280], [890, 280]],
    peito: [[170, 275], [215, 320], [260, 300], [320, 290], [340, 335], [250, 345]],
    biceps: [[35, 360], [85, 395], [60, 400], [370, 380], [375, 420]],
    triceps: [[600, 360], [575, 390], [910, 350], [935, 420], [890, 410]],
    antebraco: [[45, 500], [30, 600], [85, 520], [400, 540], [372, 530], [540, 470], [530, 560], [590, 520], [910, 520], [935, 560], [900, 470]],
    // terceiro número = tolerância de cor própria (áreas com textura no desenho)
    costas: [[685, 300], [690, 340], [870, 355, 95], [850, 320], [710, 420], [850, 420, 95]],
    lombar: [[780, 520], [720, 490]],
    abdomen: [[250, 440], [300, 440], [240, 500], [300, 500], [250, 570], [300, 570], [270, 640], [180, 480], [195, 560], [660, 500], [815, 520]],
    gluteo: [[710, 680], [820, 690], [650, 700], [700, 740]],
    quadriceps: [[160, 800], [215, 850], [175, 930], [330, 760], [320, 880], [290, 950],
      [170, 760], [190, 820], [215, 880], [180, 960], [225, 800], [150, 900],
      [320, 700], [335, 800], [315, 850], [300, 930], [340, 900]],
    posterior: [[695, 880], [730, 900], [825, 900], [790, 880], [705, 960]],
    panturrilha: [[115, 1100], [215, 1120], [735, 1150], [815, 1150], [760, 1180], [840, 1130], [720, 1100]]
  };
  // Onde a ilustração não tem traço separando duas áreas parecidas, limita a altura (y mín., y máx.).
  var LIMITE = { quadriceps: [600, 1000], ombro: [200, 345] };

  var W = Math.round(RECORTE.w * ESCALA), H = Math.round(RECORTE.h * ESCALA), N = W * H;
  var base = null;      // Uint8ClampedArray RGBA da figura em cinza
  var lumi = null;      // luminância original de cada pixel (0-255)
  var musculo = null;   // Int8Array: índice do músculo de cada pixel (-1 = nenhum)
  var NOMES = Object.keys(SEMENTES);
  var pronto = null;

  function hex(c) {
    c = c.trim().replace("#", "");
    return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
  }

  function processar(img) {
    var cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    var cx = cv.getContext("2d", { willReadFrequently: true });
    cx.fillStyle = "#fff";
    cx.fillRect(0, 0, W, H);
    cx.drawImage(img, RECORTE.x, RECORTE.y, RECORTE.w, RECORTE.h, 0, 0, W, H);
    var d = cx.getImageData(0, 0, W, H).data;

    lumi = new Uint8Array(N);
    for (var i = 0; i < N; i++) lumi[i] = 0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2];

    function vizinhos(p) {
      var x = p % W, r = [];
      if (x > 0) r.push(p - 1);
      if (x < W - 1) r.push(p + 1);
      if (p >= W) r.push(p - W);
      if (p < N - W) r.push(p + W);
      return r;
    }
    function difer(a, b) {
      return Math.abs(d[a * 4] - d[b * 4]) + Math.abs(d[a * 4 + 1] - d[b * 4 + 1]) + Math.abs(d[a * 4 + 2] - d[b * 4 + 2]);
    }
    function claroNeutro(p) {
      var r = d[p * 4], g = d[p * 4 + 1], b = d[p * 4 + 2];
      return lumi[p] > 225 && Math.max(r, g, b) - Math.min(r, g, b) < 22;
    }

    // 1) Fundo: branco ligado às bordas.
    var fundo = new Uint8Array(N), pilha = [];
    for (var x = 0; x < W; x++) { pilha.push(x, N - W + x); }
    for (var y = 0; y < H; y++) { pilha.push(y * W, y * W + W - 1); }
    pilha = pilha.filter(claroNeutro);
    pilha.forEach(function (p) { fundo[p] = 1; });
    while (pilha.length) {
      var p = pilha.pop();
      vizinhos(p).forEach(function (q) {
        if (!fundo[q] && claroNeutro(q)) { fundo[q] = 1; pilha.push(q); }
      });
    }

    // 2) Músculos: cresce cada área de cor a partir das sementes, parando no contorno.
    musculo = new Int8Array(N).fill(-1);
    NOMES.forEach(function (nome, k) {
      SEMENTES[nome].forEach(function (s) {
        var sx = Math.round(s[0] * ESCALA), sy = Math.round(s[1] * ESCALA), semente = -1;
        for (var r = 0; r <= 4 && semente < 0; r++) {          // semente caiu num traço? procura ao lado
          for (var dy = -r; dy <= r && semente < 0; dy++) for (var dx = -r; dx <= r && semente < 0; dx++) {
            var q = (sy + dy) * W + sx + dx;
            if (q >= 0 && q < N && lumi[q] >= 130 && !fundo[q]) semente = q;
          }
        }
        if (semente < 0 || musculo[semente] >= 0) return;
        var r0 = d[semente * 4], g0 = d[semente * 4 + 1], b0 = d[semente * 4 + 2];
        var tol = s[2] || 55, passo = s[2] ? 45 : 30;
        var lim = LIMITE[nome] ? [LIMITE[nome][0] * ESCALA * W, LIMITE[nome][1] * ESCALA * W] : [0, N];
        var st = [semente];
        musculo[semente] = k;
        while (st.length) {
          var p = st.pop();
          vizinhos(p).forEach(function (q) {
            if (musculo[q] >= 0 || fundo[q] || lumi[q] < 120 || q < lim[0] || q > lim[1]) return;
            if (difer(p, q) > passo) return;
            if (Math.abs(d[q * 4] - r0) + Math.abs(d[q * 4 + 1] - g0) + Math.abs(d[q * 4 + 2] - b0) > tol) return;
            musculo[q] = k;
            st.push(q);
          });
        }
      });
    });
    // Engorda 1 px para cobrir a borda suavizada entre a cor e o traço.
    var copia = Int8Array.from(musculo);
    for (var p2 = 0; p2 < N; p2++) {
      if (copia[p2] >= 0 || fundo[p2] || lumi[p2] < 90) continue;
      var vz = vizinhos(p2);
      for (var j = 0; j < vz.length; j++) if (copia[vz[j]] >= 0) { musculo[p2] = copia[vz[j]]; break; }
    }

    // 3) Base em cinza: traços viram vão (cor do fundo do quadro), planos viram tons de cinza.
    var est = getComputedStyle(document.documentElement);
    var vao = hex(est.getPropertyValue("--card-2") || "#1e1e21");
    base = new Uint8ClampedArray(N * 4);
    for (var i2 = 0; i2 < N; i2++) {
      if (fundo[i2]) continue; // transparente
      var L = lumi[i2];
      var t = Math.min(1, Math.max(0, (L - 70) / 90));      // 0 = traço, 1 = plano
      var cinza = 46 + Math.max(0, L - 150) * 0.22;          // planos claros ficam um pouco mais claros
      base[i2 * 4] = vao[0] + (cinza - vao[0]) * t;
      base[i2 * 4 + 1] = vao[1] + (cinza + 1 - vao[1]) * t;
      base[i2 * 4 + 2] = vao[2] + (cinza + 5 - vao[2]) * t;
      base[i2 * 4 + 3] = 255;
    }
  }

  function carregar() {
    if (!pronto) {
      pronto = new Promise(function (ok, erro) {
        var img = new Image();
        img.onload = function () { processar(img); ok(); };
        img.onerror = erro;
        img.src = "img/corpo.webp";
      });
    }
    return pronto;
  }

  // ativos: { musculo: "p" (principal) | "a" (auxiliar) }; cor: "#rrggbb"
  function pintar(canvas, ativos, cor) {
    var c = hex(cor);
    var nivel = NOMES.map(function (n) { return ativos[n] === "p" ? 2 : ativos[n] === "a" ? 1 : 0; });
    var cx = canvas.getContext("2d");
    var out = cx.createImageData(W, H), o = out.data;
    o.set(base);
    for (var i = 0; i < N; i++) {
      var k = musculo[i];
      if (k < 0 || !nivel[k] || !o[i * 4 + 3]) continue;
      var L = lumi[i];
      var t = Math.min(1, Math.max(0, (L - 70) / 90));
      var sombra = 0.8 + Math.max(0, L - 150) / 105 * 0.28;   // mantém os planos da ilustração
      var forca = (nivel[k] === 2 ? 1 : 0.42) * t;
      for (var ch = 0; ch < 3; ch++) {
        o[i * 4 + ch] = o[i * 4 + ch] + (Math.min(255, c[ch] * sombra) - o[i * 4 + ch]) * forca;
      }
    }
    cx.putImageData(out, 0, 0);
  }

  window.Corpo = {
    largura: W,
    altura: H,
    // Cria o quadro (canvas + legendas frente/costas) e pinta quando a imagem carregar.
    html: function (rotulo) {
      return '<figure class="fig"><canvas width="' + W + '" height="' + H + '" role="img" aria-label="' + rotulo + '"></canvas>' +
        '<figcaption><span>frente</span><span>costas</span></figcaption></figure>';
    },
    pintar: function (canvas, ativos, cor) {
      return carregar().then(function () { pintar(canvas, ativos, cor); });
    }
  };
})();
