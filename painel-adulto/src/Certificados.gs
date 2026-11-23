/* ===== Gerador de certificados e livro de controle =====
   Modelo: apresentação Google "Modelo_Certificado" (2 slides: conquista e participação).
   Numeração: 001/AAAA, reinicia a cada ano. Antes de 2027 funciona em modo teste. */
var CERT_ANO_INICIO = CONFIG.CERT_ANO_INICIO;

var ABA_LIVRO = 'Livro de certificados';

var ABA_LIVRO_TESTE = 'Livro de certificados (testes)';

var CAB_LIVRO = ['Número', 'Ano', 'Sequência', 'Nome', 'Registro', 'Tratamento', 'Tipo', 'Conquista ou atividade', 'Data da atividade', 'Data do certificado', 'Gerado por', 'Gerado em', 'PDF (Drive)'];

var MESES_EXT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/* Rodar uma vez: converte o modelo .pptx enviado à pasta do painel e prepara as abas */
function configurarCertificados() {
  var sp = PropertiesService.getScriptProperties();
  var pasta = DriveApp.getFolderById(PASTA_ID);
  var it = pasta.getFilesByName('Modelo_Certificado.pptx');
  if (!it.hasNext()) throw new Error('Envie o arquivo Modelo_Certificado.pptx para a pasta do painel.');
  var pptx = it.next();
  var resp = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + pptx.getId() + '/copy?supportsAllDrives=true', {
    method: 'post', contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: JSON.stringify({ name: 'Modelo_Certificado', mimeType: 'application/vnd.google-apps.presentation', parents: [PASTA_ID] }),
    muteHttpExceptions: true
  });
  if (resp.getResponseCode() !== 200) throw new Error('Conversão do modelo falhou: ' + resp.getContentText());
  sp.setProperty('CERT_MODELO_ID', JSON.parse(resp.getContentText()).id);
  var sub = pasta.getFoldersByName('Certificados');
  sp.setProperty('CERT_PASTA_ID', (sub.hasNext() ? sub.next() : pasta.createFolder('Certificados')).getId());
  [ABA_LIVRO, ABA_LIVRO_TESTE].forEach(function (n) { abaLivro_(n); });
  console.log('Certificados prontos. Modelo: ' + sp.getProperty('CERT_MODELO_ID'));
}

function abaLivro_(nome) {
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(nome);
  if (!sh) {
    sh = ss.insertSheet(nome);
    sh.getRange(1, 1, 1, CAB_LIVRO.length).setValues([CAB_LIVRO]).setFontWeight('bold').setBackground('#00853F').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
    sh.setColumnWidth(4, 260); sh.setColumnWidth(8, 300); sh.setColumnWidth(13, 220);
  }
  return sh;
}

function dataExtenso_(d) { return d.getDate() + ' de ' + MESES_EXT[d.getMonth()] + ' de ' + d.getFullYear(); }

function dataDe_(s) {
  if (s instanceof Date) return s;
  var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], 12);
  m = String(s || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], 12);
  return null;
}

/* Chamada pelo painel. itens: [{nome, reg, trat, tipo:'Conquista'|'Participação', desc, dataAtiv, data}] */
function gerarCertificados(itens) {
  if (!acessoOk_()) throw new Error('Acesso não autorizado.');
  if (!itens || !itens.length) throw new Error('Nenhum certificado no lote.');
  if (itens.length > 40) throw new Error('Gere no máximo 40 certificados por vez.');
  itens.forEach(function (x) {
    if (!String(x.nome || '').trim() || !String(x.desc || '').trim()) throw new Error('Falta nome ou conquista/atividade em algum certificado.');
  });
  var email = Session.getActiveUser().getEmail() || '';
  var agora = new Date(), ano = agora.getFullYear(), teste = ano < CERT_ANO_INICIO;
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    var sh = abaLivro_(teste ? ABA_LIVRO_TESTE : ABA_LIVRO);
    var ult = 0, n = sh.getLastRow();
    if (n > 1) sh.getRange(2, 2, n - 1, 2).getValues().forEach(function (r) { if (Number(r[0]) === ano) ult = Math.max(ult, Number(r[1]) || 0); });
    var linhas = itens.map(function (x, i) {
      var seq = ult + i + 1, num = ('00' + seq).slice(-3) + '/' + ano;
      var dc = dataDe_(x.data) || agora;
      return { numero: (teste ? 'TESTE ' : '') + num, seq: seq, nome: String(x.nome).trim().toUpperCase(), reg: String(x.reg || '').trim(),
        trat: x.trat || 'Jovem', tipo: x.tipo === 'Participação' ? 'Participação' : 'Conquista', desc: String(x.desc).trim(),
        dataAtiv: String(x.dataAtiv || ''), data: dc };
    });
    var pdf = montarPdfCertificados_(linhas, 'Certificados ' + linhas[0].numero.replace('/', '-') + (linhas.length > 1 ? ' a ' + linhas[linhas.length - 1].numero.split(' ').pop().replace('/', '-') : ''));
    var arq = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('CERT_PASTA_ID')).createFile(pdf);
    sh.getRange(sh.getLastRow() + 1, 1, linhas.length, CAB_LIVRO.length).setValues(linhas.map(function (l) {
      return [l.numero, ano, l.seq, l.nome, l.reg, l.trat, l.tipo, l.desc, l.dataAtiv, l.data, email, agora, arq.getUrl()];
    }));
    sh.getRange(2, 10, sh.getLastRow() - 1, 1).setNumberFormat('dd/MM/yyyy');
    sh.getRange(2, 12, sh.getLastRow() - 1, 1).setNumberFormat('dd/MM/yyyy HH:mm');
    return { ok: true, teste: teste, numeros: linhas.map(function (l) { return l.numero; }), nome: arq.getName() + '.pdf',
      pdf: Utilities.base64Encode(pdf.getBytes()) };
  } finally { lock.releaseLock(); }
}

/* Segunda via com o mesmo número, a partir do livro */
function segundaViaCertificado(numero) {
  if (!acessoOk_()) throw new Error('Acesso não autorizado.');
  var achado = null;
  [ABA_LIVRO, ABA_LIVRO_TESTE].forEach(function (nome) {
    var sh = SpreadsheetApp.getActive().getSheetByName(nome); if (!sh || achado || sh.getLastRow() < 2) return;
    sh.getRange(2, 1, sh.getLastRow() - 1, CAB_LIVRO.length).getValues().forEach(function (r) { if (!achado && String(r[0]) === String(numero)) achado = r; });
  });
  if (!achado) throw new Error('Certificado ' + numero + ' não encontrado no livro.');
  var l = { numero: achado[0], nome: achado[3], reg: achado[4], trat: achado[5], tipo: achado[6], desc: achado[7], dataAtiv: achado[8], data: dataDe_(achado[9]) || new Date() };
  var pdf = montarPdfCertificados_([l], 'Certificado ' + String(numero).replace('/', '-') + ' (2a via)');
  return { ok: true, nome: pdf.getName() + '.pdf', pdf: Utilities.base64Encode(pdf.getBytes()) };
}

function montarPdfCertificados_(linhas, nome) {
  var sp = PropertiesService.getScriptProperties();
  var modelo = sp.getProperty('CERT_MODELO_ID');
  if (!modelo) throw new Error('O gerador ainda não foi configurado (função configurarCertificados).');
  var pasta = DriveApp.getFolderById(sp.getProperty('CERT_PASTA_ID'));
  var copia = DriveApp.getFileById(modelo).makeCopy('tmp ' + nome, pasta);
  try {
    var pres = SlidesApp.openById(copia.getId()), base = pres.getSlides();
    linhas.forEach(function (l) {
      var s = (l.tipo === 'Participação' ? base[1] : base[0]).duplicate();
      s.move(pres.getSlides().length - 1);
      var dAtiv = dataDe_(l.dataAtiv);
      var rep = { '{{TRATAMENTO}}': l.trat, '{{NOME}}': l.nome, '{{REGISTRO}}': l.reg || '-', '{{CONQUISTA}}': l.desc, '{{ATIVIDADE}}': l.desc,
        '{{DATA_ATIVIDADE}}': dAtiv ? dataExtenso_(dAtiv) : (l.dataAtiv || ''), '{{DATA_EXTENSO}}': dataExtenso_(l.data), '{{NUMERO}}': l.numero };
      Object.keys(rep).forEach(function (k) { s.replaceAllText(k, rep[k]); });
    });
    base[0].remove(); base[1].remove();
    pres.saveAndClose();
    return copia.getAs('application/pdf').setName(nome);
  } finally { copia.setTrashed(true); }
}

function livroParaPainel_() {
  var out = { linhas: [], teste: new Date().getFullYear() < CERT_ANO_INICIO, configurado: !!PropertiesService.getScriptProperties().getProperty('CERT_MODELO_ID') };
  try { out.listas = listasCert_(); } catch (e) { out.listas = null; }
  [ABA_LIVRO, ABA_LIVRO_TESTE].forEach(function (nome) {
    var sh = SpreadsheetApp.getActive().getSheetByName(nome); if (!sh || sh.getLastRow() < 2) return;
    sh.getRange(2, 1, sh.getLastRow() - 1, 12).getDisplayValues().forEach(function (r) { out.linhas.push(r); });
  });
  return out;
}

function testeCertificado() {
  var r = gerarCertificados([{ nome: 'Fulano de Teste', reg: '11111', trat: 'Jovem', tipo: 'Conquista', desc: 'Especialidade Educação Física - Nível 1', data: new Date() }, { nome: 'Ciclano de Teste', reg: '22222', trat: 'Jovem', tipo: 'Participação', desc: 'Acampamento de Grupo', dataAtiv: '15/11/2026', data: new Date() }]);
  console.log(r.numeros.join(', ') + ' · ' + r.nome);
}

/* ===== Lista de especialidades e insígnias (aba editável) =====
   Fonte: Guias de Especialidades e Insígnias v1.2 (jul/2026), Lobinho/Escoteiro e Sênior/Pioneiro.
   A aba pode ser editada à mão quando sair versão nova do guia: o painel lê dela. */
var ABA_ESP = 'Especialidades e Insígnias';

var CAB_ESP = ['Tipo', 'Nome', 'Ramo', 'Eixo', 'Tem níveis?', 'Guia (página)'];

/* Rodar uma vez: cria a aba e preenche com a lista dos guias. Não apaga se já existir. */
function criarAbaEspecialidades() {
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(ABA_ESP);
  if (sh && sh.getLastRow() > 1) { Logger.log('A aba já existe com ' + (sh.getLastRow() - 1) + ' linhas. Nada foi alterado.'); return; }
  if (!sh) sh = ss.insertSheet(ABA_ESP);
  var L = [["Especialidade","Aeronáutica","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.24"],["Especialidade","Administração","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.26"],["Especialidade","Arquitetura e Urbanismo","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.28"],["Especialidade","Arte Digital","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.30"],["Especialidade","Artes Visuais","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.32"],["Especialidade","Artesanato","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.34"],["Especialidade","Astronomia","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.36"],["Especialidade","Biblioteconomia","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.38"],["Especialidade","Cartografia","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.40"],["Especialidade","Comédia","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.42"],["Especialidade","Comunicações","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.44"],["Especialidade","Confeitaria","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.46"],["Especialidade","Construção Civil","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.48"],["Especialidade","Costura e Estilismo","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.50"],["Especialidade","Criptografia","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.52"],["Especialidade","Culinária","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.54"],["Especialidade","Design de Interiores","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.56"],["Especialidade","E-sports","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.58"],["Especialidade","Educação Financeira","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.60"],["Especialidade","Empreendedorismo","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.62"],["Especialidade","Encadernação","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.64"],["Especialidade","Etiqueta","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.66"],["Especialidade","Fiscalização de Pátio de Aeródromo","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.68"],["Especialidade","Fotografia","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.70"],["Especialidade","GPS","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.72"],["Especialidade","Grafite","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.74"],["Especialidade","HQ","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.76"],["Especialidade","Informática","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.78"],["Especialidade","Jornalismo","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.80"],["Especialidade","Manicure","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.82"],["Especialidade","Manutenção Elétrica","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.84"],["Especialidade","Maquete","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.86"],["Especialidade","Marcenaria","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.88"],["Especialidade","Marinharia","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.90"],["Especialidade","Matemática","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.92"],["Especialidade","Mecânica de Automóveis","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.94"],["Especialidade","Oratória","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.96"],["Especialidade","Pintura","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.98"],["Especialidade","Planador","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.100"],["Especialidade","Plastimodelismo","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.102"],["Especialidade","Prevenção De Incêndio","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.104"],["Especialidade","Produção Gráfica","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.106"],["Especialidade","Programação","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.108"],["Especialidade","Propaganda e Marketing","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.110"],["Especialidade","Química","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.112"],["Especialidade","Radioamadorismo","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.114"],["Especialidade","Radioescuta","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.116"],["Especialidade","Redes de Computadores","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.118"],["Especialidade","Reparos Domésticos","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.120"],["Especialidade","Robótica","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.122"],["Especialidade","Segurança no Trânsito","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.124"],["Especialidade","Simulação Aérea","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.126"],["Especialidade","Sinalização","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.128"],["Especialidade","Vendas","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.130"],["Especialidade","Videomaker","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.132"],["Especialidade","Web Design","Lobinho e Escoteiro","Habilidades para a Vida","Sim","L/E p.134"],["Especialidade","Acampamento","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.138"],["Especialidade","Agricultura","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.140"],["Especialidade","Animais Peçonhentos e Venenosos","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.142"],["Especialidade","Aquarismo","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.144"],["Especialidade","Aquicultura","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.146"],["Especialidade","Biologia","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.148"],["Especialidade","Botânica","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.150"],["Especialidade","Corrida de Orientação","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.152"],["Especialidade","Cuidados com Animais de Estimação","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.154"],["Especialidade","Culinária Mateira","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.156"],["Especialidade","Energia","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.158"],["Especialidade","Entomologia","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.160"],["Especialidade","Escalada","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.162"],["Especialidade","Espeleoturismo","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.164"],["Especialidade","Excursões","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.166"],["Especialidade","Ferramentas de Corte","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.168"],["Especialidade","Geologia","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.170"],["Especialidade","Horticultura","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.172"],["Especialidade","Jardinagem e Paisagismo","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.174"],["Especialidade","Meliponicultura","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.176"],["Especialidade","Meteorologia","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.178"],["Especialidade","Microbiologia","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.180"],["Especialidade","Montanhismo","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.182"],["Especialidade","Mountain Bike","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.184"],["Especialidade","Oceanologia","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.186"],["Especialidade","Pesca","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.188"],["Especialidade","Pioneiria","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.190"],["Especialidade","Rastreamento","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.192"],["Especialidade","Sobrevivência","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.194"],["Especialidade","Zoologia","Lobinho e Escoteiro","Meio Ambiente","Sim","L/E p.196"],["Especialidade","Anime","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.200"],["Especialidade","Arqueologia","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.202"],["Especialidade","Arte da Marinharia","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.204"],["Especialidade","Artes Cênicas","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.206"],["Especialidade","Brasilidades","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.208"],["Especialidade","Capoeira","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.210"],["Especialidade","Civilizações da Antiguidade","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.212"],["Especialidade","Cosplay","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.214"],["Especialidade","Culinária Típica","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.216"],["Especialidade","Danças Folclóricas","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.218"],["Especialidade","Defesa Civil","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.220"],["Especialidade","Escotismo Mundial","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.222"],["Especialidade","Fogo de Conselho","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.224"],["Especialidade","Genealogia","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.226"],["Especialidade","Geografia","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.228"],["Especialidade","História Aeroespacial","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.230"],["Especialidade","História da Aviação","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.232"],["Especialidade","História Brasileira","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.234"],["Especialidade","História da Arte","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.236"],["Especialidade","História do Escotismo","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.238"],["Especialidade","História Local","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.240"],["Especialidade","História Marítima","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.242"],["Especialidade","História Mundial","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.244"],["Especialidade","Inclusão","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.246"],["Especialidade","Informações Turísticas","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.248"],["Especialidade","Libras","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.250"],["Especialidade","Línguas","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.252"],["Especialidade","Literatura","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.254"],["Especialidade","Mitologias","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.256"],["Especialidade","Museologia","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.258"],["Especialidade","Origami","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.260"],["Especialidade","Paleontologia","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.262"],["Especialidade","Paz e Justiça","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.264"],["Especialidade","Poesia","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.266"],["Especialidade","Prevenção de Fake News","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.268"],["Especialidade","Tradições dos Povos Originários","Lobinho e Escoteiro","Paz e Desenvolvimento","Sim","L/E p.270"],["Especialidade","Aeromodelismo","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.274"],["Especialidade","Anatomia Humana","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.276"],["Especialidade","Artes Marciais","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.278"],["Especialidade","Babá","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.280"],["Especialidade","Canoagem","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.282"],["Especialidade","Canto","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.284"],["Especialidade","Ciclismo","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.286"],["Especialidade","Coleções","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.288"],["Especialidade","Corrida de Rua","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.290"],["Especialidade","Cubo Mágico","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.292"],["Especialidade","Cuidados Bucais","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.294"],["Especialidade","Cuidados com Idosos","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.296"],["Especialidade","Culinária Vegetariana","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.298"],["Especialidade","Dança","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.300"],["Especialidade","Desportos Inclusivos","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.302"],["Especialidade","Esportes de Quadra","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.304"],["Especialidade","Expressão Musical","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.306"],["Especialidade","Futebol","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.308"],["Especialidade","Ginásticas","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.310"],["Especialidade","Hipismo","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.312"],["Especialidade","Ioiô","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.314"],["Especialidade","Jogos de Cartas Colecionáveis","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.316"],["Especialidade","Jogos de Tabuleiro","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.318"],["Especialidade","Mágica e Ilusionismo","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.320"],["Especialidade","Maquiagem","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.322"],["Especialidade","Mergulho","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.324"],["Especialidade","Natação","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.326"],["Especialidade","Nutrição","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.328"],["Especialidade","Patinação","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.330"],["Especialidade","Pipas","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.332"],["Especialidade","Plantas Medicinais","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.334"],["Especialidade","Prevenção Ao Bullying","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.336"],["Especialidade","Prevenção Aos Vícios","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.338"],["Especialidade","Prevenção em Saúde","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.340"],["Especialidade","Primeiros Socorros","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.342"],["Especialidade","Quebra-cabeças","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.346"],["Especialidade","Remo","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.348"],["Especialidade","RPG","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.350"],["Especialidade","Salvamento","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.352"],["Especialidade","Segurança","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.354"],["Especialidade","Segurança e Emergência Náutica","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.356"],["Especialidade","Skateboard","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.358"],["Especialidade","Slackline","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.360"],["Especialidade","Técnicas Verticais","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.362"],["Especialidade","Tênis","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.364"],["Especialidade","Tênis de Mesa","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.366"],["Especialidade","Tiro com Arco","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.368"],["Especialidade","Triatlo","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.370"],["Especialidade","Vela","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.372"],["Especialidade","Vigilância Epidemiológica","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.374"],["Especialidade","Xadrez","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.376"],["Especialidade","Yoga","Lobinho e Escoteiro","Saúde e Bem-Estar","Sim","L/E p.378"],["Insígnia","Distintivo Mensageiros da Paz","Lobinho e Escoteiro","","Não","L/E p.383"],["Insígnia","Tribo da Terra","Lobinho e Escoteiro","","Não","L/E p.386"],["Insígnia","Insígnia Campeões da Natureza","Lobinho","","Não","L/E p.390"],["Insígnia","Insígnia Reduzir, Reciclar e Reutilizar","Lobinho","","Não","L/E p.394"],["Insígnia","Insígnia Escoteiros Pela Energia Solar","Lobinho","","Não","L/E p.397"],["Insígnia","Insígnia do Aprender","Lobinho","","Não","L/E p.400"],["Insígnia","Insígnia da Boa Ação","Lobinho","","Não","L/E p.402"],["Insígnia","Insígnia do Cone Sul","Lobinho","","Não","L/E p.405"],["Insígnia","Insígnia da Lusofonia","Lobinho","","Não","L/E p.408"],["Insígnia","Insígnia Campeões da Natureza","Escoteiro","","Não","L/E p.412"],["Insígnia","Insígnia Reduzir, Reciclar e Reutilizar","Escoteiro","","Não","L/E p.416"],["Insígnia","Insígnia Escoteiros Pela Energia Solar","Escoteiro","","Não","L/E p.420"],["Insígnia","Insígnia do Aprender","Escoteiro","","Não","L/E p.423"],["Insígnia","Insígnia da Ação Comunitária","Escoteiro","","Não","L/E p.426"],["Insígnia","Insígnia do Cone Sul","Escoteiro","","Não","L/E p.428"],["Insígnia","Insígnia da Lusofonia","Escoteiro","","Não","L/E p.432"],["Insígnia","Insígnia da Modalidade do Ar - Aviador","Escoteiro","","Não","L/E p.438"],["Insígnia","Insígnia da Modalidade do Mar - Grumete","Escoteiro","","Não","L/E p.442"],["Especialidade","Comunicações","Sênior e Pioneiro","Habilidades para a Vida","Não","S/P p.24"],["Especialidade","Educação","Sênior e Pioneiro","Habilidades para a Vida","Não","S/P p.30"],["Especialidade","Empreendedorismo e Negócios","Sênior e Pioneiro","Habilidades para a Vida","Não","S/P p.36"],["Especialidade","Finanças e Economia","Sênior e Pioneiro","Habilidades para a Vida","Não","S/P p.42"],["Especialidade","Gastronomia","Sênior e Pioneiro","Habilidades para a Vida","Não","S/P p.48"],["Especialidade","Idiomas","Sênior e Pioneiro","Habilidades para a Vida","Não","S/P p.54"],["Especialidade","Liderança e Gestão","Sênior e Pioneiro","Habilidades para a Vida","Não","S/P p.60"],["Especialidade","Tecnologia","Sênior e Pioneiro","Habilidades para a Vida","Não","S/P p.66"],["Especialidade","Viagens","Sênior e Pioneiro","Habilidades para a Vida","Não","S/P p.72"],["Especialidade","Agricultura Sustentável","Sênior e Pioneiro","Meio Ambiente","Não","S/P p.80"],["Especialidade","Ecoturismo","Sênior e Pioneiro","Meio Ambiente","Não","S/P p.86"],["Especialidade","Educação Ambiental","Sênior e Pioneiro","Meio Ambiente","Não","S/P p.92"],["Especialidade","Esportes de Aventura","Sênior e Pioneiro","Meio Ambiente","Não","S/P p.98"],["Especialidade","Habilidades Escoteiras","Sênior e Pioneiro","Meio Ambiente","Não","S/P p.104"],["Especialidade","Natureza e Ciências Naturais","Sênior e Pioneiro","Meio Ambiente","Não","S/P p.110"],["Especialidade","Sustentabilidade","Sênior e Pioneiro","Meio Ambiente","Não","S/P p.116"],["Especialidade","Ações Humanitárias","Sênior e Pioneiro","Paz e Desenvolvimento","Não","S/P p.124"],["Especialidade","Ciências Humanas","Sênior e Pioneiro","Paz e Desenvolvimento","Não","S/P p.130"],["Especialidade","Cultura e Arte","Sênior e Pioneiro","Paz e Desenvolvimento","Não","S/P p.136"],["Especialidade","Desenvolvimento Comunitário","Sênior e Pioneiro","Paz e Desenvolvimento","Não","S/P p.142"],["Especialidade","Direitos Humanos","Sênior e Pioneiro","Paz e Desenvolvimento","Não","S/P p.148"],["Especialidade","Diversidades","Sênior e Pioneiro","Paz e Desenvolvimento","Não","S/P p.154"],["Especialidade","Equidade","Sênior e Pioneiro","Paz e Desenvolvimento","Não","S/P p.160"],["Especialidade","Fé, Crenças e Diálogo Inter-religioso","Sênior e Pioneiro","Paz e Desenvolvimento","Não","S/P p.166"],["Especialidade","Inclusão e Acessibilidade","Sênior e Pioneiro","Paz e Desenvolvimento","Não","S/P p.172"],["Especialidade","Políticas Públicas","Sênior e Pioneiro","Paz e Desenvolvimento","Não","S/P p.178"],["Especialidade","Educação Alimentar e Nutricional","Sênior e Pioneiro","Saúde e Bem-Estar","Não","S/P p.186"],["Especialidade","Esportes","Sênior e Pioneiro","Saúde e Bem-Estar","Não","S/P p.192"],["Especialidade","Hobbies e Lazer","Sênior e Pioneiro","Saúde e Bem-Estar","Não","S/P p.198"],["Especialidade","Saúde","Sênior e Pioneiro","Saúde e Bem-Estar","Não","S/P p.204"],["Especialidade","Saúde Mental e Bem-estar Emocional","Sênior e Pioneiro","Saúde e Bem-Estar","Não","S/P p.210"],["Especialidade","Saúde Sexual e Reprodutiva","Sênior e Pioneiro","Saúde e Bem-Estar","Não","S/P p.216"],["Insígnia","Insígnia do Aprender","Sênior","","Não","S/P p.224"],["Insígnia","Insígnia do Desafio Comunitário","Sênior","","Não","S/P p.227"],["Insígnia","Insígnia do Cone Sul","Sênior","","Não","S/P p.229"],["Insígnia","Insígnia da Lusofonia","Sênior","","Não","S/P p.233"],["Insígnia","Insígnia da Modalidade do Ar - Aeronauta","Sênior","","Não","S/P p.238"],["Insígnia","Insígnia da Modalidade do Mar - Naval","Sênior","","Não","S/P p.242"],["Insígnia","Insígnia do Aprender","Pioneiro","","Não","S/P p.248"],["Insígnia","Insígnia do Cone Sul","Pioneiro","","Não","S/P p.250"],["Insígnia","Insígnia da Lusofonia","Pioneiro","","Não","S/P p.253"],["Insígnia","Tribo da Terra","Sênior e Pioneiro","","Não","S/P p.258"],["Insígnia","Insígnia Campeões da Natureza","Sênior e Pioneiro","","Não","S/P p.259"],["Insígnia","Insígnia Reduzir, Reciclar e Reutilizar","Sênior e Pioneiro","","Não","S/P p.262"],["Insígnia","Insígnia Escoteiros Pela Energia Solar","Sênior e Pioneiro","","Não","S/P p.265"],["Insígnia","Distintivo Mensageiros da Paz","Sênior e Pioneiro","","Não","S/P p.269"],["Insígnia","Inovadores de Impacto","Sênior e Pioneiro","","Não","S/P p.273"],["Insígnia","Reconhecimento Escoteiros do Mundo","Sênior e Pioneiro","","Não","S/P p.275"],["Progressão","Progressão Pista","","","Não","do livro 2024"],["Progressão","Progressão Trilha","","","Não","do livro 2024"],["Progressão","Progressão Rumo","","","Não","do livro 2024"],["Progressão","Progressão Travessia","","","Não","do livro 2024"],["Cordão","Cordão Verde e Amarelo","","","Não","do livro 2024"],["Cordão","Cordão Vermelho e Branco","","","Não","do livro 2024"],["Promessa e outros","Promessa Escoteira","","","Não","do livro 2024"],["Promessa e outros","1 Ano de Boas Atividades","","","Não","do livro 2024"]];
  sh.getRange(1, 1, 1, CAB_ESP.length).setValues([CAB_ESP]).setFontWeight('bold').setBackground('#00853e').setFontColor('#ffffff');
  sh.getRange(2, 1, L.length, CAB_ESP.length).setValues(L);
  sh.getRange(2, 1, L.length + 200, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Especialidade', 'Insígnia', 'Progressão', 'Cordão', 'Promessa e outros'], true).build());
  sh.getRange(2, 5, L.length + 200, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Sim', 'Não'], true).build());
  sh.setFrozenRows(1); sh.autoResizeColumns(1, CAB_ESP.length);
  Logger.log('Aba criada com ' + L.length + ' itens.');
}

function listasCert_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(ABA_ESP);
  if (!sh || sh.getLastRow() < 2) return null;
  return sh.getRange(2, 1, sh.getLastRow() - 1, 5).getDisplayValues().filter(function (r) { return r[0] && r[1]; })
    .map(function (r) { return [r[0], r[1].trim(), r[2], r[4]]; });
}
