import { config } from "dotenv";
import { Pool } from "@neondatabase/serverless";

config(); // Load .env file

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    // Check if facility_id column exists
    const checkResult = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'credentials' AND column_name = 'facility_id'
    `);

    if (checkResult.rows.length === 0) {
      console.log("Adding facility_id column to credentials table...");
      await client.query("ALTER TABLE credentials ADD COLUMN facility_id VARCHAR");
      console.log("Added facility_id column");
    } else {
      console.log("facility_id column already exists");
    }

    // Check for credential_type column
    const checkType = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'credentials' AND column_name = 'credential_type'
    `);

    if (checkType.rows.length === 0) {
      console.log("Adding credential_type column...");
      await client.query("ALTER TABLE credentials ADD COLUMN credential_type TEXT");
      console.log("Added credential_type column");
    } else {
      console.log("credential_type column already exists");
    }

    // Check for credential_number column
    const checkNum = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'credentials' AND column_name = 'credential_number'
    `);

    if (checkNum.rows.length === 0) {
      console.log("Adding credential_number column...");
      await client.query("ALTER TABLE credentials ADD COLUMN credential_number TEXT");
      console.log("Added credential_number column");
    } else {
      console.log("credential_number column already exists");
    }

    // Check for issuing_authority column
    const checkAuth = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'credentials' AND column_name = 'issuing_authority'
    `);

    if (checkAuth.rows.length === 0) {
      console.log("Adding issuing_authority column...");
      await client.query("ALTER TABLE credentials ADD COLUMN issuing_authority TEXT");
      console.log("Added issuing_authority column");
    } else {
      console.log("issuing_authority column already exists");
    }

    // Check for issue_date column
    const checkIssue = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'credentials' AND column_name = 'issue_date'
    `);

    if (checkIssue.rows.length === 0) {
      console.log("Adding issue_date column...");
      await client.query("ALTER TABLE credentials ADD COLUMN issue_date DATE");
      console.log("Added issue_date column");
    } else {
      console.log("issue_date column already exists");
    }

    // Check for notes column
    const checkNotes = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'credentials' AND column_name = 'notes'
    `);

    if (checkNotes.rows.length === 0) {
      console.log("Adding notes column...");
      await client.query("ALTER TABLE credentials ADD COLUMN notes TEXT");
      console.log("Added notes column");
    } else {
      console.log("notes column already exists");
    }

    // Check for document_url column
    const checkDoc = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'credentials' AND column_name = 'document_url'
    `);

    if (checkDoc.rows.length === 0) {
      console.log("Adding document_url column...");
      await client.query("ALTER TABLE credentials ADD COLUMN document_url TEXT");
      console.log("Added document_url column");
    } else {
      console.log("document_url column already exists");
    }

    // Check for expiration_date column
    const checkExpDate = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'credentials' AND column_name = 'expiration_date'
    `);

    if (checkExpDate.rows.length === 0) {
      console.log("Adding expiration_date column...");
      await client.query("ALTER TABLE credentials ADD COLUMN expiration_date DATE");
      console.log("Added expiration_date column");
    } else {
      console.log("expiration_date column already exists");
    }

    // Check for created_at column
    const checkCreatedAt = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'credentials' AND column_name = 'created_at'
    `);

    if (checkCreatedAt.rows.length === 0) {
      console.log("Adding created_at column...");
      await client.query("ALTER TABLE credentials ADD COLUMN created_at TIMESTAMP DEFAULT NOW()");
      console.log("Added created_at column");
    } else {
      console.log("created_at column already exists");
    }

    // Check for updated_at column
    const checkUpdatedAt = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'credentials' AND column_name = 'updated_at'
    `);

    if (checkUpdatedAt.rows.length === 0) {
      console.log("Adding updated_at column...");
      await client.query("ALTER TABLE credentials ADD COLUMN updated_at TIMESTAMP DEFAULT NOW()");
      console.log("Added updated_at column");
    } else {
      console.log("updated_at column already exists");
    }

    console.log("Migration complete!");
  } catch (err: any) {
    console.error("Migration failed:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
