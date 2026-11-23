/* ===== Verba CMDCA 2027: o dinheiro não passa pela Ninhada. A chefia envia as notas fiscais e o Diretor Financeiro paga. ===== */
var CMDCA_PLAN_ = 'CMDCA 2027 - Planejado', CMDCA_NF_ = 'CMDCA 2027 - Notas';
function getCmdca_() {
  var ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName(CMDCA_PLAN_)) return null;
  var plan = linhas_(CMDCA_PLAN_).map(function (p) { return { mes: Number(p['Mês']), categoria: p['Categoria'], valor: Number(p['Valor previsto']) || 0, cobre: p['O que cobre'] }; });
  var notas = linhas_(CMDCA_NF_).map(function (n) {
    return { linha: n._linha, data: dt_(n['Data da NF']), iso: iso_(n['Data da NF']), mes: n['Data da NF'] instanceof Date ? n['Data da NF'].getMonth() + 1 : 0,
      categoria: n['Categoria'], atividade: n['Atividade'], fornecedor: n['Fornecedor'], nf: n['Nº da NF'], valor: Number(n['Valor']) || 0,
      link: n['Link da NF'], situacao: n['Situação'], envio: dt_(n['Enviada em']), obs: n['Observação'] };
  });
  return { total: 6000, plan: plan, notas: notas };
}
function lancarNotaCMDCA(o) {
  var email = exigir_();
  return trava_(function () {
    var sh = aba_(CMDCA_NF_), d = dataDe_(o.iso);
    sh.appendRow([d, o.categoria, o.atividade || '', o.fornecedor || '', o.nf || '', Number(String(o.valor).replace(',', '.')) || 0, o.link || '',
      o.situacao || 'A enviar', o.situacao === 'Enviada ao financeiro' ? new Date() : '', o.obs || '']);
    sh.getRange(sh.getLastRow(), 1).setNumberFormat('dd/MM/yyyy'); sh.getRange(sh.getLastRow(), 9).setNumberFormat('dd/MM/yyyy');
    registrarAcesso_(email, 'NF CMDCA ' + (o.nf || ''));
    return 'Nota lançada.';
  });
}
function situacaoNotaCMDCA(linha, situacao) {
  exigir_();
  var sh = aba_(CMDCA_NF_);
  sh.getRange(linha, 8).setValue(situacao);
  if (situacao === 'Enviada ao financeiro' && !sh.getRange(linha, 9).getValue()) sh.getRange(linha, 9).setValue(new Date()).setNumberFormat('dd/MM/yyyy');
  return 'Situação atualizada.';
}
function linkNotaCMDCA(linha, link) { exigir_(); aba_(CMDCA_NF_).getRange(linha, 7).setValue(link); return 'Link salvo.'; }

