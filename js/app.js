(function () {
  "use strict";

  var D = window.TREINO;
  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  var MES_C = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  var SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  var SEM_C = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  var COR = { A: "var(--a)", B: "var(--b)" };

  // ---------- datas (sempre no fuso local) ----------
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function lerData(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function somaDias(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function dif(a, b) {
    return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
      Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 864e5);
  }
  function segunda(d) { return somaDias(d, -((d.getDay() + 6) % 7)); }
  function curta(d) { return SEM_C[d.getDay()] + ", " + d.getDate() + " " + MES_C[d.getMonth()]; }
  function longa(d) { return d.getDate() + " de " + MESES[d.getMonth()]; }
  function num(n, c) { return n.toLocaleString("pt-BR", { maximumFractionDigits: c == null ? 1 : c }); }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function el(id) { return document.getElementById(id); }

  // ---------- estado ----------
  var agora = new Date();
  var hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  var HOJE = iso(hoje);
  var inicio = lerData(D.inicio);
  var antesDoInicio = HOJE < D.inicio;

  var regs = (D.registros || [])
    .filter(function (r) { return r.data >= D.inicio && r.data <= HOJE; })
    .sort(function (a, b) { return a.data < b.data ? -1 : 1; });
  var porData = {};
  regs.forEach(function (r) { porData[r.data] = r; });

  var EX = {};
  ["A", "B"].forEach(function (t) {
    D.treinos[t].exercicios.forEach(function (e) { EX[e.id] = e; });
  });

  // Dias que já "fecharam": até ontem, ou até hoje se hoje já teve treino.
  var ultimoContado = porData[HOJE] ? hoje : somaDias(hoje, -1);
  var dias = Math.max(0, dif(inicio, ultimoContado) + 1);
  var nA = regs.filter(function (r) { return r.treino === "A"; }).length;
  var nB = regs.length - nA;
  var n = regs.length;
  var semTreino = Math.max(0, dias - n);
  var porSemana = dias > 0 ? n * 7 / Math.max(7, dias) : 0;
  var ultimo = regs[regs.length - 1];
  var proximo = ultimo ? (ultimo.treino === "A" ? "B" : "A") : "A";

  function quando(s) {
    var k = dif(lerData(s), hoje);
    return k === 0 ? "hoje" : k === 1 ? "ontem" : "há " + k + " dias";
  }
  function estadoDia(s) {
    if (s < D.inicio) return "fora";
    if (porData[s]) return porData[s].treino;
    if (s >= HOJE) return "futuro";
    return "vazio";
  }
  function textoDia(d) {
    var s = iso(d), r = porData[s], t = "<b>" + curta(d) + "</b>";
    if (s === HOJE) t += " · hoje";
    if (r) {
      t += "<br>" + D.treinos[r.treino].nome + (r.cardio ? " + cardio " + r.cardio + " min" : "");
    } else if (s < D.inicio) {
      t += "<br>Antes do início";
    } else if (s === D.inicio && s > HOJE) {
      t += "<br>Início do acompanhamento";
    } else if (s < HOJE) {
      t += "<br>Sem treino";
    }
    return t;
  }
  function formatarCarga(series) {
    if (!series || !series.length) return "";
    var kgs = series.map(function (x) { return x.kg; });
    var iguais = kgs.every(function (k) { return k === kgs[0]; });
    var reps = series.map(function (x) { return x.reps; }).join("/");
    return (iguais ? num(kgs[0]) : kgs.map(function (k) { return num(k); }).join("/")) + " kg · " + reps;
  }
  function ultimaCarga(id) {
    for (var i = regs.length - 1; i >= 0; i--) {
      if (regs[i].cargas && regs[i].cargas[id]) return { reg: regs[i], txt: formatarCarga(regs[i].cargas[id]) };
    }
    return null;
  }

  // ---------- topo ----------
  function topo() {
    el("hoje").textContent = SEMANA[hoje.getDay()] + ", " + longa(hoje) + " de " + hoje.getFullYear();
    var k = dif(hoje, inicio);
    el("status").textContent = antesDoInicio
      ? (k === 1 ? "O acompanhamento começa amanhã, " : "O acompanhamento começa em " + k + " dias, ") +
        SEMANA[inicio.getDay()] + ", " + longa(inicio) + "."
      : "Dia " + (dif(inicio, hoje) + 1) + " do acompanhamento, desde " + longa(inicio) + ".";
    el("regra").textContent = "Alternados, A → B → A, com descanso quando precisar. " + D.regra;
    el("rodape").textContent = "Atualizado em " + longa(lerData(D.atualizado)) + " de " + lerData(D.atualizado).getFullYear() + ".";
  }

  // ---------- resumo ----------
  function bento() {
    var t = D.treinos[proximo];
    var rodape = ultimo
      ? "Último: " + D.treinos[ultimo.treino].nome + ", " + quando(ultimo.data)
      : "Primeiro treino da rotina";
    var h = '<article class="card prox">' +
      '<div class="prox-topo">' +
      '<svg class="anel" viewBox="0 0 76 76" aria-hidden="true">' +
      '<circle cx="38" cy="38" r="35" fill="none" stroke="' + COR[proximo] + '" stroke-width="3"/>' +
      '<text x="38" y="40" text-anchor="middle" dominant-baseline="central">' + proximo + "</text></svg>" +
      '<div><p class="rotulo">Próximo treino</p><h3>' + t.nome + '</h3><p class="foco">' + t.foco + "</p></div>" +
      "</div>" +
      '<p class="prox-rodape">' + t.exercicios.length + " exercícios + cardio de " + t.cardio + " · " + rodape + "</p>" +
      "</article>";

    h += tile(n, "", "Dias treinados", "A: " + nA + " · B: " + nB);
    h += tile(semTreino, "", "Sem treinar", dias ? "de " + dias + " " + (dias === 1 ? "dia" : "dias") + " até agora" : "a partir de " + curta(inicio));
    h += tile(porSemana, "", "Treinos por semana", "média desde o início");
    el("bento").innerHTML = h;
  }
  function tile(v, unid, titulo, sub) {
    return '<article class="card tile"><p class="num">' + num(v) + (unid ? "<small>" + unid + "</small>" : "") +
      "</p><div><h3>" + titulo + "</h3><p>" + sub + "</p></div></article>";
  }

  // ---------- calendário de pontos ----------
  function legendaBasica(extra) {
    return '<li><span class="sw" style="background:var(--a)"></span>Treino A</li>' +
      '<li><span class="sw" style="background:var(--b)"></span>Treino B</li>' +
      (extra || "") +
      '<li><span class="sw" style="background:var(--vazio)"></span>Sem treino</li>';
  }
  function calendario() {
    el("leg-cal").innerHTML = legendaBasica() + '<li><span class="sw ring"></span>Hoje</li>';
    var m0 = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
    var mHoje = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    var total = Math.max(6, (mHoje.getFullYear() - m0.getFullYear()) * 12 + mHoje.getMonth() - m0.getMonth() + 2);
    var h = "";
    for (var i = 0; i < total; i++) {
      var m = new Date(m0.getFullYear(), m0.getMonth() + i, 1);
      var nDias = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
      var cont = 0, g = "";
      ["S", "T", "Q", "Q", "S", "S", "D"].forEach(function (x) { g += '<span class="sem-dia" aria-hidden="true">' + x + "</span>"; });
      for (var b = 0; b < (m.getDay() + 6) % 7; b++) g += "<span></span>";
      for (var d = 1; d <= nDias; d++) {
        var dt = new Date(m.getFullYear(), m.getMonth(), d), s = iso(dt), est = estadoDia(s);
        if (est === "A" || est === "B") cont++;
        g += '<span class="d ' + est + (s === HOJE ? " hoje" : "") + '" data-tip="' + esc(textoDia(dt)) + '"><i>' +
          (est === "A" || est === "B" ? est : "") + "</i></span>";
      }
      h += '<div class="mes" role="img" aria-label="' + MESES[m.getMonth()] + " de " + m.getFullYear() + ": " + cont +
        (cont === 1 ? " treino" : " treinos") + '"><h3>' + MESES[m.getMonth()] + " <span>" + m.getFullYear() +
        '</span></h3><div class="grade">' + g + "</div></div>";
    }
    el("meses").innerHTML = h;
  }

  // ---------- treinos A e B ----------
  function treinos() {
    var h = "";
    ["A", "B"].forEach(function (k) {
      var t = D.treinos[k];
      var linhas = t.exercicios.map(function (e) {
        var c = ultimaCarga(e.id);
        return '<tr data-ex="' + e.id + '" tabindex="0"><td><span class="nome">' + e.nome + "</span>" +
          (e.detalhe ? '<span class="det">' + e.detalhe + "</span>" : "") + "</td>" +
          '<td class="n">' + e.series + "</td>" +
          (c ? '<td class="carga" title="' + curta(lerData(c.reg.data)) + '">' + c.txt + "</td>"
             : '<td class="carga vz">—</td>') + "</tr>";
      }).join("");
      linhas += '<tr class="cardio"><td><span class="nome">Cardio</span><span class="det">no final</span></td>' +
        '<td class="n">—</td><td>' + t.cardio + "</td></tr>";

      h += '<article class="card treino t-' + k + '" data-t="' + k + '">' +
        '<div class="treino-topo"><span class="letra" style="background:' + COR[k] + '">' + k + "</span>" +
        "<div><h3>" + t.nome + "</h3><p>" + t.foco + "</p></div>" +
        (k === proximo ? '<span class="chip">Próximo</span>' : "") + "</div>" +
        '<div class="corpo">' + Corpo.html(t.nome + ": músculos trabalhados, de frente e de costas") + "</div>" +
        '<div class="leg-corpo"><span><i class="sw" style="background:' + COR[k] + '"></i>principal</span>' +
        '<span><i class="sw" style="background:' + COR[k] + ';opacity:.38"></i>auxiliar</span></div>' +
        '<table class="exs"><thead><tr><th>Exercício</th><th>Séries</th><th>Última carga</th></tr></thead><tbody>' +
        linhas + "</tbody></table></article>";
    });
    el("treinos").innerHTML = h;

    var est = getComputedStyle(document.documentElement);
    var HEX = { A: est.getPropertyValue("--a").trim(), B: est.getPropertyValue("--b").trim() };
    function ativosDe(lista) {
      var r = {};
      lista.forEach(function (e) { (e.apoio || []).forEach(function (m) { if (!r[m]) r[m] = "a"; }); });
      lista.forEach(function (e) { e.musculos.forEach(function (m) { r[m] = "p"; }); });
      return r;
    }
    Array.prototype.forEach.call(el("treinos").querySelectorAll(".treino"), function (card) {
      var k = card.getAttribute("data-t");
      Corpo.pintar(card.querySelector("canvas"), ativosDe(D.treinos[k].exercicios), HEX[k]);
    });

    // Passar o dedo/mouse num exercício acende só os músculos dele.
    Array.prototype.forEach.call(el("treinos").querySelectorAll("tr[data-ex]"), function (tr) {
      var card = tr.closest(".treino"), k = card.getAttribute("data-t"), e = EX[tr.getAttribute("data-ex")];
      var canvas = card.querySelector("canvas");
      function on() { Corpo.pintar(canvas, ativosDe([e]), HEX[k]); }
      function off() { Corpo.pintar(canvas, ativosDe(D.treinos[k].exercicios), HEX[k]); }
      tr.addEventListener("pointerenter", on);
      tr.addEventListener("pointerleave", off);
      tr.addEventListener("focus", on);
      tr.addEventListener("blur", off);
    });
  }

  // ---------- período inteiro ----------
  function periodo() {
    var h = '<div class="per-topo"><h2>Desde ' + longa(inicio) + "</h2>";
    if (!dias) {
      el("periodo").innerHTML = h + "</div>" + '<div class="barra" aria-hidden="true"></div>' +
        '<p class="vazio-msg">O período começa ' + (antesDoInicio ? "em " + longa(inicio) : "hoje") +
        ". A barra mostra a proporção de dias com e sem treino.</p>";
      return;
    }
    h += '<div class="per-nums"><span><b>' + n + "</b>treinados</span><span><b>" + semTreino +
      "</b>sem treinar</span><span><b>" + num(n / dias * 100, 0) + "%</b>dos dias</span></div></div>";
    var segs = [["sA", nA, "Treino A"], ["sB", nB, "Treino B"], ["sV", semTreino, "Sem treino"]]
      .filter(function (s) { return s[1] > 0; })
      .map(function (s) {
        return '<span class="' + s[0] + '" style="flex:' + s[1] + '" data-tip="<b>' + s[2] + "</b><br>" + s[1] +
          (s[1] === 1 ? " dia" : " dias") + " · " + num(s[1] / dias * 100, 0) + '%"></span>';
      }).join("");
    el("periodo").innerHTML = h + '<div class="barra" role="img" aria-label="' + nA + " dias de treino A, " + nB +
      " de treino B e " + semTreino + ' sem treino">' + segs + "</div>" +
      '<ul class="legenda per-leg">' +
      '<li><span class="sw" style="background:var(--a)"></span>Treino A · ' + nA + "</li>" +
      '<li><span class="sw" style="background:var(--b)"></span>Treino B · ' + nB + "</li>" +
      '<li><span class="sw" style="background:var(--vazio)"></span>Sem treino · ' + semTreino + "</li></ul>";
  }

  // ---------- mês em anel ----------
  var mesMin = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
  var mesMax = antesDoInicio ? mesMin : new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  var mesSel = mesMax;

  function ponto(r, a) {
    var rad = a * Math.PI / 180;
    return (r * Math.cos(rad)).toFixed(2) + " " + (r * Math.sin(rad)).toFixed(2);
  }
  function setor(r0, r1, a0, a1) {
    return "M" + ponto(r1, a0) + "A" + r1 + " " + r1 + " 0 0 1 " + ponto(r1, a1) +
      "L" + ponto(r0, a1) + "A" + r0 + " " + r0 + " 0 0 0 " + ponto(r0, a0) + "Z";
  }
  function corBase(s) {
    if (s < D.inicio) return "var(--fora)";
    if (s >= HOJE) return "var(--futuro)";
    return "var(--vazio)";
  }
  function mes() {
    var ano = mesSel.getFullYear(), m = mesSel.getMonth();
    var nDias = new Date(ano, m + 1, 0).getDate(), passo = 360 / nDias;
    var segs = "", nums = "", destaque = "", cont = 0, contC = 0;
    for (var d = 1; d <= nDias; d++) {
      var dt = new Date(ano, m, d), s = iso(dt), r = porData[s];
      var a0 = -90 + (d - 1) * passo, a1 = a0 + passo, meio = a0 + passo / 2;
      var tip = esc(textoDia(dt));
      if (r) cont++;
      if (r && r.cardio) contC++;
      segs += '<path class="seg" d="' + setor(106, 134, a0, a1) + '" fill="' + (r ? COR[r.treino] : corBase(s)) + '" data-tip="' + tip + '"/>';
      segs += '<path class="seg" d="' + setor(82, 104, a0, a1) + '" fill="' + (r && r.cardio ? "var(--cardio)" : corBase(s)) + '" data-tip="' + tip + '"/>';
      nums += '<text class="num' + (s === HOJE ? " h" : "") + '" x="' + (149 * Math.cos(meio * Math.PI / 180)).toFixed(1) +
        '" y="' + (149 * Math.sin(meio * Math.PI / 180)).toFixed(1) + '">' + d + "</text>";
      if (s === HOJE) destaque = '<path class="hl" d="' + setor(81, 135, a0 + 0.6, a1 - 0.6) + '" pointer-events="none"/>';
    }
    var nomeMes = MESES[m];
    var h = '<div class="card-topo"><h2>Mês</h2><div class="mes-nav">' +
      '<button type="button" data-d="-1" aria-label="Mês anterior"' + (mesSel <= mesMin ? " disabled" : "") + ">‹</button>" +
      "<span>" + nomeMes + " " + ano + "</span>" +
      '<button type="button" data-d="1" aria-label="Próximo mês"' + (mesSel >= mesMax ? " disabled" : "") + ">›</button></div></div>" +
      '<svg class="radial" viewBox="-166 -166 332 332" role="img" aria-label="' + nomeMes + ": " + cont + " treinos, cardio em " + contC + ' dias">' +
      segs + destaque + nums +
      '<text class="c1" x="0" y="8">' + cont + "</text>" +
      '<text class="c2" x="0" y="32">' + (cont === 1 ? "treino" : "treinos") + " em " + nomeMes + "</text>" +
      '<text class="c2" x="0" y="50">cardio em ' + contC + (contC === 1 ? " dia" : " dias") + "</text>" +
      "</svg>" +
      '<ul class="legenda mes-leg">' + legendaBasica('<li><span class="sw" style="background:var(--cardio)"></span>Cardio (anel de dentro)</li>') + "</ul>";
    el("mes").innerHTML = h;
    Array.prototype.forEach.call(el("mes").querySelectorAll(".mes-nav button"), function (b) {
      b.addEventListener("click", function () {
        mesSel = new Date(mesSel.getFullYear(), mesSel.getMonth() + (+b.getAttribute("data-d")), 1);
        mes();
      });
    });
  }

  // ---------- por semana ----------
  function semanas() {
    var QTD = 12;
    var w0 = segunda(inicio), wHoje = segunda(antesDoInicio ? inicio : hoje);
    var decorridas = dif(w0, wHoje) / 7 + 1;
    var primeira = decorridas <= QTD ? w0 : somaDias(wHoje, -7 * (QTD - 1));
    var lista = [], maior = 0;
    for (var i = 0; i < QTD; i++) {
      var ini = somaDias(primeira, 7 * i), fim = somaDias(ini, 6), a = 0, b = 0;
      regs.forEach(function (r) {
        if (r.data >= iso(ini) && r.data <= iso(fim)) { if (r.treino === "A") a++; else b++; }
      });
      maior = Math.max(maior, a + b);
      lista.push({ ini: ini, fim: fim, a: a, b: b, atual: iso(ini) === iso(wHoje), futura: ini > wHoje });
    }
    var ymax = Math.max(4, maior);
    if (ymax > 4) ymax = Math.ceil(ymax / 2) * 2;
    var passo = ymax <= 4 ? 1 : 2, ticks = [];
    for (var t = 0; t <= ymax; t += passo) ticks.push(t);

    var cols = "repeat(" + QTD + ", minmax(0, 1fr))";
    var grade = ticks.slice(1).map(function (t) {
      return '<span class="grid-y" style="bottom:' + (t / ymax * 100) + '%"></span>';
    }).join("");
    var barras = lista.map(function (w) {
      var tot = w.a + w.b;
      var faixa = w.ini.getDate() + (w.ini.getMonth() !== w.fim.getMonth() ? " " + MES_C[w.ini.getMonth()] : "") +
        " a " + w.fim.getDate() + " " + MES_C[w.fim.getMonth()];
      var tip = "<b>Semana de " + faixa + "</b><br>" + (w.futura ? "Ainda não chegou"
        : tot + (tot === 1 ? " treino" : " treinos") + (tot ? " (A " + w.a + " · B " + w.b + ")" : ""));
      return '<div class="col' + (w.atual ? " atual" : "") + '" data-tip="' + esc(tip) + '">' +
        (w.b ? '<span class="seg B" style="height:calc(' + (w.b / ymax * 100) + '% - 2px)"></span>' : "") +
        (w.a ? '<span class="seg A" style="height:calc(' + (w.a / ymax * 100) + '% - 2px)"></span>' : "") + "</div>";
    }).join("");
    var eixoY = ticks.map(function (t) { return '<span style="bottom:' + (t / ymax * 100) + '%">' + t + "</span>"; }).join("");
    var eixoX = lista.map(function (w) {
      return '<span class="' + (w.atual ? "atual" : "") + '">' + w.ini.getDate() + "/" + (w.ini.getMonth() + 1) + "</span>";
    }).join("");

    el("semanas").innerHTML = '<div class="card-topo"><h2>Treinos por semana</h2><ul class="legenda">' +
      '<li><span class="sw" style="background:var(--a)"></span>Treino A</li>' +
      '<li><span class="sw" style="background:var(--b)"></span>Treino B</li></ul></div>' +
      '<div class="sem-graf"><div class="eixo-y" aria-hidden="true">' + eixoY + "</div>" +
      '<div class="plot" style="grid-template-columns:' + cols + '">' + grade + barras + "</div>" +
      '<div class="eixo-x" style="grid-template-columns:' + cols + '" aria-hidden="true">' + eixoX + "</div></div>" +
      '<p class="vazio-msg">' + (n ? "Semanas de segunda a domingo; o rótulo é a segunda-feira." :
        "Ainda sem treinos registrados. Semanas de segunda a domingo.") + "</p>";
  }

  // ---------- histórico (tabela com todos os dados) ----------
  function historico() {
    if (!regs.length) {
      el("historico").innerHTML = '<p class="hist-vazio">Nenhum treino registrado ainda. Cada treino aparece aqui com data, cardio e cargas.</p>';
      return;
    }
    var linhas = regs.slice().reverse().map(function (r) {
      var dt = lerData(r.data), det = "";
      Object.keys(r.cargas || {}).forEach(function (id) {
        det += "<div>" + esc(EX[id] ? EX[id].nome : id) + ": " + esc(formatarCarga(r.cargas[id])) + "</div>";
      });
      if (r.obs) det += '<div class="obs">' + esc(r.obs) + "</div>";
      return '<tr><td class="dt">' + pad(dt.getDate()) + "/" + pad(dt.getMonth() + 1) + "<small>" + SEMANA[dt.getDay()] + "</small></td>" +
        '<td><span class="tag"><span class="sw" style="background:' + COR[r.treino] + '"></span>' + D.treinos[r.treino].nome + "</span></td>" +
        "<td>" + (r.cardio ? r.cardio + " min" : "—") + "</td>" +
        '<td class="det">' + (det || "—") + "</td></tr>";
    }).join("");
    el("historico").innerHTML = '<table class="hist"><thead><tr><th>Data</th><th>Treino</th><th>Cardio</th><th>Detalhes</th></tr></thead><tbody>' +
      linhas + "</tbody></table>";
  }

  // ---------- tooltip ----------
  function tooltip() {
    var tip = el("tip");
    function pos(x, y) {
      var w = tip.offsetWidth, h = tip.offsetHeight;
      var left = x + 14, top = y + 16;
      if (left + w > window.innerWidth - 8) left = x - w - 14;
      if (top + h > window.innerHeight - 8) top = y - h - 12;
      tip.style.left = Math.max(8, left) + "px";
      tip.style.top = Math.max(8, top) + "px";
    }
    function mostrar(e) {
      var alvo = e.target.closest && e.target.closest("[data-tip]");
      if (!alvo) { tip.hidden = true; return; }
      tip.innerHTML = alvo.getAttribute("data-tip");
      tip.hidden = false;
      pos(e.clientX, e.clientY);
    }
    document.addEventListener("pointerover", mostrar);
    document.addEventListener("pointerdown", mostrar);
    document.addEventListener("pointermove", function (e) { if (!tip.hidden) pos(e.clientX, e.clientY); });
    window.addEventListener("scroll", function () { tip.hidden = true; }, { passive: true });
  }

  topo();
  bento();
  calendario();
  treinos();
  periodo();
  mes();
  semanas();
  historico();
  tooltip();
})();
