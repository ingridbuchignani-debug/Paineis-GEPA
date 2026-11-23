/* Calendário inicial opcional: [data AAAA-MM-DD, título, local, tipo, taxa, observação, programação] */
var NINHADA_CAL_ = [];

/* ===== Planilha base e importação dos Filhotes do Paxtu ===== */
var NINHADA_SECOES_ = CONFIG.SECOES_PAXTU;
var NINHADA_SECAO_ID = NINHADA_SECOES_[Object.keys(NINHADA_SECOES_)[0]];

var NINHADA_ABAS_ = {
  'Filhotes': ['Registro escoteiro', 'Nome', 'Nº registro', 'Data de nascimento', 'Idade', 'Ano de ingresso', 'Validade do registro', 'Situação', 'Renovar 2027',
    'Responsável 1', 'Parentesco 1', 'Contato 1', 'E-mail 1', 'Responsável 2', 'Parentesco 2', 'Contato 2', 'E-mail 2',
    'Acolhida', 'Paco', 'Tixa', 'Lipe', 'Nina', 'Caminho Lobinho', 'Atualizado em', 'Observações', 'Ninhada', 'ID Paxtu', 'Origem'],
  'Progressão': ['Registro escoteiro', 'Nome', 'Etapa', 'Bloco', 'Código do item', 'Item', 'Data', 'Observação da chefia', 'Situação no Paxtu'],
  'Itens': ['Etapa', 'Código do bloco', 'Bloco', 'Mínimo do bloco', 'Código do item', 'Item'],
  'Presença': ['Data', 'Atividade', 'Registro escoteiro', 'Nome', 'Estado', 'Motivo', 'Lançado no Paxtu', 'Acompanhantes'],
  'Atividades': ['Data', 'Dia da semana', 'Tipo', 'Título', 'Local', 'Situação', 'Motivo do cancelamento', 'Taxa por participante', 'Autorização no Paxtu',
    'Programação', 'Situação no Paxtu', 'Chefia ausente', 'Observações'],
  'Financeiro': ['Data', 'Registro escoteiro', 'Filhote', 'Descrição', 'Tipo', 'Valor', 'Situação', 'Forma de pagamento', 'Atividade', 'Observação'],
  'Documentos': ['Registro escoteiro', 'Nome', 'Documento', 'Situação', 'Data', 'Link'],
  'Acessos': ['Data', 'Hora', 'E-mail', 'Nome', 'Ação'],
  'Chefia': ['Nome', 'E-mail', 'Liberado']
};

var NINHADA_ETAPAS_ = { 1: 'Paco', 2: 'Tixa', 3: 'Lipe', 4: 'Nina' };

var DIAS_NINHADA_ = ['Domingo', '2ª Feira', '3ª Feira', '4ª Feira', '5ª Feira', '6ª Feira', 'Sábado'];

function planNinhada_() { return SpreadsheetApp.getActive(); }

/* Rodar uma vez (menu Painel › Preparar a planilha): cria as abas, importa o calendário inicial e puxa os Filhotes do Paxtu */
function criarPlanilhaNinhada() {
  soDona_();
  var ss = planNinhada_();
  Object.keys(NINHADA_ABAS_).forEach(function (nome) {
    var sh = ss.getSheetByName(nome) || ss.insertSheet(nome);
    var cab = NINHADA_ABAS_[nome];
    sh.getRange(1, 1, 1, cab.length).setValues([cab]).setFontWeight('bold').setBackground('#00853F').setFontColor('#FFFFFF').setFontFamily('Montserrat');
    sh.setFrozenRows(1);
  });
  var p1 = ss.getSheetByName('Página1') || ss.getSheetByName('Sheet1');
  if (p1 && ss.getSheets().length > 1) ss.deleteSheet(p1);
  validacoesNinhada_(ss);
  importarCalendarioNinhada_(ss);
  atualizarNinhadaDoPaxtu();
  Logger.log('Planilha: ' + ss.getUrl());
}

function validacoesNinhada_(ss) {
  function lista(aba, col, vals) {
    var sh = ss.getSheetByName(aba);
    sh.getRange(2, col, 998, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(vals, true).setAllowInvalid(false).build());
  }
  lista('Presença', 5, ['Presente', 'Falta justificada', 'Falta']);
  lista('Presença', 7, ['Sim', 'Não']);
  lista('Atividades', 3, ['Ninhada', 'Grupo']);
  lista('Atividades', 6, ['Realizada', 'Cancelada', 'Prevista', 'Sem atividade']);
  lista('Atividades', 9, ['Sim', 'Não']);
  lista('Atividades', 11, ['Cadastrada', 'Falta cadastrar', 'Não se aplica']);
  lista('Financeiro', 5, ['Entrada', 'Saída', 'Cobrança']);
  lista('Financeiro', 7, ['Pago', 'Pendente']);
  lista('Documentos', 4, ['Entregue', 'Pendente']);
  lista('Progressão', 9, ['Lançado', 'Falta lançar']);
}

function importarCalendarioNinhada_(ss) {
  var sh = ss.getSheetByName('Atividades');
  if (sh.getLastRow() > 1) { Logger.log('Atividades já tem dados: calendário não reimportado.'); return; }
  var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  var out = NINHADA_CAL_.map(function (c) {
    var p = c[0].split('-'), d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12);
    var titulo = c[1], ramo = String(c[3]), custo = c[4], obs = c[5], aus = c[6];
    var tipo = (/todos/i.test(ramo) || /em grupo/i.test(obs)) ? 'Grupo' : 'Ninhada';
    var sit = d < hoje ? 'Realizada' : 'Prevista', motivo = '', taxa = '';
    if (/^f[ée]rias$/i.test(titulo) || /lobinho/i.test(ramo) || /NÃO TERÁ ATIVIDADE/i.test(obs)) sit = 'Sem atividade';
    if (c[0] === '2026-11-07') { sit = 'Cancelada'; motivo = 'Chefia em cursos'; }
    if (c[0] === '2026-11-14') obs = (obs ? obs + '. ' : '') + 'No Paxtu está em 11/11/2026 (4ª Feira): corrigir a data';
    if (typeof custo === 'number') taxa = custo;
    else if (/sem custo/i.test(custo)) taxa = 0;
    else if (custo && custo !== '_') obs = (obs ? obs + '. ' : '') + 'Custo: ' + custo;
    var sitPx = sit === 'Sem atividade' ? 'Não se aplica' : '';
    return [d, DIAS_NINHADA_[d.getDay()], tipo, titulo, c[2], sit, motivo, taxa, '', '', sitPx, String(aus).replace(/^Ausente\s*/i, ''), obs];
  });
  sh.getRange(2, 1, out.length, out[0].length).setValues(out);
  sh.getRange(2, 1, out.length, 1).setNumberFormat('dd/MM/yyyy');
  sh.getRange(2, 8, out.length, 1).setNumberFormat('"R$" #,##0.00');
}

/* ---- leitura do Paxtu ---- */
function pxCampoN_(html, nome) {
  var re = new RegExp('<input[^>]*name="' + nome + '"[^>]*>', 'i'), m = html.match(re);
  if (m) { var v = m[0].match(/value="([^"]*)"/); return v ? decodeHtml_(v[1]).trim() : ''; }
  var s = html.match(new RegExp('<select[^>]*name="' + nome + '"[\\s\\S]*?</select>', 'i'));
  if (s) { var o = s[0].match(/<option[^>]*selected[^>]*>([^<]*)</i); return o ? decodeHtml_(o[1]).trim() : ''; }
  return '';
}

function decodeHtml_(s) {
  return String(s).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function dataBR_(s) {
  var m = String(s || '').match(/(\d{2})\/(\d{2})\/(\d{4})/) || String(s || '').match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return m[1].length === 4 ? new Date(+m[1], +m[2] - 1, +m[3], 12) : new Date(+m[3], +m[2] - 1, +m[1], 12);
}

function idadeNinhada_(nasc, ref) {
  var a = ref.getFullYear() - nasc.getFullYear();
  if (ref.getMonth() < nasc.getMonth() || (ref.getMonth() === nasc.getMonth() && ref.getDate() < nasc.getDate())) a--;
  return a;
}

function pxAjax_(jar, tk, url, payload) {
  return req_(jar, PAXTU + url, { method: payload ? 'post' : 'get', payload: payload,
    headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': tk, 'Accept': 'application/json, text/html' } });
}

function membrosNinhada_(jar, tk, secao) {
  var det = req_(jar, PAXTU + '/se%C3%A7%C3%A3o/detalhes', { method: 'post', payload: { _token: tk, id: secao || NINHADA_SECAO_ID } }).getContentText();
  var team = (det.match(/data-team-id="?(\d+)/) || [])[1];
  if (!team) throw new Error('Equipe da Ninhada não encontrada no Paxtu.');
  var j = JSON.parse(pxAjax_(jar, tk, '/se%C3%A7%C3%A3o/equipe', { _token: tk, team_id: team }).getContentText());
  return j.members || [];
}

/* Atualiza abas Filhotes, Progressão e Itens com o que está no Paxtu (mantém observações e itens "Falta lançar") */
function atualizarNinhadaDoPaxtu() {
  var ss = planNinhada_(), jar = paxtuSessao_(), tk = pxToken_(jar), hoje = new Date(), ano = hoje.getFullYear();
  var membros = [];
  Object.keys(NINHADA_SECOES_).forEach(function (n) { membrosNinhada_(jar, tk, NINHADA_SECOES_[n]).forEach(function (x) { x._ninhada = n; membros.push(x); }); });
  var vigencias = {}; try { vigencias = pxValidades_(jar, tk); } catch (e) { Logger.log('Vigência do seguro: ' + e.message); }
  var shF = ss.getSheetByName('Filhotes'), shP = ss.getSheetByName('Progressão'), shI = ss.getSheetByName('Itens');
  var manuais = [];
  var obsF = {}; if (shF.getLastRow() > 1) shF.getRange(2, 1, shF.getLastRow() - 1, 28).getValues().forEach(function (r) { obsF[r[0]] = r[24]; if (r[27] === 'Manual') manuais.push(r); });
  var antigos = shP.getLastRow() > 1 ? shP.getRange(2, 1, shP.getLastRow() - 1, 9).getValues() : [];
  var obsP = {}, pendentes = [];
  antigos.forEach(function (r) { obsP[r[0] + '|' + r[4]] = r; if (r[8] === 'Falta lançar') pendentes.push(r); });

  var linhasF = [], linhasP = [], itens = [], catalogo = null;
  membros.forEach(function (m) {
    var cod = String(m.cd_associado), html = pxPerfil_(jar, cod, tk), chave = String(pxCampoN_(html, 'associate-register-number') || ('ID ' + cod));
    var nasc = dataBR_(pxCampoN_(html, 'birthdate')), valTxt = pxCampoN_(html, 'registry-expiration-date'), val = /^\d{4}$/.test(valTxt) ? new Date(+valTxt, 11, 31, 12) : dataBR_(valTxt);
    var reg = pxCampoN_(html, 'associate-register-number'), idade = nasc ? idadeNinhada_(nasc, hoje) : '';
    var vig = vigencias[String(reg).split('-')[0].replace(/\D/g, '')]; if (vig && vig.fim) val = vig.fim;
    var sit, renova = 'Não';
    if (nasc && idade < 5 && !reg) {
      sit = 'Abaixo da idade mínima (menor de 5 anos)';
      var cinco = new Date(nasc.getFullYear() + 5, nasc.getMonth(), nasc.getDate(), 12);
      if (cinco.getFullYear() <= ano + 1) renova = 'Sim (faz 5 anos em ' + Utilities.formatDate(cinco, 'America/Sao_Paulo', 'dd/MM/yyyy') + ')';
    } else if (!val) { sit = 'Sem validade no Paxtu'; renova = 'Conferir'; }
    else if (val < hoje) { sit = 'Vencido'; renova = 'Sim'; }
    else if (val.getFullYear() === ano) { sit = 'Vence neste ano'; renova = 'Sim'; }
    else { sit = 'Vigente'; if (val.getFullYear() === ano + 1) renova = 'Sim (vence em ' + Utilities.formatDate(val, 'America/Sao_Paulo', 'dd/MM/yyyy') + ')'; }
    var conq = {};
    (html.match(/<[^>]*data-type="achievement"[^>]*>/g) || []).forEach(function (t) {
      var id = (t.match(/data-id="(\d+)"/) || [])[1], dt = (t.match(/data-date="([^"]*)"/) || [])[1];
      if (id) conq[id] = dataBR_(dt) || '';
    });
    linhasF.push([chave, pxCampoN_(html, 'associate-name'), reg, nasc || '', idade, pxCampoN_(html, 'admission-date'), val || '', sit, renova,
      pxCampoN_(html, 'primary-responsible-name'), pxCampoN_(html, 'primary-responsible-type'), pxCampoN_(html, 'primary-responsible-cellphone'), pxCampoN_(html, 'primary-responsible-main-email'),
      pxCampoN_(html, 'secondary-responsible-name'), pxCampoN_(html, 'secondary-responsible-type'), pxCampoN_(html, 'secondary-responsible-cellphone'), pxCampoN_(html, 'secondary-responsible-main-email'),
      conq[1] || '', conq[3] || '', conq[2] || '', conq[4] || '', conq[5] || '', conq[6] || '', hoje, obsF[chave] || '', m._ninhada, cod, 'Paxtu']);

    var nome = pxCampoN_(html, 'associate-name'), cat = [];
    for (var b = 1; b <= 14; b++) {
      var etapa = b <= 4 ? 'Paco' : b <= 7 ? 'Tixa' : b <= 11 ? 'Lipe' : 'Nina';
      var j = JSON.parse(pxAjax_(jar, tk, '/associado/modal-eixo?id=' + b + '&type=block&associateId=' + cod).getContentText());
      var h = j.html || '', bloco = decodeHtml_(((h.match(/id="axisBlocksModalLabel"[^>]*>([\s\S]*?)<\/h4>/) || [])[1] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim() || ('Bloco ' + b);
      var minimo = (h.match(/Realizar\s*<b>\s*(\d+)/) || [])[1] || '';
      var re = /<input[^>]*type="checkbox"[^>]*>/g, inp;
      while ((inp = re.exec(h))) {
        var t = inp[0], v = (t.match(/value="([^"]*)"/) || [])[1], idc = (t.match(/id="([^"]*)"/) || [])[1];
        if (!v || !idc || !/^check-/.test(idc)) continue;
        var lab = h.slice(inp.index).match(new RegExp('<label[^>]*for="' + idc + '"[^>]*>([\\s\\S]*?)</label>'));
        var texto = decodeHtml_((lab ? lab[1] : '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();
        cat.push([etapa, b, bloco, minimo, v, texto]);
        if (/\schecked/.test(t)) {
          var old = obsP[chave + '|' + v];
          linhasP.push([chave, nome, etapa, bloco, v, texto, old ? old[6] : '', old ? old[7] : '', 'Lançado']);
        }
      }
    }
    if (!catalogo) catalogo = cat;
  });
  pendentes.forEach(function (r) {
    var ja = linhasP.some(function (x) { return x[0] === String(r[0]) && String(x[4]) === String(r[4]); });
    if (!ja) linhasP.push(r);
  });

  ['Filhotes', 'Progressão', 'Presença', 'Financeiro', 'Documentos', 'Atividades'].forEach(function (n) { var c = NINHADA_ABAS_[n], s = ss.getSheetByName(n); s.getRange(1, 1, 1, c.length).setValues([c]).setFontWeight('bold').setBackground('#00853F').setFontColor('#FFFFFF'); });
  var nomesPx = {}; linhasF.forEach(function (x) { nomesPx[String(x[1]).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()] = 1; });
  manuais.forEach(function (x) { if (!nomesPx[String(x[1]).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()]) linhasF.push(x); });
  limparEscrever_(shF, linhasF, 28);
  if (linhasF.length) { shF.getRange(2, 4, linhasF.length, 1).setNumberFormat('dd/MM/yyyy'); shF.getRange(2, 7, linhasF.length, 1).setNumberFormat('dd/MM/yyyy');
    shF.getRange(2, 18, linhasF.length, 7).setNumberFormat('dd/MM/yyyy'); }
  limparEscrever_(shP, linhasP, 9);
  if (catalogo) limparEscrever_(shI, catalogo, 6);
  Logger.log('Filhotes: ' + linhasF.length + ' | itens marcados: ' + linhasP.length + ' | catálogo: ' + (catalogo || []).length);
}

function limparEscrever_(sh, linhas, n) {
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, n).clearContent();
  if (linhas.length) sh.getRange(2, 1, linhas.length, n).setValues(linhas);
}

/* Rodar uma vez: atualiza o painel das Ninhadas com o Paxtu todo dia por volta das 4h */
function instalarAtualizacaoNinhada() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'atualizarNinhadaDoPaxtu') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('atualizarNinhadaDoPaxtu').timeBased().everyDays(1).atHour(4).create();
  Logger.log('Atualização diária das Ninhadas instalada (4h).');
}
