/* ===== Instalação das rotinas automáticas (menu Painel › 4) =====
   04h00: Filhotes, progressão e conquistas vindos do Paxtu
   04h30: ficha médica (saúde e alimentação) vinda do Paxtu
   05h00: base de documentos do assistente Pergunte */
function instalarRotinas() {
  soDona_();
  var alvo = { atualizarNinhadaDoPaxtu: 4, atualizarFichaNinhada: 4, atualizarConsultaDiaria: 5 };
  ScriptApp.getProjectTriggers().forEach(function (t) { if (alvo[t.getHandlerFunction()] !== undefined) ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('atualizarNinhadaDoPaxtu').timeBased().everyDays(1).atHour(4).create();
  ScriptApp.newTrigger('atualizarFichaNinhada').timeBased().everyDays(1).atHour(4).nearMinute(30).create();
  ScriptApp.newTrigger('atualizarConsultaDiaria').timeBased().everyDays(1).atHour(5).create();
  try { SpreadsheetApp.getUi().alert('Atualizações automáticas instaladas: 4h, 4h30 e 5h, todos os dias.'); } catch (e) {}
}
