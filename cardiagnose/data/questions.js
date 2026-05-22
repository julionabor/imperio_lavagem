/** @module questions
 * Pain categories and diagnostic question bank for CarDiagnose widget.
 * Each category has 3–6 questions, each with 3 options scored 1–3 (mild→severe).
 */

export const PAIN_CATEGORIES = [
  {
    id: 'exterior',
    title: 'Carro sujo por fora',
    description: 'Sujidade acumulada, pó, pólen ou resíduos na carroçaria.',
    iconFile: 'icons/exterior.svg',
    questions: [
      {
        id: 'E1',
        text: 'Quando foi a última vez que o teu carro foi lavado a sério?',
        options: [
          { label: 'Há menos de 2 semanas', score: 1 },
          { label: 'Há 1 a 3 meses', score: 2 },
          { label: 'Há mais de 3 meses', score: 3 },
        ],
      },
      {
        id: 'E2',
        text: 'O teu carro fica estacionado ao ar livre habitualmente?',
        options: [
          { label: 'Não, garagem', score: 1 },
          { label: 'Às vezes ao ar livre', score: 2 },
          { label: 'Sempre ao ar livre', score: 3 },
        ],
      },
      {
        id: 'E3',
        text: 'Há marcas de pássaros, resina de árvore ou pólen na carroçaria?',
        options: [
          { label: 'Raramente', score: 1 },
          { label: 'Às vezes', score: 2 },
          { label: 'Com frequência', score: 3 },
        ],
      },
      {
        id: 'E4',
        text: 'Os plásticos exteriores estão branqueados ou opacos?',
        options: [
          { label: 'Estão em bom estado', score: 1 },
          { label: 'Ligeiramente opacos', score: 2 },
          { label: 'Muito degradados', score: 3 },
        ],
      },
    ],
  },
  {
    id: 'interior',
    title: 'Interior em mau estado',
    description: 'Sujidade, manchas, pó acumulado nos plásticos.',
    iconFile: 'icons/interior.svg',
    questions: [
      {
        id: 'I1',
        text: 'Tens animais de estimação que andam no carro?',
        options: [
          { label: 'Não', score: 1 },
          { label: 'Às vezes', score: 2 },
          { label: 'Sempre', score: 3 },
        ],
      },
      {
        id: 'I2',
        text: 'Os estofos têm manchas visíveis?',
        options: [
          { label: 'Não há manchas', score: 1 },
          { label: '1 a 2 manchas leves', score: 2 },
          { label: 'Manchas múltiplas / difíceis', score: 3 },
        ],
      },
      {
        id: 'I3',
        text: 'Os plásticos e o tablier têm pó acumulado?',
        options: [
          { label: 'Limpos', score: 1 },
          { label: 'Algum pó', score: 2 },
          { label: 'Muito sujos / gordurosos', score: 3 },
        ],
      },
      {
        id: 'I4',
        text: 'A alcatifa tem sujidade incrustada?',
        options: [
          { label: 'Limpa', score: 1 },
          { label: 'Suja mas não incrustada', score: 2 },
          { label: 'Incrustada / difícil de remover', score: 3 },
        ],
      },
    ],
  },
  {
    id: 'odor',
    title: 'Mau cheiro persistente',
    description: 'O carro cheira a tabaco, animais ou mofo.',
    iconFile: 'icons/odor.svg',
    questions: [
      {
        id: 'O1',
        text: 'Qual é a origem provável do cheiro?',
        options: [
          { label: 'Não sei / geral', score: 1 },
          { label: 'Tabaco / animais', score: 2 },
          { label: 'Mofo / humidade / orgânico', score: 3 },
        ],
      },
      {
        id: 'O2',
        text: 'O cheiro persiste depois de abrir as janelas?',
        options: [
          { label: 'Dissipa-se rapidamente', score: 1 },
          { label: 'Fica parcialmente', score: 2 },
          { label: 'Não desaparece', score: 3 },
        ],
      },
      {
        id: 'O3',
        text: 'Já limpaste o interior recentemente?',
        options: [
          { label: 'Limpei há pouco tempo', score: 1 },
          { label: 'Há alguns meses', score: 2 },
          { label: 'Nunca fiz limpeza profunda', score: 3 },
        ],
      },
    ],
  },
  {
    id: 'riscos',
    title: 'Pintura opaca ou riscada',
    description: 'A pintura perdeu o brilho, está baça ou tem riscos e marcas visíveis.',
    iconFile: 'icons/riscos.svg',
    questions: [
      {
        id: 'R1',
        text: 'Os riscos são visíveis ao sol ou só com ângulo específico?',
        options: [
          { label: 'Só com ângulo específico', score: 1 },
          { label: 'Visíveis ao sol', score: 2 },
          { label: 'Visíveis de qualquer ângulo', score: 3 },
        ],
      },
      {
        id: 'R2',
        text: 'A pintura tem marcas de escovas de lavagem ou areia?',
        options: [
          { label: 'Não', score: 1 },
          { label: 'Poucas marcas', score: 2 },
          { label: 'Muitas / severas', score: 3 },
        ],
      },
      {
        id: 'R3',
        text: 'Qual é a idade aproximada do carro?',
        options: [
          { label: 'Menos de 2 anos', score: 1 },
          { label: '2 a 5 anos', score: 2 },
          { label: 'Mais de 5 anos', score: 3 },
        ],
      },
      {
        id: 'R4',
        text: 'O carro já teve polimento profissional antes?',
        options: [
          { label: 'Sim, recentemente', score: 1 },
          { label: 'Sim, mas há muito', score: 2 },
          { label: 'Nunca', score: 3 },
        ],
      },
    ],
  },
  {
    id: 'protecao',
    title: 'Quero proteger a pintura',
    description: 'O carro está bem mas quero mantê-lo assim por mais tempo.',
    iconFile: 'icons/protecao.svg',
    questions: [
      {
        id: 'P1',
        text: 'Quanto tempo queres que a protecção dure?',
        options: [
          { label: 'Alguns meses', score: 1 },
          { label: '1 ano', score: 2 },
          { label: '2 anos ou mais', score: 3 },
        ],
      },
      {
        id: 'P2',
        text: 'O carro fica exposto a chuva ácida, pólen ou sal marinho?',
        options: [
          { label: 'Raramente', score: 1 },
          { label: 'Ocasionalmente', score: 2 },
          { label: 'Com frequência', score: 3 },
        ],
      },
      {
        id: 'P3',
        text: 'Pretendes vender o carro nos próximos 2 anos?',
        options: [
          { label: 'Não', score: 1 },
          { label: 'Talvez', score: 2 },
          { label: 'Sim, quero preservar o valor', score: 3 },
        ],
      },
    ],
  },
  {
    id: 'completo',
    title: 'Renovação completa',
    description: 'Quero o carro como novo — interior e exterior.',
    iconFile: 'icons/completo.svg',
    questions: [
      {
        id: 'C1',
        text: 'O interior e o exterior estão ambos em mau estado?',
        options: [
          { label: 'Exterior apenas', score: 1 },
          { label: 'Interior apenas', score: 2 },
          { label: 'Ambos precisam de atenção', score: 3 },
        ],
      },
      {
        id: 'C2',
        text: 'Queres incluir protecção duradoura após a renovação?',
        options: [
          { label: 'Não é prioridade', score: 1 },
          { label: 'Se não encarecer muito', score: 2 },
          { label: 'Sim, quero protecção máxima', score: 3 },
        ],
      },
      {
        id: 'C3',
        text: 'Há quanto tempo não fazes uma limpeza profunda?',
        options: [
          { label: 'Menos de 6 meses', score: 1 },
          { label: '6 meses a 1 ano', score: 2 },
          { label: 'Mais de 1 ano', score: 3 },
        ],
      },
    ],
  },
];

export const VEHICLE_TYPES = [
  { id: 'citadino',   label: 'Citadino / Hatch',    modelFile: 'models/citadino.glb',   surcharge: 0,    isMoto: false },
  { id: 'berlina',    label: 'Berlina / Sedan',      modelFile: 'models/berlina.glb',    surcharge: 0,    isMoto: false },
  { id: 'suv',        label: 'SUV / 4×4',            modelFile: 'models/suv.glb',        surcharge: 5.00, isMoto: false },
  { id: 'carrinha',   label: 'Carrinha / Break',     modelFile: 'models/carrinha.glb',   surcharge: 5.00, isMoto: false },
  { id: 'monovolume', label: 'Monovolume / 7 Lug.', modelFile: 'models/monovolume.glb', surcharge: 5.00, isMoto: false },
  { id: 'mota',       label: 'Mota',                 modelFile: 'models/mota.glb',       surcharge: 0,    isMoto: true  },
];

export const COLOR_PALETTE = [
  { label: 'Branco',           hex: '#F5F5F5' },
  { label: 'Preto',            hex: '#1A1A1A' },
  { label: 'Cinzento',         hex: '#8A8A8A' },
  { label: 'Prateado',         hex: '#C0C0C0' },
  { label: 'Azul Escuro',      hex: '#1B3A6B' },
  { label: 'Azul Claro',       hex: '#5B8DB8' },
  { label: 'Vermelho',         hex: '#C0392B' },
  { label: 'Verde',            hex: '#27AE60' },
  { label: 'Bege / Champagne', hex: '#D4B896' },
  { label: 'Laranja',          hex: '#E67E22' },
  { label: 'Amarelo',          hex: '#F1C40F' },
];
