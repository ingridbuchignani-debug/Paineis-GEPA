# Painel das Ninhadas

Painel de acompanhamento do **Ramo Filhotes** (Escoteiros do Brasil) para a chefia de seção. Roda de graça no Google (Planilhas + Apps Script) e conversa com o **Paxtu**: o que a chefia registra no painel é lançado no Paxtu, e os dados dos Filhotes vêm de lá todos os dias.

Criado no Grupo Escoteiro Padre Anchieta 27/SP (Botucatu) e aberto para qualquer grupo usar e adaptar.

## O que o painel faz

| Aba | Para quê |
|---|---|
| **Visão geral** | Números da seção, aviso de atividade sem cadastro no Paxtu nos próximos 7 dias, próximas atividades e entradas e saídas de cada mês |
| **Filhotes** | Lista vinda do Paxtu, lembrete de renovação do registro (abre o WhatsApp do responsável com a mensagem pronta) e fila de espera |
| **Ficha do Filhote** | Resumo da vida escoteira e ficha médica do Paxtu (saúde e alimentação) |
| **Progressão** | Itens e conquistas de Paco, Tixa, Lipe e Nina, lançados direto no Paxtu, e quem está perto da próxima conquista |
| **Presença** | Chamada da atividade: quem esteve presente recebe os itens de progressão da atividade no Paxtu |
| **Atividades** | Calendário com filtro por ciclo, cadastro de atividade especial no Paxtu, ficha de atividade, banco de fichas (Nacional e do grupo), texto para WhatsApp e relato para o histórico do Paxtu |
| **Financeiro** e **Verba CMDCA** | Pagamentos das famílias e controle de verba planejada x usada |
| **Documentos** | Documentos pendentes por Filhote |
| **Pergunte** | Assistente que responde dúvidas da chefia usando só documentos oficiais (POR, Estatuto, Resoluções do CAN, manuais) e cita a fonte |

## O que você precisa

- Conta Google do grupo (de preferência `@escoteiros.org.br`, que é o domínio liberado por padrão).
- Login do Paxtu de quem é chefe da seção.
- Para o **Pergunte**: uma chave gratuita do Gemini, criada em [aistudio.google.com](https://aistudio.google.com) (opcional).

## Instalação

1. Crie uma planilha nova no Google Drive e abra **Extensões › Apps Script**.
2. Crie no projeto um arquivo para cada arquivo da pasta `src/` (mesmo nome) e cole o conteúdo. `Painel.html` é do tipo HTML; os demais são Script. Em **Configurações do projeto**, marque "Mostrar o arquivo de manifesto" e substitua `appsscript.json` pelo deste repositório (ele liga o serviço avançado do Drive).
   - Quem usa [clasp](https://github.com/google/clasp) pode fazer `clasp create --type sheets` e `clasp push` dentro de `src/`.
3. Edite **`Config.gs`** com os dados do seu grupo: nome, endereço da sede, e-mail de quem administra, códigos das seções no Paxtu e IDs das pastas no Drive.
4. Volte à planilha, recarregue a página e use o menu **Painel**, na ordem:
   1. Configurar acesso ao Paxtu (login e senha ficam guardados só na sua conta, fora do código)
   2. Configurar chave do Gemini (opcional)
   3. Preparar a planilha (cria as abas e puxa os Filhotes do Paxtu)
   4. Instalar atualizações automáticas (Paxtu às 4h, ficha médica às 4h30, documentos às 5h)
5. Na aba **Chefia**, liste quem pode entrar: Nome, E-mail e Liberado = Sim.
6. No Apps Script: **Implantar › Nova implantação › App da Web**, executar como "Eu" e acesso "Qualquer pessoa do domínio". O link gerado é o painel.

## Pastas no Drive

- **Fichas de atividade do grupo** e **Fichas da Nacional**: PDF ou Word. O menu "Importar fichas de atividade" separa cada ficha e monta o Banco de atividades.
- **Documentos de consulta**: base do Pergunte. A rotina baixa sozinha os documentos oficiais listados em `NinhadaConsultaDocs.gs` e cria as subpastas. Qualquer PDF que você colocar lá entra na base no dia seguinte. PDFs que são só imagem precisam de OCR antes (o Drive faz isso ao abrir como Google Docs).

## Privacidade

- Os dados das crianças ficam na planilha do grupo, no Google do grupo. Nada vai para este repositório.
- Senha do Paxtu e chave do Gemini nunca ficam no código.
- O Pergunte envia ao Gemini **só a pergunta e trechos dos documentos oficiais**, nunca dados dos Filhotes.
- Só entra no painel quem a administração liberar na aba Chefia.

## Limitações conhecidas

- O Paxtu não tem API pública: o painel usa as mesmas telas do site. Se o Paxtu mudar, alguma função pode parar e precisar de ajuste.
- Cadastro de atividade **de sede** no Paxtu ainda não funciona pelo painel (só atividade especial).
- No plano gratuito do Gemini, em horários de pico a resposta pode demorar ou pedir para tentar de novo.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `Config.gs` | Configurações do grupo (o único que você precisa editar) |
| `Codigo.gs` | Web app, controle de acesso e menu |
| `Dados.gs` | Leitura da planilha para o painel |
| `Gravacao.gs` | Gravações do painel (chamada, itens, atividades) |
| `Lancar.gs` | Lançamentos no Paxtu (itens, conquistas, atividade especial) |
| `Paxtu.gs` | Login e sessão do Paxtu |
| `Ninhada.gs` | Abas da planilha e importação diária dos Filhotes |
| `NinhadaFicha.gs` | Ficha médica do Paxtu |
| `NinhadaAtividades.gs`, `Fichas.gs` | Fichas de atividade e Banco de atividades |
| `Crescimento.gs` | Fila de espera e números do mês |
| `Verba.gs` | Verba CMDCA |
| `Ficha.gs` | Ficha do Filhote |
| `NinhadaConsulta.gs`, `NinhadaConsultaDocs.gs`, `Consulta.gs` | Base de documentos e assistente Pergunte |
| `Instalacao.gs` | Rotinas automáticas |
| `Painel.html` | Tela do painel |

## Licença

MIT. Use, adapte e compartilhe. Se melhorar algo, mande de volta para todo mundo aproveitar.
