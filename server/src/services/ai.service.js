async function recommendWithAI({ perfil, prendas }) {
  return {
    outfits: [
      {
        nombre: "Outfit recomendado 1",
        prendas: prendas.slice(0, 3).map(p => ({ id: p.Id, nombre: p.Nombre })),
        razon: `Equilibra tu tipo de cuerpo (${perfil.TipoCuerpo}) y armoniza con tu subtono (${perfil.SubTono}).`
      },
      {
        nombre: "Outfit recomendado 2",
        prendas: prendas.slice(3, 6).map(p => ({ id: p.Id, nombre: p.Nombre })),
        razon: "Versión alternativa: mismo estilo, diferente combinación para rotar outfits."
      }
    ]
  };
}

module.exports = { recommendWithAI };
