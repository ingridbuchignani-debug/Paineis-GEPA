/* ===== Paxtu: login, sessão, cookies e leitura de perfil ===== */
/** Tela para a própria usuária digitar login e senha do Paxtu. Guarda nas propriedades da conta dela (fora do código). */
function configurarPaxtu() {
  var html = HtmlService.createHtmlOutput(
    '<div style="font-family:Tahoma,Verdana,sans-serif;font-size:14px;color:#2b2e2b">' +
    '<p>Login e senha do Paxtu usados pela atualização automática do painel. Ficam guardados só na sua conta Google, fora do código.</p>' +
    '<label>Login (registro)<br><input id="l" style="width:100%;padding:6px"></label><br><br>' +
    '<label>Senha<br><input id="s" type="password" style="width:100%;padding:6px"></label><br><br>' +
    '<button style="background:#00853e;color:#fff;border:0;padding:8px 16px;border-radius:6px" onclick="google.script.run.withSuccessHandler(function(m){document.getElementById(\'r\').textContent=m}).salvarPaxtu(document.getElementById(\'l\').value,document.getElementById(\'s\').value)">Salvar</button>' +
    '<p id="r" style="color:#00853e"></p></div>').setWidth(380).setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(html, 'Acesso ao Paxtu');
}

function salvarPaxtu(login, senha) {
  if (!login || !senha) return 'Preencha login e senha.';
  PropertiesService.getUserProperties().setProperties({ PAXTU_LOGIN: String(login).trim(), PAXTU_SENHA: String(senha) });
  return 'Salvo. Pode usar o painel.';
}

function testarPaxtu() {
  var ui = SpreadsheetApp.getUi();
  try { var s = paxtuSessao_(); var t = paxtuGet_(s, '/home'); var nome = (t.match(/Olá,\s*<[^>]*>\s*([^<]+)/) || [])[1] || '(nome não encontrado)'; ui.alert('Acesso ao Paxtu funcionando. Usuário: ' + nome.trim()); }
  catch (e) { ui.alert('Não foi possível entrar no Paxtu: ' + e.message); }
}

/* ===== Acesso ao Paxtu (login pelo login.escoteiros.org.br) ===== */
var PAXTU = 'https://paxtu100.escoteiros.org.br';

function guardaCookies_(jar, resp, host) {
  var h = resp.getAllHeaders()['Set-Cookie']; if (!h) return;
  (Array.isArray(h) ? h : [h]).forEach(function (c) { var p = String(c).split(';')[0]; var i = p.indexOf('='); if (i > 0) { jar[host] = jar[host] || {}; jar[host][p.slice(0, i).trim()] = p.slice(i + 1); } });
}

function cookieHeader_(jar, host) { var c = jar[host] || {}; return Object.keys(c).map(function (k) { return k + '=' + c[k]; }).join('; '); }

function hostDe_(url) { return url.match(/^https?:\/\/([^\/]+)/)[1]; }

function req_(jar, url, opt) {
  opt = opt || {}; var host = hostDe_(url);
  var o = { method: opt.method || 'get', followRedirects: false, muteHttpExceptions: true, headers: Object.assign({ 'Cookie': cookieHeader_(jar, host), 'User-Agent': 'Mozilla/5.0 PainelNinhadas' }, opt.headers || {}) };
  if (opt.payload) o.payload = opt.payload;
  var r = UrlFetchApp.fetch(url, o); guardaCookies_(jar, r, host); return r;
}

function seguir_(jar, url, opt) {
  var r = req_(jar, url, opt), n = 0;
  while ([301, 302, 303, 307].indexOf(r.getResponseCode()) >= 0 && n < 10) {
    var loc = r.getAllHeaders()['Location']; if (Array.isArray(loc)) loc = loc[0];
    if (loc.indexOf('http') !== 0) loc = 'https://' + hostDe_(url) + loc;
    url = loc; r = req_(jar, url); n++;
  }
  return { r: r, url: url };
}

function paxtuSessao_() {
  var p = PropertiesService.getUserProperties(); var login = p.getProperty('PAXTU_LOGIN'), senha = p.getProperty('PAXTU_SENHA');
  if (!login || !senha) throw new Error('credenciais não configuradas (menu Painel › Configurar acesso ao Paxtu).');
  var jar = {};
  var x = seguir_(jar, PAXTU + '/login'); var t = x.r.getContentText();
  var act = (t.match(/<form[^>]*id="kc-form-login"[^>]*action="([^"]+)"/) || [])[1];
  if (!act) { if (/Olá,/.test(t)) return jar; throw new Error('formulário de login não encontrado.'); }
  act = act.replace(/&amp;/g, '&');
  var y = req_(jar, act, { method: 'post', payload: { username: login, password: senha, credentialId: '' } });
  if (y.getResponseCode() === 200) throw new Error('login recusado (confira usuário e senha).');
  var loc = y.getAllHeaders()['Location']; if (Array.isArray(loc)) loc = loc[0];
  var z = seguir_(jar, loc);
  if (!/paxtu100/.test(z.url)) throw new Error('retorno inesperado do login.');
  return jar;
}

function paxtuGet_(jar, path) { var x = seguir_(jar, PAXTU + path); if (/login\.escoteiros/.test(x.url)) throw new Error('sessão expirada.'); return x.r.getContentText(); }

function pxToken_(jar) { var t = paxtuGet_(jar, '/associado/lista'); var m = t.match(/<meta name="csrf-token" content="([^"]+)"/); if (!m) throw new Error('token do Paxtu não encontrado.'); return m[1]; }

function pxPerfil_(jar, codigo, token) {
  var r = req_(jar, PAXTU + '/associado/perfil', { method: 'post', payload: { associate_code: codigo, _token: token } });
  return r.getContentText();
}
