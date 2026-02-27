// ============================================================
// DESIGN: Intelligence Dossier — All 35 contacts consolidated
// ============================================================

export type ContactGroup = "general" | "business-card" | "colombian-vc";

export type TierLevel = 1 | 2 | 3 | null;

export interface CareerEntry {
  role: string;
  organization: string;
  dates?: string;
}

export interface Achievement {
  title: string;
  detail: string;
}

export interface Contact {
  id: number;
  name: string;
  group: ContactGroup;
  role: string;
  organization: string;
  location?: string;
  linkedin?: string;
  email?: string;
  phone?: string;
  cell?: string;
  website?: string;
  notes?: string;
  photo?: string;
  tier?: TierLevel;
  tierRating?: {
    access?: string;
    accessDetail?: string;
    history?: string;
    historyDetail?: string;
    relationships?: string;
    relationshipsDetail?: string;
  };
  keyWins?: string;
  bio?: string;
  career?: CareerEntry[];
  achievements?: Achievement[];
  education?: string;
  boardMemberships?: string[];
}

export const CONTACTS: Contact[] = [
  // ============================================================
  // GROUP 1: GENERAL CONTACTS (1-21)
  // ============================================================
  {
    id: 1,
    name: "Daniel Silva FO",
    group: "general",
    role: "Family Office Principal",
    organization: "Inversiones Leon Violeta",
    location: "Colombia",
    linkedin: "https://co.linkedin.com/in/danielsilva355",
    notes: "Family office in Colombia",
  },
  {
    id: 2,
    name: "TCF CAPITAL",
    group: "general",
    role: "Investment Banking & Corporate Finance",
    organization: "TCF Capital Group",
    location: "Colombia",
    linkedin: "https://co.linkedin.com/company/tcfcapitalgroup",
    notes: "Investment banking & corporate finance firm in Colombia",
  },
  {
    id: 3,
    name: "Juana Téllez",
    group: "general",
    role: "Chief Economist Colombia",
    organization: "BBVA Research",
    location: "Colombia",
    linkedin: "https://co.linkedin.com/in/juana-tellez-4a519b37",
    bio: "Chief Economist for Colombia at BBVA Research, one of the leading economic research institutions in Latin America. Provides macroeconomic analysis and forecasts for the Colombian market.",
  },
  {
    id: 4,
    name: "Arcesio de Jesus Velez",
    group: "general",
    role: "Finance & Real Estate",
    organization: "Vélez Constructora Inmobiliaria",
    location: "Colombia",
    linkedin: "https://co.linkedin.com/in/arcesio-velez-36042755",
    phone: "+57 300 4110131",
  },
  {
    id: 5,
    name: "Santiago RC",
    group: "general",
    role: "Contact",
    organization: "—",
    notes: "Insufficient context to confirm match",
  },
  {
    id: 6,
    name: "Byrman Riveros",
    group: "general",
    role: "Contact",
    organization: "Kowu (possible)",
    location: "Colombia",
    notes: "Possibly associated with Colombian company Kowu",
  },
  {
    id: 7,
    name: "Mabel Delgadillo",
    group: "general",
    role: "Associate Partner",
    organization: "Norfolk FG",
    notes: "LinkedIn link broken; Associate Partner at Norfolk FG",
  },
  {
    id: 8,
    name: "Roberto Andres Calderon",
    group: "general",
    role: "Real Estate Developer",
    organization: "Independent",
    location: "Colombia",
    linkedin: "https://www.linkedin.com/in/racamandaca",
  },
  {
    id: 9,
    name: "Ana Belén Salas",
    group: "general",
    role: "Investment Professional",
    organization: "Nobis Holding de Inversiones",
    location: "Ecuador",
    linkedin: "https://ec.linkedin.com/in/anitabelens",
  },
  {
    id: 10,
    name: "Isabella Muñoz",
    group: "general",
    role: "General Manager, Free Trade Zone Developer",
    organization: "Grupo ZFB",
    location: "Bogotá D.C., Colombia",
    linkedin: "https://co.linkedin.com/in/isamunozm",
    photo: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029992019/cVMuCcQ54nJHNk4TDe3BMH/isabella-munoz_fd1baf6a.jpg",
    bio: "Isabella is the General Manager of Free Trade Zone Developer at ZFB Group. Previously, she served as the Executive Director of Invest in Bogotá, the city's investment promotion agency — a public-private partnership between the Bogotá Chamber of Commerce and the Bogotá City Government. A key figure in the development of Colombia's private equity industry since 2008, Isabella was a partner at MAS Equity Partners, a pioneering private equity fund. She drives sustainable growth in LatAm across investments, trade, real estate, data centers, entrepreneurship, transformation, strategy & innovation.",
    career: [
      { role: "General Manager, Free Trade Zone Developer", organization: "Grupo ZFB" },
      { role: "Executive Director", organization: "Invest in Bogotá" },
      { role: "Partner", organization: "MAS Equity Partners" },
    ],
    achievements: [
      { title: "Grupo ZFB Leadership", detail: "Leading free trade zone development operations in Bogotá" },
      { title: "Invest in Bogotá", detail: "Directed the city's investment promotion agency, a public-private partnership" },
      { title: "Private Equity Pioneer", detail: "Partner at MAS Equity Partners since 2008, one of Colombia's pioneering PE funds" },
    ],
  },
  {
    id: 11,
    name: "Danni Martinez",
    group: "general",
    role: "Contact",
    organization: "Rootstock",
    notes: "Associated with Rootstock",
  },
  {
    id: 12,
    name: "Lorena Torrente",
    group: "general",
    role: "Finance Professional",
    organization: "—",
    notes: "Finance professional",
  },
  {
    id: 13,
    name: "Pablo Cuervo",
    group: "general",
    role: "Financial Management Specialist",
    organization: "Independent",
    location: "Colombia",
    linkedin: "https://co.linkedin.com/in/pablo-cuervo-796574ba",
  },
  {
    id: 14,
    name: "Santiago Rojas",
    group: "general",
    role: "Co-founder",
    organization: "Cube Ventures & Meridian75",
    location: "Colombia",
    linkedin: "https://www.linkedin.com/in/santiagorojasmontoya/",
    bio: "Co-founder of Cube Ventures and Meridian75, active in the Colombian venture capital and startup ecosystem.",
  },
  {
    id: 15,
    name: "Pipe Cano",
    group: "general",
    role: "Co-Founder",
    organization: "LinkU Ventures",
    location: "Colombia",
    linkedin: "https://co.linkedin.com/in/felipecanom",
    bio: "Co-Founder of LinkU Ventures, a venture capital firm operating in the Colombian startup ecosystem.",
  },
  {
    id: 16,
    name: "Leonardo Borrero",
    group: "general",
    role: "Executive Director & Angel Investor",
    organization: "Constructora Normandia",
    location: "Cali, Colombia",
    linkedin: "https://www.linkedin.com/in/leonardoborrero/",
    bio: "Executive Director of Constructora Normandia and active angel investor based in Cali, Colombia.",
  },
  {
    id: 17,
    name: "Eugenio De La Torre",
    group: "general",
    role: "Co-founder & Managing Director",
    organization: "KLIDE Group",
    location: "Bogotá / Miami",
    linkedin: "https://co.linkedin.com/in/yuyidelatorre",
    phone: "+1 (305) 794-5464",
    email: "edelatorre@klide.co",
    bio: "Co-founder and Managing Director of KLIDE Group, operating across Bogotá and Miami.",
  },
  {
    id: 18,
    name: "Carlos Alvarado",
    group: "general",
    role: "Contact",
    organization: "—",
    phone: "+57 310 5815149",
  },
  {
    id: 19,
    name: "Luis H. Corzo",
    group: "general",
    role: "Managing Director / Advisor",
    organization: "Findeca Family Office / 30N Venture Capital",
    bio: "Managing Director at Findeca Family Office and Advisor at 30N Venture Capital.",
  },
  {
    id: 20,
    name: "Santiago Tamayo",
    group: "general",
    role: "CEO",
    organization: "Santa Maria Investment Group FO",
    location: "Colombia",
    linkedin: "https://co.linkedin.com/in/santiagotamayodaza-01",
    bio: "CEO of Santa Maria Investment Group, a family office operating in Colombia.",
  },
  {
    id: 21,
    name: "Gustavo Villota",
    group: "general",
    role: "Co-Founder & Director",
    organization: "Café San Alberto",
    location: "Colombia",
    linkedin: "https://www.linkedin.com/in/gustavo-villota-a42229",
    bio: "Co-Founder and Director of Café San Alberto, one of Colombia's most recognized specialty coffee brands.",
  },

  // ============================================================
  // GROUP 2: BUSINESS CARD CONTACTS (22-28)
  // ============================================================
  {
    id: 22,
    name: "Adrian Herrera M.",
    group: "business-card",
    role: "Attorney at Law & Certified Public Translator",
    organization: "PR Translation",
    location: "Panama City, Panama",
    email: "adrian@prtranslation.com",
    phone: "(507) 6141-3245",
    bio: "Attorney at Law based in Panama City, also serving as a Certified Public Translator. Provides legal and translation services for international business operations.",
  },
  {
    id: 23,
    name: "Julián Luna",
    group: "business-card",
    role: "Business Development Manager Americas",
    organization: "Londonde",
    location: "Bogotá, Colombia",
    phone: "+573142590969",
    email: "Julian.L@londonde.com",
    website: "www.londonde.com",
    bio: "Business Development Manager for the Americas at Londonde, based in Bogotá.",
  },
  {
    id: 24,
    name: "Daniel Echaiz Moreno",
    group: "business-card",
    role: "Partner (Socio)",
    organization: "Echaiz Consultores",
    location: "Lima, Peru",
    email: "daniel@echaiz.com",
    phone: "(51) 995 657 580 / (51) 2976892",
    website: "www.echaiz.com",
    notes: "Neither phone number is WhatsApp",
    bio: "Partner at Echaiz Consultores, a consulting firm based in Lima, Peru. Specializes in legal and business consulting for the Peruvian and Latin American markets.",
  },
  {
    id: 25,
    name: "Anuar Estefan",
    group: "business-card",
    role: "International Tax Attorney",
    organization: "Chamberlain Hrdlicka, Attorneys at Law",
    location: "San Antonio, Texas",
    phone: "+1 210.278.5838 (direct) / +1 210.253.8383 (office)",
    cell: "+1 619.917.2118",
    email: "anuar.estefan@chamberlainlaw.com",
    notes: "Licensed in California and Mexico, not in Texas",
    bio: "International Tax Attorney at Chamberlain Hrdlicka in San Antonio, Texas. Licensed in California and Mexico. Specializes in international taxation with a focus on cross-border transactions between the US and Latin America.",
  },
  {
    id: 26,
    name: "Luisa Angulo",
    group: "business-card",
    role: "Senior Consultant / CFO",
    organization: "Beyond Consulting",
    location: "USA",
    phone: "+1 408.464.3876",
    email: "langulo@beyondconsulting.net",
    website: "www.beyondconsulting.net",
    bio: "Senior Consultant and CFO at Beyond Consulting, providing financial advisory and consulting services.",
  },
  {
    id: 27,
    name: "Enrique Abel del Real González",
    group: "business-card",
    role: "Managing Director",
    organization: "DTA Capital",
    location: "Bogotá & Medellín, Colombia",
    phone: "+57 316 069 1005",
    email: "edelreal@dta-capital.com",
    website: "www.dta-capital.com",
    bio: "Managing Director of DTA Capital, operating across Bogotá and Medellín. Focused on capital markets and investment management in Colombia.",
  },
  {
    id: 28,
    name: "Ivanni Patino",
    group: "business-card",
    role: "Consultant",
    organization: "Advantage Bank",
    location: "San Juan, Puerto Rico",
    phone: "+1 (305) 904-9793",
    email: "i.patinoconsultant@advantagebank.pr",
    bio: "Consultant at Advantage Bank in San Juan, Puerto Rico. Provides banking and financial advisory services.",
  },

  // ============================================================
  // GROUP 3: COLOMBIAN MARKET — VC & FINANCIAL ECOSYSTEM (29-35)
  // ============================================================
  {
    id: 29,
    name: "Alejandro Arenas",
    group: "colombian-vc",
    role: "Senior Director, Investments",
    organization: "Community Investment Management (CIM)",
    location: "Bogotá, Colombia",
    linkedin: "https://co.linkedin.com/in/alejandro-arenas-50002b26",
    tier: 1,
    tierRating: {
      access: "Highest",
      accessDetail: "Sits at CIM, a US-based institutional private credit fund actively deploying into LatAm fintechs. Direct pipeline to structured debt capital for growth-stage companies.",
      history: "Deepest in VC",
      historyDetail: "Built Velum Inverlink from scratch — one of Colombia's first institutional VC funds. 18 portfolio companies over ~12 years. Transitioned from IB to VC to private credit, covering the full capital stack.",
      relationships: "Strongest",
      relationshipsDetail: "Career spans Inverlink (Colombia's #1 IB), Velum Ventures (acquired by Amplo), and now CIM. Connected to both traditional Colombian finance and the US institutional investor world.",
    },
    keyWins: "Merqueo (NASDAQ-listed), Fluvip ($4.5M Series A), Acsendo (acquired by Crehana), Finkargo ($75M credit facility + $20M Series A). He is the single most connected person to VC-friendly capital across all three entities.",
    bio: "Alejandro Arenas is a Senior Director on the Investment team at Community Investment Management (CIM), based in Bogotá, Colombia. His focus is on sourcing, executing, and managing investments, with a specialization in emerging markets. His career is marked by significant contributions to the Colombian venture capital ecosystem, notably as a leader in one of its pioneering funds. Prior to his current role, Mr. Arenas was the Managing Director and Partner at Velum Ventures (Velum Inverlink), which was one of Colombia's first venture capital funds. Before leading Velum, he served as a Vice President at Inverlink, where he was responsible for early-stage venture capital investments.",
    career: [
      { role: "Senior Director, Investments", organization: "Community Investment Management (CIM)" },
      { role: "Managing Director & Partner", organization: "Velum Ventures / Velum Inverlink" },
      { role: "Vice President", organization: "Inverlink" },
      { role: "Private Equity Associate, Latin America", organization: "Developing World Markets" },
      { role: "Private Bank Analyst", organization: "J.P. Morgan" },
      { role: "Investment Banking Analyst", organization: "Inverlink" },
    ],
    achievements: [
      { title: "Velum Ventures Leadership", detail: "Managed one of Colombia's first dedicated venture capital funds, later acquired by impact investment firm Amplo in January 2023" },
    ],
    education: "M.B.A., University of Cambridge Judge Business School; B.A. in Economics, Universidad de los Andes",
  },
  {
    id: 30,
    name: "Mauricio Saldarriaga",
    group: "colombian-vc",
    role: "Managing Partner",
    organization: "Inverlink",
    location: "Bogotá, Colombia",
    linkedin: "https://www.linkedin.com/in/mauricio-saldarriaga-573854",
    email: "mbohmer@inverlink.com",
    tier: 1,
    tierRating: {
      access: "Very High",
      accessDetail: "Leads Colombia's #4-ranked investment bank (TTR Data 2025). UBS partnership gives direct access to global institutional capital. Inverlink Alternative Investments manages private capital vehicles.",
      history: "40 years institutional",
      historyDetail: "280+ transactions. Inverlink incubated Velum (VC), partnered with Ashmore (infrastructure), created Visum Capital (real estate) with BTG Pactual, and launched a fintech investment vehicle with Liquitech.",
      relationships: "Elite Colombian network",
      relationshipsDetail: "Multi-decade relationships with Colombia's top business families (e.g., Helm Group). IMAP membership connects to 45+ countries. UBS relationship opens doors to ultra-high-net-worth and institutional capital globally.",
    },
    keyWins: "$180M Helm Bank USA sale to Credicorp, UBS collaboration, Ashmore infrastructure fund (largest in Colombia at the time), Visum Capital/BTG Pactual JV.",
    bio: "Mauricio Saldarriaga is the Managing Partner of Inverlink, an institution he has been with since 2002. Inverlink holds the distinction of being Colombia's first investment bank, founded in 1986, and has established itself as a leader in the Latin American market. With over 25 years of experience in investment banking across local and international arenas, Mr. Saldarriaga has a deep history of executing M&A, capital market, and project finance transactions. Before joining Inverlink, he worked at Salomon Smith Barney in their London and New York offices. His career began in the Bogotá offices of Deutsche Morgan Grenfell.",
    career: [
      { role: "Managing Partner", organization: "Inverlink", dates: "2002 – Present" },
      { role: "Investment Banker", organization: "Salomon Smith Barney (London & New York)" },
      { role: "Investment Banker", organization: "Deutsche Morgan Grenfell (Bogotá)" },
    ],
    achievements: [
      { title: "Helm Bank USA Sale", detail: "Co-led advisory for the $180 million sale to Credicorp (2025)" },
      { title: "UBS Strategic Alliance", detail: "Announced collaboration with UBS for investment banking services in Colombia, Central America, and the Caribbean (2020)" },
      { title: "EPM / CaribeMar Acquisition", detail: "Exclusive financial advisor to EPM in acquisition of energy provider CaribeMar (Afinia)" },
      { title: "TTR Data Ranking", detail: "Inverlink ranked #4 among financial advisors in Colombia by number of transactions (2025)" },
    ],
    education: "Career began at Deutsche Morgan Grenfell; advanced through Salomon Smith Barney internationally",
  },
  {
    id: 31,
    name: "Martha Juliana Silva",
    group: "colombian-vc",
    role: "Founder & President",
    organization: "SILK Banca de Inversión",
    location: "Bogotá, Colombia",
    linkedin: "https://co.linkedin.com/in/martha-juliana-silva-de-ricaurte-6a861328",
    email: "info@silkbancadeinversion.com",
    tier: 2,
    tierRating: {
      access: "High (cross-border)",
      accessDetail: "Relationships with 76+ PE firms in the US, Dubai, and Canada. Specializes in channeling foreign capital into Colombia. Managed $9B+ in trust assets and $3B+ in investment resources across her career.",
      history: "Deep institutional",
      historyDetail: "Former CEO of Fiduciaria de Bogotá and Leasing Bogotá. Former EVP of the Banking Association of Colombia. Designed fiduciary structures for major Colombian public entities. Participated in Ecopetrol, Isagen, and Grupo Aval equity issuances.",
      relationships: "International PE focus",
      relationshipsDetail: "Harvard Law + LSE credentials open doors globally. Board experience at Bolsa de Valores de Colombia, Banco AV Villas, Ecopetrol pension fund. $700M+ in closed deals in Silk's first 3 years.",
    },
    keyWins: "First PPP in Bogotá ($1.2B transportation project), Polish food company entry into Colombia, extensive PE firm network for cross-border deal flow.",
    bio: "Martha Juliana Silva is the Founder and President of SILK Banca de Inversión, a boutique investment bank she established in February 2010. She is a highly respected figure in the Colombian financial sector, with a distinguished career spanning investment banking, trust management, and corporate governance. Ms. Silva holds a remarkable academic background as a lawyer and economist from Universidad Javeriana, complemented by a Master of Laws (LL.M.) and studies in International Tax Policy from Harvard University, and studies in Business Administration in Globalized Economies at the London School of Economics.",
    career: [
      { role: "Founder & President", organization: "SILK Banca de Inversión" },
      { role: "Managing Partner", organization: "Strategy Minds" },
      { role: "President", organization: "Fiduciaria de Bogotá" },
      { role: "President", organization: "Leasing Bogotá" },
      { role: "International Consultant", organization: "Development Bank of Latin America (CAF) & United Nations" },
    ],
    achievements: [
      { title: "SILK Founder", detail: "Established a successful boutique investment bank in 2010, leading numerous acquisitions and strategic alliances" },
      { title: "Asset Management", detail: "Managed trust assets exceeding $9 billion and investment resources over $3 billion" },
      { title: "Fiduciary Structuring", detail: "Designed fiduciary structures for Colombia's most significant public trusts including FOSYGA, regional pension funds, and mass transit systems" },
      { title: "Major Equity Issuances", detail: "Participated in equity issuance processes for Ecopetrol, Isagen, and Grupo Aval" },
    ],
    education: "LL.M. & International Tax Policy, Harvard University; Business Administration in Globalized Economies, London School of Economics; Law & Economics, Universidad Javeriana",
    boardMemberships: [
      "Bolsa de Valores de Colombia (Colombian Stock Exchange)",
      "Bolsa de Valores de Bogotá (Bogotá Stock Exchange)",
      "Banco AV Villas",
      "Cámara Colombiana de la Construcción",
      "Asociación Bancaria de Colombia",
      "Asociación de Fiduciarias",
      "Universidad Iberoamericana",
    ],
  },
  {
    id: 32,
    name: "Santiago Ricaurte",
    group: "colombian-vc",
    role: "Partner & Co-founder",
    organization: "SILK Banca de Inversión / SILK Habitat",
    location: "Bogotá, Colombia",
    linkedin: "https://co.linkedin.com/in/santiago-ricaurte-silva-31251426",
    email: "sricaurte@silkbancadeinversion.com",
    tier: 2,
    tierRating: {
      access: "Moderate-High",
      accessDetail: "PE/VC experience plus real estate development through SILK Habitat. Harvard Business School network.",
      history: "Solid",
      historyDetail: "Background in private equity and venture capital before joining Silk. Co-founded the real estate arm, expanding Silk's footprint into alternative assets.",
      relationships: "Strong",
      relationshipsDetail: "HBS alumni network + Silk's international PE relationships. Bridge between real estate capital and financial advisory.",
    },
    bio: "Santiago Ricaurte Silva is a Partner at SILK Banca de Inversión and the Co-founder of SILK Habitat. He has extensive experience in private equity and venture capital, having managed the PE and VC division at SILK and participated in transactions valued at over $1 billion over the last decade. He is also the Head of Strategy at Strategy Minds, a firm focused on the education sector where he is also a founder and investor in related fintech companies.",
    career: [
      { role: "Partner & Co-founder", organization: "SILK Banca de Inversión" },
      { role: "Co-founder", organization: "SILK Habitat" },
      { role: "Head of Strategy", organization: "Strategy Minds" },
    ],
    achievements: [
      { title: "Co-founder of SILK", detail: "Co-founded both SILK Banca de Inversión and SILK Habitat" },
      { title: "Fintech & Education", detail: "Founder and investor in multiple fintech companies focused on the education sector" },
    ],
    education: "General Management Program (GMP), Harvard Business School (2017); Private Equity Masterclass, London Business School; B.A. Business Administration, Graceland University",
  },
  {
    id: 33,
    name: "Felipe Camacho",
    group: "colombian-vc",
    role: "Partner & Co-leader, Financial Services Group",
    organization: "Inverlink",
    location: "Bogotá, Colombia",
    linkedin: "https://co.linkedin.com/in/felipecamacho",
    tier: 2,
    tierRating: {
      access: "High",
      accessDetail: "Co-led the $180M Helm Bank USA / Credicorp deal. Direct access to Inverlink's full deal pipeline and UBS partnership.",
      history: "Strong in financial services M&A",
      historyDetail: "Specializes in financial services sector transactions — banks, insurance, fintech.",
      relationships: "Deep in Colombian financial sector",
      relationshipsDetail: "Works directly with bank shareholders, PE firms, and institutional investors on financial services deals.",
    },
    bio: "Felipe Camacho González is a Partner at Inverlink and the co-leader of the firm's Financial Services Group. He joined Inverlink in March 2010 and has over 16 years of experience in investment banking, specializing in Mergers & Acquisitions (M&A), Project Finance, and private placements. Mr. Camacho has led transactions exceeding a total value of $4 billion. His expertise also extends to the real estate sector.",
    career: [
      { role: "Partner & Co-leader, Financial Services Group", organization: "Inverlink", dates: "2010 – Present" },
      { role: "Director", organization: "Inverlink Estructuras Inmobiliarias" },
    ],
    achievements: [
      { title: "Helm Bank USA Sale", detail: "Pivotal role in advising shareholders on the $180 million sale to Credicorp (2025)" },
      { title: "Omni Structured Finance", detail: "Led advisory team for Omni in securing a $100 million structured finance facility" },
      { title: "$4B+ Transaction Volume", detail: "Led transactions exceeding $4 billion in total value" },
    ],
  },
  {
    id: 34,
    name: "Claudia Robledo",
    group: "colombian-vc",
    role: "Managing Director, North America",
    organization: "Inverlink",
    location: "Miami, USA",
    linkedin: "https://www.linkedin.com/in/claudia-robledo-investment-management",
    tier: 3,
    tierRating: {
      access: "Moderate-High",
      accessDetail: "US-based; manages Inverlink's North American relationships. Key liaison for cross-border deals and US institutional investors.",
      history: "Specialized",
      historyDetail: "Focused on connecting US capital with Colombian opportunities.",
      relationships: "US-Colombia bridge",
      relationshipsDetail: "Miami-based, positioned at the intersection of US and LatAm capital flows.",
    },
    bio: "Claudia Robledo Arias is the Managing Director for North America at Inverlink, based in Miami. She was appointed in April 2025 to establish a regional office and strengthen the firm's presence and impact within the real estate industry across North America and Latin America. With over 25 years of international experience in the real estate sector across Europe, the United States, and Latin America, Ms. Robledo has a proven track record of leadership and value creation. She has structured and executed over $2 billion in transactions throughout her career.",
    career: [
      { role: "Managing Director, North America", organization: "Inverlink" },
      { role: "Leadership Roles", organization: "Macquarie Asset Management, CBRE, Grupo Bancolombia" },
    ],
    achievements: [
      { title: "$2B+ Transactions", detail: "Structured and executed over $2 billion in real estate transactions" },
      { title: "Academic Engagement", detail: "Speaker at University of Miami Real Estate Impact Conference" },
    ],
    education: "Architecture, Pontificia Universidad Javeriana; MBA & Master's in Project Management, Universidad Politécnica de Madrid; PDD, IESE Business School; Executive programs, NYU",
  },
  {
    id: 35,
    name: "Carlos Cortés",
    group: "colombian-vc",
    role: "Fund Manager / Director of Investments",
    organization: "Inverlink Alternative Investments",
    location: "Bogotá, Colombia",
    linkedin: "https://co.linkedin.com/in/carlos-cortes-a78aa2147",
    tier: 3,
    tierRating: {
      access: "Moderate",
      accessDetail: "Manages Inverlink's alternative investment vehicles including the Liquitech e-invoice fund (12-14.5% projected returns).",
      history: "Alternative assets specialist",
      historyDetail: "Oversees private capital fund structuring and distribution.",
      relationships: "Fintech-adjacent",
      relationshipsDetail: "Direct connection to Liquitech and the emerging Colombian fintech lending ecosystem.",
    },
    bio: "Carlos Cortés is a Fund Manager and Director of Investments at Inverlink Alternative Investments, the fund management arm of Inverlink. He has over 23 years of experience in the capital markets of Colombia and the Andean region. His expertise is central to the management of Inverlink's private equity funds and alternative asset strategies.",
    career: [
      { role: "Fund Manager / Director of Investments", organization: "Inverlink Alternative Investments" },
      { role: "Previous Roles", organization: "Tinello Capital, BTG Pactual, Black River Asset Management" },
    ],
    achievements: [
      { title: "Liquitech E-Invoice Vehicle", detail: "Manages investment vehicle launched with Liquitech targeting 12-14.5% net annual returns for institutional investors (2025)" },
      { title: "Alternative Assets Pioneer", detail: "Part of team managing Inverlink's alternative asset division, including Colombia's first Real Estate PE fund (2007)" },
    ],
    education: "Business Administration, CESA; Economics, University of Western Sydney",
  },
];

export const GROUP_LABELS: Record<ContactGroup, string> = {
  general: "General Contacts",
  "business-card": "Business Card Contacts",
  "colombian-vc": "Colombian Market — VC & Financial Ecosystem",
};

export const GROUP_DESCRIPTIONS: Record<ContactGroup, string> = {
  general: "Strategic contacts across family offices, venture capital, real estate, and financial services in Latin America.",
  "business-card": "Direct business card contacts with verified contact information across legal, consulting, and financial services.",
  "colombian-vc": "Key decision makers in Colombia's venture capital and financial ecosystem, ranked by capital access, track record, and network strength.",
};

export function getContactsByGroup(group: ContactGroup): Contact[] {
  return CONTACTS.filter((c) => c.group === group);
}

export function getContactById(id: number): Contact | undefined {
  return CONTACTS.find((c) => c.id === id);
}

export function getTierLabel(tier: TierLevel): string {
  switch (tier) {
    case 1: return "TIER 1 — HIGHEST IMPACT";
    case 2: return "TIER 2 — HIGH IMPACT";
    case 3: return "TIER 3 — SUPPORTING";
    default: return "";
  }
}
