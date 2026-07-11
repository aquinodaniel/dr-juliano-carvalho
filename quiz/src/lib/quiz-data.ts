// QUIZ — IMERSÃO PRIMEIRA ARREMATAÇÃO (Juliano Carvalho)
// 35 telas — Quiz Sales Letter para funil de R$19
// Mentor: Juliano Carvalho. Método: Encontrar → Analisar → Arrematar.
import homemAsset from "@/assets/homem.webp.asset.json";
import mulherAsset from "@/assets/mulher.webp.asset.json";

export type Screen =
  | { id: string; type: "intro" }
  | {
      id: string;
      type: "single";
      question: string;
      options: { value: string; label: string; image?: string; emoji?: string }[];
      grid?: 2 | 4;
    }
  | {
      id: string;
      type: "multi";
      question: string;
      options: { value: string; label: string }[];
    }
  | {
      id: string;
      type: "scale";
      question: string;
      statement: string;
    }
  | {
      id: string;
      type: "content";
      title: string;
      body: string;
      image?: string;
      quote?: { author: string; text: string };
    }
  | { id: string; type: "loading" }
  | { id: string; type: "diagnosis" }
  | { id: string; type: "comparison" }
  | { id: string; type: "testimonials" }
  | { id: string; type: "lead" };

export const screens: Screen[] = [
  // TELA 1 — Intro (headline + gênero)
  { id: "intro", type: "intro" },

  // TELA 1 (gênero — usado dentro da intro)
  {
    id: "genero",
    type: "single",
    question: "Você é:",
    grid: 2,
    options: [
      { value: "homem", label: "Homem", image: homemAsset.url },
      { value: "mulher", label: "Mulher", image: mulherAsset.url },
    ],
  },

  // TELA 2 — Idade
  {
    id: "idade",
    type: "single",
    question: "Qual a sua idade?",
    grid: 2,
    options: [
      { value: "18_29", label: "18 a 29 anos", emoji: "🧑" },
      { value: "30_39", label: "30 a 39 anos", emoji: "🧔" },
      { value: "40_49", label: "40 a 49 anos", emoji: "👨" },
      { value: "50_mais", label: "50+ anos", emoji: "🧓" },
    ],
  },

  // TELA 3 — Moradia
  {
    id: "moradia",
    type: "single",
    question: "Hoje, como é a sua situação de moradia?",
    options: [
      { value: "aluguel", label: "🏠 Pago aluguel todo mês" },
      { value: "familia", label: "👨‍👩‍👧 Moro com meus pais ou sogros" },
      { value: "financiando", label: "💳 Estou financiando meu imóvel" },
      { value: "proprio", label: "✅ Já tenho imóvel próprio, quero conquistar meu carro" },
    ],
  },

  // TELA 4 — Situação atual
  {
    id: "situacao_atual",
    type: "single",
    question: "Hoje, o que mais te descreve quando o assunto é comprar seu imóvel ou carro?",
    options: [
      { value: "3", label: "😰 Acho que nunca vou conseguir juntar dinheiro suficiente" },
      { value: "2", label: "😔 Já tentei entender como funciona e desisti por achar complicado" },
      { value: "1", label: "📊 Estou pesquisando, mas não sei por onde começar de verdade" },
      { value: "0", label: "😎 Já sei o que quero, só preciso do caminho certo" },
    ],
  },

  // TELA 5 — Frequência
  {
    id: "frequencia_pensamento",
    type: "single",
    question:
      'Com que frequência você pensa "eu poderia estar economizando esse dinheiro" quando paga aluguel ou parcela do financiamento?',
    options: [
      { value: "3", label: "😩 Todos os meses, sempre que pago" },
      { value: "2", label: "😔 Algumas vezes, quando vejo o valor total já pago" },
      { value: "1", label: "😐 De vez em quando" },
      { value: "0", label: "🙂 Quase nunca penso nisso" },
    ],
  },

  // TELA 6 — Prova social
  {
    id: "prova_social_1",
    type: "content",
    title: "Você sabia?",
    body:
      "O brasileiro médio precisa de mais de 15 anos de salário integral para comprar um imóvel à vista nas grandes cidades. (Dado de mercado imobiliário, 2024)",
    quote: {
      author: "Rafael S., participante da imersão, 11/06 às 22:14",
      text:
        "Juliano, cara, eu nem sabia que dava pra comprar apê arrematando em leilão... comprei o meu com mais de 50% de desconto do valor de mercado. Ainda não caiu a ficha 🙏",
    },
  },

  // TELA 7 — Padrão repetido
  {
    id: "padrao_desistir",
    type: "single",
    question:
      "Isso já aconteceu mais de uma vez: você via um imóvel ou carro que queria, calculava o preço e desistia por achar caro demais?",
    options: [
      { value: "3", label: "😔 Sim, isso já virou rotina" },
      { value: "2", label: "😐 Já aconteceu algumas vezes" },
      { value: "1", label: "🙂 Foi só uma vez ou outra" },
      { value: "0", label: "🙁 Nunca nem cheguei a pesquisar de verdade" },
    ],
  },

  // TELA 8 — Visualização do futuro
  {
    id: "mudanca_primeiro",
    type: "single",
    question:
      "Se você conquistasse seu imóvel ou carro pagando metade do preço, o que isso mudaria primeiro na sua vida?",
    options: [
      { value: "aluguel", label: "🏠 Eu pararia de pagar aluguel de vez" },
      { value: "familia", label: "👨‍👩‍👧 Eu daria mais segurança pra minha família" },
      { value: "sobra", label: "💰 Eu sobraria dinheiro todo mês pela primeira vez" },
      { value: "conquista", label: "🎉 Eu finalmente sentiria que conquistei algo com as próprias mãos" },
    ],
  },

  // TELA 9 — Rotina futura
  {
    id: "tempo_dinheiro",
    type: "single",
    question:
      "Quanto tempo (e dinheiro) você acha que teria de volta se não estivesse mais refém de aluguel ou de um financiamento caro?",
    options: [
      { value: "3", label: "🔥 Muito, isso mudaria completamente meu mês" },
      { value: "2", label: "🙂 Bastante, eu sentiria a diferença rápido" },
      { value: "1", label: "😐 Um pouco, mas ainda ajudaria" },
      { value: "0", label: "🤔 Nunca parei pra calcular isso" },
    ],
  },

  // TELA 10 — Prioridade
  {
    id: "prioridade_compra",
    type: "single",
    question:
      "Se existisse um jeito seguro de conquistar seu imóvel ou carro pagando muito menos, qual seria sua prioridade?",
    options: [
      { value: "imovel", label: "🏠 Comprar meu primeiro imóvel" },
      { value: "carro", label: "🚗 Comprar meu primeiro carro" },
      { value: "ambos", label: "🏠🚗 Os dois, nessa ordem" },
      { value: "entender", label: "🤔 Ainda não sei, quero entender como funciona primeiro" },
    ],
  },

  // TELA 11 — Vilão (conteúdo)
  {
    id: "vilao_edital",
    type: "content",
    title:
      "Você sabia que o leilão não é arriscado — o que é arriscado é entrar nele sem saber ler o que está escrito no edital?",
    body:
      "A maioria das pessoas desiste do leilão não por falta de dinheiro, mas por medo do que não entende: termos jurídicos, letra miúda, prazos, riscos escondidos no processo.\n\nQuem sabe ler esse \"manual\" antes de dar o lance, compra com segurança e paga muito menos. A solução para conquistar seu imóvel ou carro por metade do preço começa em aprender a analisar um edital antes de agir.",
  },

  // TELA 12 — Áreas afetadas (MULTI)
  {
    id: "areas_afetadas",
    type: "multi",
    question:
      "Selecione as áreas da sua vida que a demora em conquistar seu imóvel ou carro próprio já afetou:",
    options: [
      { value: "financeira", label: "💵 Minha tranquilidade financeira" },
      { value: "parceiro", label: "❤️ Minha relação com meu(minha) parceiro(a)" },
      { value: "autoestima", label: "😔 Minha autoestima e sensação de progresso" },
      { value: "familia", label: "👨‍👩‍👧 Meu relacionamento com meus filhos ou família" },
      { value: "rotina", label: "🕐 Minha rotina e qualidade de vida" },
      { value: "planos", label: "💭 Meus planos futuros (ter filhos, casar, se estabilizar)" },
      { value: "nenhuma", label: "🚫 Nenhuma das acima" },
    ],
  },

  // TELA 13 — Vulnerabilidade
  {
    id: "sentimento_outros",
    type: "single",
    question:
      "Sendo 100% sincero(a): o que você sente quando vê outras pessoas comprando seu primeiro imóvel ou carro?",
    options: [
      { value: "comparacao", label: "😔 Comparação — \"por que elas conseguiram e eu não\"" },
      { value: "incapacidade", label: "😩 Incapacidade — acho que não é pra mim" },
      { value: "indiferenca", label: "😐 Indiferença, mas queria estar no lugar delas" },
      { value: "inspiracao", label: "🔥 Inspiração — acredito que também vou conseguir" },
    ],
  },

  // TELA 14 — Nível de conhecimento
  {
    id: "nivel_conhecimento",
    type: "single",
    question: "Quando o assunto é leilão de imóvel ou carro, você se considera:",
    options: [
      { value: "3", label: "😬 Totalmente perdido, nunca estudei sobre isso" },
      { value: "2", label: "😐 Já ouvi falar, mas tenho medo de me arriscar" },
      { value: "1", label: "🙂 Já pesquisei um pouco, mas não confio no que sei" },
      { value: "0", label: "😎 Já entendo o básico, só preciso de direção" },
    ],
  },

  // TELA 15 — O que rouba (MULTI)
  {
    id: "o_que_rouba",
    type: "multi",
    question: "O que a demora em ter seu imóvel ou carro próprio mais rouba de você?",
    options: [
      { value: "paz", label: "🕊️ Minha paz" },
      { value: "liberdade", label: "🗽 Minha liberdade de escolha" },
      { value: "progresso", label: "📈 Meu senso de progresso na vida" },
      { value: "familia", label: "👨‍👩‍👧 Tempo com a família" },
      { value: "sonhar", label: "💭 Minha capacidade de sonhar mais alto" },
      { value: "orgulho", label: "🏆 Meu orgulho próprio" },
      { value: "nenhuma", label: "🚫 Nenhuma das acima" },
    ],
  },

  // TELA 16 — Revelação do produto + prova social
  {
    id: "revelacao_imersao",
    type: "content",
    title:
      "Com base nas suas respostas, identificamos que a Imersão Primeira Arrematação é perfeita para a sua situação atual!",
    body:
      "O próximo passo é entender quais crenças estão te impedindo de dar o primeiro lance.",
    quote: {
      author: "Camila R., 03/06 às 19:47",
      text:
        "Cara eu jurava que ia precisar de advogado pra participar de leilão... o Juliano explica tão simples que hj eu já entendo mais que muita gente que trampa com isso. Vou dar meu primeiro lance mês que vem 🔥",
    },
  },

  // TELA 17 — Escala de concordância
  {
    id: "escala_arriscado",
    type: "scale",
    question: "Avalie o quanto você concorda:",
    statement:
      "Comprar em leilão é arriscado demais para uma pessoa comum, sem ser advogado ou investidor.",
  },

  // TELA 18 — Não-dito
  {
    id: "medo_leilao",
    type: "single",
    question:
      "Você já teve vontade de participar de um leilão, mas travou com medo de ser enganado ou de perder o dinheiro que já tem?",
    options: [
      { value: "3", label: "😰 Sim, isso me trava até hoje" },
      { value: "2", label: "😔 Já pensei nisso, mas nunca cheguei perto de tentar" },
      { value: "1", label: "🤔 Nunca tinha pensado em leilão como opção real" },
      { value: "0", label: "🙂 Não, só faltava saber como fazer certo" },
    ],
  },

  // TELA 19 — Frases ouvidas (MULTI)
  {
    id: "frases_ouvidas",
    type: "multi",
    question: "Quais dessas frases você já ouviu (ou já repetiu) sobre leilão?",
    options: [
      { value: "roubada", label: "\"Leilão é roubada, tem gente que perde tudo\"" },
      { value: "golpe", label: "\"Isso é golpe, cuidado\"" },
      { value: "so_rico", label: "\"Só rico ou investidor profissional ganha nesses leilões\"" },
      { value: "complicado", label: "\"É complicado demais pra gente comum entender\"" },
      { value: "advogado", label: "\"Você vai precisar de advogado pra não ser enganado\"" },
      { value: "nenhuma", label: "🚫 Nenhuma das anteriores" },
    ],
  },

  // TELA 20 — Autoridade Juliano
  {
    id: "autoridade_juliano",
    type: "content",
    title:
      "De acordo com suas respostas, você não tem medo do leilão em si — você tem medo de não saber interpretar o que está escrito nele. E essa é exatamente a especialidade de quem vai te ensinar.",
    body:
      "Juliano Carvalho foi advogado corporativo por 17 anos: seu trabalho era ler contrato, enxergar risco e proteger quem confiava nele.\n\nAplicou isso nos próprios leilões e já arrematou mais de R$25 milhões em imóveis — não por sorte, por método.",
  },

  // TELA 21 — Julgamento social
  {
    id: "julgamento_social",
    type: "single",
    question: "Você já se sentiu julgado(a) ou desencorajado(a) por considerar comprar em leilão?",
    options: [
      { value: "familia", label: "👨‍👩‍👧 Já, pela minha família" },
      { value: "amigos", label: "😔 Já, por amigos" },
      { value: "ambos", label: "😬 Já, por ambos" },
      { value: "nunca", label: "🙂 Nunca, ninguém sabe que penso nisso" },
    ],
  },

  // TELA 22 — Frases da família (MULTI)
  {
    id: "frases_familia",
    type: "multi",
    question: "Quais dessas frases sua família costuma repetir sobre comprar imóvel ou carro?",
    options: [
      { value: "vista", label: "\"Compra só o que você consegue pagar à vista\"" },
      { value: "financiamento", label: "\"Financiamento é a única forma segura de comprar\"" },
      { value: "barato", label: "\"Quem compra barato demais está se arriscando\"" },
      { value: "sobrando", label: "\"Essas coisas de leilão são pra gente com dinheiro sobrando\"" },
      { value: "tradicao", label: "\"Do jeito que sempre se fez é o jeito certo\"" },
      { value: "nenhuma", label: "🚫 Nenhuma das acima" },
    ],
  },

  // TELA 23 — Autoconfiança
  {
    id: "autoconfianca",
    type: "single",
    question:
      "Você acredita que VOCÊ é capaz de conquistar seu primeiro imóvel ou carro pagando muito menos do que imagina?",
    options: [
      { value: "0", label: "😄 Sim, com certeza" },
      { value: "2", label: "🤔 Talvez, mas tenho dúvidas" },
      { value: "3", label: "😭 Não acredito muito nisso" },
    ],
  },

  // TELA 24 — Oportunidade perdida
  {
    id: "oportunidade_perdida",
    type: "single",
    question:
      "Alguma vez você já viu uma oportunidade de imóvel ou carro barato passar, e depois se arrependeu de não ter entendido como participar?",
    options: [
      { value: "3", label: "😔 Sim, mais de uma vez" },
      { value: "2", label: "😐 Sim, uma vez" },
      { value: "0", label: "🙂 Não, nunca cheguei a ver uma oportunidade de verdade" },
    ],
  },

  // TELA 25 — Tempo para conquistar
  {
    id: "tempo_para_conquistar",
    type: "single",
    question:
      "Se você tivesse um método simples para encontrar, analisar e arrematar um leilão com segurança, em quanto tempo você acredita que conquistaria seu primeiro imóvel ou carro?",
    options: [
      { value: "3", label: "🔥 Em menos de 6 meses" },
      { value: "2", label: "😎 Em até 1 ano" },
      { value: "1", label: "🙂 Em 1 a 2 anos" },
      { value: "0", label: "😐 Não sei, nunca calculei isso" },
      { value: "0", label: "🙁 Acho que levaria muitos anos" },
    ],
  },

  // TELA 26 — Impedimento (módulos do método)
  {
    id: "impedimento",
    type: "single",
    question: "Qual o seu maior impedimento hoje para conquistar seu imóvel ou carro em leilão?",
    options: [
      { value: "encontrar", label: "🔍 Não sei onde encontrar leilões reais e confiáveis" },
      { value: "analisar", label: "📄 Não sei analisar um edital pra saber se vale a pena" },
      { value: "lance", label: "💸 Tenho medo de dar o lance errado e perder dinheiro" },
      { value: "depois", label: "🤷 Não sei o que fazer depois de arrematar" },
    ],
  },

  // TELA 27 — Loading (calculando)
  { id: "calculando", type: "loading" },

  // TELA 28 — Diagnóstico visual (4 bloqueios fixos)
  { id: "diagnostico", type: "diagnosis" },

  // TELA 29 — Compromisso #1
  {
    id: "compromisso_1",
    type: "single",
    question:
      "Quão motivado(a) você está para conquistar seu primeiro imóvel ou carro nos próximos meses?",
    options: [
      { value: "curioso", label: "🤔 Só estou curioso(a) para entender como funciona" },
      { value: "duvida", label: "😔 Ainda não tenho certeza se consigo" },
      { value: "vou", label: "🔥 Não vou parar até conquistar o meu" },
    ],
  },

  // TELA 30 — Comparativo antes/depois
  { id: "comparativo", type: "comparison" },

  // TELA 31 — Prova social concreta (2 mensagens)
  {
    id: "prova_social_2",
    type: "content",
    title: "Quem já aplicou o método e conquistou:",
    body: "",
    quote: {
      author: "Fernanda M., 27/05 às 20:03  ·  Marcos T., 14/06 às 18:29",
      text:
        "Juliano, fechei! Comprei meu primeiro apê com 53% de desconto do valor de mercado, tudo pelo método que vc ensinou. Ainda parece mentira assinando o contrato 😭🙏\n\n— — —\n\nConsegui meu carro pagando quase metade do preço de tabela, sem financiar nada. Nunca imaginei que ia ser advogado de mim mesmo lendo edital kkkk valeu Juliano",
    },
  },

  // TELA 32 — Quebra de objeção "já tentei"
  {
    id: "quebra_ja_tentei",
    type: "content",
    title:
      "\"Já tentei entender leilão sozinho(a) por vídeo no YouTube... mas desisti porque parecia jurídico demais e eu tinha medo de errar.\"",
    body:
      "📉 78% de esforço tentando aprender sozinho / 11% de confiança real para dar um lance.\n\nERA MUITO ESFORÇO PARA POUCO PROGRESSO. O problema nunca foi você — foi tentar decifrar sozinho(a) o que um advogado especialista leva 17 anos pra dominar.",
  },

  // TELA 33 — Autoridade + transformações múltiplas
  {
    id: "autoridade_transformacoes",
    type: "content",
    title: "Juliano Carvalho já ajudou milhares de brasileiros comuns a conquistarem seu primeiro imóvel ou carro:",
    body:
      "17 anos como advogado corporativo, lendo contrato e medindo risco.\n\n+R$25 milhões arrematados, por método, não por sorte.\n\nMilhares de contratos analisados antes de cada decisão.",
    quote: {
      author: "participante da imersão",
      text:
        "Além do imóvel, isso mudou minha relação com dinheiro. Hoje eu entendo o que assino, não tenho mais medo de burocracia e minha família finalmente tem uma casa que é nossa.",
    },
  },

  // TELA 34 — Compromisso final
  {
    id: "compromisso_2",
    type: "single",
    question:
      "Você acredita que seria capaz de conquistar seu primeiro imóvel ou carro com mais de 50% de desconto se tivesse esse método nas mãos?",
    options: [
      { value: "pronto", label: "✅ Sim, estou pronto(a) para isso" },
      { value: "direcao", label: "🙂 Com certeza, só preciso de direção" },
      { value: "tentar", label: "🙁 Acho que sim... quero tentar" },
    ],
  },

  // TELA 35 (parte 1) — Loading final
  { id: "loading_final", type: "loading" },

  // TELA 35 (parte 2) — Gate / captura
  { id: "captura_lead", type: "lead" },
];
