/* ===== Ninhada: fichas de atividade =====
   Lê as fichas do Drive (docx/pdf convertidos em texto pelo serviço avançado Drive v3), separa CADA ficha
   (um arquivo pode ter várias) e organiza os campos: nome, data, duração, local, participantes, progressão,
   programação geral, materiais, segurança, roteiro e passo a passo.
   - aba "Banco de atividades": todas as fichas (Nacional e do grupo), sem repetição;
   - aba "Fichas": as fichas do grupo com data, ligadas às atividades do calendário.
   Não altera os arquivos originais. */


var CAB_BANCO_ = ['Origem', 'Semana', 'Título', 'Data', 'Duração', 'Local', 'Participantes', 'Progressão', 'Programação', 'Materiais', 'Segurança', 'Roteiro', 'Passo a passo', 'Arquivo', 'Atualizado em'];
var CAB_FICHAS_ = ['Data', 'Atividade', 'Duração', 'Local', 'Participantes', 'Segurança', 'Roteiro', 'Programação', 'Passo a passo', 'Banco (origem)', 'Arquivo', 'Atualizado em', 'Atualizado por', 'Materiais'];
var MESES_N_ = { janeiro: 1, fevereiro: 2, 'março': 3, marco: 3, abril: 4, maio: 5, junho: 6, julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12 };

function subpasta_(f, nome) { var it = f.getFoldersByName(nome); return it.hasNext() ? it.next() : null; }
function textoDoArquivo_(file) {
  if (file.getMimeType() === MimeType.GOOGLE_DOCS) return DocumentApp.openById(file.getId()).getBody().getText();
  var tmp = Drive.Files.create({ name: 'tmp-ficha-ninhada', mimeType: MimeType.GOOGLE_DOCS }, file.getBlob(), { ocrLanguage: 'pt', supportsAllDrives: true });
  try { return DocumentApp.openById(tmp.id).getBody().getText(); }
  finally { try { Drive.Files.remove(tmp.id, { supportsAllDrives: true }); } catch (e) { DriveApp.getFileById(tmp.id).setTrashed(true); } }
}
function limpaTexto_(t) { return String(t || '').replace(/\r/g, '').replace(/\u000b/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim(); }

/* Separa um texto em fichas: cada "Informações gerais" (ou "INFORMAÇÕES GERAIS") abre uma ficha; o título vem das linhas logo acima */
function separarFichas_(t) {
  var L = t.split('\n'), marcos = [];
  L.forEach(function (l, i) { if (/^\s*informa[çc][õo]es gerais\s*:?\s*$/i.test(l)) marcos.push(i); });
  if (!marcos.length) return [];
  var inicios = marcos.map(function (m) {
    var k = m - 1, n = 0;
    while (k >= 0 && n < 4) { if (L[k].trim()) { n++; if (/ficha de atividade|ramo filhotes|semana\s*\d+/i.test(L[k])) return k; } k--; }
    return Math.max(0, m - 1);
  });
  return inicios.map(function (ini, j) { return L.slice(ini, j + 1 < inicios.length ? inicios[j + 1] : L.length).join('\n').trim(); });
}
function secao_(t, inicio, fins) {
  var m = t.match(inicio); if (!m) return '';
  var resto = t.slice(m.index + m[0].length), corte = resto.length;
  fins.forEach(function (f) { var x = resto.search(f); if (x >= 0 && x < corte) corte = x; });
  return resto.slice(0, corte).trim();
}
function linhaCampo_(t, rot) { var m = t.match(new RegExp('(?:^|\\n)\\s*[●•\\-]?\\s*' + rot + '\\s*:?\\s*\\t?\\s*([^\\n]*)', 'i')); return m ? m[1].replace(/^["“]|["”]$/g, '').trim() : ''; }
function dataFicha_(t) {
  var m = t.match(/(\d{2})\/(\d{2})\/(\d{4})/); if (m) return m[3] + '-' + m[2] + '-' + m[1];
  m = t.match(/(\d{1,2})\s+de\s+([a-zç]+)\s+de\s+(\d{4})/i);
  if (m && MESES_N_[m[2].toLowerCase()]) return m[3] + '-' + ('0' + MESES_N_[m[2].toLowerCase()]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  return '';
}
var FIM_PROG_ = [/\n\s*materiais/i, /\n\s*programa[çc][ãa]o descritiva/i, /\n\s*organiza[çc][ãa]o/i, /\n\s*cuidados de seguran/i, /\n\s*roteiro/i, /\n\s*observa[çc]/i];
function programacao_(t) {
  var bloco = secao_(t, /programa[çc][ãa]o geral[^\n]*\n/i, FIM_PROG_); if (!bloco) return [];
  var linhas = bloco.split('\n').map(function (l) { return l.trim(); }).filter(function (l) { return l && !/^(tempo|atividade|respons[aá]vel|foco pedag[oó]gico[^\n]*)$/i.test(l); });
  var rows = [], cur = null;
  linhas.forEach(function (l) {
    var m = l.match(/^(\d{1,3})\s*(?:[’'′`"”]+|min\.?\b|minutos)\s*(.*)$/i);
    if (m) { cur = { t: m[1], partes: [] }; rows.push(cur); if (m[2]) cur.partes.push(m[2].replace(/\t+/g, ' | ')); }
    else if (cur) cur.partes.push(l.replace(/\t+/g, ' | '));
  });
  return rows.map(function (r) {
    var p = r.partes.join(' | ').split(/\s*\|\s*/).filter(String), resp = '';
    if (p.length > 1 && p[p.length - 1].length < 40 && /chefia|todos|pais|filhotes|adultos|escotist|fam[ií]lia|chefe/i.test(p[p.length - 1])) resp = p.pop();
    return { t: r.t, a: p[0] || '', f: p.slice(1).join(' '), r: resp };
  });
}
function progressao_(t) {
  var bloco = secao_(t, /progress[ãa]o pessoal[^\n]*\n/i, [/\n\s*programa[çc][ãa]o/i, /\n\s*organiza[çc][ãa]o/i, /\n\s*materiais/i]);
  if (!bloco) return '';
  var et = '', marc = [];
  bloco.split('\n').forEach(function (l) {
    var e = l.match(/^\s*(Paco|Tixa|Lipe|Nina)\b/i); if (e) et = e[1].charAt(0).toUpperCase() + e[1].slice(1).toLowerCase();
    (l.match(/[☑☒✔✓■]\s*[^☐☑☒✔✓■\t]+/g) || []).forEach(function (x) { marc.push(et + ': ' + x.replace(/^[☑☒✔✓■]\s*/, '').replace(/\(.*?\)/g, '').trim()); });
  });
  return marc.join('; ');
}
function lerFicha_(t, origem, arquivo, nomeArq) {
  var nome = linhaCampo_(t, 'Nome da Atividade');
  var cab = (t.split('\n').filter(function (l) { return l.trim(); })[0] || '').trim();
  var titulo = nome || cab.replace(/^.*?ficha de atividade\s*[—–\-:]*\s*/i, '').replace(/^ramo filhotes\s*[—–\-:]+\s*/i, '').trim();
  var sem = (t.match(/semana\s*(\d{1,2})/i) || (nomeArq || '').match(/Semana_(\d+)/i) || [])[1] || '';
  if (/^semana\s*\d+$/i.test(titulo) || !titulo) {
    var p1 = programacao_(t).filter(function (r) { return !/rotina|celebra/i.test(r.a); })[0];
    titulo = 'Semana ' + sem + (p1 ? ': ' + p1.a : '');
  }
  var passo = secao_(t, /programa[çc][ãa]o descritiva[^\n]*\n/i, [/\n\s*materiais para imprimir/i]);
  return {
    origem: origem, semana: origem === 'Nacional' ? sem : '', titulo: titulo.slice(0, 160), data: origem === CONFIG.ORIGEM_FICHAS_GRUPO ? dataFicha_(t) : '',
    duracao: linhaCampo_(t, 'Dura[çc][ãa]o'), local: linhaCampo_(t, 'Local'),
    participantes: linhaCampo_(t, '(?:Quantidade de )?Participantes'),
    progressao: progressao_(t), programacao: programacao_(t),
    materiais: secao_(t, /(?:^|\n)\s*materiais( de apoio)?( sugeridos)?\s*:?\s*\n/i, [/\n\s*programa[çc][ãa]o/i, /\n\s*organiza[çc][ãa]o/i, /\n\s*cuidados/i, /\n\s*avalia[çc][ãa]o\s*\n/i]),
    seguranca: secao_(t, /(?:^|\n)\s*cuidados de seguran[çc]a[^\n]{0,60}\n/i, [/\n\s*roteiro/i, /\n\s*programa[çc][ãa]o/i, /\n\s*pista\s*1/i, /\n\s*avalia[çc][ãa]o\s*\n/i]),
    roteiro: secao_(t, /(?:^|\n)\s*(organiza[çc][ãa]o d[aoe][^\n]{0,60}|roteiro[^\n]{0,60})\n/i, [/\n\s*programa[çc][ãa]o geral/i, /\n\s*programa[çc][ãa]o descritiva/i, /\n\s*avalia[çc][ãa]o\s*\n/i]),
    passo: passo || t, arquivo: arquivo
  };
}

function importarFichasNinhada() {
  var ss = planNinhada_(), agora = new Date();
  var ciclo = CONFIG.PASTA_FICHAS_GRUPO_ID ? DriveApp.getFolderById(CONFIG.PASTA_FICHAS_GRUPO_ID) : null;
  var nac = CONFIG.PASTA_FICHAS_NACIONAL_ID ? DriveApp.getFolderById(CONFIG.PASTA_FICHAS_NACIONAL_ID) : null;
  var todas = [], materiaisImpr = [];
  [['Nacional', nac], [CONFIG.ORIGEM_FICHAS_GRUPO, ciclo]].forEach(function (par) {
    if (!par[1]) return;
    var arqs = {}, it = par[1].getFiles();
    while (it.hasNext()) { var f = it.next(), base = f.getName().replace(/\.(docx?|pdf)$/i, '').trim(); if (!arqs[base] || /docx?$/i.test(f.getName())) arqs[base] = f; }
    Object.keys(arqs).forEach(function (base) {
      
      var f = arqs[base], t = limpaTexto_(textoDoArquivo_(f));
      if (/^MATERIAIS PARA IMPRIMIR/i.test(t)) { materiaisImpr.push({ data: dataFicha_(t), url: f.getUrl(), nome: base }); return; }
      var partes = separarFichas_(t); if (!partes.length) partes = [t];
      partes.forEach(function (p) { todas.push(lerFicha_(p, par[0], f.getUrl(), f.getName())); });
    });
  });
  /* sem repetição: mesma origem + semana/data + título; fica a versão mais completa */
  var uni = {};
  todas.forEach(function (x) {
    var k = x.origem + '|' + (x.semana || x.data) + '|' + x.titulo.toLowerCase().replace(/[^a-z0-9à-ú]/g, '').slice(0, 40);
    var tam = function (y) { return JSON.stringify(y).length; };
    if (!uni[k] || tam(x) > tam(uni[k])) uni[k] = x;
  });
  var lista = Object.keys(uni).map(function (k) { return uni[k]; });
  materiaisImpr.forEach(function (m) { lista.forEach(function (x) { if (x.data && x.data === m.data) x.materiais = (x.materiais ? x.materiais + '\n\n' : '') + 'Materiais para imprimir: ' + m.url; }); });
  lista.sort(function (x, y) { return (x.origem + ('0' + x.semana).slice(-2) + x.data).localeCompare(y.origem + ('0' + y.semana).slice(-2) + y.data); });

  var sb = ss.getSheetByName('Banco de atividades') || ss.insertSheet('Banco de atividades');
  sb.clear(); sb.getRange(1, 1, 1, CAB_BANCO_.length).setValues([CAB_BANCO_]).setFontWeight('bold').setBackground('#E74E0F').setFontColor('#FFFFFF');
  var rows = lista.map(function (x) {
    return [x.origem, x.semana ? Number(x.semana) : '', x.titulo, x.data, x.duracao, x.local, x.participantes, x.progressao, JSON.stringify(x.programacao),
      x.materiais.slice(0, 20000), x.seguranca.slice(0, 20000), x.roteiro.slice(0, 20000), x.passo.slice(0, 40000), x.arquivo, agora];
  });
  if (rows.length) sb.getRange(2, 1, rows.length, CAB_BANCO_.length).setValues(rows);
  sb.setFrozenRows(1);

  /* Fichas do grupo ligadas às datas: substitui só as que vieram de importação (as editadas no painel ficam) */
  var sf = ss.getSheetByName('Fichas') || ss.insertSheet('Fichas');
  if (sf.getLastRow() === 0) sf.appendRow(CAB_FICHAS_);
  sf.getRange(1, 1, 1, CAB_FICHAS_.length).setValues([CAB_FICHAS_]).setFontWeight('bold').setBackground('#E74E0F').setFontColor('#FFFFFF'); sf.setFrozenRows(1);
  var v = sf.getDataRange().getValues(), manter = {};
  for (var i = v.length - 1; i >= 1; i--) {
    var d = v[i][0] instanceof Date ? Utilities.formatDate(v[i][0], 'America/Sao_Paulo', 'yyyy-MM-dd') : String(v[i][0]);
    if (v[i][12] === 'Importação') sf.deleteRow(i + 1); else manter[d] = 1;
  }
  var novas = lista.filter(function (x) { return x.origem === CONFIG.ORIGEM_FICHAS_GRUPO && x.data && !manter[x.data] && (manter[x.data] = 1); }).map(function (x) {
    var p = x.data.split('-');
    return [new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12), x.titulo, x.duracao, x.local, x.participantes, x.seguranca.slice(0, 20000), x.roteiro.slice(0, 20000),
      JSON.stringify(x.programacao), x.passo.slice(0, 40000), 'Importada do Drive', x.arquivo, agora, 'Importação', x.materiais.slice(0, 20000)];
  });
  if (novas.length) { sf.getRange(sf.getLastRow() + 1, 1, novas.length, CAB_FICHAS_.length).setValues(novas); sf.getRange(2, 1, sf.getLastRow() - 1, 1).setNumberFormat('dd/MM/yyyy'); }
  Logger.log('Banco: ' + lista.length + ' fichas (Nacional ' + lista.filter(function (x) { return x.origem === 'Nacional'; }).length + ', ' + CONFIG.ORIGEM_FICHAS_GRUPO + ' ' + lista.filter(function (x) { return x.origem === CONFIG.ORIGEM_FICHAS_GRUPO; }).length + '). Ligadas a datas: ' + novas.length + '.');
  Logger.log('TÍTULOS: ' + lista.map(function (x) { return (x.semana ? 'S' + x.semana : x.data) + ' ' + x.titulo.slice(0, 50) + ' [prog ' + x.programacao.length + ']'; }).join(' | '));
}
