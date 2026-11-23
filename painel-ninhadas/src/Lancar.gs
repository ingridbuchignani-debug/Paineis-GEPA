/* ===== Lançamento no Paxtu: o que a chefia registra no painel vai para o jovem no Paxtu =====
   Usa o login do Paxtu guardado neste projeto (menu Painel > Configurar acesso ao Paxtu).
   Progressão: ações do bloco (/associado/salvar-acoes). Conquistas: /associado/salvar-conquista.
   Sempre confere no Paxtu depois de enviar. Se falhar, fica "Falta lançar" com o motivo. */

var CONQ_ID_ = { 'Acolhida': 1, 'Tixa': 2, 'Paco': 3, 'Lipe': 4, 'Nina': 5, 'Caminho Lobinho': 6 };

function sessaoPx_() { var jar = paxtuSessao_(); return { jar: jar, tk: pxToken_(jar) }; }
function ajaxPx_(s, url, payload) {
  return req_(s.jar, PAXTU + url, { method: payload ? 'post' : 'get', payload: payload,
    headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': s.tk, 'Accept': 'application/json, text/html' } });
}
function idPaxtu_(cod) {
  var f = linhas_('Filhotes').filter(function (x) { return String(x['Registro escoteiro']) === String(cod); })[0];
  var id = f && String(f['ID Paxtu'] || '').replace(/\D/g, '');
  if (!id) throw new Error('Este Filhote não está no Paxtu.');
  return id;
}
function modalBloco_(s, bloco, id) {
  var h = JSON.parse(ajaxPx_(s, '/associado/modal-eixo?id=' + bloco + '&type=block&associateId=' + id).getContentText()).html || '';
  var marcados = (h.match(/<input[^>]*type="checkbox"[^>]*>/gi) || []).filter(function (t) { return /\schecked/i.test(t); })
    .map(function (t) { return (t.match(/value="([^"]*)"/) || [])[1]; }).filter(String);
  var ramos = ((h.match(/id="fl-ramos-maiores"[^>]*value="([^"]*)"/) || h.match(/value="([^"]*)"[^>]*id="fl-ramos-maiores"/) || [])[1]) || '0';
  var adic = (h.match(/id="div-additional-actions"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '';
  var temVariaveis = /<(div|li|input|label|span|p)\b/i.test(adic) || adic.replace(/<[^>]+>/g, '').trim().length > 0;
  return { marcados: marcados, ramos: ramos, temVariaveis: temVariaveis };
}

/* Envia um item de progressão. Retorna '' se deu certo ou o motivo do erro. */
function enviarItemPx_(s, cod, codItem) {
  try {
    var it = linhas_('Itens').filter(function (i) { return String(i['Código do item']) === String(codItem); })[0];
    if (!it) return 'Item não encontrado.';
    var id = idPaxtu_(cod), bloco = String(it['Código do bloco']), m = modalBloco_(s, bloco, id);
    if (m.marcados.indexOf(String(codItem)) >= 0) return '';
    if (m.temVariaveis) return 'O bloco tem atividades variáveis no Paxtu: lançar este item direto no Paxtu.';
    var acoes = m.marcados.concat([String(codItem)]);
    var p = '_token=' + encodeURIComponent(s.tk) + '&blockId=' + bloco + '&associateId=' + id + '&ramosMaiores=' + encodeURIComponent(m.ramos);
    acoes.forEach(function (v) { p += '&actions%5B%5D=' + encodeURIComponent(v); });
    var r = req_(s.jar, PAXTU + '/associado/salvar-acoes', { method: 'post', payload: p,
      headers: { 'X-CSRF-TOKEN': s.tk, 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded' } });
    if (r.getResponseCode() >= 400) return 'Paxtu recusou (' + r.getResponseCode() + ').';
    if (modalBloco_(s, bloco, id).marcados.indexOf(String(codItem)) < 0) return 'Enviado, mas o Paxtu não confirmou.';
    return '';
  } catch (e) { return String(e.message || e); }
}
function marcarSituacaoProg_(cod, codItem, situacao, motivo) {
  var sh = aba_('Progressão'), v = sh.getDataRange().getValues(), cab = v[0], cm = cab.indexOf('Motivo Paxtu');
  if (cm < 0) { cm = cab.length; sh.getRange(1, cm + 1).setValue('Motivo Paxtu').setFontWeight('bold'); }
  for (var i = 1; i < v.length; i++) if (String(v[i][0]) === String(cod) && String(v[i][4]) === String(codItem)) {
    sh.getRange(i + 1, 9).setValue(situacao); sh.getRange(i + 1, cm + 1).setValue(motivo || '');
  }
}

/* Botão "Lançar pendentes no Paxtu" da aba Progressão */
function lancarPendentesPaxtu() {
  var email = exigir_(), ini = Date.now();
  var pend = linhas_('Progressão').filter(function (p) { return p['Situação no Paxtu'] === 'Falta lançar'; });
  if (!pend.length) return 'Nada para lançar.';
  /* envia fora do bloqueio e para antes do limite de 6 minutos do Google; o que sobrar fica para o próximo clique */
  var s = sessaoPx_(), ok = 0, erros = [], feitos = 0;
  for (var k = 0; k < pend.length; k++) {
    if (Date.now() - ini > 240000) break;
    var p = pend[k], cod = String(p['Registro escoteiro']), item = String(p['Código do item']), e = enviarItemPx_(s, cod, item);
    try { trava_(function () { marcarSituacaoProg_(cod, item, e ? 'Falta lançar' : 'Lançado', e || ''); }); } catch (x) {}
    if (e) erros.push(p['Nome'] + ': ' + e); else ok++;
    feitos++;
  }
  registrarAcesso_(email, 'Lançou ' + ok + ' itens no Paxtu');
  var resto = pend.length - feitos;
  return ok + ' item(ns) lançado(s) no Paxtu.' + (erros.length ? ' Não foram: ' + erros.join(' | ') : '') +
    (resto ? ' Faltam ' + resto + ' item(ns): clique de novo para continuar.' : '');
}

function dataConquista_(perfil, cid) {
  var d = '';
  (perfil.match(/<[^>]*data-type="achievement"[^>]*>/g) || []).forEach(function (t) {
    if ((t.match(/data-id="(\d+)"/) || [])[1] === String(cid)) d = (t.match(/data-date="([^"]*)"/) || [])[1] || '';
  });
  return d;
}
/* Registrar conquista (Acolhida, Paco, Tixa, Lipe, Nina, Caminho Lobinho) com data */
function lancarConquista(cod, conquista, iso) {
  var email = exigir_();
  /* fala com o Paxtu sem bloqueio; só a gravação na planilha usa o bloqueio */
  var r = (function () {
    var cid = CONQ_ID_[conquista]; if (!cid) throw new Error('Conquista inválida.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) throw new Error('Informe a data.');
    var id = idPaxtu_(cod), s = sessaoPx_();
    var dataJa = dataConquista_(pxPerfil_(s.jar, id, s.tk), cid);
    if (!dataJa) {
      var h = JSON.parse(ajaxPx_(s, '/associado/modal-eixo?id=' + cid + '&type=achievement&associateId=' + id).getContentText()).html || '';
      var itens = (h.match(/<input[^>]*type="checkbox"[^>]*>/g) || []).map(function (t) { return (t.match(/value="([^"]*)"/) || [])[1]; }).filter(String);
      var p = '_token=' + encodeURIComponent(s.tk) + '&achievementId=' + cid + '&associateId=' + id + '&date=' + iso;
      itens.forEach(function (v) { p += '&items%5B%5D=' + encodeURIComponent(v); });
      var r = req_(s.jar, PAXTU + '/associado/salvar-conquista', { method: 'post', payload: p,
        headers: { 'X-CSRF-TOKEN': s.tk, 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded' } });
      if (r.getResponseCode() >= 400) throw new Error('O Paxtu recusou a conquista (' + r.getResponseCode() + ').');
      if (!dataConquista_(pxPerfil_(s.jar, id, s.tk), cid)) throw new Error('Enviado, mas o Paxtu não confirmou. Confira no Paxtu.');
    }
    return { dataJa: dataJa };
  })();
  var dataJa = r.dataJa;
  return trava_(function () {
    var sh = aba_('Filhotes'), v = sh.getDataRange().getValues(), col = v[0].indexOf(conquista);
    for (var i = 1; i < v.length; i++) if (String(v[i][0]) === String(cod) && col >= 0) sh.getRange(i + 1, col + 1).setValue(dataDe_(dataJa || iso)).setNumberFormat('dd/MM/yyyy');
    registrarAcesso_(email, 'Conquista ' + conquista + ' ' + cod);
    return dataJa ? conquista + ' já estava no Paxtu (' + dataJa.split('-').reverse().join('/') + ').' : conquista + ' lançada no Paxtu.';
  });
}

/* Teste só de leitura: confere se o login do Paxtu funciona (rodar pelo editor) */
function conferirAcessoPaxtu() {
  soDona_();
  var s = sessaoPx_(), f = linhas_('Filhotes').filter(function (x) { return String(x['ID Paxtu'] || '').replace(/\D/g, ''); })[0];
  var m = modalBloco_(s, 1, idPaxtu_(f['Registro escoteiro']));
  Logger.log('Acesso ao Paxtu OK. Bloco 1 lido: ' + m.marcados.length + ' itens marcados.');
}

/* ===== Atividade especial (fora da sede) no Paxtu: /atividades/nova/especial =====
   Seções: Ninhadas 1 e 2 juntas. Jovens = Filhotes escolhidos; Escotistas = chefia escolhida (adultos das seções). */
var SECOES_PX_ = CONFIG.SECOES_PAXTU;
function listaSecaoPx_(s, rota, sec) {
  var r = ajaxPx_(s, '/atividades/nova/' + rota + '/se%C3%A7%C3%A3o', { section: sec, _token: s.tk });
  try { return JSON.parse(r.getContentText()) || []; } catch (e) { return []; }
}
/* Para o formulário do painel: escotistas e jovens das duas Ninhadas no Paxtu */
function pessoasAtividadePaxtu() {
  exigir_();
  var s = sessaoPx_(), adultos = {}, jovens = {};
  Object.keys(SECOES_PX_).forEach(function (n) {
    listaSecaoPx_(s, 'escotista', SECOES_PX_[n]).forEach(function (a) { adultos[a.cd_associado] = a.nm_associado; });
    listaSecaoPx_(s, 'associado', SECOES_PX_[n]).forEach(function (a) { jovens[a.cd_associado] = a.nm_associado; });
  });
  var m = function (o) { return Object.keys(o).map(function (k) { return { id: k, nome: o[k] }; }).sort(function (a, b) { return a.nome.localeCompare(b.nome); }); };
  return { adultos: m(adultos), jovens: m(jovens) };
}
function eventosPx_(s, ano) {
  var ev = [];
  Object.keys(SECOES_PX_).forEach(function (n) {
    var r = req_(s.jar, PAXTU + '/agenda/mes-ano?year=' + ano + '&section=' + SECOES_PX_[n], { method: 'get', headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' } });
    try { ev = ev.concat(JSON.parse(r.getContentText()) || []); } catch (e) {}
  });
  return ev;
}
/* o: {nome, tipo, dataIni, horaIni, local, saida, dataFim, horaFim, chegada, transporte, custo, descricao, responsavel, escotistas[], jovens[]} */
function cadastrarAtividadePaxtu(linha, o) {
  var email = exigir_();
  return trava_(function () {
    ['nome', 'tipo', 'dataIni', 'horaIni', 'local', 'saida', 'dataFim', 'horaFim', 'chegada', 'responsavel'].forEach(function (k) { if (!o[k]) throw new Error('Preencha todos os campos obrigatórios.'); });
    if (!(o.escotistas || []).length || !(o.jovens || []).length) throw new Error('Escolha pelo menos um escotista e um jovem.');
    var s = sessaoPx_();
    var ja = eventosPx_(s, o.dataIni.slice(0, 4)).filter(function (e) { return e.date === o.dataIni && String(e.name).trim().toLowerCase() === String(o.nome).trim().toLowerCase(); })[0];
    if (!ja) {
      var custo = String(o.custo || '').replace(/[^\d,\.]/g, '').replace('.', ',');
      var q = [['_token', s.tk], ['activity-name', o.nome], ['activity-type', o.tipo], ['activity-responsible', o.responsavel], ['activity-location', o.local],
        ['location-link', ''], ['transport', o.transporte || ''], ['individual-cost', custo ? 'R$' + custo : ''], ['start-date', o.dataIni], ['start-time', o.horaIni],
        ['exit-location', o.saida], ['end-date', o.dataFim], ['end-time', o.horaFim], ['arrival-location', o.chegada], ['description', o.descricao || '']];
      Object.keys(SECOES_PX_).forEach(function (n) { q.push(['sections[]', SECOES_PX_[n]]); });
      o.jovens.forEach(function (id) { q.push(['participants[]', id]); });
      o.escotistas.forEach(function (id) { q.push(['scouts[]', id]); });
      var p = q.map(function (kv) { return encodeURIComponent(kv[0]) + '=' + encodeURIComponent(kv[1]); }).join('&');
      var r = req_(s.jar, PAXTU + '/atividades/nova/especial', { method: 'post', payload: p, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      if (r.getResponseCode() >= 400) throw new Error('O Paxtu recusou (' + r.getResponseCode() + ').');
      ja = eventosPx_(s, o.dataIni.slice(0, 4)).filter(function (e) { return e.date === o.dataIni && String(e.name).trim().toLowerCase() === String(o.nome).trim().toLowerCase(); })[0];
      if (!ja) throw new Error('Enviado, mas a atividade não apareceu na agenda do Paxtu. Confira no Paxtu antes de tentar de novo.');
    }
    var sh = aba_('Atividades'), cab = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    var cP = cab.indexOf('Situação no Paxtu'), cI = cab.indexOf('ID Paxtu');
    if (cI < 0) { cI = cab.length; sh.getRange(1, cI + 1).setValue('ID Paxtu').setFontWeight('bold'); }
    if (cP >= 0) sh.getRange(linha, cP + 1).setValue('Cadastrada');
    sh.getRange(linha, cI + 1).setValue(String(ja.id));
    registrarAcesso_(email, 'Atividade no Paxtu: ' + o.nome);
    return 'Atividade "' + o.nome + '" cadastrada no Paxtu.';
  });
}
