import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const contacts = [
  { name: "Alejandro Restrepo", role: "Managing Partner", organization: "Bogotá Ventures", location: "Bogotá, Colombia", group_name: "Colombian VC", tier: "Tier 1", email: "arestrepo@bogotaventures.co", phone: "+57 310 555 0101" },
  { name: "Camila Herrera", role: "Investment Director", organization: "Andes Capital", location: "Medellín, Colombia", group_name: "Colombian VC", tier: "Tier 1", email: "cherrera@andescapital.co", phone: "+57 311 555 0102" },
  { name: "Santiago Morales", role: "General Partner", organization: "Pacific Fund", location: "Cali, Colombia", group_name: "Colombian VC", tier: "Tier 2", email: "smorales@pacificfund.co", phone: "+57 312 555 0103" },
  { name: "Valentina Ospina", role: "Principal", organization: "Emerald Investments", location: "Bogotá, Colombia", group_name: "Colombian VC", tier: "Tier 1", email: "vospina@emeraldinv.co", phone: "+57 313 555 0104" },
  { name: "Felipe Arango", role: "Venture Partner", organization: "Café Ventures", location: "Bogotá, Colombia", group_name: "Colombian VC", tier: "Tier 2", email: "farango@cafeventures.co", phone: "+57 314 555 0105" },
  { name: "James Mitchell", role: "Senior Partner", organization: "Meridian Capital", location: "New York, United States", group_name: "US Investors", tier: "Tier 1", email: "jmitchell@meridiancap.com", phone: "+1 212 555 0201" },
  { name: "Sarah Chen", role: "Managing Director", organization: "Pacific Bridge Ventures", location: "San Francisco, United States", group_name: "US Investors", tier: "Tier 1", email: "schen@pacificbridge.vc", phone: "+1 415 555 0202" },
  { name: "Michael Torres", role: "Partner", organization: "Latitude Capital", location: "Miami, United States", group_name: "US Investors", tier: "Tier 1", email: "mtorres@latitudecap.com", phone: "+1 305 555 0203" },
  { name: "Emily Rodriguez", role: "VP of Investments", organization: "Sunbelt Ventures", location: "Austin, United States", group_name: "US Investors", tier: "Tier 2", email: "erodriguez@sunbeltvc.com", phone: "+1 512 555 0204" },
  { name: "David Park", role: "Investment Analyst", organization: "Crossroads Fund", location: "Chicago, United States", group_name: "US Investors", tier: "Tier 3", email: "dpark@crossroadsfund.com", phone: "+1 312 555 0205" },
  { name: "Oliver Whitfield", role: "Managing Partner", organization: "Thames Capital", location: "London, United Kingdom", group_name: "European Network", tier: "Tier 1", email: "owhitfield@thamescap.co.uk", phone: "+44 20 5555 0301" },
  { name: "Charlotte Beaumont", role: "Director", organization: "Crown Ventures", location: "London, United Kingdom", group_name: "European Network", tier: "Tier 2", email: "cbeaumont@crownvc.co.uk", phone: "+44 20 5555 0302" },
  { name: "Hans Mueller", role: "Partner", organization: "Rhine Investments", location: "Frankfurt, Germany", group_name: "European Network", tier: "Tier 2", email: "hmueller@rhineinv.de", phone: "+49 69 5555 0303" },
  { name: "Sophie Laurent", role: "Investment Manager", organization: "Seine Capital", location: "Paris, France", group_name: "European Network", tier: "Tier 2", email: "slaurent@seinecap.fr", phone: "+33 1 5555 0304" },
  { name: "Carlos Mendoza", role: "General Partner", organization: "Aztec Ventures", location: "Mexico City, Mexico", group_name: "LATAM Network", tier: "Tier 1", email: "cmendoza@aztecvc.mx", phone: "+52 55 5555 0401" },
  { name: "María Fernanda López", role: "Managing Director", organization: "Condor Capital", location: "Mexico City, Mexico", group_name: "LATAM Network", tier: "Tier 2", email: "mflopez@condorcap.mx", phone: "+52 55 5555 0402" },
  { name: "Roberto Silva", role: "Partner", organization: "Quito Fund", location: "Quito, Ecuador", group_name: "LATAM Network", tier: "Tier 2", email: "rsilva@quitofund.ec", phone: "+593 2 555 0403" },
  { name: "Ana Lucía Vargas", role: "Investment Director", organization: "Lima Ventures", location: "Lima, Peru", group_name: "LATAM Network", tier: "Tier 2", email: "alvargas@limavc.pe", phone: "+51 1 555 0404" },
  { name: "Ricardo Castillo", role: "Principal", organization: "Canal Capital", location: "Panama City, Panama", group_name: "LATAM Network", tier: "Tier 3", email: "rcastillo@canalcap.pa", phone: "+507 555 0405" },
  { name: "Ahmed Al-Rashid", role: "Managing Partner", organization: "Gulf Ventures", location: "Dubai, UAE", group_name: "Middle East", tier: "Tier 1", email: "aalrashid@gulfvc.ae", phone: "+971 4 555 0501" },
  { name: "Fatima Hassan", role: "Director of Strategy", organization: "Oasis Capital", location: "Abu Dhabi, UAE", group_name: "Middle East", tier: "Tier 2", email: "fhassan@oasiscap.ae", phone: "+971 2 555 0502" },
  { name: "Khalid Mansour", role: "Investment Partner", organization: "Desert Bridge Fund", location: "Dubai, UAE", group_name: "Middle East", tier: "Tier 1", email: "kmansour@desertbridge.ae", phone: "+971 4 555 0503" },
  { name: "Jean-Pierre Dubois", role: "Senior Advisor", organization: "Alpine Investments", location: "Geneva, Netherlands", group_name: "European Network", tier: "Tier 3", email: "jpdubois@alpineinv.ch", phone: "+41 22 555 0601" },
  { name: "Isabella Martínez", role: "Fund Manager", organization: "Caribbean Ventures", location: "San Juan, Puerto Rico", group_name: "Caribbean", tier: "Tier 2", email: "imartinez@caribbeanvc.pr", phone: "+1 787 555 0701" },
  { name: "Luis Enrique Pérez", role: "Partner", organization: "Isla Capital", location: "San Juan, Puerto Rico", group_name: "Caribbean", tier: "Tier 3", email: "leperez@islacap.pr", phone: "+1 787 555 0702" },
  { name: "Margaret Thompson", role: "Managing Director", organization: "Northern Star Fund", location: "Toronto, Canada", group_name: "Canadian Network", tier: "Tier 1", email: "mthompson@northernstar.ca", phone: "+1 416 555 0801" },
  { name: "Pierre Tremblay", role: "Partner", organization: "Maple Ventures", location: "Montreal, Canada", group_name: "Canadian Network", tier: "Tier 2", email: "ptremblay@maplevc.ca", phone: "+1 514 555 0802" },
  { name: "Antonio García", role: "Investment Director", organization: "Iberian Capital", location: "Madrid, Spain", group_name: "European Network", tier: "Tier 2", email: "agarcia@iberiancap.es", phone: "+34 91 555 0901" },
  { name: "Elena Petrova", role: "Senior Analyst", organization: "Volga Fund", location: "Amsterdam, Netherlands", group_name: "European Network", tier: "Tier 3", email: "epetrova@volgafund.nl", phone: "+31 20 555 1001" },
  { name: "Daniel Herrera", role: "Co-Founder", organization: "Altiplano Tech", location: "Bogotá, Colombia", group_name: "Colombian VC", tier: "Tier 2", email: "dherrera@altiplanotech.co", phone: "+57 315 555 1101" },
  { name: "Patricia Guzmán", role: "Chief Investment Officer", organization: "Cordillera Partners", location: "Bogotá, Colombia", group_name: "Colombian VC", tier: "Tier 1", email: "pguzman@cordillerapartners.co", phone: "+57 316 555 1102" },
  { name: "Robert Williams", role: "Venture Partner", organization: "Atlantic Bridge", location: "Boston, United States", group_name: "US Investors", tier: "Tier 2", email: "rwilliams@atlanticbridge.com", phone: "+1 617 555 1201" },
  { name: "Jennifer Kim", role: "Principal", organization: "West Coast Capital", location: "Los Angeles, United States", group_name: "US Investors", tier: "Tier 2", email: "jkim@westcoastcap.com", phone: "+1 310 555 1202" },
  { name: "Marco Rossi", role: "Fund Manager", organization: "Mediterranean Ventures", location: "Barcelona, Spain", group_name: "European Network", tier: "Tier 3", email: "mrossi@medvc.es", phone: "+34 93 555 1301" },
  { name: "Andrés Mejía", role: "Analyst", organization: "Caribe Fund", location: "Cartagena, Colombia", group_name: "Colombian VC", tier: "Tier 3", email: "amejia@caribefund.co", phone: "+57 317 555 1401" },
];

async function seed() {
  const conn = await mysql.createConnection(DATABASE_URL);
  console.log("Connected to database. Seeding contacts...");
  
  const [rows] = await conn.execute("SELECT COUNT(*) as cnt FROM contacts");
  const count = rows[0]?.cnt || 0;
  
  if (Number(count) > 0) {
    console.log(`Already have ${count} contacts, skipping seed.`);
    await conn.end();
    process.exit(0);
  }

  for (const c of contacts) {
    await conn.execute(
      "INSERT INTO contacts (name, role, organization, location, group_name, tier, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [c.name, c.role, c.organization, c.location, c.group_name, c.tier, c.email, c.phone]
    );
  }
  
  console.log(`Seeded ${contacts.length} contacts successfully!`);
  await conn.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
