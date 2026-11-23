/* ===== Histórico do Paxtu no Drive =====
   Toda semana baixa do Paxtu e guarda no Drive, sem duplicar:
   - certificados de atividades, cursos e eventos de cada adulto (pasta base › Chefia › nome › ano)
     e de cada jovem (pasta da seção › Histórico Paxtu › nome › ano);
   - Acordo de Trabalho Voluntário assinado de cada adulto (pasta base › Chefia › nome);
   - histórico de formação do grupo (pasta base › Chefia, planilha);
   - apólice do Seguro Escoteiro (pasta administrativa › Paxtu - Relatórios).
   Documentos pessoais e ficha médica ficam de fora de propósito (LGPD). O PDF do acordo
   traz o CPF: deixe a pasta Chefia só com quem precisa.
   O que já foi salvo fica anotado na aba "Histórico Paxtu" desta planilha.
   Cada execução para antes de 5 minutos e agenda a continuação para 1 minuto depois.
   Configure as pastas em Config.gs (CONFIG.HIST_PASTA_ID, CONFIG.HIST_PASTA_ADMIN_ID, CONFIG.HIST_SECOES)
   e rode instalarHistoricoPaxtu uma vez. */

var HP_ = {
  GEPA: CONFIG.HIST_PASTA_ID,               // pasta base do grupo no Drive
  ADMIN: CONFIG.HIST_PASTA_ADMIN_ID,        // pasta administrativa (apólice do seguro)
  SECOES: CONFIG.HIST_SECOES || [],         // [trecho do nome da seção no Paxtu (RegExp), ID da pasta da seção]
  LIMITE_MS: 270000,
  ABA: 'Histórico Paxtu'
};

/** Instala a rotina semanal (domingo, 2h). */
function instalarHistoricoPaxtu() {
  apagarTriggers_('atualizarHistoricoPaxtu'); apagarTriggers_('continuarHistoricoPaxtu');
  ScriptApp.newTrigger('atualizarHistoricoPaxtu').timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(2).inTimezone('America/Sao_Paulo').create();
  try { SpreadsheetApp.getUi().alert('Histórico do Paxtu: rotina semanal instalada (domingo de madrugada).'); } catch (e) {}
}

/** Rotina semanal: recomeça a fila do zero. */
function atualizarHistoricoPaxtu() {
  PropertiesService.getScriptProperties().deleteProperty('HP_POS');
  continuarHistoricoPaxtu();
}

/** Processa a fila até o limite de tempo; se sobrar, agenda a continuação. */
function continuarHistoricoPaxtu() {
  apagarTriggers_('continuarHistoricoPaxtu');
  var ini = Date.now(), props = PropertiesService.getScriptProperties();
  var lock = LockService.getScriptLock(); if (!lock.tryLock(1000)) return;
  /* rede de segurança: se esta parte for interrompida, a corrente continua em 8 minutos */
  ScriptApp.newTrigger('continuarHistoricoPaxtu').timeBased().after(8 * 60 * 1000).create();
  try {
    var hoje = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd');
    if (props.getProperty('HP_ARRUMADO_V2') !== hoje) { var ok = false; try { ok = hpArrumar_(ini); } catch (e) { hpLog_('erro', 'Arrumação', String(e.message || e)); ok = true; } if (ok) props.setProperty('HP_ARRUMADO_V2', hoje); }
    var jar = paxtuSessao_(), tk = pxToken_(jar), feitos = hpFeitos_();
    /* a fila é refeita das abas Adultos e Jovens; guarda só a posição (propriedade tem limite de tamanho) */
    var fila = hpMontarFila_(), posTxt = props.getProperty('HP_POS'), pos = posTxt === null ? -1 : +posTxt;
    if (pos < 0) { hpGerais_(jar, tk, feitos); pos = 0; }
    /* situação dos acordos para o painel: uma vez por dia enquanto a rotina roda */
    if (props.getProperty('HP_SIT_ACORDOS') !== hoje) { try { atualizarSituacaoAcordos_(); } catch (e) { hpLog_('erro', 'Situação dos acordos', String(e.message || e)); } props.setProperty('HP_SIT_ACORDOS', hoje); }
    /* Acordos de Trabalho Voluntário: continua em cada parte até baixar todos (uma volta completa por dia) */
    if (props.getProperty('HP_ACORDOS_DIA') !== hoje) {
      var okA = false; try { okA = hpAcordos_(jar, tk, feitos, ini); } catch (e) { hpLog_('erro', 'Acordos de voluntariado', String(e.message || e)); }
      if (okA) props.setProperty('HP_ACORDOS_DIA', hoje);
    }
    var novos = 0;
    while (pos < fila.length && Date.now() - ini < HP_.LIMITE_MS) {
      var p = fila[pos];
      try { novos += hpPessoa_(jar, tk, p, feitos, ini); } catch (e) { hpLog_('erro', p.nome, String(e.message || e).slice(0, 200)); }
      if (p.parou) break;
      pos++;
    }
    apagarTriggers_('continuarHistoricoPaxtu');
    if (pos < fila.length) {
      props.setProperty('HP_POS', String(pos));
      ScriptApp.newTrigger('continuarHistoricoPaxtu').timeBased().after(60 * 1000).create();
    } else props.deleteProperty('HP_POS');
    Logger.log('Histórico Paxtu: ' + novos + ' arquivo(s) novo(s); faltam ' + (fila.length - pos) + ' pessoa(s).');
  } finally { lock.releaseLock(); }
}

/* ---------- fila de pessoas ---------- */
function hpMontarFila_() {
  var ss = SpreadsheetApp.getActive(), fila = [];
  var ad = ss.getSheetByName('Adultos');
  if (ad && ad.getLastRow() >= 5) ad.getRange(5, 1, ad.getLastRow() - 4, 2).getDisplayValues().forEach(function (r) {
    if (/^\d{4,8}$/.test(String(r[0]).trim())) fila.push({ reg: String(r[0]).trim(), nome: String(r[1]).trim(), adulto: true });
  });
  var jv = ss.getSheetByName('Jovens');
  if (jv && jv.getLastRow() >= 4) jv.getRange(4, 1, jv.getLastRow() - 3, 11).getDisplayValues().forEach(function (r) {
    if (/^\d{4,8}$/.test(String(r[0]).trim()) && r[10] !== 'Sim') fila.push({ reg: String(r[0]).trim(), nome: String(r[1]).trim(), secao: r[3], ramo: r[2] });
  });
  return fila;
}

/* ---------- uma pessoa: certificados e acordo de voluntariado ---------- */
function hpPessoa_(jar, tk, p, feitos, ini) {
  var cod = pxCodigo_(jar, p.reg); if (!cod) return 0;
  var h = pxPerfil_(jar, cod, tk), itens = hpCertificados_(h), novos = 0, pasta = null;
  var AJ = { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json', 'X-CSRF-TOKEN': tk };
  var pend = itens.filter(function (c) { return !feitos[p.reg + ':' + c.chave]; });
  for (var i = 0; i < pend.length; i += 6) {
    if (Date.now() - ini > HP_.LIMITE_MS) { p.parou = true; break; }
    var lote = pend.slice(i, i + 6), ck = cookieHeader_(jar, hostDe_(PAXTU));
    var resp = UrlFetchApp.fetchAll(lote.map(function (c) {
      var q = c.tipo === 'activity' ? '&type=activity&activityId=' + c.id : '&type=reg&id=' + c.id;
      return { url: PAXTU + '/associado/associate/history-certificate?associateCode=' + encodeURIComponent(cod) + q, muteHttpExceptions: true, followRedirects: false, headers: Object.assign({ 'Cookie': ck, 'User-Agent': 'Mozilla/5.0 PainelGEPA' }, AJ) };
    }));
    lote.forEach(function (c, k) {
      var j = {}; try { j = JSON.parse(resp[k].getContentText()); } catch (e) {}
      if (!j.file || !j.file.content) { hpLog_('sem arquivo', p.nome, c.titulo); feitos[p.reg + ':' + c.chave] = 1; hpAnota_(p.reg + ':' + c.chave, 'Sem certificado no Paxtu', p.nome, c.titulo, ''); return; }
      pasta = pasta || hpPastaPessoa_(p);
      var nome = (c.data || '0000-00-00') + ' - ' + hpLimpa_(c.titulo) + '.pdf';
      var f = hpSub_(hpSub_(pasta, 'Certificados de atividades e cursos'), (c.data || '0000').slice(0, 4)).createFile(Utilities.newBlob(Utilities.base64Decode(j.file.content), j.file.content_type || 'application/pdf', nome));
      feitos[p.reg + ':' + c.chave] = 1; novos++;
      hpAnota_(p.reg + ':' + c.chave, c.tipo === 'activity' ? 'Certificado de atividade' : 'Certificado de curso/evento', p.nome, c.titulo, f.getUrl());
    });
  }
  return novos;
}

/** Lê a aba Vida Escoteira do perfil: linhas com botão de certificado. */
function hpCertificados_(h) {
  var out = [], re = /<tr class="activity-item">([\s\S]*?)<\/tr>/g, m;
  while ((m = re.exec(h))) {
    var t = m[1], a = t.match(/data-activity-id="(\d+)"/), e = t.match(/data-event-id="(\d+)"/);
    if (!a && !e) continue;
    var tx = function (cls) { var x = t.match(new RegExp('class="[^"]*' + cls + '[^"]*">([\\s\\S]*?)<\\/td>')); return x ? x[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : ''; };
    var d = tx('start-date').match(/(\d{2})\/(\d{2})\/(\d{4})/);
    out.push({ tipo: a ? 'activity' : 'reg', id: (a || e)[1], chave: (a ? 'a' : 'e') + (a || e)[1], titulo: tx('activity-description') || 'Atividade', data: d ? d[3] + '-' + d[2] + '-' + d[1] : '' });
  }
  return out;
}

/* ---------- itens gerais do grupo (uma vez por semana) ---------- */
function hpGerais_(jar, tk, feitos) {
  /* Seguro Escoteiro: salva quando o arquivo muda */
  try {
    var r = seguir_(jar, PAXTU + '/seguro.pdf').r, b = r.getBlob(), dig = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, b.getBytes()));
    if (r.getResponseCode() === 200 && !feitos['seguro:' + dig]) {
      var f = hpSub_(DriveApp.getFolderById(HP_.ADMIN), 'Paxtu - Relatórios').createFile(b.setName('Seguro Escoteiro - ' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd') + '.pdf'));
      feitos['seguro:' + dig] = 1; hpAnota_('seguro:' + dig, 'Seguro Escoteiro', 'Grupo', 'Apólice', f.getUrl());
    }
  } catch (e) { hpLog_('erro', 'Seguro', String(e.message || e)); }
  /* Histórico de formação do grupo: planilha atualizada toda semana */
  try {
    var AJ = { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json', 'X-CSRF-TOKEN': tk }, linhas = [], pg = 1;
    while (pg <= 40) {
      var j = JSON.parse(req_(jar, PAXTU + '/formacao/buscar-historico?page=' + pg, { headers: AJ }).getContentText());
      var rows = String(j.html || '').match(/<tr>[\s\S]*?<\/tr>/g) || [];
      rows.forEach(function (tr) { var c = (tr.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || []).map(function (x) { return x.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }); if (c.length >= 5) linhas.push(c.slice(1, 5)); });
      if (rows.length < 10) break; pg++;
    }
    if (linhas.length) {
      var chefia = hpSub_(DriveApp.getFolderById(HP_.GEPA), 'Chefia'), it = chefia.getFilesByName('Histórico de formação (Paxtu)');
      var ss = it.hasNext() ? SpreadsheetApp.open(it.next()) : (function () { var n = SpreadsheetApp.create('Histórico de formação (Paxtu)'); DriveApp.getFileById(n.getId()).moveTo(chefia); return n; })();
      var sh = ss.getSheets()[0]; sh.clear();
      sh.getRange(1, 1).setValue('Histórico de formação do grupo no Paxtu · atualizado em ' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm')).setFontWeight('bold');
      sh.getRange(3, 1, 1, 4).setValues([['Registro', 'Nome', 'Nível | Linha | Ramo', 'Situação']]).setFontWeight('bold').setBackground('#00853e').setFontColor('#ffffff');
      sh.getRange(4, 1, linhas.length, 4).setValues(linhas); sh.autoResizeColumns(1, 4);
    }
  } catch (e) { hpLog_('erro', 'Histórico de formação', String(e.message || e)); }
}

/** Acordos de Trabalho Voluntário assinados: lista do Paxtu e download de cada um. */
function hpAcordos_(jar, tk, feitos, ini) {
  var AJ = { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json', 'X-CSRF-TOKEN': tk }, pg = 1, nomes = hpNomesAdultos_();
  while (pg <= 60) {
    var j = JSON.parse(req_(jar, PAXTU + '/associado/carregar-voluntario?page=' + pg + '&status=1', { headers: AJ }).getContentText());
    var rows = String(j.html || '').match(/<tr[\s\S]*?<\/tr>/g) || [];
    if (pg === 1 && !PropertiesService.getScriptProperties().getProperty('HP_ACORDO_MODELO') && rows[0]) {
      PropertiesService.getScriptProperties().setProperty('HP_ACORDO_MODELO', rows[0].replace(/\s+/g, ' ').slice(0, 1500)); // referência para manutenção
    }
    if (!rows.length) return true;
    for (var k = 0; k < rows.length; k++) {
      if (Date.now() - ini > HP_.LIMITE_MS - 60000) return false;
      var tr = rows[k];
      if (!/Assinado/i.test(tr)) continue;
      var c = (tr.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || []).map(function (x) { return x.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); });
      var nome = c[1] || '', funcao = c[3] || c[2] || '', inicio = c[4] || '';
      var id = (tr.match(/editar-voluntario\/(\d+)/) || [])[1];
      var chave = 'acordo:' + (id || nome + inicio);
      if (!id || feitos[chave]) continue;
      var blob = hpPdfAcordo_(jar, tk, id);
      if (!blob) { hpLog_('acordo sem download', nome, funcao); continue; }
      var ad = nomes[hpNorm_(nome)] || {};
      var pasta = hpPastaPessoa_({ nome: ad.nome || nome, reg: ad.reg || '', adulto: true });
      var d = inicio.match(/(\d{2})\/(\d{2})\/(\d{4})/), arq = (d ? d[3] + '-' + d[2] + '-' + d[1] : 'sem data') + ' - Acordo de Trabalho Voluntário - ' + hpLimpa_(funcao) + '.pdf';
      var f = hpSub_(pasta, 'Acordo de Trabalho Voluntário').createFile(blob.setName(arq));
      feitos[chave] = 1; hpAnota_(chave, 'Acordo de Trabalho Voluntário', nome, funcao, f.getUrl());
    }
    pg++;
  }
  return true;
}

/* ---------- pastas ---------- */
function hpPastaPessoa_(p) {
  var base;
  if (p.adulto) base = hpSub_(DriveApp.getFolderById(HP_.GEPA), 'Chefia');
  else {
    var alvo = null; HP_.SECOES.forEach(function (s) { if (!alvo && s[0].test(p.secao || '')) alvo = s[1]; });
    base = alvo ? hpSub_(DriveApp.getFolderById(alvo), 'Histórico Paxtu') : hpSub_(hpSub_(DriveApp.getFolderById(HP_.GEPA), 'Jovens'), hpLimpa_(p.secao || p.ramo || 'Sem seção'));
  }
  return hpSubPessoa_(base, hpLimpa_(p.nome || p.reg));
}
/** Acha a pasta da pessoa ignorando maiúsculas e acentos (evita pasta duplicada). */
var HP_CACHE_ = {};
function hpSubPessoa_(pai, nome) {
  var id = pai.getId(), alvo = hpNorm_(nome);
  if (!HP_CACHE_[id]) { HP_CACHE_[id] = {}; var it = pai.getFolders(); while (it.hasNext()) { var f = it.next(); HP_CACHE_[id][hpNorm_(f.getName())] = f; } }
  return HP_CACHE_[id][alvo] || (HP_CACHE_[id][alvo] = pai.createFolder(nome));
}
function hpSub_(pai, nome) { var it = pai.getFoldersByName(nome); return it.hasNext() ? it.next() : pai.createFolder(nome); }
function hpLimpa_(s) { return String(s || '').replace(/&quot;/g, "'").replace(/&amp;/g, '&').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, '(').replace(/&gt;/g, ')').replace(/[\\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim().slice(0, 120); }
function hpNorm_(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim(); }
function hpNomesAdultos_() {
  var ad = SpreadsheetApp.getActive().getSheetByName('Adultos'), m = {};
  if (ad && ad.getLastRow() >= 5) ad.getRange(5, 1, ad.getLastRow() - 4, 2).getDisplayValues().forEach(function (r) { if (r[1]) m[hpNorm_(r[1])] = { reg: r[0], nome: String(r[1]).trim() }; });
  return m;
}

/* ---------- registro do que já foi salvo ---------- */
function hpAba_() {
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(HP_.ABA);
  if (!sh) { sh = ss.insertSheet(HP_.ABA); sh.getRange(1, 1, 1, 6).setValues([['Chave', 'Tipo', 'Pessoa', 'Documento', 'Arquivo no Drive', 'Salvo em']]).setFontWeight('bold').setBackground('#00853e').setFontColor('#ffffff'); sh.setFrozenRows(1); }
  return sh;
}
function hpFeitos_() {
  var sh = hpAba_(), m = {};
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().forEach(function (r) { m[r[0]] = 1; });
  return m;
}
function hpAnota_(chave, tipo, pessoa, doc, url) { hpAba_().appendRow([chave, tipo, pessoa, doc, url, new Date()]); }
function hpLog_(tipo, quem, msg) { Logger.log('[Histórico Paxtu] ' + tipo + ' · ' + quem + ' · ' + msg); }
/** PDF do acordo: tenta o arquivo assinado e, se não houver, o gerado pelo Paxtu. */
function hpPdfAcordo_(jar, tk, id) {
  var AJ = { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json, application/pdf', 'X-CSRF-TOKEN': tk };
  var tentativas = [PAXTU + '/assinatura-eletronica/imprimir-assinado?id=' + id, PAXTU + '/associado/gerar-pdf/' + id];
  for (var i = 0; i < tentativas.length; i++) {
    var r = req_(jar, tentativas[i], { headers: AJ });
    if (r.getResponseCode() !== 200) continue;
    if (/pdf/i.test(hpTipo_(r))) return r.getBlob();
    try {
      var j = JSON.parse(r.getContentText()), b64 = j.pdf || (j.file && j.file.content) || j.content;
      if (b64) return Utilities.newBlob(Utilities.base64Decode(String(b64).replace(/^data:[^,]+,/, '')), 'application/pdf');
    } catch (e) {}
  }
  return null;
}
function hpTipo_(r) { var h = r.getHeaders(); return String(h['Content-Type'] || h['content-type'] || ''); }

/* ---------- arrumação: junta pastas da mesma pessoa e corrige nomes de arquivos ---------- */
function hpArrumar_(ini) {
  var limite = (ini || Date.now()) + 120000;
  var bases = [], gepa = DriveApp.getFolderById(HP_.GEPA);
  var ch = gepa.getFoldersByName('Chefia'); if (ch.hasNext()) bases.push(ch.next());
  HP_.SECOES.forEach(function (s) { var it = DriveApp.getFolderById(s[1]).getFoldersByName('Histórico Paxtu'); if (it.hasNext()) bases.push(it.next()); });
  var jv = gepa.getFoldersByName('Jovens'); if (jv.hasNext()) { var it2 = jv.next().getFolders(); while (it2.hasNext()) bases.push(it2.next()); }
  var completo = bases.every(function (b) { if (Date.now() > limite) return false; hpJuntarIguais_(b); return hpPorAno_(b, limite); });
  if (!completo) return false;
  /* nomes com &quot; e similares, de antes da correção */
  var it3 = DriveApp.searchFiles("title contains '&quot;' or title contains '&amp;' or title contains '&#039;'");
  while (it3.hasNext()) { var f = it3.next(); if (/^\d{4}-\d{2}-\d{2} - /.test(f.getName())) f.setName(hpLimpa_(f.getName().replace(/\.pdf$/i, '')) + '.pdf'); }
  return true;
}
/** Move certificados soltos para a subpasta do ano (tirado do começo do nome do arquivo). */
function hpPorAno_(base, limite) {
  var ps = base.getFolders();
  while (ps.hasNext()) {
    if (Date.now() > limite) return false;
    var it = ps.next().getFoldersByName('Certificados de atividades e cursos'); if (!it.hasNext()) continue;
    var cert = it.next(), fs = cert.getFiles(), anos = {};
    while (fs.hasNext()) {
      var f = fs.next(), m = f.getName().match(/^(\d{4})-\d{2}-\d{2} - /); if (!m) continue;
      var d = anos[m[1]] || (anos[m[1]] = hpSub_(cert, m[1]));
      if (d.getFilesByName(f.getName()).hasNext()) f.setTrashed(true); else f.moveTo(d);
    }
  }
  return true;
}
/** Dentro de uma pasta, junta subpastas com o mesmo nome (sem diferenciar maiúsculas e acentos). */
function hpJuntarIguais_(pai) {
  var grupos = {}, it = pai.getFolders();
  while (it.hasNext()) { var f = it.next(), k = hpNorm_(f.getName()); (grupos[k] = grupos[k] || []).push(f); }
  Object.keys(grupos).forEach(function (k) {
    var g = grupos[k]; if (g.length < 2) return;
    /* fica a pasta com nome em letras normais (não tudo maiúsculo) */
    g.sort(function (a, b) { return (a.getName() === a.getName().toUpperCase()) - (b.getName() === b.getName().toUpperCase()); });
    for (var i = 1; i < g.length; i++) hpMesclar_(g[0], g[i]);
  });
}
function hpMesclar_(dest, src) {
  var fs = src.getFiles();
  while (fs.hasNext()) { var f = fs.next(); if (dest.getFilesByName(f.getName()).hasNext()) f.setTrashed(true); else f.moveTo(dest); }
  var ds = src.getFolders();
  while (ds.hasNext()) {
    var d = ds.next(), it = dest.getFolders(), par = null;
    while (it.hasNext()) { var x = it.next(); if (hpNorm_(x.getName()) === hpNorm_(d.getName())) { par = x; break; } }
    if (par) hpMesclar_(par, d); else d.moveTo(dest);
  }
  src.setTrashed(true);
}

/* ---------- situação dos Acordos de Trabalho Voluntário (para o painel) ----------
   Lê a lista do Paxtu (sem baixar PDFs) e grava na aba Adultos, coluna AT (46),
   o fim do acordo mais recente de cada adulto, ou "Pendente" se o mais recente não foi assinado. */
function atualizarSituacaoAcordos_() {
  var jar = paxtuSessao_(), tk = pxToken_(jar), AJ = { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json', 'X-CSRF-TOKEN': tk };
  var porNome = {}, pg = 1;
  while (pg <= 60) {
    var j = JSON.parse(req_(jar, PAXTU + '/associado/carregar-voluntario?page=' + pg, { headers: AJ }).getContentText());
    var rows = String(j.html || '').match(/<tr[\s\S]*?<\/tr>/g) || [];
    if (!rows.length) break;
    rows.forEach(function (tr) {
      var c = (tr.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || []).map(function (x) { return hpLimpaTexto_(x.replace(/<[^>]+>/g, '')); });
      if (c.length < 6 || !c[1]) return;
      var ini = pxData_(c[4]), fim = pxData_(c[5]), k = hpNorm_(c[1]), atual = porNome[k];
      if (!atual || (ini && (!atual.ini || ini > atual.ini))) porNome[k] = { st: c[0], ini: ini, fim: fim };
    });
    pg++;
  }
  var sh = SpreadsheetApp.getActive().getSheetByName('Adultos'), n = sh.getLastRow() - 4; if (n < 1) return;
  if (sh.getMaxColumns() < 46) sh.insertColumnsAfter(sh.getMaxColumns(), 46 - sh.getMaxColumns());
  var cab = sh.getRange(4, 46);
  if (cab.getValue() && cab.getValue() !== 'Acordo voluntário (fim)') throw new Error('A coluna AT da aba Adultos já está em uso: ' + cab.getValue());
  if (!cab.getValue()) cab.setValue('Acordo voluntário (fim)').setFontWeight('bold').setBackground('#00853e').setFontColor('#ffffff').setWrap(true);
  var nomes = sh.getRange(5, 2, n, 1).getDisplayValues(), out = nomes.map(function (r) {
    var a = porNome[hpNorm_(r[0])]; if (!a) return [''];
    if (!/Assinado/i.test(a.st)) return ['Pendente'];
    return [a.fim || ''];
  });
  sh.getRange(5, 46, n, 1).setValues(out).setNumberFormat('dd/MM/yyyy');
  PropertiesService.getScriptProperties().setProperty('ACORDOS_SYNC', Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm'));
  Logger.log('Acordos: ' + Object.keys(porNome).length + ' pessoas na lista do Paxtu.');
}
function hpLimpaTexto_(s) { return String(s || '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim(); }
