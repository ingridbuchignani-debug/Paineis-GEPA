/* ===== Fichas de atividade e Banco de atividades =====
   Abas "Fichas" (uma ficha por data de atividade) e "Banco de atividades" (Nacional e do grupo, importadas do Drive
   pela rotina importarFichasNinhada). */

function getFichasAtiv_() {
  if (!SpreadsheetApp.getActive().getSheetByName('Fichas')) return [];
  return linhas_('Fichas').map(function (f) {
    return { linha: f._linha, iso: iso_(f['Data']), atividade: f['Atividade'], duracao: f['Duração'], local: f['Local'], participantes: f['Participantes'],
      seguranca: f['Segurança'], roteiro: f['Roteiro'], programacao: f['Programação'], passo: f['Passo a passo'], origem: f['Banco (origem)'],
      arquivo: f['Arquivo'], atualizado: dt_(f['Atualizado em']), por: f['Atualizado por'], materiais: f['Materiais'] || '' };
  });
}
function getBanco_() {
  if (!SpreadsheetApp.getActive().getSheetByName('Banco de atividades')) return [];
  return linhas_('Banco de atividades').map(function (b) {
    return { linha: b._linha, origem: b['Origem'], semana: b['Semana'], titulo: b['Título'], data: b['Data'] instanceof Date ? iso_(b['Data']) : String(b['Data'] || ''), duracao: b['Duração'], progressao: b['Progressão'], arquivo: b['Arquivo'] };
  });
}
/* Ficha completa do banco (carregada só quando abre) */
function bancoItem(linha) {
  exigir_();
  var sh = aba_('Banco de atividades'), cab = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0], v = sh.getRange(Number(linha), 1, 1, cab.length).getValues()[0], o = {};
  cab.forEach(function (c, i) { o[c] = v[i] instanceof Date ? dt_(v[i]) : String(v[i] === null ? '' : v[i]); });
  return o;
}
/* o: {iso, atividade, duracao, local, participantes, seguranca, roteiro, programacao (JSON), passo, origem} */
function salvarFicha(o) {
  var email = exigir_();
  return trava_(function () {
    var sh = aba_('Fichas'), v = sh.getDataRange().getValues(), cab = v[0], linha = 0;
    if (cab.indexOf('Materiais') < 0) { sh.getRange(1, cab.length + 1).setValue('Materiais').setFontWeight('bold'); cab.push('Materiais'); }
    for (var i = 1; i < v.length; i++) if (iso_(v[i][0]) === o.iso) { linha = i + 1; break; }
    var arq = linha ? v[linha - 1][cab.indexOf('Arquivo')] : '';
    var row = [dataDe_(o.iso), o.atividade || '', o.duracao || '', o.local || '', o.participantes || '', o.seguranca || '', o.roteiro || '',
      o.programacao || '', o.passo || '', o.origem || '', arq || '', new Date(), email, o.materiais || ''];
    if (linha) sh.getRange(linha, 1, 1, row.length).setValues([row]);
    else { sh.appendRow(row); linha = sh.getLastRow(); }
    sh.getRange(linha, 1).setNumberFormat('dd/MM/yyyy');
    registrarAcesso_(email, 'Ficha ' + o.iso);
    return 'Ficha salva.';
  });
}
