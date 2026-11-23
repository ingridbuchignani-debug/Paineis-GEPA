# Painel de Acompanhamento do Adulto Voluntário

Painel para o Diretor de Métodos Educativos e os APFs acompanharem a formação dos escotistas e dirigentes do grupo. Roda de graça no Google (Planilhas, Formulários e Apps Script) e lê os dados do **Paxtu**. O painel Gestão de Adultos do Paxtu não mostra o acompanhamento por competências; este painel cobre essa parte.

## O que o painel faz

| Parte | Para quê |
|---|---|
| **Adultos** | Lista dos adultos ativos vinda do Paxtu: funções, seção, APF, validade do registro, tempo de escotismo e situação dos documentos |
| **Formação** | Cursos e níveis de cada adulto, separando "curso concluído" de "nível concluído" (no Paxtu são campos diferentes), e o próximo passo de cada um |
| **Competências** | Formulário para o APF registrar o acompanhamento anual (3 essenciais e 4 específicas) e alerta de acompanhamento atrasado |
| **Rotas de aprendizagem** | Catálogo das ações de cada rota (Filhotes a Pioneiro e linha Dirigente, níveis Preliminar a Avançado), autoavaliação do adulto e conferência do APF |
| **Certificados** | Certificados de conquista e participação com numeração anual e livro de controle |
| **Anos de atividade** | Certificado automático de anos de boas atividades, contados da Promessa, enviado por e-mail antes da primeira atividade do mês |
| **Calendário** | Eventos do grupo, distritais, regionais e nacionais, com decisão de participação |
| **Transição de ramo** | Jovens perto da idade de passagem para o próximo ramo |
| **Acordo de Trabalho Voluntário** | Situação do acordo de cada adulto (vigente, vence em até 60 dias, vencido, pendente ou sem acordo), com indicador, filtro e alertas |
| **Histórico do Paxtu no Drive** | Toda semana guarda no Drive os certificados de atividades e cursos (por pessoa e por ano), os Acordos de Trabalho Voluntário assinados, o histórico de formação do grupo e a apólice do seguro |
| **Acesso** | Só entra quem estiver liberado na aba Acessos, com e-mail @escoteiros.org.br |

## O que você precisa

- Conta Google do grupo (de preferência `@escoteiros.org.br`).
- Login do Paxtu de quem tem acesso aos dados dos adultos do grupo.

## Instalação

1. Suba `modelo/Modelo_Planilha_Adulto.xlsx` no Google Drive e abra como Planilhas Google (Arquivo › Salvar como Planilhas Google). Ela vem só com as abas e os títulos, sem dados.
2. Na planilha, abra **Extensões › Apps Script**. Crie um arquivo para cada arquivo da pasta `src/` (mesmo nome) e cole o conteúdo. `Painel.html` é do tipo HTML; os demais são Script. Em **Configurações do projeto**, marque "Mostrar o arquivo de manifesto" e substitua `appsscript.json` pelo deste repositório.
3. Edite **`Config.gs`**: nome do grupo, ID da planilha e ID da pasta do Drive.
4. Na aba **Adultos**, cole o Registro e o Nome dos adultos ativos (relatório de Associados do Paxtu). O resto o painel preenche, e adultos novos entram sozinhos nas atualizações.
5. Recarregue a planilha e use o menu **Painel**, na ordem:
   1. Configurar acesso ao Paxtu (login e senha ficam guardados só na sua conta, fora do código)
   2. Testar acesso ao Paxtu
   3. Puxar os adultos do Paxtu
   4. Montar a aba Acessos (marque Sim para quem pode entrar)
   5. Criar o formulário de competências (copie o link público para `FORM_COMPETENCIAS_URL` no `Config.gs`)
   6. Montar Rotas de aprendizagem e formulário
   7. Criar a aba de especialidades
   8. Configurar certificados (veja abaixo)
   9. Instalar atualizações automáticas
6. Opcional, histórico do Paxtu no Drive: preencha `HIST_PASTA_ID`, `HIST_PASTA_ADMIN_ID` e, se quiser, `HIST_SECOES` no `Config.gs`, e rode `instalarHistoricoPaxtu` uma vez no editor (domingo de madrugada). A primeira rodada baixa tudo e pode levar algumas horas; as seguintes só baixam o que for novo.
7. No Apps Script: **Implantar › Nova implantação › App da Web**, executar como "Eu" e acesso "Qualquer pessoa do domínio". O link gerado é o painel.

## Modelo de certificado

Crie uma apresentação de 2 slides (1º conquista, 2º participação) com a identidade do seu grupo e salve na pasta do painel como `Modelo_Certificado.pptx`. Use estes campos no texto, que o painel troca pelos dados:

`{{NOME}}` `{{TRATAMENTO}}` `{{REGISTRO}}` `{{CONQUISTA}}` `{{ATIVIDADE}}` `{{DATA_ATIVIDADE}}` `{{DATA_EXTENSO}}` `{{NUMERO}}`

Antes do ano definido em `CERT_ANO_INICIO`, os certificados saem em modo teste e os e-mails vão só para quem administra.

## Privacidade

- Os dados dos adultos ficam na planilha do grupo, no Google do grupo. Nada vai para este repositório.
- A senha do Paxtu nunca fica no código.
- O registro de novos associados não faz parte do painel, por causa da LGPD.
- O PDF do Acordo de Trabalho Voluntário traz o CPF. Deixe a pasta Chefia, criada pelo histórico do Paxtu, só com quem precisa.

## Limitações conhecidas

- O Paxtu não tem API pública: o painel usa as mesmas telas do site. Se o Paxtu mudar, alguma função pode parar e precisar de ajuste.
- Os materiais de competências são anteriores ao programa atualizado, e a lista de competências específicas pode mudar.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `Config.gs` | Configurações do grupo (o único que você precisa editar) |
| `Codigo.gs` | Web app, controle de acesso, menu e atualização dos adultos pelo Paxtu |
| `Paxtu.gs` | Login e sessão do Paxtu |
| `Rotas.gs` | Rotas de aprendizagem e formulário de autoavaliação |
| `Certificados.gs` | Certificados e livro de controle |
| `Estrelas.gs` | Anos de boas atividades e e-mails automáticos |
| `HistoricoPaxtu.gs` | Histórico do Paxtu no Drive e situação dos Acordos de Trabalho Voluntário |
| `Instalacao.gs` | Atalhos do menu para montar o painel |
| `Painel.html` | Tela do painel |
