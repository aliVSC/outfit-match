function bodyTypeFromMeasures({ hombros, pecho, cintura, cadera }) {
  // Validación simple
  const vals = [hombros, pecho, cintura, cadera].map(Number);
  if (vals.some(v => !v || v <= 0)) return "desconocido";

  // Reglas basadas en proporciones (simplificadas para prototipo)
  const sh = Number(hombros);
  const ch = Number(cadera);
  const wa = Number(cintura);
  const bu = Number(pecho);

  const top = (sh + bu) / 2; // promedio parte superior
  const diffTopHip = Math.abs(top - ch) / Math.max(top, ch);

  const cinturaMarcada = wa / Math.max(top, ch) <= 0.75; // cintura notable

  // Reloj de arena: top ~ cadera y cintura marcada
  if (diffTopHip <= 0.08 && cinturaMarcada) return "reloj_arena";

  // Pera: cadera bastante mayor que top
  if (ch > top * 1.08) return "pera";

  // Triángulo invertido: top bastante mayor que cadera
  if (top > ch * 1.08) return "triangulo_invertido";

  // Manzana: cintura alta (poca definición)
  if (wa / Math.max(top, ch) > 0.80) return "manzana";

  // Rectángulo: proporciones similares y cintura poco marcada
  return "rectangulo";
}

module.exports = { bodyTypeFromMeasures };
