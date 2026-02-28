import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SELECT id, name, role, organization, location, email, linkedinUrl, sector, event, confidence FROM contacts ORDER BY name');
for (const r of rows) {
  console.log(`${r.id}\t${r.name}\t${r.role}\t${r.organization}\t${r.location}\t${r.email || ''}\t${r.linkedinUrl || ''}\t${r.sector || ''}\t${r.event || ''}\t${r.confidence || ''}`);
}
await conn.end();
