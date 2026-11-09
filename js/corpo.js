// Mapa muscular em SVG, desenhado em planos (frente e costas).
// Só a metade esquerda é desenhada; a direita é o espelho.
(function () {
  "use strict";

  // m = músculo (null = só silhueta). linha = traço de separação interno.
  // Cabeça e pescoço são desenhados inteiros (sem espelho, para não ficar com emenda).
  var CABECA = '<path class="pl" d="M100 8C86 8 80 19 80 33C80 47 88 60 100 62C112 60 120 47 120 33C120 19 114 8 100 8Z"/>';
  var PESCOCO_F = '<path class="pl" d="M91 56L91 72L100 76L109 72L109 56Z"/>';
  var PESCOCO_C = '<path class="pl" d="M91 54L91 66L100 61L109 66L109 54Z"/>';

  var FRENTE = [
    { m: "trapezio", d: "M90 66L66 80L92 79Z" },
    { m: "ombro", d: "M64 82C50 82 41 92 38 108C37 117 39 124 42 129C50 125 56 115 60 105C64 96 68 88 72 84Z" },
    { m: "peito", d: "M99 84L76 84C68 92 62 104 62 118C70 128 86 132 99 128Z" },
    { m: "biceps", d: "M44 133C38 147 37 162 40 174C48 176 55 168 58 154C60 142 60 128 59 119C55 125 49 130 44 133Z" },
    { m: "antebraco", d: "M40 180C33 198 29 222 29 244L39 247C46 226 53 204 57 181C51 183 45 182 40 180Z" },
    { d: "M29 250L39 253C41 261 40 270 37 278C32 280 28 276 27 268C27 260 28 254 29 250Z" },
    { m: "abdomen", d: "M99 134L80 134C79 158 79 182 80 200C85 212 91 220 99 226Z" },
    { m: "abdomen", d: "M75 132C69 130 65 128 62 126C63 146 64 170 63 190C66 198 70 204 75 208C75 184 75 158 75 132Z" },
    { d: "M77 212L99 230L99 238Z" },
    { m: "quadriceps", d: "M75 211C64 224 59 248 59 276C59 294 61 308 64 318L93 318C95 296 97 272 97 252C97 246 96 241 95 238C88 230 81 221 75 211Z" },
    { d: "M64 322L92 322C92 330 90 338 86 344L70 344C66 338 64 330 64 322Z" },
    { m: "panturrilha", d: "M64 348C59 366 61 386 68 404L80 404C86 384 91 366 90 348Z" },
    { d: "M67 408L81 408C84 412 86 418 86 424L60 424C61 418 64 412 67 408Z" }
  ];
  var FRENTE_LINHAS = [
    "M80 158L99 157", "M80 181L99 180", "M79 232C75 258 76 290 82 316"
  ];

  var COSTAS = [
    { m: "trapezio", d: "M100 58L90 64L64 80C74 88 84 97 90 112C94 126 97 138 100 148Z" },
    { m: "ombro", d: "M64 82C50 82 41 92 38 108C37 117 39 124 42 129C50 125 56 115 60 105C64 96 68 88 72 84Z" },
    { m: "costas", d: "M67 88C63 96 62 105 65 113C73 112 80 110 87 108C83 99 76 92 67 88Z" },
    { m: "costas", d: "M65 118C65 140 70 164 78 186C84 192 90 194 96 195C96 177 94 158 92 140C90 129 89 119 88 113C80 115 72 117 65 118Z" },
    { m: "lombar", d: "M99 152L97 198L83 201L99 212Z" },
    { m: "triceps", d: "M44 133C38 147 37 162 40 174C48 176 55 168 58 154C60 142 60 128 59 119C55 125 49 130 44 133Z" },
    { m: "antebraco", d: "M40 180C33 198 29 222 29 244L39 247C46 226 53 204 57 181C51 183 45 182 40 180Z" },
    { d: "M29 250L39 253C41 261 40 270 37 278C32 280 28 276 27 268C27 260 28 254 29 250Z" },
    { m: "abdomen", d: "M63 124C64 146 65 170 65 190C68 198 73 204 79 207C72 186 66 158 63 124Z" },
    { m: "gluteo", d: "M99 216C88 207 73 207 65 219C60 232 62 248 70 256C80 262 92 260 99 254Z" },
    { m: "posterior", d: "M64 262C60 280 60 300 64 322L93 322C96 302 97 282 96 262C86 266 74 266 64 262Z" },
    { d: "M64 326L93 326L90 336L67 336Z" },
    { m: "panturrilha", d: "M64 340C56 356 58 374 66 388C72 392 82 392 88 388C96 372 96 354 90 340Z" },
    { d: "M70 392L84 392L82 410L72 410Z" },
    { d: "M68 412L84 412L86 424L64 424Z" }
  ];
  var COSTAS_LINHAS = ["M79 267L79 320", "M77 343L77 388"];

  function desenhar(partes, linhas, ativos, centro) {
    var meia = partes.map(function (p) {
      var cls = "pl", dado = "";
      if (p.m) {
        var nivel = ativos[p.m];
        cls = "mu" + (nivel === "p" ? " pri" : nivel === "a" ? " apo" : "");
        dado = ' data-m="' + p.m + '"';
      }
      return '<path class="' + cls + '"' + dado + ' d="' + p.d + '"/>';
    }).join("") + linhas.map(function (d) {
      return '<path class="ln" d="' + d + '"/>';
    }).join("");
    return centro + "<g>" + meia + '</g><g transform="matrix(-1 0 0 1 200 0)">' + meia + "</g>";
  }

  // ativos: { musculo: "p" (principal) | "a" (auxiliar) }
  window.Corpo = {
    svg: function (vista, ativos, rotulo) {
      var g = vista === "frente"
        ? desenhar(FRENTE, FRENTE_LINHAS, ativos, CABECA + PESCOCO_F)
        : desenhar(COSTAS, COSTAS_LINHAS, ativos, PESCOCO_C + CABECA);
      return '<figure class="fig"><svg viewBox="0 0 200 430" role="img" aria-label="' + rotulo + '">' +
        g + "</svg><figcaption>" + (vista === "frente" ? "frente" : "costas") + "</figcaption></figure>";
    }
  };
})();
