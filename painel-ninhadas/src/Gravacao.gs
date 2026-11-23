/* ===== Gravações feitas pelo painel (todas conferem o acesso) ===== */
function trava_(fn) { var l = LockService.getScriptLock(); l.waitLock(30000); try { return fn(); } finally { l.releaseLock(); } }
function dataDe_(iso) { var p = String(iso).split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }

/* lista: [{cod, nome, estado, motivo, acomp}]: acomp = familiares que participaram junto (pagam taxa) */
function salvarChamada(iso, atividade, lista) {
  var email = exigir_();
  /* 1) grava a chamada e os itens na planilha (rápido, com bloqueio) */
  var res = trava_(function () {
    var sh = aba_('Presença'), v = sh.getDataRange().getValues();
    for (var i = v.length - 1; i >= 1; i--) if (iso_(v[i][0]) === iso) sh.deleteRow(i + 1);
    var d = dataDe_(iso);
    var linhas = lista.filter(function (x) { return x.estado; }).map(function (x) { return [d, atividade, x.cod, x.nome, x.estado, x.motivo || '', 'Não', Number(x.acomp) || 0]; });
    if (linhas.length) {
      sh.getRange(sh.getLastRow() + 1, 1, linhas.length, 8).setValues(linhas);
      sh.getRange(sh.getLastRow() - linhas.length + 1, 1, linhas.length, 1).setNumberFormat('dd/MM/yyyy');
    }
    registrarAcesso_(email, 'Chamada ' + dt_(d));
    var it = itensDaAtividade_(iso, atividade, lista.filter(function (x) { return x.estado === 'Presente'; }));
    return { msg: 'Chamada de ' + dtDia_(d) + ' salva (' + linhas.length + ' Filhotes).', it: it };
  });
  /* 2) manda os itens ao Paxtu sem segurar o bloqueio */
  return res.msg + enviarItensChamada_(res.it);
}

function marcarItem(cod, nome, codItem, iso, obs) {
  var email = exigir_();
  return trava_(function () {
    var it = linhas_('Itens').filter(function (i) { return String(i['Código do item']) === String(codItem); })[0];
    if (!it) throw new Error('Item não encontrado.');
    var sh = aba_('Progressão'), v = sh.getDataRange().getValues();
    for (var i = 1; i < v.length; i++) if (String(v[i][0]) === String(cod) && String(v[i][4]) === String(codItem)) {
      sh.getRange(i + 1, 7, 1, 2).setValues([[iso ? dataDe_(iso) : v[i][6], obs !== undefined ? obs : v[i][7]]]);
      return 'Item atualizado.';
    }
    sh.appendRow([cod, nome, it['Etapa'], it['Bloco'], codItem, it['Item'], iso ? dataDe_(iso) : new Date(), obs || '', 'Falta lançar']);
    sh.getRange(sh.getLastRow(), 7).setNumberFormat('dd/MM/yyyy');
    registrarAcesso_(email, 'Progressão ' + nome);
    var e; try { e = enviarItemPx_(sessaoPx_(), cod, codItem); } catch (err) { e = 'sem acesso ao Paxtu (' + (err.message || err) + ')'; }
    marcarSituacaoProg_(cod, codItem, e ? 'Falta lançar' : 'Lançado', e);
    return e ? 'Item marcado no painel, mas não foi para o Paxtu: ' + e : 'Item marcado e lançado no Paxtu.';
  });
}
function desmarcarItem(cod, codItem) {
  exigir_();
  return trava_(function () {
    var sh = aba_('Progressão'), v = sh.getDataRange().getValues();
    for (var i = v.length - 1; i >= 1; i--) if (String(v[i][0]) === String(cod) && String(v[i][4]) === String(codItem)) {
      if (v[i][8] === 'Lançado') throw new Error('Este item já está no Paxtu. Desmarque lá primeiro.');
      sh.deleteRow(i + 1); return 'Item desmarcado.';
    }
    return 'Nada para desmarcar.';
  });
}

var CAMPOS_ATIV_ = { situacao: 'Situação', motivo: 'Motivo do cancelamento', taxa: 'Taxa por participante', autorizacao: 'Autorização no Paxtu', paxtu: 'Situação no Paxtu',
  titulo: 'Título', local: 'Local', programacao: 'Programação', obs: 'Observações' };
function salvarAtividade(linha, campo, valor) {
  exigir_();
  var col = CAMPOS_ATIV_[campo]; if (!col) throw new Error('Campo inválido.');
  var sh = aba_('Atividades'), cab = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0], c = cab.indexOf(col) + 1;
  if (campo === 'taxa') valor = valor === '' ? '' : Number(String(valor).replace(',', '.'));
  sh.getRange(linha, c).setValue(valor);
  return 'Atividade atualizada.';
}
function novaAtividade(o) {
  exigir_();
  var d = dataDe_(o.iso), sh = aba_('Atividades');
  sh.appendRow([d, DIAS_[d.getDay()], o.tipo || 'Ninhada', o.titulo || 'Atividade', o.local || '', 'Prevista', '', o.taxa === '' ? '' : Number(o.taxa || 0), 'Não', '', 'Falta cadastrar', '', '']);
  sh.getRange(sh.getLastRow(), 1).setNumberFormat('dd/MM/yyyy');
  return 'Atividade incluída.';
}

/* o: {iso, cod, filhote, descricao, tipo, valor, situacao, forma, atividade, obs} */
function lancarFinanceiro(o) {
  exigir_();
  var sh = aba_('Financeiro'), d = o.iso ? dataDe_(o.iso) : new Date();
  sh.appendRow([d, o.cod || '', o.filhote || '', o.descricao || '', o.tipo, Number(String(o.valor).replace(',', '.')) || 0, o.situacao || 'Pago', o.forma || '', o.atividade || '', o.obs || '']);
  sh.getRange(sh.getLastRow(), 1).setNumberFormat('dd/MM/yyyy');
  return 'Lançamento salvo.';
}
function salvarDocumento(o) {
  exigir_();
  var sh = aba_('Documentos'), v = sh.getDataRange().getValues();
  for (var i = 1; i < v.length; i++) if (String(v[i][0]) === String(o.cod) && v[i][2] === o.documento) {
    sh.getRange(i + 1, 4, 1, 3).setValues([[o.situacao, o.iso ? dataDe_(o.iso) : '', o.link || '']]); return 'Documento atualizado.';
  }
  sh.appendRow([o.cod, o.nome, o.documento, o.situacao, o.iso ? dataDe_(o.iso) : '', o.link || '']);
  return 'Documento incluído.';
}


/* Itens de progressão ligados a uma atividade (coluna "Itens de progressão" da aba Atividades: códigos separados por vírgula) */
function salvarItensAtividade(linha, codigos) {
  var email = exigir_();
  return trava_(function () {
    var sh = aba_('Atividades'), cab = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0], c = cab.indexOf('Itens de progressão');
    if (c < 0) { c = cab.length; sh.getRange(1, c + 1).setValue('Itens de progressão').setFontWeight('bold'); }
    sh.getRange(linha, c + 1).setValue((codigos || []).join(','));
    registrarAcesso_(email, 'Itens da atividade linha ' + linha);
    return (codigos || []).length + ' item(ns) ligado(s) à atividade.';
  });
}
/* Ao salvar a chamada: quem esteve Presente recebe os itens da atividade (grava na planilha; o envio ao Paxtu é depois) */
function itensDaAtividade_(iso, titulo, presentes) {
  var at = linhas_('Atividades').filter(function (a) { return iso_(a['Data']) === iso && String(a['Título']) === String(titulo); })[0];
  var cods = String((at && at['Itens de progressão']) || '').split(',').map(function (x) { return x.trim(); }).filter(String);
  if (!cods.length || !presentes.length) return { novos: [], semItens: !cods.length };
  var itens = {}; linhas_('Itens').forEach(function (i) { itens[String(i['Código do item'])] = i; });
  var ja = {}; linhas_('Progressão').forEach(function (p) { ja[p['Registro escoteiro'] + '|' + p['Código do item']] = 1; });
  var sh = aba_('Progressão'), novos = [], rows = [];
  presentes.forEach(function (x) {
    cods.forEach(function (ci) {
      var it = itens[ci]; if (!it || ja[x.cod + '|' + ci]) return;
      rows.push([x.cod, x.nome, it['Etapa'], it['Bloco'], ci, it['Item'], dataDe_(iso), 'Pela atividade ' + titulo, 'Falta lançar']);
      novos.push({ cod: x.cod, nome: x.nome, ci: ci });
    });
  });
  if (rows.length) { var r0 = sh.getLastRow() + 1; sh.getRange(r0, 1, rows.length, 9).setValues(rows); sh.getRange(r0, 7, rows.length, 1).setNumberFormat('dd/MM/yyyy'); }
  return { novos: novos };
}
function enviarItensChamada_(it) {
  if (!it || !it.novos) return '';
  if (!it.novos.length) return it.semItens ? '' : ' Os presentes já tinham os itens desta atividade.';
  var s = null, ok = 0, erros = [];
  it.novos.forEach(function (n) {
    var e;
    try { if (!s) s = sessaoPx_(); e = enviarItemPx_(s, n.cod, n.ci); } catch (err) { e = 'sem acesso ao Paxtu (' + (err.message || err) + ')'; }
    try { trava_(function () { marcarSituacaoProg_(n.cod, n.ci, e ? 'Falta lançar' : 'Lançado', e); }); } catch (x) {}
    if (e) { if (erros.indexOf(n.nome) < 0) erros.push(n.nome); } else ok++;
  });
  return ' Progressão: ' + it.novos.length + ' item(ns) marcado(s), ' + ok + ' lançado(s) no Paxtu.' + (erros.length ? ' Ficaram para lançar (botão na Progressão): ' + erros.join(', ') + '.' : '');
}
