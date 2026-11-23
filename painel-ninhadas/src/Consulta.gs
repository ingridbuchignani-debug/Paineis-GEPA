/* ===== Pergunte: assistente de consulta da chefia =====
   Busca os trechos mais ligados à pergunta na aba "Base de consulta" (documentos oficiais, montada pelo projeto
   do painel do adulto) e pede ao Gemini uma resposta só com base neles, citando a fonte.
   Só a pergunta e os trechos dos documentos são enviados ao Gemini: nenhum dado dos Filhotes. */

var MODELOS_GEMINI_ = ['gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'];
var PARADAS_ = ' a o e é as os de da do das dos em no na nos nas um uma uns umas para por pra com sem que qual quais quando como onde quem se ao aos à às ou mais menos muito pode posso podemos deve devo devemos tem ter há isso esse essa este esta ser são foi era sobre entre até já não sim me te lhe nos eu você vocês ele ela eles elas meu minha nosso nossa seu sua precisa preciso '.split(' ');

function normC_(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); }
function termosC_(q) {
  var vistos = {};
  return normC_(q).split(' ').filter(function (w) { if (w.length < 3 && !/^\d+$/.test(w)) return false; if (PARADAS_.indexOf(w) >= 0 || vistos[w]) return false; vistos[w] = 1; return true; })
    .map(function (w) { return /^\d+$/.test(w) ? w : (w.length > 5 ? w.slice(0, w.length - 2) : w); });
}

function perguntarConsulta(pergunta) {
  var email = exigir_(), q = String(pergunta || '').trim();
  if (q.length < 5) throw new Error('Escreva a pergunta.');
  if (q.length > 1500) throw new Error('Pergunta muito longa: resuma em até 1500 caracteres.');
  var key = PropertiesService.getScriptProperties().getProperty('GEMINI_KEY');
  if (!key) throw new Error('A chave do Gemini ainda não foi configurada (planilha: menu Painel › Configurar chave do Gemini).');
  var sh = SpreadsheetApp.getActive().getSheetByName('Base de consulta');
  if (!sh || sh.getLastRow() < 2) throw new Error('A base de documentos ainda não foi montada.');
  var v = sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues();
  var termos = termosC_(q); if (!termos.length) throw new Error('Não entendi a pergunta. Tente com outras palavras.');
  var docs = v.map(function (r) { return ' ' + normC_(r[0] + ' ' + r[2] + ' ' + r[3]) + ' '; }), N = docs.length;
  var idf = termos.map(function (t) { var df = 0; docs.forEach(function (d) { if (d.indexOf(t) >= 0) df++; }); return Math.log((N + 1) / (df + 0.5)); });
  var sc = docs.map(function (d, i) {
    var s = 0, achou = 0;
    termos.forEach(function (t, k) { var n = d.split(t).length - 1; if (n) { achou++; s += (1 + Math.log(n)) * idf[k]; } });
    if (/regra|art/.test(normC_(q)) && v[i][2]) termos.forEach(function (t) { if (/^\d+$/.test(t) && normC_(v[i][2]).indexOf(t) >= 0) s += 8; });
    return { i: i, s: s * (achou / termos.length + 0.5) };
  }).filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 8);

  var hoje = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');
  var fontes = sc.map(function (x, n) { var r = v[x.i]; return { n: n + 1, doc: r[0], ref: r[2], fonte: r[4], arquivo: r[5], texto: r[3] }; });
  var ctx = fontes.length ? fontes.map(function (f) { return '[' + f.n + '] ' + f.doc + (f.ref ? ' (' + f.ref + ')' : '') + '\n' + f.texto; }).join('\n\n---\n\n') : '(nenhum trecho encontrado)';
  var sistema = 'Você é o assistente de consulta da chefia do Ramo Filhotes do ' + CONFIG.NOME_GRUPO + ', de ' + CONFIG.CIDADE + '. Hoje é ' + hoje + '.\n' +
    'Responda em português do Brasil, de forma direta e curta, usando SOMENTE os trechos numerados fornecidos. Cite a fonte de cada afirmação com o número entre colchetes, por exemplo [2], e diga o documento e a regra ou artigo quando estiverem no trecho.\n' +
    'Se os trechos não trouxerem a resposta, diga claramente que não encontrou isso nos documentos consultados e sugira a quem perguntar (diretoria do grupo ou Escritório Regional). Nunca invente regras, números de artigos, datas ou valores.\n' +
    'Resoluções do CAN mais recentes alteram o POR: quando houver trecho de resolução sobre o mesmo assunto, ela prevalece, e avise isso.\n' +
    'Não use emojis nem travessão (—). Escreva datas no formato dd/mm/aaaa.';
  var corpo = { systemInstruction: { parts: [{ text: sistema }] }, contents: [{ role: 'user', parts: [{ text: 'TRECHOS DOS DOCUMENTOS:\n\n' + ctx + '\n\nPERGUNTA DA CHEFIA: ' + q }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 4096 } };
  var resp = '', erroUlt = '';
  for (var k = 0; k < MODELOS_GEMINI_.length && !resp; k++) {
    var r = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + MODELOS_GEMINI_[k] + ':generateContent',
      { method: 'post', contentType: 'application/json', headers: { 'x-goog-api-key': key }, payload: JSON.stringify(corpo), muteHttpExceptions: true });
    var c = r.getResponseCode(), j = {}; try { j = JSON.parse(r.getContentText()); } catch (e) {}
    if (c === 200) resp = ((((j.candidates || [])[0] || {}).content || {}).parts || []).map(function (p) { return p.text || ''; }).join('').trim();
    else { erroUlt = c + ' ' + ((j.error || {}).message || ''); if (c === 400 || c === 401 || c === 403) break; }
  }
  if (!resp) throw new Error(/^(429|503|500)/.test(erroUlt) ? 'O Gemini está sobrecarregado agora. Tente de novo em alguns minutos.' : 'O Gemini não respondeu (' + erroUlt.slice(0, 200) + ').');
  try {
    var lg = SpreadsheetApp.getActive().getSheetByName('Perguntas') || SpreadsheetApp.getActive().insertSheet('Perguntas');
    if (lg.getLastRow() === 0) lg.appendRow(['Data', 'Quem', 'Pergunta', 'Resposta']);
    lg.appendRow([new Date(), email, q, resp.slice(0, 45000)]);
  } catch (e) {}
  return { resposta: resp, fontes: fontes.map(function (f) { return { n: f.n, doc: f.doc, ref: f.ref, fonte: f.fonte, arquivo: f.arquivo }; }) };
}

/* Menu da planilha: só a dona cola a chave; fica nas propriedades do script, nunca na planilha */
function configurarGemini() {
  soDona_();
  var ui = SpreadsheetApp.getUi(), r = ui.prompt('Chave do Gemini', 'Cole aqui a chave de API criada no Google AI Studio (aistudio.google.com):', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var k = r.getResponseText().trim(); if (!k) { ui.alert('Nenhuma chave informada.'); return; }
  PropertiesService.getScriptProperties().setProperty('GEMINI_KEY', k);
  var t = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1', { headers: { 'x-goog-api-key': k }, muteHttpExceptions: true });
  ui.alert(t.getResponseCode() === 200 ? 'Chave salva e testada. O "Pergunte" do painel já pode ser usado.' : 'Chave salva, mas o teste falhou (' + t.getResponseCode() + '). Confira se copiou a chave inteira.');
}
