/* ===== Anos de boas atividades: certificado automático no aniversário da Promessa =====
   - atualizarPromessas(): lê do Paxtu a data da Promessa (calculada pelo "Tempo no Movimento") e os anos
     com registro de cada jovem e adulto, e guarda na aba "Promessas". Roda toda semana.
   - verificarEstrelas(): roda todo dia. O lote do mês fecha 5 dias antes da primeira atividade do grupo
     no mês (aba Calendário, "Grupo participa?" = Sim). Sem atividade: último dia útil do mês anterior.
     Gera os certificados dos aniversários de Promessa do mês, um lote por seção, e manda por e-mail
     ao Chefe de Seção (e-mail Escoteiros do Brasil da aba Acessos; se não tiver, o e-mail do Paxtu).
     Adultos vão num lote para o Diretor Presidente.
   - Anos contados: anos completos desde a Promessa, limitado aos anos com registro ativo no Paxtu.
   - Antes de 2027 (modo teste) os lotes vão só para a dona do painel, para conferência. */
var ABA_PROM = 'Promessas';

var CAB_PROM = ['Registro', 'Nome', 'Tipo', 'Seção', 'Data da Promessa (Paxtu)', 'Anos com registro', 'E-mail no Paxtu', 'Atualizado em', 'Base da contagem'];

var DIAS_SEM = ['Domingo', '2ª Feira', '3ª Feira', '4ª Feira', '5ª Feira', '6ª Feira', 'Sábado'];

function linhaCab_(sh, rotulo) {
  var n = Math.min(8, sh.getLastRow()); if (n < 1) return 0;
  var v = sh.getRange(1, 1, n, 1).getDisplayValues();
  for (var i = 0; i < v.length; i++) if (String(v[i][0]).trim() === rotulo) return i + 1;
  return 0;
}

function dadosAba_(nome, rotulo, brutos) {
  var sh = SpreadsheetApp.getActive().getSheetByName(nome); if (!sh) return [];
  var h = linhaCab_(sh, rotulo); if (!h || sh.getLastRow() <= h) return [];
  var r = sh.getRange(h + 1, 1, sh.getLastRow() - h, sh.getLastColumn());
  return brutos ? r.getValues() : r.getDisplayValues();
}

function soNum_(v) { return String(v || '').replace(/\D/g, ''); }

function dataBr_(d) { return Utilities.formatDate(d, 'America/Sao_Paulo', 'dd/MM/yyyy') + ' (' + DIAS_SEM[d.getDay()] + ')'; }

function pxPromessa_(html) {
  var t = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  var o = { data: null, anos: [], email: '', base: '' };
  var m = t.match(/Tempo no Movimento Escoteiro:\s*(\d+) anos?, (\d+) m[eê]s(?:es)? e (\d+) dias?/);
  if (m) {
    var d = new Date(); d.setHours(12, 0, 0, 0);
    d.setFullYear(d.getFullYear() - (+m[1])); d.setMonth(d.getMonth() - (+m[2])); d.setDate(d.getDate() - (+m[3]));
    o.data = d; o.base = 'Promessa';
  }
  if (!o.data) { var ad = pxData_(pxCampo_(html, 'admission-date') || (((html.match(/<input[^>]*name="admission-date"[^>]*>/) || [''])[0].match(/value="([^"]*)"/) || [])[1])); if (ad instanceof Date && !isNaN(ad)) { o.data = ad; o.base = 'Registro'; } }
  var a = t.indexOf('Ano Região Grupo Isento');
  if (a >= 0) { var seg = t.slice(a, a + 2000), r = /\b(19\d\d|20\d\d) [A-Z]{2} \d+ (Sim|Não)/g, x; while ((x = r.exec(seg))) if (o.anos.indexOf(+x[1]) < 0) o.anos.push(+x[1]); }
  var e = (html.match(/<input[^>]*mail[^>]*>/gi) || []).map(function (s) { return (s.match(/value="([^"]*@[^"]*)"/) || [])[1] || ''; }).filter(String);
  o.email = e[0] || '';
  if (!o.data) {
    var ve = pxData_(pxCampo_(html, 'registry-expiration-date'));
    if (ve instanceof Date && !isNaN(ve)) { ve.setFullYear(o.anos.length ? Math.min.apply(null, o.anos) : ve.getFullYear() - 1); o.data = ve; o.base = 'Registro'; }
  }
  return o;
}

function pessoasPromessa_() {
  var L = [];
  dadosAba_('Jovens', 'Reg').forEach(function (r) { if (soNum_(r[0]) && r[10] !== 'Sim') L.push([soNum_(r[0]), r[1], 'Jovem', r[3], r[2]]); });
  dadosAba_('Adultos', 'Registro').forEach(function (r) {
    if (!soNum_(r[0])) return;
    var t = /dirigente/i.test(r[2]) && !/escotista/i.test(r[5]) ? 'Dirigente' : 'Escotista'; L.push([soNum_(r[0]), r[1], t, 'Adultos', t, r[21]]);
  });
  return L;
}

/* Lê do Paxtu (em partes, continua sozinho se passar do tempo) */
function atualizarPromessas() {
  var ini = Date.now(), sp = PropertiesService.getScriptProperties(), ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(ABA_PROM);
  if (!sh) { sh = ss.insertSheet(ABA_PROM); sh.getRange(1, 1, 1, CAB_PROM.length).setValues([CAB_PROM]).setFontWeight('bold').setBackground('#00853e').setFontColor('#ffffff'); sh.setFrozenRows(1); }
  sh.getRange(1, 1, 1, CAB_PROM.length).setValues([CAB_PROM]).setFontWeight('bold').setBackground('#00853e').setFontColor('#ffffff');
  var P = pessoasPromessa_(), i0 = +(sp.getProperty('PROM_IDX') || 0); if (i0 >= P.length) i0 = 0;
  var linhas = {}, n = sh.getLastRow();
  if (n > 1) sh.getRange(2, 1, n - 1, 1).getDisplayValues().forEach(function (r, i) { linhas[soNum_(r[0])] = i + 2; });
  var jar = paxtuSessao_(), tk = pxToken_(jar);
  for (var i = i0; i < P.length; i++) {
    if (Date.now() - ini > 270000) { sp.setProperty('PROM_IDX', String(i)); apagarTriggers_('continuarPromessas_'); ScriptApp.newTrigger('continuarPromessas_').timeBased().after(60 * 1000).create(); return; }
    var p = P[i], c = pxCodigo_(jar, p[0]); if (!c) continue;
    var o = pxPromessa_(pxPerfil_(jar, c, tk));
    var row = [p[0], p[1], p[2], p[3], o.data || '', o.anos.sort().join(', '), o.email, new Date(), o.base];
    var ln = linhas[p[0]]; if (!ln) { ln = sh.getLastRow() + 1; linhas[p[0]] = ln; }
    else if (!o.data) { var ant = sh.getRange(ln, 1, 1, 9).getValues()[0]; if (ant[4] instanceof Date) { row[4] = ant[4]; row[8] = ant[8] || 'Registro'; } var ja = String(ant[5]).split(',').map(function (y) { return +y; }).filter(Boolean); o.anos.forEach(function (y) { if (ja.indexOf(y) < 0) ja.push(y); }); row[5] = ja.sort().join(', '); }
    sh.getRange(ln, 1, 1, row.length).setValues([row]);
  }
  try { completarComRegistro_(sh, jar, tk); } catch (e) { console.log('completarComRegistro_: ' + e); }
  sh.getRange(2, 5, Math.max(1, sh.getLastRow() - 1), 1).setNumberFormat('dd/MM/yyyy');
  sh.getRange(2, 8, Math.max(1, sh.getLastRow() - 1), 1).setNumberFormat('dd/MM/yyyy HH:mm');
  sp.setProperties({ PROM_IDX: '0', PROM_SYNC: Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm') });
  apagarTriggers_('continuarPromessas_');
}

function continuarPromessas_() { atualizarPromessas(); }

/* Data em que o lote do mês fecha */
function fechamentoLote_(ano, mes) {
  var cal = dadosAba_('Calendário', 'Início', true), prim = null;
  cal.forEach(function (r) {
    var d = r[0] instanceof Date ? r[0] : null; if (!d || d.getFullYear() !== ano || d.getMonth() !== mes) return;
    if (String(r[9]).trim() !== 'Sim' || /comemorativa|feriado/i.test(r[8])) return;
    if (!prim || d < prim.data) prim = { data: d, atv: r[2] };
  });
  var f;
  if (prim) { f = new Date(prim.data); f.setDate(f.getDate() - 5); }
  else { f = new Date(ano, mes, 0); while (f.getDay() === 0 || f.getDay() === 6) f.setDate(f.getDate() - 1); }
  f.setHours(0, 0, 0, 0);
  return { fecha: f, primeira: prim };
}

/* Monta os lotes de um mês (sem gerar nada) */
function lotesDoMes_(ano, mes) {
  var ativos = {}; pessoasPromessa_().forEach(function (p) { ativos[p[0]] = p; });
  var lotes = {}, semData = {};
  dadosAba_(ABA_PROM, 'Registro', true).forEach(function (r) {
    var reg = soNum_(r[0]), p = ativos[reg]; if (!p) return;
    var sec = p[3] || 'Sem seção', d = r[4] instanceof Date ? r[4] : null;
    if (!d) { (semData[sec] = semData[sec] || []).push(p[1]); return; }
    if (d.getMonth() !== mes) return;
    var anosReg = String(r[5]).split(',').map(function (x) { return +x; }).filter(function (y) { return y > d.getFullYear() && y <= ano; }).length;
    var N = Math.min(ano - d.getFullYear(), anosReg); if (N < 1) return;
    (lotes[sec] = lotes[sec] || []).push({ reg: reg, nome: p[1], trat: p[2], ramo: p[4] || '', apf: p[5] || '', base: r[8] || 'Promessa', anos: N, promessa: d, dataCert: new Date(ano, mes, Math.min(d.getDate(), new Date(ano, mes + 1, 0).getDate())) });
  });
  return { lotes: lotes, semData: semData };
}

function emailsDe_(nomesOuRegs) {
  var ac = dadosAba_('Acessos', 'Nome'), pr = dadosAba_(ABA_PROM, 'Registro'), out = [];
  nomesOuRegs.forEach(function (x) {
    var alvo = String(x).trim(); if (!alvo) return;
    var a = ac.filter(function (r) { return soNum_(r[1]) === soNum_(alvo) || semAcento_(r[0]).toLowerCase() === semAcento_(alvo).toLowerCase(); })[0];
    var em = a && /@/.test(a[3]) ? a[3].trim() : '';
    if (!em) { var reg = a ? soNum_(a[1]) : soNum_(alvo); var p = pr.filter(function (r) { return soNum_(r[0]) === reg && reg; })[0]; if (p && /@/.test(p[6])) em = p[6].trim(); }
    if (em && out.indexOf(em) < 0) out.push(em);
  });
  return out;
}

function destinatarios_(sec) {
  if (sec === 'Adultos') {
    var regs = dadosAba_('Adultos', 'Registro').filter(function (r) { return /Diretor Presidente/i.test([r[3], r[6], r[8]].join(' ')); }).map(function (r) { return r[0]; });
    return emailsDe_(regs);
  }
  var s = dadosAba_('Seções', 'Seção').filter(function (r) { return String(r[0]).trim() === sec; })[0];
  return s ? emailsDe_(String(s[4]).split(/[,;\/\n]| e /)) : [];
}

/* Gera e grava no livro, sem a checagem de acesso do painel (uso interno, por gatilho) */
function emitirLote_(itens, autor) {
  var agora = new Date(), ano = agora.getFullYear(), teste = ano < CERT_ANO_INICIO;
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    var sh = abaLivro_(teste ? ABA_LIVRO_TESTE : ABA_LIVRO), ult = 0, n = sh.getLastRow();
    if (n > 1) sh.getRange(2, 2, n - 1, 2).getValues().forEach(function (r) { if (Number(r[0]) === ano) ult = Math.max(ult, Number(r[1]) || 0); });
    var linhas = itens.map(function (x, i) {
      var seq = ult + i + 1;
      return { numero: (teste ? 'TESTE ' : '') + ('00' + seq).slice(-3) + '/' + ano, seq: seq, nome: String(x.nome).trim().toUpperCase(), reg: x.reg, trat: x.trat,
        tipo: 'Conquista', desc: (x.anos === 1 ? '1 Ano de Boas Atividades' : x.anos + ' Anos de Boas Atividades') + (x.ramo ? (/Escotista|Dirigente/.test(x.ramo) ? ' (' + x.ramo + ')' : ' (Ramo ' + x.ramo + ')') : ''), dataAtiv: '', data: x.dataCert };
    });
    var pdf = montarPdfCertificados_(linhas, 'Certificados ' + linhas[0].numero.replace('/', '-') + (linhas.length > 1 ? ' a ' + linhas[linhas.length - 1].numero.split(' ').pop().replace('/', '-') : ''));
    var arq = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('CERT_PASTA_ID')).createFile(pdf);
    sh.getRange(sh.getLastRow() + 1, 1, linhas.length, CAB_LIVRO.length).setValues(linhas.map(function (l) {
      return [l.numero, ano, l.seq, l.nome, l.reg, l.trat, l.tipo, l.desc, l.dataAtiv, l.data, autor, agora, arq.getUrl()];
    }));
    sh.getRange(2, 10, sh.getLastRow() - 1, 1).setNumberFormat('dd/MM/yyyy');
    sh.getRange(2, 12, sh.getLastRow() - 1, 1).setNumberFormat('dd/MM/yyyy HH:mm');
    return { teste: teste, linhas: linhas, pdf: pdf, arq: arq };
  } finally { lock.releaseLock(); }
}

function enviarLotes_(ano, mes, simular) {
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var fc = fechamentoLote_(ano, mes), L = lotesDoMes_(ano, mes), dono = Session.getEffectiveUser().getEmail(), log = [];
  var teste = new Date().getFullYear() < CERT_ANO_INICIO;
  Object.keys(L.lotes).sort().forEach(function (sec) {
    var itens = L.lotes[sec], dest = destinatarios_(sec);
    log.push(sec + ': ' + itens.map(function (x) { return x.nome + ' (' + x.anos + ')'; }).join(', ') + ' -> ' + (dest.join(', ') || 'sem e-mail'));
    if (simular) return;
    if (sec === 'Adultos') {
      itens.forEach(function (x) {
        var r = emitirLote_([x], 'Automático (aniversário da Promessa)'), eu = emailsDe_([x.reg]);
        var reais = eu.concat(emailsDe_([x.apf]), dest).filter(function (e, i, a) { return a.indexOf(e) === i; });
        var para = teste || !reais.length ? [dono] : reais;
        var corpo = corpoAuto_('Olá, ' + x.nome + ',', 'Segue o certificado referente aos seus ' + x.anos + (x.anos === 1 ? ' ano' : ' anos') + ' de boas atividades no Movimento Escoteiro, contados desde ' + (x.base === 'Registro' ? 'o seu registro' : 'a sua Promessa') + ' (' + Utilities.formatDate(x.promessa, 'America/Sao_Paulo', 'dd/MM/yyyy') + '). Certificado Nº ' + r.linhas[0].numero + '.',
          (x.base === 'Registro' ? 'A Promessa não está cadastrada no Paxtu: a contagem foi feita pela data de registro.' + (teste ? '\n\n' : '') : '') + (teste ? '[MODO TESTE até 31/12/2026: em produção este e-mail iria para ' + (reais.join(', ') || 'ninguém, pois não há e-mail cadastrado') + '.]' : ''));
        GmailApp.sendEmail(para.join(','), (teste ? '[TESTE] ' : '') + 'Certificado de ' + x.anos + (x.anos === 1 ? ' ano' : ' anos') + ' de boas atividades: ' + x.nome, corpo, { attachments: [r.pdf], name: CONFIG.NOME_PAINEL });
      });
      return;
    }
    for (var k = 0; k < itens.length; k += 40) {
      var parte = itens.slice(k, k + 40), r = emitirLote_(parte, 'Automático (aniversário da Promessa)');
      var para = teste || !dest.length ? [dono] : dest;
      var corpo = corpoAuto_('Olá,', 'Seguem os certificados referentes aos anos de boas atividades dos aniversários de Promessa de ' + MESES[mes] + ' de ' + ano + ' (' + sec + ').',
        (fc.primeira ? 'Sugestão de entrega: primeira atividade do mês, ' + dataBr_(fc.primeira.data) + ', ' + fc.primeira.atv + '.\n\n' : '') +
        parte.map(function (x, i) { return '• ' + x.nome + ': ' + x.anos + (x.anos === 1 ? ' ano' : ' anos') + (x.ramo ? ', ' + x.ramo : '') + ' (' + (x.base === 'Registro' ? 'registro' : 'Promessa') + ' em ' + Utilities.formatDate(x.promessa, 'America/Sao_Paulo', 'dd/MM/yyyy') + ') · Nº ' + r.linhas[i].numero; }).join('\n') +
        '\n\nPelo POR (Estrelas de Atividade), só conta o ano de quem teve mais de 70% de presença nas reuniões e atividades dos últimos 12 meses. O painel não tem a frequência.' +
        '\n\nO certificado já sai com a assinatura do Diretor Presidente. Falta a assinatura do Chefe de Seção.' +
        (parte.some(function (x) { return x.base === 'Registro'; }) ? '\n\nSem Promessa cadastrada no Paxtu (o certificado foi contado pela data de registro; vale cadastrar a Promessa): ' + parte.filter(function (x) { return x.base === 'Registro'; }).map(function (x) { return x.nome; }).join(', ') + '.' : '') +
        (L.semData[sec] && L.semData[sec].length ? '\n\nSem data da Promessa nem de registro no Paxtu (não entram no lote até ser cadastrada): ' + L.semData[sec].join(', ') + '.' : '') +
        (teste ? '\n\n[MODO TESTE até 31/12/2026: em produção este e-mail iria para ' + (dest.join(', ') || 'ninguém, pois não há e-mail cadastrado') + '.]' : '') +
        (!teste && !dest.length ? '\n\n[Não achei o e-mail do Chefe desta seção na aba Acessos nem no Paxtu.]' : ''));
      GmailApp.sendEmail(para.join(','), (teste ? '[TESTE] ' : '') + 'Certificados de anos de atividade: ' + MESES[mes] + '/' + ano + ' - ' + sec, corpo, { attachments: [r.pdf], name: CONFIG.NOME_PAINEL });
    }
  });
  console.log('Lote ' + (mes + 1) + '/' + ano + ' (fecha em ' + dataBr_(fc.fecha) + (simular ? ', simulação' : '') + '):\n' + (log.join('\n') || 'nenhum aniversário de Promessa com registro ativo') +
    '\nSem data da Promessa: ' + Object.keys(L.semData).map(function (s) { return s + ' ' + L.semData[s].length; }).join(', '));
  return log;
}

/* Gatilho diário */
function verificarEstrelas() {
  var sp = PropertiesService.getScriptProperties(), hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  [0, 1].forEach(function (k) {
    var m = new Date(hoje.getFullYear(), hoje.getMonth() + k, 1), chave = 'ESTRELAS_' + m.getFullYear() + '_' + (m.getMonth() + 1);
    if (sp.getProperty(chave)) return;
    var fc = fechamentoLote_(m.getFullYear(), m.getMonth()), fim = new Date(m.getFullYear(), m.getMonth() + 1, 0);
    if (hoje < fc.fecha || hoje > fim) return;
    enviarLotes_(m.getFullYear(), m.getMonth(), false);
    try { enviarAvisos_(false); } catch (e) { console.log('Avisos: ' + e); }
    sp.setProperty(chave, Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm'));
  });
}

/* Simulação do próximo lote (só mostra no registro) */
function simularEstrelas() {
  var h = new Date();
  [0, 1].forEach(function (k) { var m = new Date(h.getFullYear(), h.getMonth() + k, 1); enviarLotes_(m.getFullYear(), m.getMonth(), true); });
}

/* Rodar uma vez: instala os gatilhos (diário às 7h e leitura semanal do Paxtu no domingo) */
function instalarEstrelas() {
  apagarTriggers_('verificarEstrelas'); apagarTriggers_('atualizarPromessas');
  ScriptApp.newTrigger('verificarEstrelas').timeBased().everyDays(1).atHour(7).create();
  ScriptApp.newTrigger('atualizarPromessas').timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(3).create();
  var sp = PropertiesService.getScriptProperties(), h = new Date(); h.setHours(0, 0, 0, 0);
  var fc = fechamentoLote_(h.getFullYear(), h.getMonth());
  if (h >= fc.fecha) sp.setProperty('ESTRELAS_' + h.getFullYear() + '_' + (h.getMonth() + 1), 'pulado na instalação');
  Logger.log('Gatilhos instalados.');
}

function fraseBP_() {
  try {
    var h = HtmlService.createHtmlOutputFromFile('Painel').getContent(), m = h.match(/var FRASES_BP\s*=\s*(\[[\s\S]*?\]);/);
    var L = m ? JSON.parse(m[1]) : []; if (L.length) return L[Math.floor(Math.random() * L.length)];
  } catch (e) {}
  return 'Deixe o mundo um pouco melhor do que você o encontrou.';
}

function corpoAuto_(saudacao, referente, meio) {
  return saudacao + '\n\n' + referente + (meio ? '\n\n' + meio : '') +
    '\n\nEste certificado foi gerado pelo sistema e pode haver erros: confira as informações antes de entregar.' +
    '\n\nEste é um e-mail automático do Painel de Acompanhamento do Adulto Voluntário - ' + CONFIG.NOME_CURTO + '.' +
    '\n\n"' + fraseBP_() + '" (Baden-Powell)';
}

/* Recomeça a leitura do Paxtu do zero */
function reiniciarPromessas() { apagarTriggers_('continuarPromessas_'); PropertiesService.getScriptProperties().setProperty('PROM_IDX', '0'); atualizarPromessas(); }

/* Primeiro registro de cada um, pelo relatório "Vigência do seguro" do Paxtu (todos os anos) */
function pxPrimeiroRegistro_(jar, tk) {
  var mapa = {}, hoje = new Date().getFullYear();
  for (var ano = 2005; ano <= hoje; ano++) {
    var p = 'reportType=associados&filters=' + encodeURIComponent('Vigência do seguro') + '&status=S&profession=Todos&year%5B%5D=' + ano;
    for (var m = 1; m <= 12; m++) p += '&month%5B%5D=' + m;
    var r = req_(jar, PAXTU + '/relatorios/consulta', { method: 'post', payload: p, headers: { 'X-CSRF-TOKEN': tk, 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' } });
    var j = {}; try { j = JSON.parse(r.getContentText()); } catch (e) { continue; }
    (j.retorno || []).forEach(function (x) {
      var reg = String(x.Registro || '').split('-')[0].replace(/\D/g, ''); if (!reg || !x.Data_Inicio) return;
      var f = String(x.Data_Inicio).split('-'), d = new Date(+f[0], +f[1] - 1, +f[2], 12);
      var o = mapa[reg] = mapa[reg] || { ini: null, anos: [] };
      if (!o.ini || d < o.ini) o.ini = d;
      if (o.anos.indexOf(ano) < 0) o.anos.push(ano);
    });
  }
  return mapa;
}

function completarComRegistro_(sh, jar, tk) {
  var n = sh.getLastRow(); if (n < 2) return;
  var mapa = pxPrimeiroRegistro_(jar, tk), v = sh.getRange(2, 1, n - 1, 9).getValues(), mud = 0;
  v.forEach(function (r) {
    var o = mapa[String(r[0]).replace(/\D/g, '')]; if (!o) return;
    if (!(r[4] instanceof Date) && o.ini) { r[4] = o.ini; r[8] = 'Registro'; mud++; }
    var ja = String(r[5]).split(',').map(function (y) { return +y; }).filter(Boolean);
    o.anos.forEach(function (y) { if (ja.indexOf(y) < 0) ja.push(y); });
    r[5] = ja.sort().join(', ');
  });
  sh.getRange(2, 1, v.length, 9).setValues(v);
  console.log('Relatório de registro: ' + Object.keys(mapa).length + ' pessoas; ' + mud + ' datas completadas pelo primeiro registro.');
}

/* Só completa com o relatório, sem reler os perfis */
function completarRegistros() { var jar = paxtuSessao_(), sh = SpreadsheetApp.getActive().getSheetByName(ABA_PROM); completarComRegistro_(sh, jar, pxToken_(jar)); }

/* Teste: gera e envia agora o lote do próximo mês (no modo teste vai só para a dona do painel) */
function testarEnvioEstrelas() { var h = new Date(), m = new Date(h.getFullYear(), h.getMonth() + 1, 1); enviarLotes_(m.getFullYear(), m.getMonth(), false); }

function verEmailEnvio() {
  var eu = Session.getEffectiveUser().getEmail();
  GmailApp.sendEmail(eu, '[TESTE] ' + CONFIG.NOME_PAINEL + ': teste de envio', 'Teste de envio do ' + CONFIG.NOME_PAINEL + ' pelo Gmail.', { name: CONFIG.NOME_PAINEL });
  console.log('Enviado pelo Gmail para ' + eu);
}

/* ===== Avisos mensais (mesmo dia do lote de certificados) =====
   1. Promessa sem data no Paxtu: um e-mail por seção ao Chefe de Seção.
   2. Jovens sem seção: um e-mail ao Diretor Presidente e ao Diretor de Métodos Educativos.
   3. Jovens em transição: um e-mail por seção, com quem vai sair (para o chefe atual)
      e quem pode chegar (para os chefes de todas as seções do próximo ramo). */
function regsPorFuncao_(re) {
  return dadosAba_('Adultos', 'Registro').filter(function (r) { return re.test([r[3], r[6], r[8]].join(' ')); }).map(function (r) { return r[0]; });
}

function norm_(s) { return semAcento_(String(s || '')).toLowerCase().trim(); }

function enviarAviso_(para, assunto, saudacao, referente, meio, simular, log) {
  var teste = new Date().getFullYear() < CERT_ANO_INICIO, dono = Session.getEffectiveUser().getEmail();
  log.push(assunto + ' -> ' + (para.join(', ') || 'sem e-mail'));
  if (simular) return;
  var dest = teste || !para.length ? [dono] : para;
  var corpo = saudacao + '\n\n' + referente + (meio ? '\n\n' + meio : '') +
    (teste ? '\n\n[MODO TESTE até 31/12/2026: em produção este e-mail iria para ' + (para.join(', ') || 'ninguém, pois não há e-mail cadastrado') + '.]' : '') +
    (!teste && !para.length ? '\n\n[Não achei o e-mail do destinatário na aba Acessos nem no Paxtu.]' : '') +
    '\n\nAs informações vêm do Paxtu e podem ter erros: confira antes de agir.' +
    '\n\nEste é um e-mail automático do Painel de Acompanhamento do Adulto Voluntário - ' + CONFIG.NOME_CURTO + '.' +
    '\n\n"' + fraseBP_() + '" (Baden-Powell)';
  GmailApp.sendEmail(dest.join(','), (teste ? '[TESTE] ' : '') + assunto, corpo, { name: CONFIG.NOME_PAINEL });
}

function enviarAvisos_(simular) {
  var log = [], jov = dadosAba_('Jovens', 'Reg').filter(function (r) { return soNum_(r[0]) && r[10] !== 'Sim'; });
  var secoes = dadosAba_('Seções', 'Seção').filter(function (r) { return String(r[0]).trim(); });
  var semSecao = function (s) { return !String(s || '').trim() || /sem se[cç][aã]o/i.test(s); };

  // 1. Promessa sem data
  var prom = {}; dadosAba_(ABA_PROM, 'Registro', true).forEach(function (r) { prom[soNum_(r[0])] = r; });
  var semProm = {};
  jov.forEach(function (j) {
    if (/filhote/i.test(j[2]) || semSecao(j[3])) return; // Filhotes não fazem Promessa
    var p = prom[soNum_(j[0])], temProm = p && p[4] instanceof Date && String(p[8] || 'Promessa') === 'Promessa';
    if (!temProm) (semProm[j[3]] = semProm[j[3]] || []).push(j[1] + (p && p[4] instanceof Date ? ' (contando pelo registro)' : ' (sem data nenhuma)'));
  });
  Object.keys(semProm).sort().forEach(function (sec) {
    enviarAviso_(destinatarios_(sec), 'Promessa sem data no Paxtu: ' + sec, 'Olá,',
      'Segue a lista de jovens da ' + sec + ' sem a data da Promessa cadastrada no Paxtu.',
      semProm[sec].map(function (n) { return '• ' + n; }).join('\n') +
      '\n\nEnquanto a data não for cadastrada, o certificado de anos de atividade é contado pela data de registro. Para corrigir, cadastre a data da Promessa no perfil do jovem no Paxtu.', simular, log);
  });

  // 2. Jovens sem seção
  var ss = jov.filter(function (j) { return semSecao(j[3]); });
  if (ss.length) {
    enviarAviso_(emailsDe_(regsPorFuncao_(/Diretor Presidente|M[eé]todos Educativos/i)), 'Jovens sem seção no Paxtu', 'Olá,',
      'Segue a lista de jovens ativos que estão sem seção no Paxtu.',
      ss.map(function (j) { return '• ' + j[1] + (j[2] ? ' (' + j[2] + ')' : '') + (j[6] ? ', ' + j[6] : ''); }).join('\n') +
      '\n\nSem seção, o jovem não aparece para nenhum chefe e não entra nos lotes de certificados. Para corrigir, vincule o jovem à seção no Paxtu.', simular, log);
  }

  // 3. Jovens em transição
  var TRANS = /Iniciar Caminho|janela de passagem|Passagem atrasada|Preparar Partida|Acima da idade/i;
  var sai = {}, chega = {};
  jov.forEach(function (j) {
    if (!TRANS.test(j[7]) || semSecao(j[3])) return;
    var linha = j[1] + ' (' + j[3] + ', ' + j[6] + '): ' + j[7] + (j[8] ? ', passagem a partir de ' + j[8] : '') + (j[9] ? ', próximo ramo ' + j[9] : '');
    (sai[j[3]] = sai[j[3]] || []).push(linha);
    if (j[9]) secoes.filter(function (s) { var a = norm_(s[2]), b = norm_(j[9]); return a && b && (a.indexOf(b) >= 0 || b.indexOf(a) >= 0); })
      .forEach(function (s) { if (String(s[0]).trim() !== String(j[3]).trim()) (chega[s[0]] = chega[s[0]] || []).push(linha); });
  });
  var todas = Object.keys(sai).concat(Object.keys(chega)).filter(function (s, i, a) { return a.indexOf(s) === i; }).sort();
  todas.forEach(function (sec) {
    var m = '';
    if (sai[sec]) m += 'Jovens da sua seção em transição (podem sair):\n' + sai[sec].map(function (n) { return '• ' + n; }).join('\n');
    if (chega[sec]) m += (m ? '\n\n' : '') + 'Jovens de outras seções que podem chegar para vocês (o jovem pode escolher entre as seções do ramo, por isso todos os chefes do ramo recebem):\n' + chega[sec].map(function (n) { return '• ' + n; }).join('\n');
    enviarAviso_(destinatarios_(sec), 'Jovens em transição: ' + sec, 'Olá,',
      'Segue a situação de passagem de ramo que envolve a ' + sec + '.', m +
      '\n\nCombinem entre as seções o Caminho e a cerimônia de passagem.', simular, log);
  });

  console.log('Avisos' + (simular ? ' (simulação)' : '') + ':\n' + (log.join('\n') || 'nenhum'));
  return log;
}

function simularAvisos() { enviarAvisos_(true); }

function testarAvisos() { enviarAvisos_(false); }
