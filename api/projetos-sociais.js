// api/projetos-sociais.js (Vercel Serverless Function)
const DEFAULT_PROJECTS = [
  {
    id: 'proj-1',
    title: 'Projeto Jiu-Jitsu Graça & Tatame',
    sport: 'Jiu-Jitsu',
    neighborhood: 'Tijuca',
    city: 'Rio de Janeiro - RJ',
    address: 'Rua Conde de Bonfim, 452 - Anexo Igreja Batista Central',
    phone: '(21) 98765-4321',
    whatsapp: '5521987654321',
    organization: 'Igreja Batista Central da Tijuca',
    targetPublic: 'Crianças, Jovens e Adultos (a partir de 6 anos)',
    schedule: 'Terças e Quintas: 19h30 às 21h00 | Sábados: 09h00 às 11h00',
    price: 'Totalmente Gratuito',
    description: 'Aulas gratuitas de Jiu-Jitsu com professores faixa preta federados. O projeto visa formar cidadãos, trabalhar disciplina, defesa pessoal e proporcionar inclusão social por meio do esporte.',
    requirements: 'Frequência escolar obrigatória para menores. Empréstimo de Kimono para iniciantes nos primeiros meses.'
  },
  {
    id: 'proj-2',
    title: 'Escolinha de Futebol Comunidade Viva',
    sport: 'Escolinha de Futebol',
    neighborhood: 'Itaquera',
    city: 'São Paulo - SP',
    address: 'Rua Augusto Carlos Bauman, 780 - Quadra Comunitária de Itaquera',
    phone: '(11) 97123-8899',
    whatsapp: '5511971238899',
    organization: 'Associação Beneficente Itaquera Unida',
    targetPublic: 'Crianças e Adolescentes de 7 a 16 anos',
    schedule: 'Quartas e Sextas: 14h00 às 17h00 | Domingos: 08h30 às 11h30',
    price: 'Totalmente Gratuito',
    description: 'Treinos de futebol de campo e futsal gratuitos com acompanhamento pedagógico e lanche solidário após cada sessão de treino.',
    requirements: 'Boletim escolar atualizado, atestado médico de aptidão física e autorização assinada pelos pais.'
  },
  {
    id: 'proj-3',
    title: 'Jiu-Jitsu Solidário Igreja Betel',
    sport: 'Jiu-Jitsu',
    neighborhood: 'Madureira',
    city: 'Rio de Janeiro - RJ',
    address: 'Estrada do Portela, 310 - Salão Social da Igreja Evangélica Betel',
    phone: '(21) 96543-2100',
    whatsapp: '5521965432100',
    organization: 'Igreja Evangélica Betel & Arte Suave',
    targetPublic: 'Jovens e Adultos (Masculino e Feminino)',
    schedule: 'Segundas, Quartas e Sextas: 20h00 às 21h30',
    price: 'Totalmente Gratuito',
    description: 'Projeto social focado no ensino do Jiu-Jitsu tradicional, condicionamento físico e valores morais para jovens da zona norte.',
    requirements: 'Traga roupa leve (camiseta e bermuda sem zíper) para aula experimental. Kimono gratuito fornecido conforme doações.'
  },
  {
    id: 'proj-4',
    title: 'Projeto Judô Caminho Suave',
    sport: 'Judô Comunitário',
    neighborhood: 'Campo Grande',
    city: 'Rio de Janeiro - RJ',
    address: 'Av. Cesário de Melo, 2150 - Centro Comunitário São José',
    phone: '(21) 99881-2233',
    whatsapp: '5521998812233',
    organization: 'Paróquia São José & Federação de Judô',
    targetPublic: 'Crianças e Adolescentes de 6 a 17 anos',
    schedule: 'Terças e Quintas: 18h00 às 19h30 | Sábados: 10h00 às 12h00',
    price: 'Totalmente Gratuito',
    description: 'Formação moral e física por meio do Judô Kodokan, com foco no desenvolvimento psicomotor e disciplina pessoal.',
    requirements: 'Apresentação de declaração de matrícula escolar e documento de identificação do responsável.'
  },
  {
    id: 'proj-5',
    title: 'Basquete Cidadão da Quebrada',
    sport: 'Basquete',
    neighborhood: 'Ceilândia',
    city: 'Brasília - DF',
    address: 'QNM 18 Conjunto C - Praça da Bíblia',
    phone: '(61) 98456-7788',
    whatsapp: '5561984567788',
    organization: 'Instituto Social Bola na Cesta',
    targetPublic: 'Jovens de 10 a 20 anos',
    schedule: 'Segundas, Terças e Quintas: 16h00 às 18h30',
    price: 'Totalmente Gratuito',
    description: 'Aulas práticas de basquete 3x3 e tradicional, palestras motivacionais e oficinas de reforço escolar.',
    requirements: 'Autorização dos pais e frequência mínima de 80% nos treinos e na escola.'
  },
  {
    id: 'proj-6',
    title: 'Natação e Hidroginástica para Todos',
    sport: 'Natação Comunitária',
    neighborhood: 'Vila Cruzeiro',
    city: 'Rio de Janeiro - RJ',
    address: 'Rua Nossa Senhora da Penha, 102 - Parque Aquático Comunitário',
    phone: '(21) 97321-6540',
    whatsapp: '5521973216540',
    organization: 'Associação de Moradores & Amigos do Esporte',
    targetPublic: 'Crianças (a partir de 5 anos), Adultos e Terceira Idade',
    schedule: 'Terças, Quintas e Sextas: 08h00 às 11h00 e 14h00 às 17h00',
    price: 'Totalmente Gratuito',
    description: 'Aulas de adaptação ao meio líquido, natação para jovens e hidroginástica para idosos.',
    requirements: 'Atestado dermatológico e cardiológico recente (fornecido em mutirão local).'
  }
];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({
    success: true,
    data: DEFAULT_PROJECTS,
    count: DEFAULT_PROJECTS.length
  });
}
