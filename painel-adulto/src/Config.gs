/* ===== Configuração do grupo: edite só este arquivo =====
   Nada aqui é senha: login e senha do Paxtu são informados pelo menu da planilha
   (Painel > Configurar acesso ao Paxtu) e ficam guardados nas propriedades do projeto, fora do código. */
var CONFIG = {
  NOME_GRUPO: 'Grupo Escoteiro Exemplo 00/UF',   // aparece no cabeçalho do painel
  NOME_CURTO: 'GE Exemplo',                      // usado em títulos, formulário e e-mails
  NOME_PAINEL: 'Painel GE Exemplo',              // nome de quem envia os e-mails automáticos
  PLANILHA_ID: '',                               // ID da planilha do painel (está no endereço dela)
  PASTA_PAINEL_ID: '',                           // pasta do Drive onde ficam a planilha, o formulário e o modelo de certificado
  FORM_COMPETENCIAS_URL: '',                     // link público do formulário (criado pelo menu, passo 5)
  CERT_ANO_INICIO: 2027,                         // antes deste ano os certificados saem em modo teste (só para quem administra)
  /* Histórico do Paxtu no Drive (HistoricoPaxtu.gs) */
  HIST_PASTA_ID: '',                             // pasta base do grupo: cria dentro dela "Chefia" e "Jovens"
  HIST_PASTA_ADMIN_ID: '',                       // pasta administrativa: cria "Paxtu - Relatórios" (apólice do seguro)
  HIST_SECOES: [                                 // opcional: pasta de cada seção no Drive, pelo trecho do nome no Paxtu
    // [/lobinho|alcateia/i, 'ID da pasta da alcateia'],
  ]
};
