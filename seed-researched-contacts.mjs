import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import { config } from "dotenv";

config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse markdown to extract bios by contact name
function parseBios() {
  const mdPath = path.join(__dirname, "contact_profiles_summary.md");
  const content = fs.readFileSync(mdPath, "utf-8");
  const bios = {};

  // Extract each contact's bio section
  const sections = content.split("### ");
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const lines = section.split("\n");
    const nameMatch = lines[0].match(/^(.*?)$/);
    if (!nameMatch) continue;

    const name = nameMatch[1].trim();
    // Find the bio paragraph (usually starts with ">")
    const bioLine = lines.find((l) => l.startsWith(">"));
    if (bioLine) {
      bios[name] = bioLine.replace(/^>\s*/, "").trim();
    }
  }

  return bios;
}

// Extract country from location string
function extractCountry(location) {
  if (!location) return null;
  // Handle formats like "Bogotá, Colombia" or just "Colombia"
  const parts = location.split(",").map((p) => p.trim());
  return parts[parts.length - 1] || null;
}

async function seedContacts() {
  // Parse DATABASE_URL or use individual env vars
  let connection;
  if (process.env.DATABASE_URL) {
    connection = await mysql.createConnection(process.env.DATABASE_URL);
  } else {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "strategic_network",
    });
  }

  try {
    const csvPath = path.join(__dirname, "contacts_researched_final.csv");
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());

    const bios = parseBios();
    const EVENT_TAG = "Black Bull Investors Summit";

    let inserted = 0;
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV parsing (handles quoted fields)
      const values = [];
      let current = "";
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim().replace(/^"|"$/g, ""));
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^"|"$/g, ""));

      // Map CSV columns
      const data = {};
      headers.forEach((header, idx) => {
        data[header.trim()] = values[idx] || null;
      });

      const name = data["Name"];
      if (!name) {
        skipped++;
        continue;
      }

      // Get bio from markdown or use CSV bio
      const bio = bios[name] || data["Brief Bio"] || null;

      // Parse sectors (comma-separated)
      const sectors = data["Sector/Industry"]
        ?.split(",")
        .map((s) => s.trim())
        .join(", ");

      // Normalize confidence level
      const confidence = data["Confidence Level"]
        ?.toLowerCase()
        .replace(/\s+/g, "");

      // Extract country from entity or use default
      const country = "Colombia"; // All 37 are from Black Bull Summit in Bogotá

      // Prepare insert
      const sql = `
        INSERT INTO contacts (
          name, role, organization, location, sector, confidence,
          email, phone, linkedinUrl, companyDomain, companyDescription,
          notes, event, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const values_insert = [
        name,
        data["Verified Role"] || null,
        data["Verified Company"] || null,
        country,
        sectors || null,
        confidence || null,
        data["Email Pattern"] !== "Not Available" ? data["Email Pattern"] : null,
        data["Phone"] !== "Not Available" ? data["Phone"] : null,
        data["LinkedIn URL"] !== "Not Found" ? data["LinkedIn URL"] : null,
        data["Company Domain"] !== "N/A" ? data["Company Domain"] : null,
        data["Company Description"] || null,
        bio || null,
        EVENT_TAG,
      ];

      try {
        await connection.execute(sql, values_insert);
        inserted++;
        console.log(`✓ Inserted: ${name}`);
      } catch (err) {
        console.error(`✗ Failed to insert ${name}:`, err.message);
        skipped++;
      }
    }

    console.log(`\n✓ Seed complete: ${inserted} inserted, ${skipped} skipped`);
  } finally {
    await connection.end();
  }
}

seedContacts().catch(console.error);
