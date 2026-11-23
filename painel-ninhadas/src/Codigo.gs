/* ===== Painel das Ninhadas: web app, acesso e menu =====
   Script vinculado à planilha do painel. Web app: executar como proprietário, acesso: qualquer pessoa do domínio (CONFIG.DOMINIO).
   Só entra quem estiver na aba Chefia (Nome, E-mail, Liberado = Sim). Configurações do grupo em Config.gs. */
var DOMINIO = CONFIG.DOMINIO;
var DIAS_ = ['Domingo', '2ª Feira', '3ª Feira', '4ª Feira', '5ª Feira', '6ª Feira', 'Sábado'];
var TZ = 'America/Sao_Paulo';

function doGet() {
  var email = (Session.getActiveUser().getEmail() || '').toLowerCase();
  if (!acessoOk_(email)) {
    registrarAcesso_(email, 'Negado');
    return HtmlService.createHtmlOutput('<div style="font-family:Montserrat,Arial;padding:40px;color:#333"><h2 style="color:#E74E0F">Painel das Ninhadas</h2>' +
      '<p>Acesso restrito à chefia da Ninhada. Entre com o seu e-mail @' + DOMINIO + '.</p><p>E-mail identificado: ' + (email || 'nenhum') + '</p></div>')
      .setTitle('Painel das Ninhadas - ' + CONFIG.NOME_CURTO);
  }
  registrarAcesso_(email, 'Acesso');
  return HtmlService.createTemplateFromFile('Painel').evaluate().setTitle('Painel das Ninhadas - ' + CONFIG.NOME_CURTO)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
function chefia_() {
  var lista = [];
  var sh = SpreadsheetApp.getActive().getSheetByName('Chefia');
  if (sh && sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues().forEach(function (r) {
    var e = String(r[1] || '').trim().toLowerCase();
    if (e && !/^n[aã]o$/i.test(String(r[2]).trim())) lista.push(e);
  });
  var dono = '';
  try { dono = SpreadsheetApp.getActive().getOwner().getEmail().toLowerCase(); } catch (e) {}
  if (dono && lista.indexOf(dono) < 0) lista.push(dono);
  var adm = String(CONFIG.ADMIN_EMAIL || '').toLowerCase();
  if (adm && lista.indexOf(adm) < 0) lista.push(adm);
  return lista;
}
function acessoOk_(email) {
  return !!email && new RegExp('@' + DOMINIO.replace('.', '\\.') + '$').test(email) && chefia_().indexOf(email) >= 0;
}
function soDona_() {
  var e = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  if (e !== String(CONFIG.ADMIN_EMAIL || '').toLowerCase()) throw new Error('Só a administradora do painel pode fazer isso.');
}
function exigir_() {
  var email = (Session.getActiveUser().getEmail() || '').toLowerCase();
  if (!acessoOk_(email)) throw new Error('Acesso não autorizado.');
  return email;
}
function registrarAcesso_(email, acao) {
  try {
    var sh = aba_('Acessos'), d = new Date();
    sh.appendRow([Utilities.formatDate(d, TZ, 'dd/MM/yyyy') + ' (' + DIAS_[d.getDay()] + ')', Utilities.formatDate(d, TZ, 'HH:mm'), email || '(não informado)', '', acao]);
  } catch (e) {}
}


/* Menu e botão na planilha para abrir o painel */
var URL_PAINEL_ = (function () { try { return ScriptApp.getService().getUrl(); } catch (e) { return ''; } })();
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Painel').addItem('Abrir o painel', 'abrirPainel').addSeparator()
    .addItem('1. Configurar acesso ao Paxtu', 'configurarPaxtu').addItem('2. Configurar chave do Gemini', 'configurarGemini')
    .addItem('3. Preparar a planilha (primeira vez)', 'criarPlanilhaNinhada').addItem('4. Instalar atualizações automáticas', 'instalarRotinas').addSeparator()
    .addItem('Atualizar Filhotes do Paxtu agora', 'atualizarNinhadaDoPaxtu').addItem('Importar fichas de atividade', 'importarFichasNinhada')
    .addItem('Atualizar base do Pergunte', 'prepararConsultaNinhada').addToUi();
}
function abrirPainel() {
  var h = HtmlService.createHtmlOutput('<script>window.open("' + URL_PAINEL_ + '","_blank");google.script.host.close();</script>' +
    '<p style="font-family:Arial">Se não abriu, <a href="' + URL_PAINEL_ + '" target="_blank">clique aqui</a>.</p>').setWidth(260).setHeight(70);
  SpreadsheetApp.getUi().showModelessDialog(h, 'Abrindo o painel');
}
