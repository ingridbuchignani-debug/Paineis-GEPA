/* ===== Instalação: atalhos do menu "Painel" para montar o painel num grupo novo ===== */

/** Cria o Formulário de Acompanhamento de Competências ligado à planilha.
    Depois copie o link público do formulário para CONFIG.FORM_COMPETENCIAS_URL. */
function criarFormularioCompetencias() { criarFormulario_(); }

/** Monta a aba Acessos com os adultos e e-mails lidos do Paxtu. Marque Sim para quem pode entrar. */
function montarAcessos() { montarAcessos_(); }

/** Monta o catálogo das Rotas de aprendizagem e o formulário de autoavaliação. */
function montarRotas() { montarAbaRotas(); montarFormularioRotas(); }

/** Rotinas automáticas: adultos do Paxtu toda 2ª Feira de madrugada,
    verificação diária dos certificados de anos de atividade e promessas aos domingos. */
function instalarRotinasAdulto() {
  instalarAtualizacaoSemanal_();
  instalarEstrelas();
  SpreadsheetApp.getUi().alert('Rotinas automáticas instaladas.');
}
