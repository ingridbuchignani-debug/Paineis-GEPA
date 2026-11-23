/* ===== Crescimento da Ninhada: fila de espera e números do mês =====
   Aba "Fila de espera": crianças interessadas, na ordem de chegada.
   Aba "Números do mês": foto mensal de quem está ativo (vinda da aba Filhotes, que o Paxtu atualiza),
   para saber quem entrou e quem saiu em cada mês. */

var CAB_FILA_ = ['Data de inclusão', 'Nome da criança', 'Data de nascimento', 'Responsável', 'Contato', 'Situação', 'Observações'];
var CAB_MES_ = ['Mês', 'Ativos', 'Registros', 'Nomes', 'Atualizado em'];

function abaNova_(nome, cab) {
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(nome);
  if (!sh) {
    sh = ss.insertSheet(nome);
    sh.getRange(1, 1, 1, cab.length).setValues([cab]).setFontWeight('bold').setBackground('#E74E0F').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
  }
  return sh;
}

/* ---- Fila de espera ---- */
function getFila_() {
  if (!SpreadsheetApp.getActive().getSheetByName('Fila de espera')) return [];
  return linhas_('Fila de espera').map(function (f) {
    return { linha: f._linha, inclusao: iso_(f['Data de inclusão']), nome: f['Nome da criança'], nasc: iso_(f['Data de nascimento']),
      resp: f['Responsável'], contato: String(f['Contato'] || ''), situacao: f['Situação'] || 'Aguardando', obs: f['Observações'] || '' };
  });
}
/* o: {inclusao, nome, nasc, resp, contato, obs} */
function incluirFila(o) {
  var email = exigir_();
  if (!o || !String(o.nome || '').trim()) throw new Error('Informe o nome da criança.');
  return trava_(function () {
    var sh = abaNova_('Fila de espera', CAB_FILA_);
    sh.appendRow([dataDe_(o.inclusao || Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd')), String(o.nome).trim(), o.nasc ? dataDe_(o.nasc) : '',
      o.resp || '', o.contato || '', 'Aguardando', o.obs || '']);
    var r = sh.getLastRow(); sh.getRange(r, 1).setNumberFormat('dd/MM/yyyy'); sh.getRange(r, 3).setNumberFormat('dd/MM/yyyy');
    sh.getRange(r, 5).setNumberFormat('@');
    registrarAcesso_(email, 'Fila de espera: ' + o.nome);
    return String(o.nome).trim() + ' incluído(a) na fila de espera.';
  });
}
function salvarFila(linha, campo, valor) {
  var email = exigir_();
  return trava_(function () {
    var sh = aba_('Fila de espera'), cab = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0], c = cab.indexOf(campo);
    if (c < 0) throw new Error('Campo não encontrado: ' + campo);
    sh.getRange(Number(linha), c + 1).setValue(valor);
    registrarAcesso_(email, 'Fila de espera linha ' + linha + ': ' + campo);
    return 'Fila de espera atualizada.';
  });
}

/* ---- Números do mês: grava a foto do mês atual sempre que o painel abre ---- */
function metricasNinhada_(fil) {
  try {
    var sh = abaNova_('Números do mês', CAB_MES_), mes = Utilities.formatDate(new Date(), TZ, 'yyyy-MM');
    var ativos = fil.filter(function (x) { return x.cod; }), cods = ativos.map(function (x) { return x.cod; }).sort().join(',');
    var nomes = {}; ativos.forEach(function (x) { nomes[x.cod] = x.nome; });
    var v = sh.getDataRange().getValues(), linha = 0;
    for (var i = 1; i < v.length; i++) if (String(v[i][0]) === mes) { linha = i + 1; break; }
    if (!linha || String(v[linha - 1][2]) !== cods) {
      var row = [mes, ativos.length, cods, JSON.stringify(nomes), new Date()];
      if (linha) sh.getRange(linha, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
      sh.getRange(linha || sh.getLastRow(), 1).setNumberFormat('@');
      v = sh.getDataRange().getValues();
    }
  } catch (e) { v = v || [[]]; }
  return (v || []).slice(1).filter(function (r) { return r[0]; }).map(function (r) {
    var n = {}; try { n = JSON.parse(r[3] || '{}'); } catch (e) {}
    var m = r[0] instanceof Date ? Utilities.formatDate(r[0], TZ, 'yyyy-MM') : String(r[0]);
    return { mes: m, ativos: Number(r[1]) || 0, cods: String(r[2] || '').split(',').filter(String), nomes: n };
  }).sort(function (a, b) { return a.mes.localeCompare(b.mes); });
}
