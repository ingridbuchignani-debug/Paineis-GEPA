/* ===== Ninhada: base de consulta do assistente "Pergunte" do painel das Ninhadas =====
   Baixa os documentos oficiais para a pasta CONFIG.PASTA_CONSULTA_ID, cada um na sua subpasta,
   extrai o texto e grava os trechos na aba "Base de consulta" da planilha do painel.
   PDFs colocados à mão na pasta também entram. Rodar de novo sempre que a pasta mudar. */

var PASTA_CONSULTA_ID_ = CONFIG.PASTA_CONSULTA_ID;
var NOMES_SUB_CONSULTA_ = { por: '1. POR e Estatuto', can: '2. Resoluções do CAN', fil: '3. Ramo Filhotes', pe: '4. Programa Educativo e atividades', ram: '5. Outros ramos', pol: '6. Políticas nacionais' };
function subConsulta_(chave) {
  var raiz = DriveApp.getFolderById(PASTA_CONSULTA_ID_), nome = NOMES_SUB_CONSULTA_[chave], it = raiz.getFoldersByName(nome);
  return it.hasNext() ? it.next() : raiz.createFolder(nome);
}
/* A lista de documentos oficiais fica em NinhadaConsultaDocs.gs */
var CAB_CONSULTA_ = ['Documento', 'Trecho', 'Referência', 'Texto', 'Fonte oficial', 'Arquivo no Drive'];

function prepararConsultaNinhada() {
  var ini = Date.now(), tempo = function () { return (Date.now() - ini) / 1000; };
  var raiz = DriveApp.getFolderById(PASTA_CONSULTA_ID_), existentes = {}, log = [], arquivos = [];
  var cache = (function () { var it = raiz.getFoldersByName('_texto extraído'); return it.hasNext() ? it.next() : raiz.createFolder('_texto extraído'); })();
  var txts = {}; var ci = cache.getFiles(); while (ci.hasNext()) { var c0 = ci.next(); txts[c0.getName()] = c0; }
  (function varre(pasta) {
    var fi = pasta.getFiles(); while (fi.hasNext()) { var f = fi.next(); existentes[f.getName()] = 1; arquivos.push(f); }
    var su = pasta.getFolders(); while (su.hasNext()) { var s0 = su.next(); if (s0.getName() !== '_texto extraído') varre(s0); }
  })(raiz);
  DOCS_CONSULTA_.forEach(function (d) {
    var nome = d[1] + '.pdf'; if (existentes[nome] || tempo() > 150) return;
    try {
      var r = UrlFetchApp.fetch(d[2], { muteHttpExceptions: true, followRedirects: true });
      if (r.getResponseCode() !== 200) { log.push('NÃO BAIXOU (' + r.getResponseCode() + '): ' + d[1]); return; }
      var f = subConsulta_(d[0]).createFile(r.getBlob().setName(nome)); f.setDescription('Fonte oficial: ' + d[2]);
      arquivos.push(f); existentes[nome] = 1; log.push('baixado: ' + d[1]);
    } catch (e) { log.push('NÃO BAIXOU: ' + d[1] + ' (' + e.message + ')'); }
  });
  var linhas = [], pendentes = 0;
  arquivos.forEach(function (f) {
    var mt = f.getMimeType(); if (!/pdf|word|document|text\/plain/i.test(mt)) return;
    var titulo = f.getName().replace(/\.(pdf|docx?|txt)$/i, ''), fonte = String(f.getDescription() || '').replace(/^Fonte oficial:\s*/, '').split(' ')[0] || f.getUrl(), t = null;
    var chave = f.getId() + '.txt';
    if (/text\/plain/i.test(mt)) t = f.getBlob().getDataAsString('UTF-8');
    else if (txts[chave]) t = txts[chave].getBlob().getDataAsString('UTF-8');
    else if (tempo() < 300) {
      try { t = limpaTexto_(textoDoArquivo_(f)); txts[chave] = cache.createFile(chave, t, MimeType.PLAIN_TEXT); }
      catch (e) { log.push('SEM TEXTO: ' + titulo + ' (' + e.message + ')'); return; }
    } else { pendentes++; return; }
    var tr = trechosConsulta_(limpaTexto_(t));
    tr.forEach(function (c, i) { linhas.push([titulo, i + 1, c.ref, c.texto.slice(0, 45000), fonte, f.getUrl()]); });
  });
  log.push('documentos na base: ' + linhas.map(function (l) { return l[0]; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).length + (pendentes ? ', faltam extrair: ' + pendentes : ''));
  if (pendentes) log.push('rode de novo para extrair o restante');
  var ss = planNinhada_(), sh = ss.getSheetByName('Base de consulta') || ss.insertSheet('Base de consulta');
  sh.clear();
  sh.getRange(1, 1, 1, CAB_CONSULTA_.length).setValues([CAB_CONSULTA_]).setFontWeight('bold').setBackground('#E74E0F').setFontColor('#FFFFFF');
  if (linhas.length) sh.getRange(2, 1, linhas.length, CAB_CONSULTA_.length).setValues(linhas);
  sh.setFrozenRows(1);
  Logger.log(log.join('\n') + '\nTOTAL: ' + linhas.length + ' trechos');
}

/* Trechos de até ~1800 caracteres; um título de Regra, Artigo ou Capítulo abre trecho novo e vira a "Referência" */
function trechosConsulta_(t) {
  var out = [], cur = '', ref = '', refCur = '';
  String(t).split('\n').forEach(function (p) {
    p = p.trim(); if (!p) return;
    var h = p.match(/^(Regra\s+\d{2,3}|Art(?:igo)?\.?\s*\d+\s*[ºo°]?|Cap[ií]tulo\s+[\dIVXL]+|Se[çc][ãa]o\s+[\dIVXL]+)/i);
    if (h && cur.length > 300) { out.push({ ref: refCur, texto: cur }); cur = ''; }
    if (h) ref = h[1].replace(/\s+/g, ' ');
    if (!cur) refCur = ref;
    cur += (cur ? '\n' : '') + p;
    if (cur.length > 1800) { out.push({ ref: refCur, texto: cur }); cur = ''; }
  });
  if (cur) out.push({ ref: refCur, texto: cur });
  return out;
}

/* Atualização automática: todo dia às 5h a base é refeita (documento novo nas subpastas entra sozinho) */
function instalarConsultaNinhada() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'atualizarConsultaDiaria') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('atualizarConsultaDiaria').timeBased().everyDays(1).atHour(5).create();
  Logger.log('Atualização diária da base de consulta instalada (5h).');
}
function atualizarConsultaDiaria() { prepararConsultaNinhada(); }
