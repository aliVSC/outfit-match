function bodyTypeFromMeasures({ hombros, pecho, cintura, cadera }) {
  const vals = [hombros, pecho, cintura, cadera].map(Number);
  if (vals.some(v => !v || v <= 0)) return "desconocido";

  const sh = Number(hombros);
  const bu = Number(pecho);
  const wa = Number(cintura);
  const hi = Number(cadera);

  const top = (sh + bu) / 2;
  const diffTopHip = Math.abs(top - hi) / Math.max(top, hi);
  const cinturaMarcada = wa / Math.max(top, hi) <= 0.75;

  if (diffTopHip <= 0.08 && cinturaMarcada) return "reloj_arena";
  if (hi > top * 1.08) return "pera";
  if (top > hi * 1.08) return "triangulo_invertido";
  if (wa / Math.max(top, hi) > 0.80) return "manzana";
  return "rectangulo";
}

module.exports = { bodyTypeFromMeasures };
