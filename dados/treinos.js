// Dados do treino — atualizado pelo Claude a partir dos áudios.
//
// treinos: o plano. Cada exercício tem
//   id (único), nome, series, musculos (principais) e apoio (auxiliares).
//   Os nomes de músculo são os do mapa em js/corpo.js.
//
// registros: um item por dia treinado.
//   data:   "AAAA-MM-DD"
//   treino: "A" ou "B"
//   cardio: minutos de cardio (0 se não fez)
//   cargas: opcional, { "id-do-exercicio": [{ kg: 30, reps: 10 }, ...] }
//   obs:    opcional, texto curto
window.TREINO = {
  inicio: "2026-11-10",
  atualizado: "2026-11-09",
  regra: "Todas as séries até a falha, ou até perder a forma.",

  treinos: {
    A: {
      nome: "Treino A",
      foco: "Peito, ombro, tríceps e quadríceps",
      exercicios: [
        { id: "supino-inclinado", nome: "Supino inclinado", series: 3, musculos: ["peito"], apoio: ["ombro", "triceps"] },
        { id: "elevacao-lateral", nome: "Elevação lateral", series: 3, musculos: ["ombro"], apoio: ["trapezio"] },
        { id: "triceps-polia", nome: "Tríceps na polia", series: 3, musculos: ["triceps"], apoio: [] },
        { id: "agachamento-livre", nome: "Agachamento livre", series: 2, musculos: ["quadriceps"], apoio: ["gluteo", "posterior", "lombar"] },
        { id: "cadeira-extensora", nome: "Cadeira extensora", detalhe: "Extensão de joelhos", series: 3, musculos: ["quadriceps"], apoio: [] }
      ],
      cardio: "20 a 30 min"
    },
    B: {
      nome: "Treino B",
      foco: "Costas, bíceps e posterior de coxa",
      exercicios: [
        { id: "remada-curvada", nome: "Remada curvada", series: 3, musculos: ["costas", "trapezio"], apoio: ["biceps", "lombar", "antebraco"] },
        { id: "rosca-maquina", nome: "Rosca de bíceps na máquina", series: 3, musculos: ["biceps"], apoio: ["antebraco"] },
        { id: "flexora", nome: "Mesa ou cadeira flexora", series: 3, musculos: ["posterior"], apoio: ["panturrilha"] }
      ],
      cardio: "20 min"
    }
  },

  registros: [
  ]
};
