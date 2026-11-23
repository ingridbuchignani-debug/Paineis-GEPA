
function prepararSaidaAdultos_() {
  var sh = SpreadsheetApp.getActive().getSheetByName('Adultos'), n = sh.getLastRow() - 4;
  sh.getRange(4, 44, 1, 2).setValues([['Saiu do grupo?', 'Observação (saída)']]).setFontWeight('bold').setBackground('#00853e').setFontColor('#ffffff').setWrap(true);
  var v = sh.getRange(5, 44, n, 1).getValues().map(function (r) { return [r[0] || 'Não']; });
  sh.getRange(5, 44, n, 1).setValues(v).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Não', 'Sim'], true).build());
  sh.getRange(5, 44, n, 2).setBackground('#fff8c5');
}

function rodarAgora() { atualizarJovens(); }

/* ===== Validade real do registro (relatório "Vigência do seguro" do Paxtu) ===== */
function pxValidades_(jar, tk) {
  var anoAtual = new Date().getFullYear(), mapa = {};
  [anoAtual - 1, anoAtual].forEach(function (ano) {
    var p = 'reportType=associados&filters=' + encodeURIComponent('Vigência do seguro') + '&status=S&profession=Todos&year%5B%5D=' + ano;
    for (var m = 1; m <= 12; m++) p += '&month%5B%5D=' + m;
    var r = req_(jar, PAXTU + '/relatorios/consulta', { method: 'post', payload: p, headers: { 'X-CSRF-TOKEN': tk, 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' } });
    var j = {}; try { j = JSON.parse(r.getContentText()); } catch (e) { Logger.log('Relatório ' + ano + ': ' + r.getResponseCode()); return; }
    (j.retorno || []).forEach(function (x) {
      var reg = String(x.Registro || '').split('-')[0].replace(/\D/g, ''); if (!reg || !x.Data_Fim) return;
      var f = x.Data_Fim.split('-'), d = new Date(+f[0], +f[1] - 1, +f[2], 12);
      if (!mapa[reg] || d > mapa[reg].fim) mapa[reg] = { fim: d, ini: x.Data_Inicio };
    });
  });
  return mapa;
}

function atualizarValidades_() {
  var jar = paxtuSessao_(), tk = pxToken_(jar), mapa = pxValidades_(jar, tk);
  var sh = SpreadsheetApp.getActive().getSheetByName('Adultos'), n = sh.getLastRow() - 4;
  var regs = sh.getRange(5, 1, n, 1).getDisplayValues(), w = sh.getRange(5, 23, n, 1).getValues(), ach = 0;
  var falta = []; for (var i = 0; i < n; i++) { var m = mapa[String(regs[i][0]).replace(/\D/g, '')]; if (m) { w[i][0] = m.fim; ach++; } else if (regs[i][0]) { falta.push(regs[i][0]); if (w[i][0] instanceof Date) w[i][0] = new Date(w[i][0].getFullYear(), w[i][0].getMonth(), w[i][0].getDate() + (w[i][0].getHours() > 12 ? 1 : 0), 12); } }
  Logger.log('Fora do relatório: ' + falta.join(', ') + ' | exemplos do relatório: ' + Object.keys(mapa).slice(0, 5).join(', '));
  sh.getRange(5, 23, n, 1).setValues(w).setNumberFormat('dd/MM/yyyy');
  PropertiesService.getScriptProperties().setProperty('VALIDADE_SYNC', Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm'));
  Logger.log('Validades: ' + Object.keys(mapa).length + ' no relatório, ' + ach + ' adultos atualizados de ' + n);
}

function instalarAtualizacao2x_() {
  apagarTriggers_('atualizarDoPaxtu'); apagarTriggers_('atualizarJovens');
  [ScriptApp.WeekDay.MONDAY, ScriptApp.WeekDay.THURSDAY].forEach(function (d) {
    ScriptApp.newTrigger('atualizarDoPaxtu').timeBased().onWeekDay(d).atHour(3).inTimezone('America/Sao_Paulo').create();
    ScriptApp.newTrigger('atualizarJovens').timeBased().onWeekDay(d).atHour(5).inTimezone('America/Sao_Paulo').create();
  });
  Logger.log('Gatilhos: ' + ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); }).join(', '));
}


function pxSecoes_(jar) {
  var h = paxtuGet_(jar, '/se%C3%A7%C3%A3o').replace(/<svg[\s\S]*?<\/svg>/g, '');
  var partes = h.split('data-section-id="'), out = [];
  for (var k = 1; k < partes.length; k++) {
    var id = partes[k].match(/^\d+/); if (!id) continue;
    var txt = partes[k].replace(/<[^>]+>/g, ' | ').replace(/\s+/g, ' ');
    var seg = txt.split('|').map(function (s) { return s.trim(); }).filter(function (s) { return s && s !== '"' && !/^\d/.test(s) && !/style=/.test(s); });
    out.push({ id: id[0], nome: seg[0] || '' });
  }
  return out;
}

function corrigirDatasComemorativas_() {
  var sh = SpreadsheetApp.getActive().getSheetByName('Calendário'), n = sh.getLastRow() - 4;
  var v = sh.getRange(5, 1, n, 13).getDisplayValues(), mud = 0;
  var re = /^(Falecimento de Baden-Powell|Carnaval$|Feriado de P[aá]scoa|Feriado de Tiradentes|Independência do Brasil$|Finados$|Aniversário da União dos Escoteiros|Proclamação da República|Consci[eê]ncia negra|Natal$|Dia do Lobinho$|Dia de Nossa Senhora Aparecida)/i;
  for (var i = 0; i < n; i++) {
    if (v[i][3] !== 'Grupo' || !re.test(v[i][2].trim())) continue;
    sh.getRange(5 + i, 9).setValue('Data comemorativa');
    sh.getRange(5 + i, 10).setValue('');
    var ob = v[i][11]; if (!/^Feriado|^Data comemorativa/.test(ob)) sh.getRange(5 + i, 12).setValue('Feriado ou data comemorativa, não é atividade' + (ob ? ' · ' + ob : ''));
    mud++;
  }
  Logger.log('Datas comemorativas ajustadas: ' + mud);
}

// ===== Jovens em transição de ramo (POR 2025, Regra 013) =====
// Ramos: Filhotes 5 a 6 · Lobinho 6,5 a 10 · Escoteiro 11 a 14 · Sênior 15 a 17 · Pioneiro 18 a 22 incompletos
// Passagem: Filhote 6,5 a 7 · Lobinho 10 a 11 · Escoteiro 14 a 15 · Sênior aos 18 · Pioneiro sai até os 22
// Caminho (antigo período de transição): até 4 meses antes da passagem
var RAMOS_POR = [
  { id: 5, ramo: 'Filhotes',  ini: 78,  fim: 84,  prox: 'Lobinho' },
  { id: 2, ramo: 'Lobinho',   ini: 120, fim: 132, prox: 'Escoteiro' },
  { id: 1, ramo: 'Escoteiro', ini: 168, fim: 180, prox: 'Sênior' },
  { id: 3, ramo: 'Sênior',    ini: 216, fim: 216, prox: 'Pioneiro' },
  { id: 4, ramo: 'Pioneiro',  ini: 258, fim: 264, prox: 'Partida (adulto voluntário)' }
];

var CAMINHO_MESES = 4;

function mesesIdade_(n, h) { var m = (h.getFullYear() - n.getFullYear()) * 12 + (h.getMonth() - n.getMonth()); if (h.getDate() < n.getDate()) m--; return m; }

function addMeses_(d, m) { var x = new Date(d.getTime()); x.setMonth(x.getMonth() + m); return x; }

function situacaoTransicao_(r, meses) {
  if (r.ramo === 'Pioneiro') {
    if (meses >= r.fim) return 'Acima da idade do ramo';
    if (meses >= r.ini) return 'Preparar Partida';
    return 'No ramo';
  }
  if (r.ini === r.fim) { if (meses >= r.fim) return 'Passagem atrasada'; }
  else { if (meses >= r.fim) return 'Passagem atrasada'; if (meses >= r.ini) return 'Na janela de passagem'; }
  if (meses >= r.ini - CAMINHO_MESES) return 'Iniciar Caminho';
  if (meses < r.ini - 12 * (r.ramo === 'Filhotes' ? 2 : 5)) return 'Abaixo da idade do ramo';
  return 'No ramo';
}

function pxJovensRamo_(jar, branchId) {
  var vistos = {}, out = [];
  for (var page = 1; page <= 40; page++) {
    var r = req_(jar, PAXTU + '/associado/associado/lista/carregar?category=1&branch_id=' + branchId + '&status=S&page=' + page, { headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' } });
    var j = {}; try { j = JSON.parse(r.getContentText()); } catch (e) { break; }
    var partes = (j.html || '').split('data-bs-associate="'), novos = 0;
    for (var k = 1; k < partes.length; k++) {
      var cod = partes[k].match(/^\d+/); if (!cod) continue;
      var ja = vistos[cod[0]]; if (ja && ja.nome) continue;
      var txt = partes[k].replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' | ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
      var seg = txt.split('|').map(function (s) { return s.trim(); }).filter(function (s) { return s; });
      var ir = -1; for (var q = 0; q < seg.length; q++) { if (/^Registro/.test(seg[q])) { ir = q; break; } }
      var mreg = ir >= 0 ? (seg[ir] + ' ' + (seg[ir + 1] || '')).match(/(\d{4,})/) : null;
      var nm = ir > 0 ? seg[ir - 1] : '', rg = mreg ? mreg[1] : '';
      if (ja) { ja.nome = nm; ja.reg = rg; continue; }
      var o = { cod: cod[0], nome: nm, reg: rg }; vistos[cod[0]] = o; out.push(o); novos++;
    }
    if (!novos) break;
  }
  return out;
}

function pxMapaSecoes_(jar, tk) {
  var h = paxtuGet_(jar, '/se%C3%A7%C3%A3o').replace(/<svg[\s\S]*?<\/svg>/g, '');
  var partes = h.split('data-section-id="'), secs = [];
  for (var k = 1; k < partes.length; k++) {
    var id = partes[k].match(/^\d+/); if (!id) continue;
    var seg = partes[k].replace(/<[^>]+>/g, ' | ').replace(/\s+/g, ' ').split('|').map(function (s) { return s.trim(); }).filter(function (s) { return s && !/^"|style=|^\d/.test(s); });
    var nj = (partes[k].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').match(/Jovens:\s*(\d+)/) || [])[1];
    secs.push({ id: id[0], nome: seg[0] || '', jovens: +nj || 0 });
  }
  var mapa = {};
  secs.forEach(function (s) {
    var d = req_(jar, PAXTU + '/se%C3%A7%C3%A3o/detalhes', { method: 'post', payload: { id: s.id, _token: tk } }).getContentText();
    var sl = d.match(/<select[^>]*id="selectSectionLeader"[^>]*>([\s\S]*?)<\/select>/); s.escotistas = sl ? (sl[1].match(/<option[^>]*>([^<]*)<\/option>/g) || []).map(function (o) { return o.replace(/<[^>]+>/g, '').trim(); }).filter(function (n) { return n && !/^Sem chefe/i.test(n); }) : [];
    var ch = d.match(/<option[^>]*selected[^>]*>([^<]*)<\/option>/); s.chefe = ''; (d.match(/<select[^>]*id="selectSectionLeader"[\s\S]*?<\/select>/) || [''])[0].replace(/<option[^>]*selected[^>]*>([^<]*)</, function (m0, n) { if (!/^Sem chefe/i.test(n.trim())) s.chefe = n.trim(); return m0; });
    var times = (d.match(/data-team-id="(\d+)"/g) || []).map(function (x) { return x.match(/\d+/)[0]; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
    times.forEach(function (t) {
      try {
        var j = JSON.parse(req_(jar, PAXTU + '/se%C3%A7%C3%A3o/equipe', { method: 'post', payload: { team_id: t, _token: tk }, headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' } }).getContentText());
        if (j.team && j.team.fl_ativa === 'N') return;
        (j.members || []).forEach(function (m) { mapa[String(m.cd_associado)] = { secao: s.nome, equipe: (j.team || {}).nm_equipe || '' }; });
      } catch (e) {}
    });
  });
  return { secs: secs, mapa: mapa };
}

function ramoDaSecao_(nome) {
  var n = String(nome).toLowerCase();
  if (/ninhada/.test(n)) return 'Filhotes'; if (/alcateia/.test(n)) return 'Lobinho'; if (/s[eê]nior/.test(n)) return 'Sênior';
  if (/cl[ãa]|pioneiro/.test(n)) return 'Pioneiro'; if (/tropa/.test(n)) return 'Escoteiro'; return '';
}

function turnoPadrao_(nome) {
  var n = String(nome).toLowerCase();
  if (/ninhada|ibitipoca|kaiow/.test(n)) return 'Manhã';
  if (/taquara|princesa|ybytu|peabiru/.test(n)) return 'Tarde';
  if (/cl[ãa]|pioneiro/.test(n)) return 'Sem horário fixo';
  return '';
}

function gravarSecoes_(secs) {
  if (!secs || !secs.length) return;
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName('Seções') || ss.insertSheet('Seções'), antes = {};
  if (sh.getLastRow() > 3) sh.getRange(4, 1, sh.getLastRow() - 3, 2).getDisplayValues().forEach(function (r) { if (r[0]) antes[r[0]] = r[1]; });
  var linhas = secs.map(function (s) { return [s.nome, antes[s.nome] || turnoPadrao_(s.nome), ramoDaSecao_(s.nome), s.jovens, s.chefe || '', (s.escotistas || []).join('; ')]; });
  sh.clear(); sh.getDataRange().clearDataValidations();
  sh.getRange(1, 1).setValue('Seções do grupo no Paxtu · turnos e escotistas').setFontWeight('bold');
  sh.getRange(2, 1).setValue('A coluna Turno pode ser editada (Manhã, Tarde ou Sem horário fixo) e é mantida nas atualizações. Escotistas vêm do menu Seção do Paxtu.').setFontStyle('italic');
  sh.getRange(3, 1, 1, 6).setValues([['Seção', 'Turno', 'Ramo', 'Jovens', 'Chefe de Seção', 'Escotistas']]).setFontWeight('bold').setBackground('#00853e').setFontColor('#ffffff');
  sh.getRange(4, 1, linhas.length, 6).setValues(linhas);
  sh.getRange(4, 2, linhas.length, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Manhã', 'Tarde', 'Sem horário fixo'], true).build()).setBackground('#fff8c5');
  sh.setFrozenRows(3); sh.autoResizeColumns(1, 5);
}

function atualizarJovens() {
  var jar = paxtuSessao_(), tok = pxToken_(jar), hoje = new Date(), linhas = [], todos = [];
  var MS = { secs: [], mapa: {} }; try { MS = pxMapaSecoes_(jar, tok); } catch (e) { Logger.log('Seções: ' + e); }
  var secUnica = function (ramo) { var s = MS.secs.filter(function (x) { return ramoDaSecao_(x.nome) === ramo && x.jovens > 0; }); return s.length === 1 ? s[0].nome : ''; };
  var secDe = function (jv) { var m = MS.mapa[jv.cod]; if (m) return [m.secao, m.equipe]; var u = secUnica(jv.r.ramo); return u ? [u, 'Sem patrulha/matilha no Paxtu'] : ['Sem seção no Paxtu', '']; };
  RAMOS_POR.forEach(function (r) { pxJovensRamo_(jar, r.id).forEach(function (j) { j.r = r; todos.push(j); }); });
  var url = PAXTU + '/associado/perfil', ck = cookieHeader_(jar, hostDe_(url));
  for (var i = 0; i < todos.length; i += 15) {
    var lote = todos.slice(i, i + 15);
    var resp = UrlFetchApp.fetchAll(lote.map(function (j) { return { url: url, method: 'post', muteHttpExceptions: true, followRedirects: false, headers: { 'Cookie': ck, 'User-Agent': 'Mozilla/5.0 PainelEscoteiro' }, payload: { associate_code: j.cod, _token: tok } }; }));
    lote.forEach(function (jv, k) {
      var r = jv.r, p = resp[k].getContentText(), bd = pxCampo_(p, 'birthdate'), mb = bd.match(/^(\d{4})-(\d{2})-(\d{2})/), n = mb ? new Date(+mb[1], mb[2] - 1, +mb[3]) : null;
      var sc = secDe(jv);
      if (!n) { linhas.push([jv.reg, jv.nome, r.ramo, sc[0], sc[1], '', '', 'Sem data de nascimento', '', r.prox]); return; }
      var me = mesesIdade_(n, hoje);
      linhas.push([jv.reg, jv.nome, r.ramo, sc[0], sc[1], n, Math.floor(me / 12) + 'a ' + (me % 12) + 'm', situacaoTransicao_(r, me), addMeses_(n, r.ramo === 'Pioneiro' ? r.fim : r.ini), r.prox]);
    });
  }
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName('Jovens') || ss.insertSheet('Jovens');
  // preserva a marcação manual "Saiu do grupo?" e a observação, pelo registro (ou nome)
  var marca = {};
  if (sh.getLastRow() > 3) { var vv = sh.getRange(3, 1, sh.getLastRow() - 2, sh.getLastColumn()).getDisplayValues(), hd = vv.shift(), cs = hd.indexOf('Saiu do grupo?'), co = hd.indexOf('Observação do grupo'); if (cs >= 0) vv.forEach(function (r) { if (r[cs] === 'Sim' || (co >= 0 && r[co])) marca[r[0] || r[1]] = [r[cs], co >= 0 ? r[co] : '']; }); }
  linhas.forEach(function (l) { var mk = marca[l[0] || l[1]] || ['Não', '']; l.push(mk[0] || 'Não', mk[1]); });
  sh.clear(); sh.getDataRange().clearDataValidations();
  sh.getRange(1, 1).setValue('Jovens em transição de ramo · POR 2025, Regra 013 · atualizado em ' + Utilities.formatDate(hoje, 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm')).setFontWeight('bold');
  var cab = ['Reg', 'Nome', 'Ramo atual', 'Seção', 'Patrulha / Matilha', 'Nascimento', 'Idade', 'Situação', 'Abre a passagem em', 'Próximo ramo', 'Saiu do grupo?', 'Observação do grupo'];
  sh.getRange(3, 1, 1, cab.length).setValues([cab]).setFontWeight('bold').setBackground('#00853e').setFontColor('#ffffff');
  if (linhas.length) sh.getRange(4, 1, linhas.length, cab.length).setValues(linhas);
  sh.getRange('F:F').setNumberFormat('dd/MM/yyyy'); sh.getRange('I:I').setNumberFormat('dd/MM/yyyy');
  if (linhas.length) { sh.getRange(4, 11, linhas.length, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Não', 'Sim'], true).build()); sh.getRange(4, 11, linhas.length, 2).setBackground('#fff8c5'); }
  sh.getRange(2, 1).setValue('Coluna "Saiu do grupo?": marque Sim para quem saiu do grupo mesmo que ainda apareça ativo no Paxtu. A marcação é mantida nas atualizações.').setFontStyle('italic');
  sh.setFrozenRows(3);
  PropertiesService.getScriptProperties().setProperty('JOVENS_SYNC', Utilities.formatDate(hoje, 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm'));
  Logger.log('Jovens: ' + linhas.length);
  try { gravarSecoes_(MS.secs); } catch (e) { Logger.log('Seções: ' + e); }
  try { atualizarValidades_(); } catch (e) { Logger.log('Validades: ' + e); }
}

/**
 * Cria o Formulário de Acompanhamento de Competências ligado a esta planilha.
 * Rodar uma vez: selecione a função criarFormulario e clique em Executar.
 */
var PASTA_ID = CONFIG.PASTA_PAINEL_ID;

var ESSENCIAIS = ["Gestão de mudanças","Relações interpessoais","Trabalho em equipe","Planejamento estratégico","Consciência organizacional","Compromisso","Aprendizagem permanente e desenvolvimento pessoal"];

var ESP_ESCOTISTA = ["Gestão de projetos","Aplicação de jogos e canções","Domínio do Programa Educativo","Campismo e vida ao ar livre","Organização de atividades","Aplicação do sistema de equipes","Operação do sistema de especialidades e insígnias","Envolvimento comunitário","Desenvolvimento sustentável","Segurança","Aplicação do Marco Simbólico","Compreensão do desenvolvimento de crianças, adolescentes e jovens","Condução de cerimônias"];

var ESP_DIRIGENTE = ["Gestão de adultos","Gestão financeira","Gestão administrativa","Gestão de conflitos","Condução de cerimônias","Organização de eventos e atividades","Compreensão do Programa Educativo","Relações institucionais","Comunicação institucional","Governança","Segurança"];

var SITUACAO = ["Desenvolvido","Em desenvolvimento"];

function criarFormulario_() {
  var ss = SpreadsheetApp.getActive();
  var ad = ss.getSheetByName('Adultos');
  var dados = ad.getRange(5, 1, ad.getLastRow() - 4, 22).getValues();
  var adultos = [], apfs = {};
  dados.forEach(function (r) {
    if (r[0] && r[1]) adultos.push(r[1] + ' - ' + r[0]);
    if (r[21]) apfs[r[21]] = true;
  });
  adultos.sort();

  var form = FormApp.create('Acompanhamento de Competências do Adulto Voluntário - ' + CONFIG.NOME_CURTO);
  form.setDescription('Preenchido pelo APF depois da conversa de acompanhamento com o assessorado (pelo menos uma vez por ano, após o Nível Avançado).\n' +
    'Escolha 3 das 7 competências essenciais e 4 competências específicas da linha do adulto e marque a situação de cada uma. Deixe em branco as não escolhidas.');
  form.setCollectEmail(true);
  form.setProgressBar(true);

  // Página 1
  form.addDateItem().setTitle('Data do acompanhamento').setRequired(true);
  form.addListItem().setTitle('Adulto acompanhado').setChoiceValues(adultos).setRequired(true);
  form.addListItem().setTitle('APF').setChoiceValues(Object.keys(apfs).sort().concat(['Outro (escrever nas observações)'])).setRequired(true);
  form.addGridItem().setTitle('Competências essenciais (escolha 3)').setHelpText('Marque somente as 3 competências escolhidas.').setRows(ESSENCIAIS).setColumns(SITUACAO);
  var linha = form.addMultipleChoiceItem().setTitle('Linha de atuação').setRequired(true);

  // Página 2: Escotista
  var pgEsc = form.addPageBreakItem().setTitle('Competências específicas: linha Escotista')
    .setHelpText('Marque somente as 4 competências escolhidas. Para o Ramo Filhotes esta lista é provisória, até sair material próprio.');
  form.addGridItem().setTitle('Competências específicas Escotista (escolha 4)').setRows(ESP_ESCOTISTA).setColumns(SITUACAO);

  // Página 3: Dirigente
  var pgDir = form.addPageBreakItem().setTitle('Competências específicas: linha Dirigente').setHelpText('Marque somente as 4 competências escolhidas.');
  form.addGridItem().setTitle('Competências específicas Dirigente (escolha 4)').setRows(ESP_DIRIGENTE).setColumns(SITUACAO);

  // Página 4: PPF
  var pgFim = form.addPageBreakItem().setTitle('Plano Pessoal de Formação');
  form.addParagraphTextItem().setTitle('Plano Pessoal de Formação').setHelpText('Ações combinadas para as competências em desenvolvimento, com prazo.');
  form.addParagraphTextItem().setTitle('Observações');

  linha.setChoices([linha.createChoice('Escotista', pgEsc), linha.createChoice('Dirigente', pgDir)]);
  pgDir.setGoToPage(pgFim); // quem termina a página Escotista pula a Dirigente

  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  var arq = DriveApp.getFileById(form.getId());
  arq.moveTo(DriveApp.getFolderById(PASTA_ID));

  SpreadsheetApp.flush();
  Utilities.sleep(4000);
  ss.getSheets().forEach(function (sh) {
    try { if (sh.getFormUrl()) sh.setName('Respostas Formulário'); } catch (e) {}
  });

  // Último acompanhamento passa a considerar a aba manual e as respostas do formulário
  var n = ad.getLastRow();
  for (var r = 5; r <= n; r++) {
    if (!ad.getRange(r, 1).getValue()) continue;
    ad.getRange(r, 29).setFormula('=LET(m,MAX(IFERROR(MAXIFS(Acompanhamentos!$A:$A,Acompanhamentos!$B:$B,A' + r + '),0),IFERROR(MAXIFS(\'Respostas Formulário\'!$C:$C,\'Respostas Formulário\'!$D:$D,"* - "&A' + r + '),0)),IF(m=0,"",m))');
  }

  var h = ss.getSheetByName('Como usar');
  h.getRange('A22').setValue('FORMULÁRIO DOS APFs');
  h.getRange('A23').setValue('Link para os APFs preencherem: ' + form.getPublishedUrl());
  h.getRange('A24').setValue('Link para editar o formulário: ' + form.getEditUrl());
  Logger.log('PUBLICADO ' + form.getPublishedUrl());
  Logger.log('EDICAO ' + form.getEditUrl());
}

// ===== Painel web: Acompanhamento do Adulto Voluntário =====
var FORM_URL = CONFIG.FORM_COMPETENCIAS_URL;

/* ===== Controle de acesso ao painel (aba Acessos) ===== */
function semAcento_(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim(); }

function montarAcessos_() {
  var ss = SpreadsheetApp.getActive(), ad = ss.getSheetByName('Adultos'), n = ad.getLastRow() - 4;
  var v = ad.getRange(5, 1, n, 44).getDisplayValues().filter(function (r) { return r[0] && r[1] && r[43] !== 'Sim'; });
  var apfs = {}; v.forEach(function (r) { if (r[21]) apfs[semAcento_(r[21])] = 1; });
  var jar = paxtuSessao_(), tk = pxToken_(jar), ck = cookieHeader_(jar, hostDe_(PAXTU + '/'));
  var hd = { 'Cookie': ck, 'User-Agent': 'Mozilla/5.0 PainelEscoteiro', 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' };
  var cods = [];
  for (var i = 0; i < v.length; i += 15) {
    var lote = v.slice(i, i + 15);
    UrlFetchApp.fetchAll(lote.map(function (r) { return { url: PAXTU + '/associado/associado/lista/carregar?registration=' + encodeURIComponent(r[0]) + '&status=S&page=1', headers: hd, muteHttpExceptions: true, followRedirects: false }; }))
      .forEach(function (resp) { var m = ''; try { m = (JSON.parse(resp.getContentText()).html || '').match(/data-bs-associate="(\d+)"/); } catch (e) {} cods.push(m ? m[1] : ''); });
  }
  var emails = [];
  for (var j = 0; j < v.length; j += 15) {
    var idx = []; for (var k = j; k < Math.min(j + 15, v.length); k++) idx.push(k);
    var reqs = idx.filter(function (k) { return cods[k]; }).map(function (k) { return { k: k, r: { url: PAXTU + '/associado/perfil', method: 'post', payload: { associate_code: cods[k], _token: tk }, headers: { 'Cookie': ck, 'User-Agent': 'Mozilla/5.0 PainelEscoteiro' }, muteHttpExceptions: true, followRedirects: false } }; });
    var res = reqs.length ? UrlFetchApp.fetchAll(reqs.map(function (x) { return x.r; })) : [];
    reqs.forEach(function (x, q) { emails[x.k] = pxCampo_(res[q].getContentText(), 'org-email'); });
  }
  var sh = ss.getSheetByName('Acessos') || ss.insertSheet('Acessos'), antes = {};
  if (sh.getLastRow() > 3) sh.getRange(4, 1, sh.getLastRow() - 3, 6).getDisplayValues().forEach(function (r) { if (r[1]) antes[r[1]] = [r[4], r[5]]; });
  var dono = Session.getEffectiveUser().getEmail().toLowerCase();
  var linhas = v.map(function (r, k) {
    var fun = [[r[3], r[4]], [r[6], r[7]], [r[8], '']].filter(function (f) { return f[0] && f[0] !== 'Não se aplica'; }).map(function (f) { return f[0] + (f[1] && f[1] !== 'Não se aplica' ? ' · ' + f[1] : ''); }).join(', ');
    var em = (emails[k] || '').toLowerCase().trim();
    var papel = /Métodos Educativos/.test(fun) ? 'Diretor de Métodos Educativos' : /Diretor Presidente/.test(fun) ? 'Diretor Presidente' : apfs[semAcento_(r[1])] ? 'APF' : '';
    if (em && em === dono) papel = papel || 'Administradora do painel';
    var padrao = papel ? 'Sim' : 'Não';
    var a = antes[r[0]];
    return [r[1], r[0], fun, em || 'Sem e-mail @escoteiros.org.br no Paxtu', a ? a[0] : padrao, a ? a[1] : papel];
  });
  linhas.sort(function (a, b) { return (a[4] === 'Sim' ? 0 : 1) - (b[4] === 'Sim' ? 0 : 1) || a[0].localeCompare(b[0]); });
  sh.clear(); sh.getDataRange().clearDataValidations();
  sh.getRange(1, 1).setValue('Acesso ao painel · só entra quem estiver com Sim e e-mail @escoteiros.org.br').setFontWeight('bold');
  sh.getRange(2, 1).setValue('E-mails lidos do campo "E-mail Escoteiros do Brasil" do Paxtu. Para liberar ou tirar acesso, mude a coluna "Acesso ao painel?". Vale na próxima vez que a pessoa abrir o painel.').setFontStyle('italic');
  sh.getRange(3, 1, 1, 6).setValues([['Nome', 'Reg', 'Funções no Paxtu', 'E-mail Escoteiros do Brasil', 'Acesso ao painel?', 'Papel / observação']]).setFontWeight('bold').setBackground('#00853e').setFontColor('#ffffff');
  if (linhas.length) {
    sh.getRange(4, 1, linhas.length, 6).setValues(linhas);
    sh.getRange(4, 5, linhas.length, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Sim', 'Não'], true).build()).setBackground('#fff8c5');
  }
  sh.setFrozenRows(3); sh.autoResizeColumns(1, 6);
  Logger.log('Acessos: ' + linhas.length + ' adultos, ' + linhas.filter(function (l) { return l[4] === 'Sim'; }).length + ' com acesso, ' + linhas.filter(function (l) { return /^Sem e-mail/.test(l[3]); }).length + ' sem e-mail');
}

function acessoOk_() {
  var em = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  if (!em) return false;
  if (em === String(Session.getEffectiveUser().getEmail()).toLowerCase()) return true;
  var sh = SpreadsheetApp.getActive().getSheetByName('Acessos'); if (!sh || sh.getLastRow() < 4) return false;
  return sh.getRange(4, 4, sh.getLastRow() - 3, 2).getDisplayValues().some(function (r) { return String(r[0]).toLowerCase().trim() === em && r[1] === 'Sim'; });
}

/* ===== Botão "Atualizar do Paxtu" no painel ===== */
function estadoAtualizacao_() {
  var p = PropertiesService.getScriptProperties(), ped = +p.getProperty('MANUAL_TS') || 0;
  var fimA = +p.getProperty('ULTIMA_SYNC_TS') || 0, fimJ = +p.getProperty('MANUAL_J_FIM') || 0;
  var fmt = function (t) { return Utilities.formatDate(new Date(t), 'America/Sao_Paulo', 'HH:mm'); };
  if (!ped) return { status: '' };
  var andamento = (fimA < ped || fimJ < ped) && Date.now() - ped < 20 * 60000;
  return { status: andamento ? 'andamento' : 'ok', pedido: fmt(ped), por: p.getProperty('MANUAL_POR') || '', fim: andamento ? '' : fmt(Math.max(fimA, fimJ)) };
}

function atualizarAgora() {
  if (!acessoOk_()) throw new Error('Acesso não autorizado');
  var p = PropertiesService.getScriptProperties(), e = estadoAtualizacao_(), ult = +p.getProperty('MANUAL_TS') || 0;
  if (e.status === 'andamento') return { ok: false, msg: 'Já tem uma atualização em andamento, pedida às ' + e.pedido + '. Espere terminar e recarregue a página.' };
  var falta = 10 - Math.floor((Date.now() - ult) / 60000);
  if (falta > 0) return { ok: false, msg: 'A última atualização terminou há pouco. Pode pedir outra em ' + falta + ' min.' };
  p.setProperty('MANUAL_TS', String(Date.now()));
  p.setProperty('MANUAL_POR', String(Session.getActiveUser().getEmail() || ''));
  apagarTriggers_('atualizacaoManualAdultos'); apagarTriggers_('atualizacaoManualJovens');
  ScriptApp.newTrigger('atualizacaoManualAdultos').timeBased().after(1000).create();
  ScriptApp.newTrigger('atualizacaoManualJovens').timeBased().after(1000).create();
  return { ok: true, msg: 'Atualização iniciada. Leva uns 5 minutos. Depois, recarregue a página.' };
}

function atualizacaoManualAdultos() { apagarTriggers_('atualizacaoManualAdultos'); atualizarDoPaxtu(); }

function atualizacaoManualJovens() { apagarTriggers_('atualizacaoManualJovens'); atualizarJovens(); PropertiesService.getScriptProperties().setProperty('MANUAL_J_FIM', String(Date.now())); }

function doGet() {
  var _ok = acessoOk_();
  registrarAcesso_(_ok);
  if (!_ok) return HtmlService.createHtmlOutput('<div style="font-family:sans-serif;max-width:520px;margin:60px auto;text-align:center"><h2 style="color:#00853e">Acompanhamento do Adulto Voluntário · ' + CONFIG.NOME_CURTO + '</h2><p>Acesso não autorizado para <b>' + (Session.getActiveUser().getEmail() || 'esta conta') + '</b>.</p><p>Entre com o seu e-mail @escoteiros.org.br. Se precisar de acesso, fale com a Diretoria de Métodos Educativos do grupo.</p></div>').setTitle('Acesso não autorizado');
  var t = HtmlService.createTemplateFromFile('Painel');
  t.formUrl = FORM_URL;
  return t.evaluate()
    .setTitle('Acompanhamento do Adulto Voluntário - ' + CONFIG.NOME_CURTO)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function tabela_(nome, linhaCab, ultimaCol) {
  var sh = SpreadsheetApp.getActive().getSheetByName(nome);
  if (!sh) return { cab: [], linhas: [] };
  var n = sh.getLastRow();
  if (n <= linhaCab) return { cab: [], linhas: [] };
  var nc = ultimaCol || sh.getLastColumn();
  var v = sh.getRange(linhaCab, 1, n - linhaCab + 1, nc).getDisplayValues();
  var cab = v.shift();
  var linhas = v.filter(function (r) { return String(r[0]).trim() !== '' || String(r[1]).trim() !== ''; });
  return { cab: cab, linhas: linhas };
}

function getDados() {
  if (!acessoOk_()) throw new Error('Acesso não autorizado');
  var ss = SpreadsheetApp.getActive();
  var ad = tabela_('Adultos', 4, 46);
  ad.linhas = ad.linhas.filter(function (r) { return r[0] && r[1]; });
  var ev = tabela_('Eventos', 4, 7);
  ev.linhas = ev.linhas.filter(function (r) { return r[0] && r[4]; });
  var ac = tabela_('Acompanhamentos', 4, 21);
  ac.linhas = ac.linhas.filter(function (r) { return r[0] && r[1] && String(r[1]) !== '0'; });
  var rf = tabela_('Respostas Formulário', 1);
  var inat = tabela_('Inativos', 4, 11);
  var tm = ss.getSheetByName('Termo de consentimento');
  var tv = tm ? tm.getDataRange().getDisplayValues() : [];
  var resumo = [], pend = [], modo = 0;
  for (var i = 0; i < tv.length; i++) {
    var r = tv[i];
    if (r[0] === 'Resumo') resumo.push(r.slice(1, 5));
    if (modo === 1 && r[0]) pend.push(r.slice(0, 7));
    if (r[0] === 'Registro' && r[1] === 'Nome') modo = 1;
  }
  return JSON.stringify({
    atualizado: Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm'),
    planilha: ss.getUrl(),
    adultos: ad, eventos: ev, paxtuSync: PropertiesService.getScriptProperties().getProperty('ULTIMA_SYNC') || '', atualizacao: estadoAtualizacao_(), acordosSync: PropertiesService.getScriptProperties().getProperty('ACORDOS_SYNC') || '', paxtuNao: PropertiesService.getScriptProperties().getProperty('SYNC_NAO_ULTIMA') || '', secoes: (function () { try { return tabela_('Seções', 3, 6); } catch (e) { return { linhas: [] }; } })(), jovens: (function () { try { var c = tabela_('Jovens', 3, 12); c.linhas = c.linhas.filter(function (r) { return r[1]; }); c.sync = PropertiesService.getScriptProperties().getProperty('JOVENS_SYNC') || ''; return c; } catch (e) { return { linhas: [] }; } })(), calendario: (function () { try { var c = tabela_('Calendário', 4, 13); c.linhas = c.linhas.filter(function (r) { return r[0] && r[2]; }); return c; } catch (e) { return { linhas: [] }; } })(), acomp: ac, respostas: rf, certificados: (function () { try { return livroParaPainel_(); } catch (e) { return null; } })(), paxtuTs: Number(PropertiesService.getScriptProperties().getProperty('ULTIMA_SYNC_TS') || 0), manualPed: Number(PropertiesService.getScriptProperties().getProperty('MANUAL_TS') || 0), rotas: (function () { try { return rotasParaPainel_(); } catch (e) { return null; } })(), inativos: inat,
    termo: { resumo: resumo, pendentes: pend }
  });
}

function corrigirAlertaCurso() {
  var ad = SpreadsheetApp.getActive().getSheetByName('Adultos');
  var n = ad.getLastRow();
  for (var r = 5; r <= n; r++) {
    if (!ad.getRange(r, 1).getValue()) continue;
    var R = r;
    ad.getRange(r, 35).setFormula('=IF(AND(Z'+R+'<>"Avançado",N'+R+'="",COUNTIFS(Eventos!$A:$A,A'+R+',Eventos!$E:$E,"Curso Avan*")>0),"Participou de Curso Avançado: conferir lançamento no Paxtu",IF(AND(OR(Z'+R+'="Sem nível",Z'+R+'="Preliminar"),L'+R+'="",COUNTIFS(Eventos!$A:$A,A'+R+',Eventos!$E:$E,"Curso Intermedi*")>0),"Participou de Curso Intermediário: conferir lançamento no Paxtu",IF(AND(Z'+R+'="Sem nível",J'+R+'="",P'+R+'="",COUNTIFS(Eventos!$A:$A,A'+R+',Eventos!$E:$E,"Curso Preliminar*")>0),"Participou de Curso Preliminar: conferir lançamento no Paxtu","")))');
  }
}

function corrigirUltimoAcomp() {
  var ad = SpreadsheetApp.getActive().getSheetByName('Adultos');
  var n = ad.getLastRow();
  for (var r = 5; r <= n; r++) {
    if (!ad.getRange(r, 1).getValue()) continue;
    var a = 'IFERROR(MAXIFS(Acompanhamentos!$A:$A,Acompanhamentos!$B:$B,A' + r + '),0)';
    var b = 'IFERROR(MAXIFS(\'Respostas Formulário\'!$C:$C,\'Respostas Formulário\'!$D:$D,"* - "&A' + r + '),0)';
    ad.getRange(r, 29).setFormula('=IF(MAX(' + a + ',' + b + ')=0,"",MAX(' + a + ',' + b + '))');
  }
}

function prepararAdultos_(n) {
  var ss = SpreadsheetApp.getActive();
  var ad = ss.getSheetByName('Adultos');
  var last = 4 + n;
  if (ad.getMaxRows() < last + 20) ad.insertRowsAfter(ad.getMaxRows(), last + 20 - ad.getMaxRows());
  // fórmulas Z:AI copiadas da linha 5
  ad.getRange('Z5:AI5').copyTo(ad.getRange('Z6:AI' + last), SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false);
  ad.getRange('Z5:AI5').copyTo(ad.getRange('Z6:AI' + last), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
  if (ad.getLastRow() > last) ad.getRange(last + 1, 1, ad.getLastRow() - last, 43).clearContent();
  var cab = ['Tipo de adulto', 'Idade', 'Cert. antecedentes (comarca)', 'Ficha antecedentes (Polícia Civil)', 'Cert. Justiça Federal', 'Doc. com foto e CPF', 'Declaração de idoneidade', 'Sanção disciplinar'];
  var h = ad.getRange(4, 36, 1, cab.length);
  h.setValues([cab]); ad.getRange('A4').copyTo(h, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
  var regras = ad.getConditionalFormatRules();
  var rg = ad.getRange(5, 38, n, 6);
  regras.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Pendente').setBackground('#FBE9E7').setFontColor('#C0392B').setRanges([rg]).build());
  regras.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Anexado').setBackground('#DFF0E5').setRanges([rg]).build());
  regras.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Ativa').setBackground('#FBE9E7').setFontColor('#C0392B').setRanges([rg]).build());
  regras.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Pioneiro').setBackground('#E5EDF6').setFontColor('#004A8D').setRanges([ad.getRange(5, 36, n, 1)]).build());
  ad.setConditionalFormatRules(regras);
  ad.getRange('A4:AQ' + last).createFilter ? null : null;
  try { if (ad.getFilter()) ad.getFilter().remove(); ad.getRange(4, 1, n + 1, 43).createFilter(); } catch (e) {}
  ad.setColumnWidths(36, 8, 130);
}

/** Cria a aba de referência do Guia Perfis: Cargos e Funções (nível local). */
function guiaCargos_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName('Guia de cargos') || ss.insertSheet('Guia de cargos');
  sh.clear();
  var linhas = [
    ['Chefe de Seção (Ninhada, Ramo Filhotes)','Escotista','Diretoria Local',21,'Métodos Educativos','Perfil Chefe de Seção Ramo Filhotes (16/09/2025)'],
    ['Assistente de Seção (Ramo Filhotes)','Escotista','Chefe de Seção','não descrito (usar 18)','Métodos Educativos','Ainda sem descritivo publicado'],
    ['Chefe de Alcateia','Escotista','Diretoria de Métodos Educativos',21,'Métodos Educativos','Guia nível local, p. 20'],
    ['Assistente de Alcateia','Escotista','Chefe de Alcateia',18,'Métodos Educativos','Guia nível local, p. 22'],
    ['Chefe de Tropa Escoteira','Escotista','Diretoria de Métodos Educativos',21,'Métodos Educativos','Guia nível local, p. 24'],
    ['Assistente de Tropa Escoteira','Escotista','Chefe de Seção',18,'Métodos Educativos','Guia nível local, p. 26'],
    ['Chefe de Tropa Sênior/Guia','Escotista','Diretoria de Métodos Educativos',21,'Métodos Educativos','Guia nível local, p. 28'],
    ['Assistente de Tropa Sênior/Guia','Escotista','Chefe de Seção',18,'Métodos Educativos','Guia nível local, p. 30'],
    ['Chefe de Clã Pioneiro (Mestre Pioneiro)','Escotista','Diretoria de Métodos Educativos',23,'Métodos Educativos','Guia nível local, p. 32'],
    ['Assistente de Clã Pioneiro','Escotista','Chefe de Seção',21,'Métodos Educativos','Guia nível local, p. 34'],
    ['Diretor Presidente','Dirigente','Assembleia de Grupo',18,'Gestão Institucional','Guia nível local, p. 38'],
    ['Diretor de Métodos Educativos','Dirigente','Diretoria de Grupo',18,'Métodos Educativos','Guia nível local, p. 42'],
    ['Diretor Financeiro','Dirigente','Diretoria de Grupo',18,'Administrativa Financeira','Guia nível local, p. 44'],
    ['Diretor Administrativo','Dirigente','Diretoria de Grupo',18,'Gestão Institucional','Guia nível local, p. 46'],
    ['Membro de Comissão Fiscal','Dirigente','Assembleia de Grupo',18,'Administrativa Financeira','Guia nível local, p. 48'],
    ['Assessor Pessoal de Formação (APF)','Apoio','Direção local',18,'Métodos Educativos','Guia nível local, p. 52'],
    ['Assistente Religioso','Apoio','Direção local',18,'Métodos Educativos','Guia nível local, p. 54']
  ];
  sh.getRange('A1').setValue('Guia de cargos e funções: nível local').setFontSize(14).setFontWeight('bold').setFontColor('#00853e');
  sh.getRange('A2').setValue('Fonte: Escoteiros do Brasil, Perfis: Cargos e Funções, Nível Local (set/2019) e Perfil Chefe de Seção Ramo Filhotes (16/09/2025). Funções completas de cada cargo: ver o guia (link abaixo).').setFontStyle('italic').setFontColor('#575A57');
  sh.getRange('A3').setRichTextValue(SpreadsheetApp.newRichTextValue().setText('Abrir os guias no site dos Escoteiros do Brasil').setLinkUrl('https://www.escoteiros.org.br/downloads/categorias/perfis-cargos-funcoes/').build());
  var cab = [['Cargo / função','Linha','A quem se dirige','Idade mínima','Área','Onde está no guia']];
  sh.getRange(4,1,1,6).setValues(cab).setFontWeight('bold').setFontColor('#ffffff').setBackground('#00853e').setWrap(true);
  sh.getRange(5,1,linhas.length,6).setValues(linhas).setWrap(true).setVerticalAlignment('top');
  sh.getRange(5,1,linhas.length,6).applyRowBanding(SpreadsheetApp.BandingTheme.GREEN, false, false);
  sh.setColumnWidths(1,1,260); sh.setColumnWidths(2,1,90); sh.setColumnWidths(3,1,220); sh.setColumnWidths(4,1,110); sh.setColumnWidths(5,1,170); sh.setColumnWidths(6,1,260);
  sh.setFrozenRows(4);
  sh.setTabColor('#004a8d');
}

/** Cria a aba Calendário (nacional, regional SP e grupo). Os dados são colados a partir da linha 5. */
function prepararCalendario_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName('Calendário') || ss.insertSheet('Calendário');
  sh.clear(); sh.clearConditionalFormatRules();
  try { sh.getDataRange().clearDataValidations(); } catch (e) {}
  if (sh.getFilter()) sh.getFilter().remove();
  var cab = ['Início','Fim','Atividade','Nível','Categoria','Modalidade','Local','Ramo / público','Tipo','Grupo participa?','Responsável no grupo','Observações','Fonte'];
  sh.getRange('A1').setValue('Calendário: grupo, regional (SP) e nacional').setFontSize(14).setFontWeight('bold').setFontColor('#00853e');
  sh.getRange('A2').setValue('Fontes: Calendário Regional UEB/SP 2026 (v. 10/10/2026) e 2027 (v. 04/11/2026); Calendário Anual Escoteiro nacional 2026 (v12, 27/08/2026) e 2027 (v4, 30/09/2026). Atividades do grupo: incluir com Nível = Grupo. Colunas J a L são preenchidas pelo grupo.').setFontStyle('italic').setFontColor('#575A57');
  sh.getRange(4,1,1,cab.length).setValues([cab]).setFontWeight('bold').setFontColor('#ffffff').setBackground('#00853e').setWrap(true).setVerticalAlignment('middle');
  sh.setFrozenRows(4);
  var w = [90,90,380,100,130,100,150,130,150,110,160,220,170];
  w.forEach(function (x, i) { sh.setColumnWidth(i + 1, x); });
  var n = 1000;
  sh.getRange(5,1,n,2).setNumberFormat('dd/mm/yyyy');
  var dv = function (list) { return SpreadsheetApp.newDataValidation().requireValueInList(list, true).setAllowInvalid(true).build(); };
  sh.getRange(5,4,n,1).setDataValidation(dv(['Grupo','Distrital','Regional SP','Nacional','Internacional']));
  sh.getRange(5,9,n,1).setDataValidation(dv(['Atividade para jovens','Formação de adultos','Institucional','Data comemorativa']));
  sh.getRange(5,10,n,1).setDataValidation(dv(['Sim','Não','A decidir']));
  sh.getRange(5,10,n,3).setBackground('#fffbd1');
  var rules = [];
  var addTxt = function (col, txt, bg, fg) { rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(txt).setBackground(bg).setFontColor(fg || '#000000').setRanges([sh.getRange(5,col,n,1)]).build()); };
  addTxt(4,'Grupo','#e6f3ec','#00853e'); addTxt(4,'Distrital','#e0f5fa','#00738a'); addTxt(4,'Regional SP','#e5edf6','#004a8d'); addTxt(4,'Nacional','#f3f6d0','#5a6200'); addTxt(4,'Internacional','#fff8b0','#5a5300');
  addTxt(9,'Formação de adultos','#fde9df','#a33a0b');
  addTxt(10,'Sim','#e6f3ec','#00853e'); addTxt(10,'Não','#eeeeee','#575A57');
  sh.setConditionalFormatRules(rules);
  sh.setTabColor('#00accd');
}

/** Validade do registro: quando só o ano foi informado, usa 31/12 desse ano (vencimento anual). */
function corrigirValidade_() {
  var sh = SpreadsheetApp.getActive().getSheetByName('Adultos');
  var last = sh.getLastRow(); var r = sh.getRange(5, 23, last - 4, 1);
  var disp = r.getDisplayValues(), vals = r.getValues(), n = 0, ex = [];
  for (var i = 0; i < vals.length; i++) {
    var d = String(disp[i][0]).trim();
    if (ex.length < 6) ex.push(d);
    if (/^\d{4}$/.test(d)) { vals[i][0] = new Date(+d, 11, 31); n++; }
  }
  r.setValues(vals); r.setNumberFormat('dd/mm/yyyy');
  return 'corrigidas ' + n + ' | exemplos antes: ' + ex.join(', ');
}

/** Menu da planilha. */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Painel')
    .addItem('1. Configurar acesso ao Paxtu', 'configurarPaxtu')
    .addItem('2. Testar acesso ao Paxtu', 'testarPaxtu')
    .addItem('3. Puxar os adultos do Paxtu', 'atualizarDoPaxtu')
    .addItem('4. Montar a aba Acessos', 'montarAcessos')
    .addItem('5. Criar o formulário de competências', 'criarFormularioCompetencias')
    .addItem('6. Montar Rotas de aprendizagem e formulário', 'montarRotas')
    .addItem('7. Criar a aba de especialidades', 'criarAbaEspecialidades')
    .addItem('8. Configurar certificados', 'configurarCertificados')
    .addItem('9. Instalar atualizações automáticas', 'instalarRotinasAdulto')
    .addToUi();
}

function jar_() { return {}; }

/* ===== Atualização automática da aba Adultos a partir do Paxtu ===== */
function pxCampo_(html, id) { var m = html.match(new RegExp('<input[^>]*id="' + id + '"[^>]*>')); if (!m) return ''; var v = m[0].match(/value="([^"]*)"/); return v ? v[1].trim() : ''; }

function pxSelect_(html, id) { var m = html.match(new RegExp('<select[^>]*id="' + id + '"[^>]*>([\\s\\S]*?)</select>')); if (!m) return ''; var o = m[1].match(/<option[^>]*selected[^>]*>([^<]*)</); return o ? o[1].replace(/\s+/g, ' ').trim() : ''; }

function pxData_(s) { var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return new Date(+m[1], +m[2] - 1, +m[3]); m = String(s || '').match(/^(\d{2})\/(\d{2})\/(\d{4})/); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : ''; }

function pxCodigo_(jar, reg) {
  var r = req_(jar, PAXTU + '/associado/associado/lista/carregar?registration=' + encodeURIComponent(reg) + '&status=S&page=1', { headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' } });
  var j = {}; try { j = JSON.parse(r.getContentText()); } catch (e) { return null; }
  var m = String(j.html || '').match(/data-bs-associate="([^"]+)"/); return m ? m[1] : null;
}

function pxFuncao_(html, p) {
  var f = pxSelect_(html, p + '-role-function'); if (!f || f === 'Não se aplica') return null;
  var cat = pxSelect_(html, p + '-role-category'), ramo = pxSelect_(html, p + '-role-branch');
  if (f === 'Diretor') { var a = pxSelect_(html, p + '-role-area'); var mapa = { 'Financeiro': 'Diretor Financeiro', 'Administrativo': 'Diretor Administrativo', 'Métodos educativos': 'Diretor de Métodos Educativos' }; f = mapa[a] || ('Diretor' + (a && a !== 'Selecione' ? ' ' + a : '')); }
  return [cat === 'Não se aplica' ? '' : cat, f, ramo === 'Não se aplica' ? '' : ramo];
}

function pxLerAdulto_(html) {
  var o = {};
  var funcs = ['primary', 'secondary', 'tertiary'].map(function (p) { return pxFuncao_(html, p); }).filter(Boolean);
  o.funcoes = funcs;
  var niv = ['preliminar', 'middle', 'advanced'], lin = ['scouter', 'institutional'], form = [];
  lin.forEach(function (l) { niv.forEach(function (n) { form.push(pxData_(pxCampo_(html, n + '_' + l + '_course_conclusion'))); form.push(pxData_(pxCampo_(html, n + '_' + l + '_level_conclusion'))); }); });
  o.formacao = form;
  var apf = ''; ['advanced', 'middle', 'preliminar'].forEach(function (n) { lin.forEach(function (l) { var v = pxCampo_(html, n + '_' + l + '_personalAdvisor'); if (!apf && v) apf = v; }); }); o.apf = apf;
  var vv = pxCampo_(html, 'registry-expiration-date'); o.validade = /^\d{4}$/.test(vv) ? new Date(+vv, 11, 31) : pxData_(vv);
  return o;
}

/** Atualiza funções, formação, APF e validade de cada adulto da aba Adultos lendo o Paxtu. Continua sozinho se passar do tempo. */
function atualizarDoPaxtu() {
  var ini = Date.now(), sp = PropertiesService.getScriptProperties();
  var sh = SpreadsheetApp.getActive().getSheetByName('Adultos');
  var last = sh.getLastRow(); if (last < 5) return;
  var regs = sh.getRange(5, 1, last - 4, 1).getDisplayValues().map(function (r) { return String(r[0]).replace(/\D/g, ''); });
  var i0 = +(sp.getProperty('SYNC_IDX') || 0); if (i0 >= regs.length) i0 = 0;
  var jar = paxtuSessao_(), tk = pxToken_(jar), naoAchados = JSON.parse(sp.getProperty('SYNC_NAO') || '[]');
  if (i0 === 0) naoAchados = [];
  if (i0 === 0) { try { incluirAdultosNovos_(jar, tk, false); } catch (e) { console.log('incluirAdultosNovos_: ' + e); } last = sh.getLastRow(); regs = sh.getRange(5, 1, last - 4, 1).getDisplayValues().map(function (r) { return String(r[0]).replace(/\D/g, ''); }); }
  for (var i = i0; i < regs.length; i++) {
    if (Date.now() - ini > 270000) { sp.setProperties({ SYNC_IDX: String(i), SYNC_NAO: JSON.stringify(naoAchados) }); continuarDepois_(); return; }
    if (!regs[i]) continue;
    var c = pxCodigo_(jar, regs[i]); if (!c) { naoAchados.push(regs[i]); continue; }
    var o = pxLerAdulto_(pxPerfil_(jar, c, tk)); var row = i + 5;
    var f = o.funcoes.slice(0, 3); while (f.length < 3) f.push(['', '', '']);
    sh.getRange(row, 3, 1, 7).setValues([[f[0][0], f[0][1], f[0][2], f[1][0], f[1][1], f[1][2], f[2][1]]]);
    sh.getRange(row, 10, 1, 12).setValues([o.formacao]);
    if (o.apf) sh.getRange(row, 22).setValue(o.apf);
    if (o.validade && !(sh.getRange(row, 23).getValue() instanceof Date)) sh.getRange(row, 23).setValue(o.validade); // a data real vem do relatório (atualizarValidades_)
  }
  sp.setProperty('ULTIMA_SYNC_TS', String(Date.now())); sp.setProperties({ SYNC_IDX: '0', SYNC_NAO: '[]', ULTIMA_SYNC: Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm'), SYNC_NAO_ULTIMA: naoAchados.join(', ') });
  apagarTriggers_('continuarSync_');
  try { atualizarSituacaoAcordos_(); } catch (e) { console.log('atualizarSituacaoAcordos_: ' + e); }
}

function continuarSync_() { atualizarDoPaxtu(); }

function continuarDepois_() { apagarTriggers_('continuarSync_'); ScriptApp.newTrigger('continuarSync_').timeBased().after(60 * 1000).create(); }

function apagarTriggers_(fn) { ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === fn) ScriptApp.deleteTrigger(t); }); }


/* ===== Registro de acessos (1ª vez no dia por pessoa) ===== */
var ABA_REG_ACESSOS = 'Registro de acessos';

var DIAS_SEMANA_ = ['Domingo', '2ª Feira', '3ª Feira', '4ª Feira', '5ª Feira', '6ª Feira', 'Sábado'];

function registrarAcesso_(liberado) {
  try {
    var email = (Session.getActiveUser().getEmail() || '').toLowerCase().trim();
    if (!email) email = '(e-mail não informado)';
    var tz = Session.getScriptTimeZone() || 'America/Sao_Paulo';
    var agora = new Date();
    var dia = Utilities.formatDate(agora, tz, 'yyyy-MM-dd');

    // Já registrou hoje? (cache rápido + conferência na planilha)
    var cache = CacheService.getScriptCache();
    var chave = 'acesso_' + dia + '_' + email;
    if (cache.get(chave)) return;

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var ss = SpreadsheetApp.getActive() || SpreadsheetApp.openById(CONFIG.PLANILHA_ID);
      var sh = ss.getSheetByName(ABA_REG_ACESSOS);
      if (!sh) {
        sh = ss.insertSheet(ABA_REG_ACESSOS);
        sh.getRange(1, 1, 1, 6).setValues([['Data', 'Dia da semana', 'Hora', 'Nome', 'E-mail', 'Resultado']])
          .setFontWeight('bold').setBackground('#00843D').setFontColor('#FFFFFF');
        sh.setFrozenRows(1);
        sh.setColumnWidths(1, 6, 140);
        sh.setColumnWidth(4, 260); sh.setColumnWidth(5, 280);
      }

      // confere as linhas de hoje
      var ult = sh.getLastRow();
      if (ult > 1) {
        var ini = Math.max(2, ult - 300);
        var vals = sh.getRange(ini, 1, ult - ini + 1, 5).getValues();
        for (var i = 0; i < vals.length; i++) {
          var d = vals[i][0];
          var dStr = d instanceof Date ? Utilities.formatDate(d, tz, 'yyyy-MM-dd') : '';
          if (dStr === dia && String(vals[i][4]).toLowerCase().trim() === email) {
            cache.put(chave, '1', 21600);
            return;
          }
        }
      }

      var nome = nomeDoEmail_(email);
      var dataMeioDia = new Date(Utilities.formatDate(agora, tz, 'yyyy/MM/dd') + ' 12:00:00');
      sh.appendRow([
        dataMeioDia,
        DIAS_SEMANA_[Number(Utilities.formatDate(agora, tz, 'u')) % 7],
        Utilities.formatDate(agora, tz, 'HH:mm'),
        nome,
        email,
        liberado ? 'Entrou' : 'Bloqueado (sem acesso)'
      ]);
      var r = sh.getLastRow();
      sh.getRange(r, 1).setNumberFormat('dd/MM/yyyy');
      if (!liberado) sh.getRange(r, 1, 1, 6).setBackground('#FFF1DC');
      cache.put(chave, '1', 21600);
    } finally {
      lock.releaseLock();
    }
  } catch (e) {
    console.log('registrarAcesso_: ' + e);
  }
}

function nomeDoEmail_(email) {
  try {
    var sh = SpreadsheetApp.getActive().getSheetByName('Acessos');
    if (!sh) return '';
    var v = sh.getDataRange().getValues();
    var cab = -1, cN = -1, cE = -1;
    for (var i = 0; i < Math.min(v.length, 6); i++) {
      for (var j = 0; j < v[i].length; j++) {
        var t = String(v[i][j]);
        if (t === 'Nome') { cab = i; cN = j; }
        if (t.indexOf('E-mail') === 0) cE = j;
      }
      if (cab >= 0) break;
    }
    if (cab < 0 || cE < 0) return '';
    for (var k = cab + 1; k < v.length; k++) {
      if (String(v[k][cE]).toLowerCase().trim() === email) return v[k][cN];
    }
  } catch (e) {}
  return '';
}

/* ===== Adultos novos ou reativados no Paxtu =====
   Lê a lista de associados ativos do grupo (Dirigentes e Escotistas) e inclui na aba Adultos
   quem ainda não está lá. Só entra quem tem função de Escotista ou Dirigente cadastrada:
   pais de apoio e pais de Filhotes (sem função) ficam de fora. Quem estava em Inativos sai de lá. */
function pxListaAdultos_(jar) {
  var vistos = {}, out = [];
  [[4, 'Dirigente'], [5, 'Escotista']].forEach(function (c) {
    for (var page = 1; page <= 40; page++) {
      var r = req_(jar, PAXTU + '/associado/associado/lista/carregar?category=' + c[0] + '&status=S&page=' + page, { headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' } });
      var j = {}; try { j = JSON.parse(r.getContentText()); } catch (e) { break; }
      var partes = (j.html || '').split('data-bs-associate="'), novos = 0;
      for (var k = 1; k < partes.length; k++) {
        var cod = partes[k].match(/^\d+/); if (!cod) continue;
        var m = partes[k].match(/Registro:\s*(\d+)/); if (!m) continue;
        var ja = vistos[cod[0]]; if (ja) continue;
        var txt = partes[k].replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' | ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
        var seg = txt.split('|').map(function (s) { return s.trim(); }).filter(function (s) { return s; });
        var ir = -1; for (var q = 0; q < seg.length; q++) { if (/^Registro/.test(seg[q])) { ir = q; break; } }
        var nm = ir > 0 ? seg[ir - 1] : '';
        var o = { cod: cod[0], reg: m[1], nome: nm, cat: c[1] }; vistos[cod[0]] = o; out.push(o); novos++;
      }
      if (!novos) break;
    }
  });
  return out;
}

function incluirAdultosNovos_(jar, tk, simular) {
  var ss = SpreadsheetApp.getActive(), ad = ss.getSheetByName('Adultos'), ina = ss.getSheetByName('Inativos');
  var limpa = function (v) { return String(v).replace(/\D/g, ''); };
  var naAba = {}; if (ad.getLastRow() >= 5) ad.getRange(5, 1, ad.getLastRow() - 4, 1).getDisplayValues().forEach(function (r) { naAba[limpa(r[0])] = 1; });
  var lista = pxListaAdultos_(jar), log = [];
  lista.forEach(function (p) {
    if (!p.reg || naAba[p.reg]) return;
    var o = pxLerAdulto_(pxPerfil_(jar, p.cod, tk));
    var temFuncao = o.funcoes.some(function (f) { return /escotista|dirigente/i.test(f[0]) && f[1]; });
    if (!temFuncao) { log.push('ignorado (sem função: pai/mãe de apoio ou de Filhotes): ' + p.nome); return; }
    var linhaIna = -1;
    if (ina && ina.getLastRow() >= 5) ina.getRange(5, 1, ina.getLastRow() - 4, 1).getDisplayValues().forEach(function (r, i) { if (limpa(r[0]) === p.reg) linhaIna = i + 5; });
    log.push((linhaIna > 0 ? 'reativado (saiu de Inativos): ' : 'novo: ') + p.nome + ' ' + JSON.stringify(o.funcoes));
    if (simular) return;
    var row = ad.getLastRow() + 1;
    if (ad.getMaxRows() < row) ad.insertRowsAfter(ad.getMaxRows(), 10);
    ad.getRange(row, 1, 1, 2).setValues([[p.reg, p.nome]]);
    ad.getRange('Z5:AI5').copyTo(ad.getRange(row, 26, 1, 10), SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false);
    ad.getRange('A5:AQ5').copyTo(ad.getRange(row, 1, 1, 43), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    if (linhaIna > 0) ina.deleteRow(linhaIna);
    naAba[p.reg] = 1;
  });
  console.log('Adultos novos/reativados' + (simular ? ' (simulação)' : '') + ': ' + (log.length ? '\n' + log.join('\n') : 'nenhum'));
  return log;
}

/* Simulação: mostra no registro quem seria incluído, sem mudar a planilha. */
function verificarAdultosNovos() { var jar = paxtuSessao_(); incluirAdultosNovos_(jar, pxToken_(jar), true); }
