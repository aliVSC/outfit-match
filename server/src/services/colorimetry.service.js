function recommendedPalette({ subTono }) {
  const s = (subTono || "").toLowerCase();

  if (s === "calido") {
    return {
      base: ["beige", "camel", "marrón", "marfil"],
      fuertes: ["mostaza", "terracota", "verde oliva", "rojo ladrillo"],
      evita: ["plateado muy frío", "fucsia azulado"]
    };
  }

  if (s === "frio") {
    return {
      base: ["negro", "gris", "blanco puro", "azul marino"],
      fuertes: ["vino", "azul rey", "esmeralda", "morado"],
      evita: ["naranja muy intenso", "mostaza fuerte"]
    };
  }

  return {
    base: ["blanco hueso", "gris medio", "azul denim", "taupe"],
    fuertes: ["verde bosque", "rosa palo", "azul petróleo"],
    evita: ["neones extremos"]
  };
}

module.exports = { recommendedPalette };
