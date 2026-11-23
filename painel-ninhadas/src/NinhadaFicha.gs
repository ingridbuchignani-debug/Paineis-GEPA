/* ===== Ninhada: ficha do Filhote vinda do Paxtu (data de entrada, saúde e alimentação) =====
   Escreve a aba "Ficha Paxtu" da planilha do Painel das Ninhadas. Não escreve nada no Paxtu.
   Roda todo dia às 4h30 (instalarFichaNinhada). Só a chefia liberada vê no painel. */

var ABA_FICHA_N_ = 'Ficha Paxtu';
var CAB_FICHA_N_ = ['Registro escoteiro', 'Nome', 'Ninhada', 'Data de entrada', 'Tipo sanguíneo', 'Alergias', 'Condições de saúde',
  'Acompanhamento médico', 'Medicamentos', 'Cuidados no dia a dia', 'Restrição alimentar', 'Plano de saúde', 'Atualizado em'];

var ROT_ = {
  cronicos: { 'checkbox-asthma': 'Asma', 'checkbox-bronchitis': 'Bronquite', 'checkbox-sinusitis': 'Sinusite', 'checkbox-hypertension': 'Hipertensão',
    'checkbox-diabetes': 'Diabetes', 'checkbox-epilepsy': 'Epilepsia', 'checkbox-dermatological': 'Dermatológico', 'checkbox-cardiac': 'Cardíaco',
    'checkbox-rheumatological': 'Reumatológico', 'checkbox-kidney': 'Renal', 'checkbox-hematological': 'Hematológico' },
  alergias: { 'mite-allergy': 'Ácaro', 'food-allergy': 'Alimento', 'fungus-allergy': 'Fungo', 'bug-bite-allergy': 'Picada de inseto',
    'plant-allergy': 'Planta', 'medicine-allergy': 'Medicamento', 'other-allergy': 'Outra' },
  condicoes: { 'physical-condition': 'Física', 'visual-condition': 'Visual', 'hearing-condition': 'Auditiva', 'intellectual-condition': 'Intelectual',
    'autism-condition': 'Autismo' },
  cuidados: { 'instructions-difficulty': 'Dificuldade com instruções', 'eating-difficulties': 'Dificuldade para comer', 'sleep-difficulty': 'Dificuldade para dormir',
    'communication-difficulty': 'Dificuldade de comunicação', 'anxiety-crisis': 'Crises de ansiedade', 'aggression-crisis': 'Crises de agressividade',
    'self-aggression-crisis': 'Crises de autoagressão', 'runaway-tendencies': 'Tendência a fugir', 'self-destructive': 'Comportamento autodestrutivo',
    'psychomotor-agitation': 'Agitação psicomotora' },
  equip: { 'checkbox-glasses': 'Óculos', 'checkbox-contact-lens': 'Lente de contato', 'checkbox-braces': 'Aparelho dentário', 'checkbox-probe': 'Sonda',
    'checkbox-pacemaker': 'Marca-passo' }
};

function tagFN_(h, chave) {
  var re = new RegExp('<(input|textarea|select)[^>]*(id|name)="' + chave.replace(/[\[\]]/g, '\\$&') + '"[^>]*>', 'i');
  var m = h.match(re); return m ? { tag: m[0], pos: m.index } : null;
}
function marcadoFN_(h, id) { var t = tagFN_(h, id); return !!(t && /\schecked/i.test(t.tag)); }
function valorFN_(h, chave) {
  var t = tagFN_(h, chave); if (!t) return '';
  if (/^<textarea/i.test(t.tag)) { var r = h.slice(t.pos + t.tag.length); return decodeHtml_(r.slice(0, r.search(/<\/textarea>/i))).trim(); }
  if (/^<select/i.test(t.tag)) { var b = h.slice(t.pos, h.indexOf('</select>', t.pos)), o = b.match(/<option[^>]*selected[^>]*>([^<]*)/i); return o ? decodeHtml_(o[1]).trim() : ''; }
  var v = t.tag.match(/value="([^"]*)"/i); return v ? decodeHtml_(v[1]).trim() : '';
}
function simFN_(h, nome) {
  if (marcadoFN_(h, 'yes-' + nome)) return true;
  var re = new RegExp('<input[^>]*name="' + nome + '"[^>]*>', 'gi'), m;
  while ((m = re.exec(h))) if (/\schecked/i.test(m[0])) return /value="(1|s|sim|yes|true|y)"/i.test(m[0]);
  return false;
}
function listaFN_(h, mapa, comDescricao) {
  return Object.keys(mapa).filter(function (id) { return marcadoFN_(h, id); }).map(function (id) {
    var d = comDescricao ? valorFN_(h, id + '-description') : ''; return mapa[id] + (d ? ' (' + d + ')' : '');
  }).join('; ');
}

function fichaDoPerfilN_(h) {
  var i0 = h.indexOf('id="medical-records"'), m = i0 >= 0 ? h.slice(i0) : '';
  if (!m) return null;
  var sangue = [valorFN_(m, 'associate-bloodtype'), valorFN_(m, 'associate-rh-factor')].filter(String).join(' ');
  var cron = simFN_(m, 'chronical-health-problem') ? [listaFN_(m, ROT_.cronicos, false), marcadoFN_(m, 'checkbox-other-condition') ? valorFN_(m, 'chronical-health-problem-other') : ''].filter(String).join('; ') : '';
  var cond = [cron, listaFN_(m, ROT_.condicoes, true),
    simFN_(m, 'mental-disorder') ? 'Saúde mental' + (valorFN_(m, 'mental-disorder-description') ? ' (' + valorFN_(m, 'mental-disorder-description') + ')' : '') : '',
    simFN_(m, 'physical-impediment') ? 'Impedimento físico' + (valorFN_(m, 'physical-impediment-description') ? ' (' + valorFN_(m, 'physical-impediment-description') + ')' : '') : '',
    simFN_(m, 'equipment') ? 'Usa: ' + listaFN_(m, ROT_.equip, false) : ''].filter(String).join('; ');
  var acomp = simFN_(m, 'medical-monitoring') ? ('Sim' + (valorFN_(m, 'medical-monitoring-info') ? ': ' + valorFN_(m, 'medical-monitoring-info') : '')) : '';
  var meds = [];
  if (simFN_(m, 'mental-disorder-medication')) meds.push(valorFN_(m, 'mental-disorder-medication-description') || 'Sim');
  if (simFN_(m, 'uses-medicine')) {
    var a = m.indexOf('medicine-rows-container'), bloco = a >= 0 ? m.slice(a, a + 6000) : '', achou = [];
    bloco = bloco.slice(0, (bloco.search(/<\/tbody>|<\/table>/i) + 1 || bloco.length + 1) - 1);
    (bloco.match(/<tr[\s\S]*?<\/tr>/gi) || []).forEach(function (tr) {
      var cel = (tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || []).map(function (td) { return decodeHtml_(td.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(); }).filter(String);
      (tr.match(/<input[^>]*type="text"[^>]*>/gi) || []).forEach(function (t) { var v = (t.match(/value="([^"]*)"/i) || [])[1]; if (v) cel.push(decodeHtml_(v)); });
      if (cel.length) achou.push(cel.join(' - '));
    });
    meds.push(achou.length ? achou.join(', ') : 'Sim (ver Paxtu)');
  }
  var rest = simFN_(m, 'food-restriction') ? (valorFN_(m, 'food-restriction-description') || 'Sim') : '';
  var plano = simFN_(m, 'health-insurance') ? (valorFN_(m, 'health_insurance_description') || valorFN_(m, 'other-health-insurance') || 'Sim') : '';
  return { sangue: sangue, alergias: listaFN_(m, ROT_.alergias, true), cond: cond, acomp: acomp, meds: meds.join('; '),
    cuidados: listaFN_(m, ROT_.cuidados, true), rest: rest, plano: plano };
}

function atualizarFichaNinhada() {
  var ss = planNinhada_(), jar = paxtuSessao_(), tk = pxToken_(jar), L = [], agora = new Date();
  Object.keys(NINHADA_SECOES_).forEach(function (nin) {
    membrosNinhada_(jar, tk, NINHADA_SECOES_[nin]).forEach(function (mb) {
      var h = req_(jar, PAXTU + '/associado/perfil', { method: 'post', payload: { _token: tk, associate_code: mb.cd_associado } }).getContentText();
      var reg = String(pxCampoN_(h, 'associate-register-number') || '').replace(/\D/g, ''), f = fichaDoPerfilN_(h) || {};
      var ent = pxCampoN_(h, 'admission-date');
      L.push([reg || 'ID ' + mb.cd_associado, decodeHtml_(pxCampoN_(h, 'associate-name') || mb.nm_associado), nin, dataBR_(ent) || ent || '',
        f.sangue || '', f.alergias || '', f.cond || '', f.acomp || '', f.meds || '', f.cuidados || '', f.rest || '', f.plano || '', agora]);
    });
  });
  var sh = ss.getSheetByName(ABA_FICHA_N_) || ss.insertSheet(ABA_FICHA_N_);
  sh.clear(); sh.getRange(1, 1, 1, CAB_FICHA_N_.length).setValues([CAB_FICHA_N_]).setFontWeight('bold').setBackground('#E74E0F').setFontColor('#FFFFFF');
  if (L.length) sh.getRange(2, 1, L.length, CAB_FICHA_N_.length).setValues(L);
  sh.setFrozenRows(1);
  Logger.log('Ficha Paxtu: ' + L.length + ' Filhotes. Com alguma informação de saúde ou alimentação: ' +
    L.filter(function (r) { return r.slice(5, 12).join('') !== ''; }).length + '. Com data de entrada: ' + L.filter(function (r) { return r[3]; }).length);
}

function instalarFichaNinhada() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'atualizarFichaNinhada') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('atualizarFichaNinhada').timeBased().everyDays(1).atHour(4).nearMinute(30).create();
  Logger.log('Atualização diária da ficha instalada (4h30).');
}
