/* ===== Ficha do Filhote: dados da aba "Ficha Paxtu" (atualizada todo dia pelo projeto do painel do adulto) ===== */
function getFichas_() {
  if (!SpreadsheetApp.getActive().getSheetByName('Ficha Paxtu')) return [];
  return linhas_('Ficha Paxtu').map(function (f) {
    return { cod: String(f['Registro escoteiro']), nome: f['Nome'], ninhada: f['Ninhada'], entrada: dt_(f['Data de entrada']),
      sangue: f['Tipo sanguíneo'], alergias: f['Alergias'], condicoes: f['Condições de saúde'], acomp: f['Acompanhamento médico'],
      meds: f['Medicamentos'], cuidados: f['Cuidados no dia a dia'], restricao: f['Restrição alimentar'], plano: f['Plano de saúde'],
      atualizado: dt_(f['Atualizado em']) };
  });
}
