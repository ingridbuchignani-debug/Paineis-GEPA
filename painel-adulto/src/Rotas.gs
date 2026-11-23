// Catálogo das Rotas de Aprendizagem (resumo das atividades por competência e nível)
// Fontes:
//  Filhotes: Competências e Rotas de Aprendizagem: Ramo Filhotes, 1ª edição, 2026
//  Lobinho, Escoteiro, Sênior, Pioneiro, Dirigente: Competências e Rotas de Aprendizagem, versão 1.0, 07/03/2019
var FONTES_ROTAS = {
  'Filhotes': { versao: '1ª edição, 2026', url: 'https://www.escoteiros.org.br/wp-content/uploads/2026/06/Competencias-e-Rotas-de-Aprendizagem_Ramo-Filhotes-2.pdf', cursoInt: 'Curso Intermediário' },
  'Lobinho': { versao: 'Versão 1.0, 07/03/2019', url: 'https://www.escoteiros.org.br/wp-content/uploads/2020/07/COMPETENCIAS-ESPEC%C3%8DFICAS-RAMO-LOBINHO-print.pdf', cursoInt: 'Curso Básico' },
  'Escoteiro': { versao: 'Versão 1.0, 07/03/2019', url: 'https://www.escoteiros.org.br/wp-content/uploads/2020/07/COMPETENCIAS-ESPEC%C3%8DFICAS-RAMO-EESCOTEIRO.pdf', cursoInt: 'Curso Básico' },
  'Sênior': { versao: 'Versão 1.0, 07/03/2019', url: 'https://www.escoteiros.org.br/wp-content/uploads/2020/07/COMPETENCIAS-ESPEC%C3%8DFICAS-RAMO-SENIOR.pdf', cursoInt: 'Curso Básico' },
  'Pioneiro': { versao: 'Versão 1.0, 07/03/2019', url: 'https://www.escoteiros.org.br/wp-content/uploads/2020/07/COMPETENCIAS-ESPEC%C3%8DFICAS-RAMO-PIONEIRO.pdf', cursoInt: 'Curso Básico' },
  'Dirigente': { versao: 'Versão 1.0, 2019', url: 'https://www.escoteiros.org.br/wp-content/uploads/2020/07/COMPETENCIAS-ESPEC%C3%8DFICAS-DIRIGENTES-1.pdf', cursoInt: 'Curso Básico' }
};

// [competência, preliminar, intermediário, avançado]
var RT_ESS_FILHOTES = [
  ['Gestão de Mudanças', 'Ler a linha do tempo dos 100 anos dos Escoteiros do Brasil; Conversar com o Chefe de Seção sobre o que leu', 'Apresentar uma ideia de atividade aos escotistas da seção; Ouvir o retorno e ajustar a ideia; Aplicar a atividade com a Ninhada', 'Elaborar e acompanhar projetos de melhoria, campanhas ou inovações de processo'],
  ['Relações Interpessoais', 'Realizar uma atividade que envolva as famílias dos Filhotes', 'Ajudar a organizar um conselho de pais; Incluir duas atividades em que as famílias ensinam uma habilidade', 'Planejar ao menos uma ação de integração entre os adultos da seção; Manter comunicação aberta e clara com os pais'],
  ['Trabalho em Equipe', 'Contribuir regularmente na organização das atividades da seção', 'Cumprir as responsabilidades da função (Paxtu, progressão, atividades, reuniões)', 'Avaliar os resultados da equipe e dar sugestões; Responder às pesquisas regionais e nacionais'],
  ['Consciência Organizacional', 'Ler o cap. 5 do POR; Conversar com o Chefe de Seção sobre a UEL', 'Ler o capítulo do Estatuto sobre a Região Escoteira; Debater o que leu com o Chefe de Seção ou o APF', 'Ler o capítulo do Estatuto sobre o nível nacional; Ler as resoluções do CAN e da DEN do último ano; Debater o que leu com o APF'],
  ['Compromisso', 'Ler o cap. 1 do POR antes do Curso Preliminar; Fazer ou renovar a Promessa Escoteira', 'Ler o Projeto Educativo; Debater o Projeto Educativo com o Chefe de Seção', 'Ler o Manual de Reconhecimento; Debater o manual com o Chefe de Seção'],
  ['Aprendizagem Permanente e Autodesenvolvimento', 'Concluir o Curso Preliminar; Concluir a Capacitação para voluntários do Ramo Filhotes', 'Concluir o Curso Intermediário (e o Módulo de Aperfeiçoamento do Ramo Filhotes, onde houver)', 'Concluir o Curso Avançado; Fazer mais um módulo, oficina ou similar'],
  ['Planejamento Estratégico', 'Participar da organização das reuniões da seção; Participar das reuniões de escotistas', 'Ajudar a definir o calendário da seção', 'Ler o Planejamento Estratégico nacional; Debater o plano numa reunião da UEL']
];
var RT_ESP_FILHOTES = [
  ['Aplicação de Jogos e Canções', 'Aplicar 5 jogos diferentes com a Ninhada; Usar 3 canções com a Ninhada', 'Usar ao menos 5 recursos didáticos diferentes em ao menos 5 reuniões da Ninhada', 'Pesquisar e ensinar à Ninhada 5 jogos ou dinâmicas'],
  ['Condução de Cerimônias', 'Realizar ao menos duas cerimônias de abertura ou uma celebração de encerramento', 'Conduzir uma cerimônia de entrega de distintivo; Conduzir ao menos duas celebrações de encerramento', 'Orientar outro adulto numa cerimônia de acolhida'],
  ['Compreensão sobre o desenvolvimento das crianças', 'Ler o cap. 8 do POR; Ler o cap. 1 do Manual do Escotista do Ramo Filhotes', 'Acompanhar a progressão de 3 Filhotes por ao menos um ciclo de programa, registrando no Paxtu', 'Fazer uma reunião de pais sobre o desenvolvimento dos Filhotes após um ciclo de programa'],
  ['Segurança', 'Ler os caps. 15 e 16 do POR; Ler a Regra 143 do POR; Ler o cap. 9 do Manual do Escotista do Ramo Filhotes; Conversar com o Chefe de Seção sobre o que leu', 'Preparar o plano de segurança de uma atividade externa da seção; Debater as responsabilidades de Espaços Seguros', 'Antes do Curso Avançado, fazer reunião de pais sobre maus-tratos e abusos; Ler a Política Nacional de Espaços Seguros; Ler a Política de Diversidade e Inclusão'],
  ['Envolvimento Comunitário', 'Aplicar duas atividades de envolvimento comunitário', 'Visitar um espaço comunitário ou social com a Ninhada, envolvendo Filhotes e famílias', 'Planejar uma atividade comunitária externa que promova o cuidado com o outro; Avaliar essa atividade depois de realizada'],
  ['Aplicação do Marco Simbólico', 'Conhecer os personagens do Ramo e suas características; Conhecer o lema do Ramo', 'Realizar uma atividade com foco em cada personagem', 'Planejar e realizar ao menos 3 atividades que evidenciem o Marco Simbólico'],
  ['Mundo Natural e Sustentabilidade', 'Aplicar duas atividades ambientais', 'Realizar uma atividade variada sobre sustentabilidade e natureza', 'Fazer uma reunião de avaliação das atividades ambientais de um ciclo de programa'],
  ['Vida ao Ar Livre', 'Aplicar duas atividades ao ar livre', 'Conduzir uma conversa com outros escotistas sobre atividades ao ar livre; Organizar um acampamento ou acantonamento', 'Planejar um acampamento com a Ninhada; Orientar outros adultos em atividades externas com pernoite'],
  ['Organização de Atividades', 'Participar das reuniões da Ninhada (planejamento, execução e avaliação)', 'Organizar uma atividade externa (local, horários, materiais, papéis da equipe e regras)', 'Fazer reunião de avaliação com a equipe e as famílias; Planejar 5 reuniões semanais da Ninhada'],
  ['Domínio do Programa Educativo', 'Ler o cap. 8 do Manual do Escotista', 'Participar de todas as fases do Ciclo de Programa', 'Discutir os resultados da avaliação com o Chefe de Seção; Identificar pontos de melhoria']
];

// Essenciais 2019 (iguais nos quatro ramos da linha escotista)
var RT_ESS_2019 = [
  ['Gestão de Mudanças', 'Ler "Características Essenciais do Movimento Escoteiro" e a história do Escotismo; debater com o APF', 'Trabalhar com a equipe ações que inovem as rotinas da função', 'Organizar ações de melhoria contínua (projetos, campanhas, processos)'],
  ['Aprendizagem e Desenvolvimento Pessoal', 'Fazer o Plano Pessoal de Formação com o APF; Curso Preliminar; ler a descrição do cargo de APF', 'Revisar o PPF; Curso Básico; ler o Guia do Chefe Escoteiro; módulo ou oficina; curso EAD sobre APF', 'Revisar o PPF; Curso Avançado; ler a Política Nacional de Adultos; conversar com o APF sobre a Insígnia de Madeira'],
  ['Compromisso', 'Ler os caps. 1 e 3 do POR; identificar com o APF os fundamentos do Escotismo; fazer a Promessa', 'Participar de grupos de debate sobre as funções e de ações de captação de adultos; ler o Projeto Educativo', 'Ler o Manual de Reconhecimento'],
  ['Consciência Organizacional', 'Ler o Estatuto (Título 2, cap. 5) e o cap. 5 do POR', 'Promover as políticas em debates; ler o Estatuto; participar de evento distrital, regional ou nacional', 'Explicar as relações entre estruturas; participar de assembleia regional ou nacional; ler resoluções do CAN e da DEN'],
  ['Planejamento Estratégico', 'Assinar o acordo de trabalho voluntário', 'Ler "Perfis: cargos e funções"; participar do calendário da estrutura', 'Ler o Planejamento Estratégico; participar do planejamento anual da UEL'],
  ['Relações Interpessoais', 'Ler e discutir com o APF a Regra 001 do POR', 'Ajudar a organizar um conselho de pais; passar por avaliação do próprio trabalho', 'Planejar ações de integração; avaliar os membros da equipe'],
  ['Trabalho em Equipe', 'Participar de ao menos um Conselho de Chefes da UEL', 'Cumprir as responsabilidades da função (Paxtu, progressão, jogos, cerimônias)', 'Avaliar os resultados da equipe em reuniões periódicas']
];

var RT_ESP_LOBINHO = [
  ['Aplicação de Jogos e Canções', 'Pesquisar tipos de jogos e canções; participar da aplicação', 'Aplicar jogos variados (cooperativo, noturno, grande jogo); ler o cap. 10 do Manual', 'Criar jogos; atualizar o arquivo de jogos; orientar a equipe'],
  ['Condução de Cerimônias', 'Assistir aos vídeos "Como se Faz?"; conduzir hasteamento e entrega de distintivos', 'Ler o Manual de Cerimônias; conduzir Promessa e passagem de ramo', 'Orientar outro adulto sobre o Grande Uivo'],
  ['Compreensão do Desenvolvimento de Crianças, Adolescentes e Jovens', 'Ler o cap. 1 do Manual e as regras do POR; registrar progressão no Paxtu', 'Acompanhar a progressão por um ciclo; usar o mAPPa; ler o cap. 9 do Manual', 'Orientar os escotistas sobre o acompanhamento da progressão'],
  ['Segurança', 'Debater o cap. 15 do POR; criar plano de segurança; ensinar primeiros socorros', 'Ler o ECA; conduzir conversa sobre prevenção em reunião de pais', 'Ler o cap. 14 do POR; Curso de Proteção Infantojuvenil; pedir autorizações para saídas'],
  ['Aplicação do Marco Simbólico', 'Ler o cap. 3 do Manual; participar de atividade temática', 'Ler "O Livro da Jângal"; contar história e aplicar atividade temática', 'Planejar atividades temáticas; fazer dança da Jângal; atualizar o totem'],
  ['Operação do Sistema de Especialidades e Insígnias', 'Ler o Guia de Especialidades e as regras 169 a 171 do POR', 'Estimular e registrar conquistas; preencher certificados', 'Mapear conquistas da seção; apresentar o sistema em reunião de pais'],
  ['Envolvimento Comunitário', 'Ler a programação do EducAção Escoteira e do MUTCOM; participar de atividade comunitária', 'Estimular o Mutirão Nacional; ler "Escotismo e Comunidade"; atividade para a Insígnia da Boa Ação', 'Avaliar as atividades com a equipe e propor melhorias'],
  ['Desenvolvimento Sustentável', 'Ler a programação do MUTECO; participar de atividade sustentável', 'Estimular o Mutirão de Ação Ecológica; atividade para a Insígnia Mundial do Meio Ambiente', 'Avaliar resultados com a equipe; aplicar atividade sobre os ODS (Unesco)'],
  ['Aplicação do Sistema de Equipes', 'Ler o cap. 4 do Manual do Escotista', 'Executar Roca de Conselho; promover eleição de Primos e Segundos', 'Orientar escotistas; apresentar o sistema em conselho de pais'],
  ['Domínio do Programa Educativo', 'Ler o cap. 8 do Manual e os caps. 7 e 8 do POR; ensinar trabalho manual', 'Aplicar atividades nas seis áreas; ler o cap. 11 (Ciclo de Programa)', 'Avaliar atividades com o APF; ler a Política Nacional de Programa Educativo'],
  ['Campismo e Vida ao Ar Livre', 'Ensinar nós básicos e organização de mochila', 'Ensinar fogueira segura, orientação, barraca e fogareiro; ler "Padrões de Atividades Escoteiras"', 'Orientar escotistas; coordenar avaliação de atividade ao ar livre'],
  ['Organização de Atividades', 'Participar do planejamento das reuniões semanais; dirigir algumas atividades', 'Organizar reunião especial, acampamento, cardápio ou excursão', 'Avaliar atividades dentro e fora da sede com a equipe e o APF']
];

var RT_ESP_ESCOTEIRO = [
  ['Aplicação de Jogos e Canções', 'Aplicar jogos e canções na seção; ler o cap. 10 do Manual', 'Usar diferentes tipos de jogos; orientar monitores sobre canções', 'Criar jogos por área de desenvolvimento; atualizar o arquivo de jogos; incentivar jovens a conduzir jogos'],
  ['Condução de Cerimônias', 'Assistir aos vídeos "Como se Faz?"; usar apito e sinais; conduzir hasteamento; entregar distintivos', 'Conduzir Promessa; entregar insígnias; ler o Manual de Cerimônias; conduzir passagem de ramo', 'Orientar outros adultos na condução de cerimônias'],
  ['Compreensão do Desenvolvimento de Crianças, Adolescentes e Jovens', 'Ler o cap. 1 do Manual e as regras 13, 53, 66, 84 e 102 do POR', 'Acompanhar a progressão por um ciclo, registrando no Paxtu; usar o mAPPa; ler os caps. 9 e 11 do Manual', 'Avaliar e registrar a progressão; debater o acompanhamento com a equipe'],
  ['Segurança', 'Ler os caps. 14 e 15 do POR; Curso de Proteção Infantojuvenil; pedir autorização para atividades externas', 'Plano de segurança de atividade externa; ensinar primeiros socorros; debater o cap. 15; conversar com o APF sobre suspeita de abuso', 'Ler o ECA e o manual de prevenção ao abuso; fazer reunião de pais sobre prevenção'],
  ['Aplicação do Marco Simbólico', 'Ler o cap. 2 do Manual; participar de atividade baseada no marco', 'Planejar e aplicar atividade que evidencie o marco', 'Criar e aplicar atividades baseadas no marco'],
  ['Operação do Sistema de Especialidades e Insígnias', 'Ler o Guia de Especialidades e as regras 169 a 173 do POR; participar de cerimônias de entrega', 'Estimular Insígnias de Interesse Especial; registrar conquistas; preencher certificados', 'Mapear conquistas; orientar outros adultos; apresentar o sistema em reunião de pais'],
  ['Envolvimento Comunitário', 'Ler EducAção Escoteira e MUTCOM; participar de atividade comunitária com a tropa', 'Estimular eventos comunitários; organizar outra atividade; ler "Escotismo e Comunidade"; Insígnia de Ação Comunitária', 'Avaliar as atividades com a equipe; orientar os jovens a avaliar o impacto'],
  ['Desenvolvimento Sustentável', 'Ler o MUTECO; participar de atividade sustentável com a tropa', 'Estimular o MUTECO; organizar outra atividade; incentivar a Insígnia Mundial do Meio Ambiente', 'Avaliar as atividades; ler o documento da Unesco sobre os ODS e aplicar; orientar a avaliação dos jovens'],
  ['Aplicação do Sistema de Patrulhas', 'Ler o cap. 3 do Manual; ajudar as patrulhas com encargos, livros, bandeirolas e gritos', 'Orientar eleições de monitores; participar da Corte de Honra e Assembleias; apoiar saídas de patrulha', 'Orientar outros adultos; apresentar o sistema em conselho de pais; planejar excursões de patrulha'],
  ['Domínio do Programa Educativo', 'Ler o cap. 8 do Manual, os caps. 7 e 9 do POR e "Escotistas em Ação"; participar de atividades nas seis áreas', 'Aplicar atividades nas seis áreas; ler o cap. 12 do Manual; participar de todas as fases do ciclo', 'Avaliar atividades; discutir resultados com o APF; conduzir avaliações com os jovens'],
  ['Campismo e Vida ao Ar Livre', 'Dominar os nós previstos; montar mochila e ensinar a tropa pelo Sistema de Patrulhas', 'Ensinar amarras, fogareiro, barraca, sinais de pista e estimativas; ler "Padrões de Atividades Escoteiras"', 'Organizar uma Jornada; ensinar construções, previsão do tempo, mapa e bússola; avaliar atividades'],
  ['Organização de Atividades', 'Contribuir no planejamento das reuniões semanais; ajudar a conduzir atividades', 'Planejar acampamento ou excursão, Fogo de Conselho e cardápio; ler "Fogo de Conselho"', 'Avaliar planejamento e execução; orientar outros adultos; planejar atividades variadas']
];

var RT_ESP_SENIOR = [
  ['Aplicação de Jogos e Canções', 'Participar da aplicação de jogos e canções; aplicá-los de forma atraente e variada', 'Aplicar diferentes tipos de jogos e orientar monitores; ler o cap. 7 do Manual', 'Criar e aplicar jogos por área de desenvolvimento; atualizar o arquivo de jogos'],
  ['Condução de Cerimônias', 'Usar sinais, apitos e vozes de comando; assistir ao vídeo da Promessa; conduzir hasteamento e entregar distintivos', 'Conduzir Promessa, Passagem de Ramo e entregas de insígnias; ler o Manual de Cerimônias', 'Orientar outro adulto em hasteamento; conduzir o Compromisso Sênior; orientar um jovem a prepará-lo'],
  ['Compreensão do Desenvolvimento de Crianças, Adolescentes e Jovens', 'Ler o cap. 1 do Manual; registrar progressão no Paxtu', 'Acompanhar a progressão por um ciclo; usar o mAPPa; ler o cap. 9 do Manual', 'Avaliar e registrar a progressão; orientar outros escotistas'],
  ['Segurança', 'Ler os caps. 14 e 15 do POR; Curso de Proteção Infantojuvenil; pedir autorização para atividades externas', 'Ler o ECA e "Proteção da Criança e do Adolescente"; conduzir conversa sobre prevenção em reunião de pais', 'Debater o cap. 15 com os adultos; plano de segurança com os jovens; discutir com o APF casos de suspeita de abuso'],
  ['Aplicação do Marco Simbólico', 'Ler o cap. 2 do Manual; participar de atividade baseada no marco', 'Aplicar atividade baseada no marco; estimular atividades de patrulha com essa base', 'Planejar e executar atividade que evidencie o marco; debater a ênfase do ramo com os pais'],
  ['Operação do Sistema de Especialidades e Insígnias', 'Ler o Guia de Especialidades e as regras 169 a 173 do POR; participar de cerimônias de entrega', 'Estimular especialidades e insígnias; registrar conquistas e preencher certificados', 'Mapear conquistas; orientar escotistas; apresentar o sistema em reunião de pais'],
  ['Envolvimento Comunitário', 'Ler EducAção Escoteira ou MUTCOM; participar de atividade comunitária com a tropa', 'Estimular mutirões; organizar atividade comunitária; ler "Escotismo e Comunidade"', 'Avaliar as atividades com a equipe; orientar os jovens a avaliar o impacto'],
  ['Desenvolvimento Sustentável', 'Ler o MUTECO; participar de atividade sustentável com a tropa', 'Estimular mutirão ecológico; organizar atividade além do MUTECO; Insígnia Mundial do Meio Ambiente', 'Avaliar as atividades; ler o documento da Unesco sobre os ODS; orientar os jovens na avaliação'],
  ['Aplicação do Sistema de Equipes', 'Ler o cap. 5 do Manual; orientar monitores sobre encargos, livros e símbolos', 'Orientar eleições de monitores e atividades de patrulha; atuar na Corte de Honra e Assembleias', 'Orientar escotistas; apresentar o sistema em conselho de pais; orientar excursões e acampamentos de patrulha'],
  ['Domínio do Programa Educativo', 'Identificar as seis áreas; ler o cap. 6 do Manual e os caps. 7 e 10 do POR', 'Aplicar atividades nas seis áreas; ler o cap. 8 do Manual; participar de todas as fases do ciclo', 'Avaliar atividades e orientar escotistas; ler a Política Nacional de Programa Educativo; avaliações com os jovens'],
  ['Campismo e Vida ao Ar Livre', 'Aplicar nós básicos; montar mochila e ensinar a tropa; ler "Padrões de Atividades Escoteiras"', 'Ensinar fogareiro, fogueira, amarras, barraca e sinais de pista; estimar alturas e distâncias', 'Organizar e avaliar uma jornada; ensinar construções, abrigos, mapa, bússola e previsão do tempo'],
  ['Organização de Atividades', 'Participar do planejamento das reuniões semanais; dirigir atividades; ler "Os Primeiros Meses de uma Tropa Sênior"', 'Organizar atividade aventureira; participar de Fogo de Conselho; planejar acampamento e excursão', 'Avaliar reuniões com a equipe; organizar um Acampamento Volante']
];

var RT_ESP_PIONEIRO = [
  ['Aplicação de Jogos e Canções', 'Compartilhar técnicas de jogos; aplicar jogos com o clã', 'Orientar pioneiros em jogos variados; promover debates após as atividades', 'Orientar criação e adaptação de jogos; atualizar o arquivo da seção'],
  ['Condução de Cerimônias', 'Assistir aos vídeos "Como se Faz?"; conduzir hasteamento e arriamento; entregar distintivo', 'Ler o Manual de Cerimônias; conduzir promessa, partida e investidura; Passagem de Ramo', 'Orientar outro adulto nas cerimônias do ramo'],
  ['Compreensão sobre o Desenvolvimento de Crianças, Adolescentes e Jovens', 'Ler o cap. 1 do Manual e as regras 13, 53, 66, 84 e 102 do POR', 'Acompanhar a progressão por um ciclo e um projeto; usar o mAPPa', 'Avaliar e registrar a progressão; alinhar o acompanhamento com outros escotistas'],
  ['Segurança', 'Ler os caps. 14 e 15 do POR; Curso de Proteção Infantojuvenil; pedir autorização para atividades externas', 'Debater o cap. 15; plano de segurança; ensinar primeiros socorros; conversar com o APF sobre suspeita de abuso', 'Ler o ECA e o livro sobre proteção infantil; orientar a seção sobre segurança'],
  ['Aplicação do Marco Simbólico', 'Ler o marco simbólico no Manual; participar de atividade baseada nele', 'Orientar atividades com o marco e as virtudes pioneiras; apoiar o projeto de vida', 'Orientar a criação de atividades com o marco; acompanhar o projeto de vida'],
  ['Operação do Sistema de Insígnias de Interesse Especial', 'Ler a regra 171 do POR', 'Orientar conquistas; registrar e preencher certificados', 'Mapear conquistas; orientar escotistas; orientar um projeto do clã para uma insígnia'],
  ['Envolvimento Comunitário', 'Ler EducAção Escoteira ou MUTCOM; participar de atividade comunitária com o clã', 'Orientar o clã em Mutirão ou EducAção Escoteira e em serviço em outra localidade', 'Orientar a avaliação do impacto e projetos para o entorno'],
  ['Desenvolvimento Sustentável', 'Ler o MUTECO; participar de atividade sustentável com o clã', 'Orientar o clã num MUTECO e em outro projeto sustentável', 'Orientar a avaliação de impacto; ler o documento da Unesco sobre os ODS'],
  ['Aplicação do Sistema de Equipes', 'Ler o cap. 5 do Manual e a Carta Pioneira; discutir com o APF', 'Auxiliar conselhos e assembleias de clã; estimular equipes de interesse', 'Orientar a revisão da Carta Pioneira; acompanhar equipes de interesse e a COMAD'],
  ['Domínio do Programa Educativo', 'Ler os caps. 3 e 4 do Manual, os caps. 7 e 11 do POR e "Escotistas em Ação"', 'Aplicar atividades nas seis áreas; ler o cap. 6 do Manual; participar do ciclo de programa; apoiar um projeto', 'Discutir avaliações com o APF; avaliações com os jovens; ler a Política Nacional de Programa Educativo'],
  ['Campismo e Vida ao Ar Livre', 'Dominar os nós indicados; ensinar a organizar a mochila', 'Amarras, fogareiro, lampião, barraca, fogueira e ferramentas; ler "Padrões de Atividades Escoteiras"', 'Orientar travessia; mapa e bússola; pioneiria e abrigos; previsão do tempo; avaliar atividades'],
  ['Organização de Atividades', 'Ler "Os primeiros meses de um novo clã"; contribuir no planejamento e avaliação das reuniões', 'Avaliar atividades; orientar o planejamento de atividades dentro e fora da sede', 'Orientar cardápio, acampamento e excursão; ler "Fogo de Conselho" e orientar sua realização'],
  ['Gestão de Projetos', 'Ler os caps. 4 e 5 do Manual e discutir com o APF', 'Orientar ao menos um projeto de intervenção social; apoiar projetos dos jovens', 'Planejar ações para escotistas e pioneiros; capacitações; avaliações com escotistas']
];

var RT_ESS_DIRIGENTE = [
  ['Gestão de Mudanças', 'Ler "Características Essenciais do Movimento Escoteiro" e a história do Escotismo; debater com o APF', 'Trabalhar com a equipe ações que inovem as rotinas da função', 'Organizar projetos ou campanhas de melhoria contínua'],
  ['Relações Interpessoais', 'Participar das reuniões da equipe; ler e discutir a Regra 001 do POR com o APF', 'Ajudar a organizar uma ação integrada entre equipes; passar por avaliação do próprio trabalho', 'Planejar ações de integração; avaliar os membros da equipe'],
  ['Trabalho em Equipe', 'Participar de ao menos uma reunião de diretoria da UEL', 'Cumprir as responsabilidades da função (Paxtu, tarefas administrativas, apoio a outros adultos)', 'Avaliar os resultados da equipe em reuniões periódicas'],
  ['Planejamento Estratégico', 'Assinar o acordo de trabalho voluntário; ler "Perfis: cargos e funções"; conhecer o plano de grupo', 'Participar da elaboração do calendário da estrutura', 'Ler o Planejamento Estratégico; participar do planejamento da UEL; ler os Perfis regionais e nacionais'],
  ['Consciência Organizacional', 'Ler os caps. 4 e 5 do Título 2 do Estatuto e o cap. 5 do POR', 'Promover as políticas em debates; ler o Estatuto; participar de eventos distritais, regionais e nacionais', 'Explicar as relações entre estruturas; participar de assembleia; debater resoluções do CAN e da DEN'],
  ['Compromisso', 'Ler os caps. 1 e 3 do POR; identificar os fundamentos do Escotismo com o APF; fazer a Promessa', 'Participar de debates sobre as funções e de captação de adultos; ler o Projeto Educativo', 'Ler o Manual de Reconhecimento; organizar avaliação e entrega de reconhecimentos aos voluntários'],
  ['Aprendizagem Permanente e Autodesenvolvimento', 'Fazer o PPF com o APF; Curso Preliminar; ler a descrição do cargo de APF', 'Revisar o PPF; Curso Básico; ler o Guia do Chefe Escoteiro; módulo ou oficina; curso EAD sobre APF', 'Revisar o PPF; Curso Avançado; conversar sobre a Insígnia de Madeira; ler a Política Nacional de Adultos; módulo ou oficina']
];
var RT_ESP_DIRIGENTE = [
  ['Gestão Administrativa', 'Reunir-se com o APF e a diretoria sobre rotinas e documentos; capacitação sobre o Paxtu', 'Organizar documentação e livros; ajudar no Paxtu; redigir uma ata; ler o regulamento do Grupo Padrão; fazer registro de associados', 'Examinar a documentação da UEL e propor melhorias; promover atualização sobre o Paxtu'],
  ['Gestão de Adultos', 'Ler as regras 35 e 36 do POR e discutir com o APF', 'Colaborar na captação de adultos; incentivar formações; acompanhar o trabalho dos APFs', 'Elaborar e executar plano de captação; criar incentivos à formação; integrar e acompanhar os adultos'],
  ['Gestão Financeira', 'Ler o cap. 4 do POR e as regras de patrimônio e finanças; examinar uma prestação de contas anterior', 'Orçamento de uma atividade; reunião com a Comissão Fiscal; ajudar na prestação de contas; controle de patrimônio', 'Participar do orçamento anual; capacitar adultos em orçamento; cartilha de despesas; apresentar a execução aos pais'],
  ['Gestão de Conflitos', 'Identificar comportamentos que geram conflitos e discutir com o APF', 'Participar de formação ou ler publicação sobre resolução de conflitos', 'Aplicar dinâmica de gestão de conflitos; ler as Resoluções 03/2008 e 09/2009'],
  ['Condução de Cerimônias', 'Assistir aos vídeos "Como se faz"; conduzir hasteamento ou arriamento', 'Ler o Manual de Cerimônias; auxiliar numa Promessa; analisar as cerimônias da UEL', 'Orientar adultos sobre o papel dos dirigentes nas cerimônias; capacitação sobre cerimoniais; participar de passagem ou partida'],
  ['Relações Institucionais', 'Ler as regras 01, 02, 03 e 11 a 20 do POR e debater com o APF', 'Participar de reuniões na comunidade representando o Movimento ou a UEL', 'Sessão informativa sobre as regras 01 a 20; ação de mobilização de recursos; ler os posicionamentos da UEB'],
  ['Governança', 'Ler o Título 1 do Estatuto e o regulamento da UEL; discutir com o APF', 'Ler a Resolução 01/2017 do CAN; ajudar a organizar uma assembleia; analisar o regulamento da UEL', 'Organizar uma assembleia de grupo; apresentar a governança da UEB; participar de reunião de distrito ou assembleia'],
  ['Comunicação Institucional', 'Acessar os canais oficiais e discutir as dificuldades com o APF', 'Ler o Manual de Identidade Visual; estudar os materiais de divulgação da UEL', 'Apresentação sobre comunicação para os adultos da UEL; orientar práticas de comunicação'],
  ['Segurança', 'Ler os caps. 14 e 15 do POR; Curso de Proteção Infantojuvenil', 'Debater o cap. 15 com os adultos; plano de segurança de atividade externa', 'Ler o ECA e "Proteção da Criança e do Adolescente"; avaliação de acampamento focada no plano de segurança'],
  ['Organização de Eventos e Atividades', 'Ler "Os primeiros meses" de um ramo; participar do planejamento de eventos', 'Avaliar com as equipes o planejamento e a execução; discutir com o APF; propor melhorias', 'Ler "Padrões de Acampamento" e "Fogo de Conselho"; participar da organização de um evento do grupo'],
  ['Compreensão do Programa Educativo', 'Ler o cap. 7 do POR e "Escotistas em ação"; participar de uma reunião de seção', 'Reunião com escotistas sobre o Programa Educativo; participar de atividade de seção; palestra para os responsáveis', 'Ler a Política Nacional de Programa Educativo; discussão com escotistas; avaliar o trabalho das seções']
];

var ROTAS = {
  'Filhotes': { ess: RT_ESS_FILHOTES, esp: RT_ESP_FILHOTES },
  'Lobinho': { ess: RT_ESS_2019, esp: RT_ESP_LOBINHO },
  'Escoteiro': { ess: RT_ESS_2019, esp: RT_ESP_ESCOTEIRO },
  'Sênior': { ess: RT_ESS_2019, esp: RT_ESP_SENIOR },
  'Pioneiro': { ess: RT_ESS_2019, esp: RT_ESP_PIONEIRO },
  'Dirigente': { ess: RT_ESS_DIRIGENTE, esp: RT_ESP_DIRIGENTE }
};
var NIVEIS_ROTA = ['Preliminar', 'Intermediário', 'Avançado'];
// O que cada competência significa no dia a dia (uma linha)
var EXPLICA_COMP = {
  'Gestão de Mudanças': 'Aceitar e propor jeitos novos de fazer as coisas, sem perder o essencial do Escotismo.',
  'Relações Interpessoais': 'Se relacionar bem com jovens, famílias e adultos: ouvir, conversar e receber críticas.',
  'Trabalho em Equipe': 'Fazer a sua parte na equipe e ajudar o grupo a funcionar.',
  'Consciência Organizacional': 'Entender como os Escoteiros do Brasil se organizam: grupo, região e nível nacional.',
  'Compromisso': 'Viver a Promessa e os valores do Movimento no que você faz.',
  'Aprendizagem Permanente e Autodesenvolvimento': 'Continuar aprendendo: cursos, leituras e o seu Plano Pessoal de Formação.',
  'Aprendizagem e Desenvolvimento Pessoal': 'Continuar aprendendo: cursos, leituras e o seu Plano Pessoal de Formação.',
  'Planejamento Estratégico': 'Saber para onde o grupo vai e ajudar a planejar o calendário.',
  'Aplicação de Jogos e Canções': 'Usar jogos e canções com objetivo educativo, não só para passar o tempo.',
  'Condução de Cerimônias': 'Conduzir os momentos especiais da seção (abertura, promessa, entregas) do jeito certo.',
  'Compreensão sobre o desenvolvimento das crianças': 'Entender como as crianças dessa idade crescem e acompanhar a progressão de cada uma.',
  'Compreensão do Desenvolvimento de Crianças, Adolescentes e Jovens': 'Entender como os jovens dessa idade crescem e acompanhar a progressão de cada um.',
  'Compreensão sobre o Desenvolvimento de Crianças, Adolescentes e Jovens': 'Entender como os jovens dessa idade crescem e acompanhar a progressão de cada um.',
  'Segurança': 'Cuidar para que as atividades sejam seguras e para que os jovens estejam protegidos.',
  'Envolvimento Comunitário': 'Levar a seção a fazer algo pela comunidade.',
  'Aplicação do Marco Simbólico': 'Usar a história e os símbolos do ramo para dar sentido às atividades.',
  'Mundo Natural e Sustentabilidade': 'Fazer atividades que aproximem as crianças da natureza e do cuidado com o ambiente.',
  'Desenvolvimento Sustentável': 'Fazer atividades de cuidado com o ambiente e com o planeta.',
  'Vida ao Ar Livre': 'Levar a seção para atividades ao ar livre com segurança.',
  'Campismo e Vida ao Ar Livre': 'Dominar e ensinar as técnicas de acampamento e de atividades ao ar livre.',
  'Organização de Atividades': 'Planejar, executar e avaliar as reuniões e as saídas da seção.',
  'Domínio do Programa Educativo': 'Conhecer o programa do ramo e o Ciclo de Programa e aplicá-los na seção.',
  'Operação do Sistema de Especialidades e Insígnias': 'Conhecer, estimular e registrar especialidades e insígnias.',
  'Operação do Sistema de Insígnias de Interesse Especial': 'Conhecer, estimular e registrar as insígnias de interesse especial.',
  'Aplicação do Sistema de Equipes': 'Fazer os pequenos grupos da seção funcionarem e terem voz.',
  'Aplicação do Sistema de Patrulhas': 'Fazer as patrulhas funcionarem: monitores, encargos, Corte de Honra.',
  'Gestão de Projetos': 'Ajudar os jovens a planejar, fazer e avaliar projetos.',
  'Gestão Administrativa': 'Cuidar dos documentos, registros e do Paxtu do grupo.',
  'Gestão de Adultos': 'Captar, acolher e acompanhar a formação dos adultos.',
  'Gestão Financeira': 'Cuidar do dinheiro e do patrimônio do grupo com transparência.',
  'Gestão de Conflitos': 'Perceber e ajudar a resolver conflitos entre pessoas.',
  'Relações Institucionais': 'Representar o grupo junto à comunidade e a outras instituições.',
  'Governança': 'Conhecer o Estatuto, as assembleias e como as decisões são tomadas.',
  'Comunicação Institucional': 'Comunicar o grupo usando os canais e a identidade oficial.',
  'Organização de Eventos e Atividades': 'Ajudar a planejar e avaliar eventos e atividades do grupo.',
  'Compreensão do Programa Educativo': 'Entender o que as seções fazem e por quê, para apoiar os escotistas.'
};

// O papel em cada nível (aparece no topo da página do formulário)
var PAPEL_NIVEL = {
  'Preliminar': 'Neste nível você conhece e participa: lê, observa e ajuda a equipe. Marque "Fiz" quando tiver feito a ação pelo menos uma vez.',
  'Intermediário': 'Neste nível você aplica e organiza sozinho: é você quem conduz a atividade com a seção. Marque "Fiz" só se foi você quem conduziu.',
  'Avançado': 'Neste nível você avalia, melhora e orienta outros adultos. Marque "Fiz" só se consegue dizer quem você orientou ou quando foi a avaliação.'
};

// "Como saber que fez": regra pelo verbo do item, mais exigente a cada nível
function comoSaber_(item, nivel) {
  var t = item.toLowerCase();
  var av = nivel === 'Avançado', it = nivel === 'Intermediário';
  var q = /^(ler|conversar|debater|discutir|assistir|identificar|conhecer)/.test(t) ? null : item.match(/\b(\d+|duas|dois|tr[eê]s)\b(?! anos)/i);
  var qtd = q ? ' Só marque "Fiz" quando completar a quantidade pedida (' + q[1] + ').' : '';
  var r = comoSaberBase_(t, av, it);
  return r + qtd;
}
function comoSaberBase_(t, av, it) {
  if (!/^(ler|assistir)/.test(t) && /curso|capacita[cç][aã]o para volunt/.test(t)) return 'Aparece como concluído no Paxtu.';
  if (/paxtu/.test(t)) return 'Dá para conferir no Paxtu.';
  if (/promessa/.test(t) && /fazer|renovar/.test(t)) return 'Você sabe a data da sua Promessa.';
  if (/assinar/.test(t)) return 'O termo está assinado.';
  if (/^ler|^assistir|^ler e/.test(t)) return av ? 'Leu tudo e consegue explicar o conteúdo a outro adulto.' : 'Leu tudo e consegue contar ao APF os pontos principais.';
  if (/ensinar (à|a|ao) (ninhada|alcateia|tropa|cl[ãa]|se[cç][aã]o)|^ensinar n[óo]s|^ensinar a organizar|^ensinar trabalho/.test(t)) return 'Você ensinou para a seção e sabe dizer quando.';
  if (/^orientar|^capacitar|^ensinar|^pesquisar e ensinar|^promover atualiza/.test(t)) return 'Você sabe dizer quem orientou, o que e quando.';
  if (/^avaliar|avalia[cç][aã]o/.test(t)) return 'Houve uma reunião ou registro da avaliação, com data.';
  if (/^planejar|^organizar|^elaborar|^preparar|^criar/.test(t)) return (av || it) ? 'Você foi o responsável: definiu local, horário, materiais e papéis.' : 'Você ajudou no planejamento e sabe o que foi decidido.';
  if (/^aplicar|^conduzir|^realizar|^usar|^executar|^fazer/.test(t)) return it || av ? 'Foi você quem conduziu, com a seção, e sabe dizer quando.' : 'Você conduziu, mesmo com ajuda de outro escotista.';
  if (/^participar|^contribuir|^ajudar|^colaborar|^auxiliar/.test(t)) return 'Você esteve presente e ajudou de verdade, não só assistiu.';
  if (/^conversar|^debater|^discutir|^identificar|^conhecer/.test(t)) return 'A conversa aconteceu e você lembra do que foi falado.';
  if (/^cumprir/.test(t)) return 'Você faz isso com regularidade, não só uma vez.';
  if (/^revisar o ppf/.test(t)) return 'O PPF foi revisado com o APF e você sabe quando.';
  if (/^(estimular|incentivar|promover)/.test(t)) return 'Você fez algo concreto para estimular (uma conversa, uma meta, um reconhecimento) e sabe dizer o quê.';
  if (/^(apresentar|apresenta[cç][aã]o|explicar|palestra|sess[aã]o|contar|discuss[aã]o)/.test(t)) return 'Você apresentou para um grupo e sabe dizer para quem e quando.';
  if (/^(m[oó]dulo|capacita[cç])/.test(t)) return 'Você participou e tem o certificado ou a data.';
  if (/^(acompanhar|alinhar|integrar)/.test(t)) return 'Você acompanhou por um tempo e há registro (Paxtu ou anotações).';
  if (/^(registrar|preencher|redigir|atualizar|or[cç]amento|controle|cartilha|plano)/.test(t)) return 'O documento ou registro existe e dá para mostrar.';
  if (/^(trabalhar|manter|atuar|dirigir|apoiar)/.test(t)) return 'Você faz isso com regularidade, não só uma vez.';
  if (/^(dominar|estimar|amarras|mapa|pioneiria|previs[aã]o|compartilhar)/.test(t)) return 'Você sabe fazer sozinho e consegue mostrar.';
  if (/^pedir autoriza/.test(t)) return 'As autorizações foram pedidas e estão guardadas.';
  if (/^(mapear|examinar|analisar|estudar|pesquisar)/.test(t)) return 'Você fez o levantamento e consegue mostrar o que encontrou.';
  if (/^(entregar|passagem|ins[ií]gnia|atividade|avalia[cç][oõ]es com)/.test(t)) return it || av ? 'Foi você quem conduziu, com a seção, e sabe dizer quando.' : 'Você conduziu, mesmo com ajuda de outro escotista.';
  return 'Aconteceu, e você sabe dizer quando.';
}

var RESPOSTAS_ROTA = ['Fiz', 'Estou fazendo', 'Não fiz', 'Fiz algo equivalente'];
/* ===== Rotas de aprendizagem: aba, formulário e situação ===== */
var ABA_ROTAS = 'Rotas de aprendizagem';
var ABA_ROTAS_RESP = 'Rotas - respostas';
var ABA_ROTAS_SIT = 'Rotas - situação';
var TITULO_QUEM = 'Quem está respondendo?';
var OPC_APF = 'Sou o APF (ou da Diretoria) registrando o acompanhamento de um adulto';
var OPC_ADULTO = 'Sou o adulto, fazendo a autoavaliação da minha rota';
var TITULO_SEU_NOME = 'Seu nome';
var TITULO_ROTA = 'Rota e nível';
var OPC_SEM_ROTA = 'Não registrar rota agora';
var PROP_ITENS_ROTAS = 'ROTAS_ITENS_FORM';

function formRotas_() {
  var sh = SpreadsheetApp.getActive().getSheetByName('Respostas Formulário');
  var url = sh && sh.getFormUrl();
  return FormApp.openByUrl(url || ORIG_EDIT);
}

/* 1. Monta (ou completa) a aba de catálogo, que pode ser corrigida à mão */
function montarAbaRotas() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(ABA_ROTAS);
  if (sh && sh.getLastRow() > 3) { console.log('A aba já existe: não sobrescrevi as correções.'); return; }
  if (!sh) sh = ss.insertSheet(ABA_ROTAS);
  sh.clear();
  sh.getRange(1, 1).setValue('Rotas de aprendizagem · catálogo usado no formulário e no painel. Pode corrigir o texto das colunas E a H. Depois de corrigir, é preciso refazer as perguntas do formulário (função montarFormularioRotas).').setFontWeight('bold');
  var cab = ['Rota', 'Versão do caderno', 'Nível', 'Tipo', 'Competência', 'O que significa', 'Item', 'Como saber que fez', 'Link do caderno'];
  sh.getRange(3, 1, 1, cab.length).setValues([cab]).setFontWeight('bold').setBackground('#00853F').setFontColor('#FFFFFF');
  var linhas = [];
  Object.keys(ROTAS).forEach(function (rota) {
    var f = FONTES_ROTAS[rota];
    NIVEIS_ROTA.forEach(function (nivel, ni) {
      [['Essencial', ROTAS[rota].ess], ['Específica', ROTAS[rota].esp]].forEach(function (par) {
        par[1].forEach(function (c) {
          String(c[ni + 1]).split(';').map(function (x) { return x.trim(); }).filter(String).forEach(function (it) {
            it = it.charAt(0).toUpperCase() + it.slice(1);
            linhas.push([rota, f.versao, nivel, par[0], c[0], EXPLICA_COMP[c[0]] || '', it, comoSaber_(it, nivel), f.url]);
          });
        });
      });
    });
  });
  sh.getRange(4, 1, linhas.length, cab.length).setValues(linhas).setWrap(true).setVerticalAlignment('top');
  sh.getRange(4, 9, linhas.length, 1).setWrap(false).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  sh.setFrozenRows(3);
  sh.setColumnWidths(1, 4, 110); sh.setColumnWidth(5, 220); sh.setColumnWidth(6, 260); sh.setColumnWidth(7, 340); sh.setColumnWidth(8, 260); sh.setColumnWidth(9, 120);
  console.log('Itens: ' + linhas.length);
}

function lerCatalogo_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(ABA_ROTAS);
  var v = sh.getRange(4, 1, Math.max(0, sh.getLastRow() - 3), 9).getValues().filter(function (r) { return r[0] && r[6]; });
  var mapa = {}; // rota|nivel -> {versao,url, comps:[{nome,tipo,expl,itens:[{t,como}]}]}
  v.forEach(function (r) {
    var k = r[0] + '|' + r[2];
    var g = mapa[k] || (mapa[k] = { rota: r[0], nivel: r[2], versao: r[1], url: r[8], comps: [], idx: {} });
    var c = g.idx[r[4]];
    if (!c) { c = g.idx[r[4]] = { nome: r[4], tipo: r[3], expl: r[5], itens: [] }; g.comps.push(c); }
    c.itens.push({ t: String(r[6]).trim(), como: String(r[7]).trim() });
  });
  return mapa;
}

function refazerAbaRotas() {
  var sh = SpreadsheetApp.getActive().getSheetByName(ABA_ROTAS);
  if (sh) SpreadsheetApp.getActive().deleteSheet(sh);
  montarAbaRotas();
}

/* 2. Acrescenta as perguntas das rotas ao formulário "Registrar acompanhamento".
   Monta em partes (cada execução do Apps Script tem limite de 6 minutos). */
var ITENS_ORIGINAIS_FORM = ['Data do acompanhamento', 'Adulto acompanhado', 'APF', 'Competências essenciais (escolha 3)', 'Linha de atuação',
  'Competências específicas: linha Escotista', 'Competências específicas Escotista (escolha 4)', 'Competências específicas: linha Dirigente',
  'Competências específicas Dirigente (escolha 4)', 'Plano Pessoal de Formação', 'Observações'];

function limparFormularioRotas_(form) {
  var nosso = function (it) { return ITENS_ORIGINAIS_FORM.indexOf(it.getTitle()) < 0; };
  // 1) desfaz navegações que apontam para páginas que vão ser apagadas
  form.getItems().forEach(function (it) {
    if (!nosso(it)) return;
    var tp = it.getType();
    if (tp === FormApp.ItemType.PAGE_BREAK) it.asPageBreakItem().setGoToPage(FormApp.PageNavigationType.CONTINUE);
    if (tp === FormApp.ItemType.MULTIPLE_CHOICE || tp === FormApp.ItemType.LIST) form.deleteItem(it);
  });
  // 2) apaga o resto, de trás para frente
  var items = form.getItems();
  for (var i = items.length - 1; i >= 0; i--) {
    if (nosso(items[i])) form.deleteItem(i);
  }
  ['ROTAS_BASE', 'ROTAS_FILA', 'ROTAS_SECOES', PROP_ITENS_ROTAS].forEach(function (k) { PropertiesService.getScriptProperties().deleteProperty(k); });
}

function montarFormularioRotas() {
  var sp = PropertiesService.getScriptProperties();
  var form = formRotas_();
  limparFormularioRotas_(form);

  var quem = form.addMultipleChoiceItem().setTitle(TITULO_QUEM).setRequired(true);
  form.moveItem(quem.getIndex(), 0);
  var pbApf = form.addPageBreakItem().setTitle('Acompanhamento pelo APF');
  form.moveItem(pbApf.getIndex(), 1);

  var nomes = [];
  form.getItems().forEach(function (it) {
    if (it.getTitle() === 'Adulto acompanhado' && it.getType() === FormApp.ItemType.LIST) nomes = it.asListItem().getChoices().map(function (c) { return c.getValue(); });
  });
  var pbSelf = form.addPageBreakItem().setTitle('Autoavaliação da rota').setHelpText('Responda com sinceridade: o APF vai conversar com você sobre cada item.');
  var seu = form.addListItem().setTitle(TITULO_SEU_NOME).setRequired(true);
  if (nomes.length) seu.setChoiceValues(nomes);
  var pbRota = form.addPageBreakItem().setTitle('Rota de aprendizagem').setHelpText('Escolha a rota e o nível que você está fazendo agora. O painel mostra qual é o próximo nível de cada pessoa.');
  pbSelf.setGoToPage(pbRota);
  var rotaItem = form.addListItem().setTitle(TITULO_ROTA).setRequired(true);
  rotaItem.setChoices([rotaItem.createChoice(OPC_SEM_ROTA, FormApp.PageNavigationType.SUBMIT)]);
  quem.setChoices([quem.createChoice(OPC_APF, pbApf), quem.createChoice(OPC_ADULTO, pbSelf)]);

  var desc = form.getDescription() || '';
  var extra = 'Também serve para a Rota de aprendizagem: o adulto faz a autoavaliação e o APF confirma, item por item.';
  if (desc.indexOf(extra) < 0) form.setDescription(desc + '\n' + extra);

  var fila = [];
  Object.keys(ROTAS).forEach(function (rota) { NIVEIS_ROTA.forEach(function (n) { fila.push(rota + '|' + n); }); });
  sp.setProperty('ROTAS_BASE', JSON.stringify({ rotaItem: rotaItem.getId() }));
  sp.setProperty('ROTAS_FILA', JSON.stringify(fila));
  sp.setProperty('ROTAS_SECOES', '{}');
  continuarFormularioRotas();
}

function continuarFormularioRotas() {
  apagarTriggers_('continuarFormularioRotas');
  var sp = PropertiesService.getScriptProperties(), ini = Date.now();
  var form = formRotas_(), cat = lerCatalogo_();
  var fila = JSON.parse(sp.getProperty('ROTAS_FILA') || '[]');
  var secoes = JSON.parse(sp.getProperty('ROTAS_SECOES') || '{}');
  while (fila.length) {
    if (Date.now() - ini > 4 * 60 * 1000) {
      ScriptApp.newTrigger('continuarFormularioRotas').timeBased().after(20 * 1000).create();
      console.log('Continua em seguida. Faltam ' + fila.length + ' seções.');
      return;
    }
    var k = fila[0], g = cat[k];
    if (g) {
      var p = k.split('|');
      var pb = form.addPageBreakItem().setTitle(p[0] + ' · ' + p[1])
        .setHelpText(PAPEL_NIVEL[p[1]] + '\nCaderno: ' + g.versao + ' · ' + g.url);
      if (Object.keys(secoes).length) pb.setGoToPage(FormApp.PageNavigationType.SUBMIT);
      g.comps.forEach(function (c) {
        var ajuda = (c.expl ? c.expl + '\n' : '') + 'Como saber que fez:\n' + c.itens.map(function (x, i) { return (i + 1) + '. ' + x.como; }).join('\n');
        form.addGridItem().setTitle(c.tipo === 'Essencial' ? c.nome + ' (essencial)' : c.nome)
          .setHelpText(ajuda)
          .setRows(c.itens.map(function (x, i) { return (i + 1) + '. ' + x.t; }))
          .setColumns(RESPOSTAS_ROTA);
      });
      form.addParagraphTextItem().setTitle('Se marcou "Fiz algo equivalente", conte o que fez');
      secoes[k] = pb.getId();
    }
    fila.shift();
    sp.setProperty('ROTAS_FILA', JSON.stringify(fila));
    sp.setProperty('ROTAS_SECOES', JSON.stringify(secoes));
  }
  // Terminou: liga a escolha de rota às seções
  var base = JSON.parse(sp.getProperty('ROTAS_BASE'));
  var rotaItem = form.getItemById(base.rotaItem).asListItem();
  var escolhas = Object.keys(secoes).map(function (k) {
    return rotaItem.createChoice(k.replace('|', ' · '), form.getItemById(secoes[k]).asPageBreakItem());
  });
  escolhas.push(rotaItem.createChoice(OPC_SEM_ROTA, FormApp.PageNavigationType.SUBMIT));
  rotaItem.setChoices(escolhas);
  apagarTriggers_('processarRotas');
  ScriptApp.newTrigger('processarRotas').forForm(form).onFormSubmit().create();
  sp.setProperty('ROTAS_FORM_OK', new Date().toISOString());
  console.log('Formulário pronto com ' + escolhas.length + ' opções de rota.');
}

/* 3. Lê as respostas e monta as abas de respostas e de situação */
function processarRotas() {
  var form = formRotas_();
  var resp = form.getResponses();
  var linhas = [];
  resp.forEach(function (r) {
    var quem = '', adulto = '', apfNome = '', rotaNivel = '', equiv = '', grades = [];
    r.getItemResponses().forEach(function (ir) {
      var it = ir.getItem(), t = it.getTitle(), v = ir.getResponse();
      if (t === TITULO_QUEM) quem = v === OPC_ADULTO ? 'Adulto' : 'APF';
      else if (t === TITULO_SEU_NOME) adulto = v;
      else if (/acompanhado/i.test(t) && !adulto) apfNome = v;
      else if (t === TITULO_ROTA) rotaNivel = v;
      else if (/^Se marcou "Fiz algo equivalente"/.test(t)) equiv = v;
      else if (it.getType() === FormApp.ItemType.GRID && ITENS_ORIGINAIS_FORM.indexOf(t) < 0) grades.push({ comp: t.replace(/ \(essencial\)$/, ''), rows: it.asGridItem().getRows(), v: v });
    });
    if (!rotaNivel || rotaNivel === OPC_SEM_ROTA) return;
    var nomeAdulto = quem === 'Adulto' ? adulto : apfNome;
    var p = rotaNivel.split(' · ');
    grades.forEach(function (g) {
      g.rows.forEach(function (row, i) {
        var s = g.v && g.v[i]; if (!s) return;
        linhas.push([r.getTimestamp(), quem || 'APF', nomeAdulto, p[0], p[1], g.comp, row.replace(/^\d+\.\s*/, ''), s, s === 'Fiz algo equivalente' ? equiv : '', r.getRespondentEmail ? (r.getRespondentEmail() || '') : '']);
      });
    });
  });
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(ABA_ROTAS_RESP) || ss.insertSheet(ABA_ROTAS_RESP);
  sh.clear();
  var cab = ['Data', 'Respondeu', 'Adulto', 'Rota', 'Nível', 'Competência', 'Item', 'Resposta', 'Equivalente', 'E-mail'];
  sh.getRange(1, 1, 1, cab.length).setValues([cab]).setFontWeight('bold').setBackground('#00853F').setFontColor('#FFFFFF');
  if (linhas.length) sh.getRange(2, 1, linhas.length, cab.length).setValues(linhas);
  sh.setFrozenRows(1);
  montarSituacaoRotas_(linhas);
}

function montarSituacaoRotas_(linhas) {
  var feito = function (s) { return s === 'Fiz' || s === 'Fiz algo equivalente'; };
  var ult = {}; // chave -> {ad, apf, dAd, dApf, eq}
  linhas.sort(function (a, b) { return a[0] - b[0]; }).forEach(function (l) {
    var k = [l[2], l[3], l[4], l[5], l[6]].join('|');
    var o = ult[k] || (ult[k] = { adulto: l[2], rota: l[3], nivel: l[4], comp: l[5], item: l[6] });
    if (l[1] === 'Adulto') { o.ad = l[7]; o.dAd = l[0]; } else { o.apf = l[7]; o.dApf = l[0]; }
    if (l[8]) o.eq = l[8];
  });
  // inclui os itens do catálogo ainda sem resposta, para cada adulto/rota/nível que já respondeu algo
  var cat = lerCatalogo_(), grupos = {};
  Object.keys(ult).forEach(function (k) { var o = ult[k]; grupos[o.adulto + '|' + o.rota + '|' + o.nivel] = 1; });
  Object.keys(grupos).forEach(function (g) {
    var p = g.split('|'), c = cat[p[1] + '|' + p[2]]; if (!c) return;
    c.comps.forEach(function (cp) {
      cp.itens.forEach(function (x) {
        var k = [p[0], p[1], p[2], cp.nome, x.t].join('|');
        if (!ult[k]) ult[k] = { adulto: p[0], rota: p[1], nivel: p[2], comp: cp.nome, item: x.t };
      });
    });
  });
  var out = Object.keys(ult).map(function (k) {
    var o = ult[k], s;
    if (feito(o.apf) && (!o.ad || feito(o.ad))) s = 'Confirmado';
    else if (o.apf && o.ad && feito(o.apf) !== feito(o.ad)) s = 'Conversar';
    else if (feito(o.ad) && !o.apf) s = 'Aguardando APF';
    else if (o.ad === 'Estou fazendo' || o.apf === 'Estou fazendo') s = 'Em andamento';
    else s = 'Falta';
    return [o.adulto, o.rota, o.nivel, o.comp, o.item, o.ad || '', o.apf || '', s, o.eq || '', o.dAd || '', o.dApf || ''];
  });
  out.sort(function (a, b) { return (a[0] + a[1] + a[2]).localeCompare(b[0] + b[1] + b[2]); });
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(ABA_ROTAS_SIT) || ss.insertSheet(ABA_ROTAS_SIT);
  sh.clear();
  sh.getRange(1, 1).setValue('Situação das rotas por adulto · atualizada a cada resposta do formulário. Não edite: corrija respondendo o formulário de novo.').setFontWeight('bold');
  var cab = ['Adulto', 'Rota', 'Nível', 'Competência', 'Item', 'Resposta do adulto', 'Resposta do APF', 'Situação', 'Equivalente', 'Data (adulto)', 'Data (APF)'];
  sh.getRange(3, 1, 1, cab.length).setValues([cab]).setFontWeight('bold').setBackground('#00853F').setFontColor('#FFFFFF');
  if (out.length) sh.getRange(4, 1, out.length, cab.length).setValues(out);
  sh.setFrozenRows(3);
}

/* 4. Dados para o painel */
function rotasParaPainel_() {
  var cat = lerCatalogo_(), out = { cat: {}, sit: [] };
  Object.keys(cat).forEach(function (k) {
    var g = cat[k], tot = 0;
    var comps = g.comps.map(function (c) { tot += c.itens.length; return [c.nome, c.tipo, c.itens.map(function (x) { return x.t; })]; });
    out.cat[k] = { versao: g.versao, url: g.url, total: tot, comps: comps };
  });
  var sh = SpreadsheetApp.getActive().getSheetByName(ABA_ROTAS_SIT);
  if (sh && sh.getLastRow() > 3) out.sit = sh.getRange(4, 1, sh.getLastRow() - 3, 9).getDisplayValues();
  return out;
}
