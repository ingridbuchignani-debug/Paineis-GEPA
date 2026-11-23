/* ===== Leitura da planilha para o painel ===== */
function aba_(n) { var sh = SpreadsheetApp.getActive().getSheetByName(n); if (!sh) throw new Error('Aba ' + n + ' não encontrada.'); return sh; }
function linhas_(n) {
  var sh = aba_(n), v = sh.getDataRange().getValues(), cab = v.shift();
  return v.map(function (r, i) { var o = { _linha: i + 2 }; cab.forEach(function (c, j) { o[c] = r[j]; }); return o; })
    .filter(function (o) { return cab.some(function (c) { return o[c] !== '' && o[c] !== null; }); });
}
function dt_(d) { return d instanceof Date ? Utilities.formatDate(d, TZ, 'dd/MM/yyyy') : String(d || ''); }
function dtDia_(d) { return d instanceof Date ? dt_(d) + ' (' + DIAS_[d.getDay()] + ')' : String(d || ''); }
function iso_(d) { return d instanceof Date ? Utilities.formatDate(d, TZ, 'yyyy-MM-dd') : ''; }

function getDados() {
  exigir_();
  var hoje = new Date();
  var anoRenov = hoje.getFullYear() + 1;
  var fil = linhas_('Filhotes').map(function (f) {
    var kr = Object.keys(f).filter(function (k) { return /^Renovar/.test(k); })[0];
    return { cod: String(f['Registro escoteiro']), nome: f['Nome'], registro: f['Nº registro'], nasc: dt_(f['Data de nascimento']), idade: f['Idade'],
      validade: dt_(f['Validade do registro']), situacao: f['Situação'], renovar: kr ? f[kr] : '',
      resp1: f['Responsável 1'], par1: f['Parentesco 1'], cont1: f['Contato 1'], email1: f['E-mail 1'],
      resp2: f['Responsável 2'], par2: f['Parentesco 2'], cont2: f['Contato 2'], email2: f['E-mail 2'],
      conquistas: { Acolhida: dt_(f['Acolhida']), Paco: dt_(f['Paco']), Tixa: dt_(f['Tixa']), Lipe: dt_(f['Lipe']), Nina: dt_(f['Nina']), 'Caminho Lobinho': dt_(f['Caminho Lobinho']) },
      obs: f['Observações'], atualizado: dt_(f['Atualizado em']), ninhada: f['Ninhada'] || Object.keys(CONFIG.SECOES_PAXTU)[0] };
  }).sort(function (a, b) { return String(a.nome).localeCompare(String(b.nome)); });

  var itens = linhas_('Itens').map(function (i) {
    return { etapa: i['Etapa'], bloco: i['Bloco'], codBloco: i['Código do bloco'], minimo: Number(i['Mínimo do bloco']) || 0, cod: String(i['Código do item']), item: i['Item'] };
  });
  var prog = linhas_('Progressão').map(function (p) {
    return { linha: p._linha, cod: String(p['Registro escoteiro']), item: String(p['Código do item']), data: dt_(p['Data']), obs: p['Observação da chefia'], paxtu: p['Situação no Paxtu'], motivo: p['Motivo Paxtu'] || '' };
  });

  var ativ = linhas_('Atividades').map(function (a) {
    var d = a['Data'];
    return { linha: a._linha, data: dtDia_(d), iso: iso_(d), passada: d instanceof Date && d < hoje, tipo: a['Tipo'], titulo: a['Título'], local: a['Local'],
      situacao: a['Situação'], motivo: a['Motivo do cancelamento'], taxa: (a['Taxa por participante'] !== undefined ? a['Taxa por participante'] : a['Taxa por Filhote']), autorizacao: a['Autorização no Paxtu'],
      programacao: a['Programação'], paxtu: a['Situação no Paxtu'], ausentes: a['Chefia ausente'], obs: a['Observações'],
      itens: String(a['Itens de progressão'] || '').split(',').map(function (x) { return x.trim(); }).filter(String) };
  }).sort(function (a, b) { return a.iso < b.iso ? -1 : 1; });

  var pres = linhas_('Presença').map(function (p) {
    return { data: iso_(p['Data']), atividade: p['Atividade'], cod: String(p['Registro escoteiro']), estado: p['Estado'], motivo: p['Motivo'], paxtu: p['Lançado no Paxtu'], acomp: Number(p['Acompanhantes']) || 0 };
  });
  var fin = linhas_('Financeiro').map(function (f) {
    return { linha: f._linha, data: dt_(f['Data']), cod: String(f['Registro escoteiro'] || ''), filhote: f['Filhote'], descricao: f['Descrição'], tipo: f['Tipo'],
      valor: Number(f['Valor']) || 0, situacao: f['Situação'], forma: f['Forma de pagamento'], atividade: f['Atividade'], obs: f['Observação'] };
  });
  var docs = linhas_('Documentos').map(function (d) {
    return { linha: d._linha, cod: String(d['Registro escoteiro'] || ''), nome: d['Nome'], documento: d['Documento'], situacao: d['Situação'], data: dt_(d['Data']), link: d['Link'] };
  });
  return { fila: getFila_(), meses: metricasNinhada_(fil), fichasAt: getFichasAtiv_(), banco: getBanco_(), fichas: getFichas_(), cmdca: getCmdca_(), hoje: dtDia_(hoje), anoRenov: anoRenov, filhotes: fil, itens: itens, progressao: prog, atividades: ativ, presenca: pres, financeiro: fin, documentos: docs };
}

