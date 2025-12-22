import "dotenv/config";
import { db } from "../server/db";
import { facilities, owners, teamMembers, residents, credentials } from "../shared/schema";
import * as fs from "fs";
import * as path from "path";

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "backups");

  // Create backups directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log("Created backups directory");
  }

  console.log("\n=== Database Backup ===");
  console.log(`Timestamp: ${timestamp}\n`);

  // Backup facilities
  const allFacilities = await db.select().from(facilities);
  const facilitiesPath = path.join(backupDir, `facilities-${timestamp}.json`);
  fs.writeFileSync(facilitiesPath, JSON.stringify(allFacilities, null, 2));
  console.log(`Facilities: ${allFacilities.length} records -> ${path.basename(facilitiesPath)}`);

  // Backup owners
  const allOwners = await db.select().from(owners);
  const ownersPath = path.join(backupDir, `owners-${timestamp}.json`);
  fs.writeFileSync(ownersPath, JSON.stringify(allOwners, null, 2));
  console.log(`Owners: ${allOwners.length} records -> ${path.basename(ownersPath)}`);

  // Backup team members
  const allTeamMembers = await db.select().from(teamMembers);
  const teamMembersPath = path.join(backupDir, `team-members-${timestamp}.json`);
  fs.writeFileSync(teamMembersPath, JSON.stringify(allTeamMembers, null, 2));
  console.log(`Team Members: ${allTeamMembers.length} records -> ${path.basename(teamMembersPath)}`);

  // Backup residents
  const allResidents = await db.select().from(residents);
  const residentsPath = path.join(backupDir, `residents-${timestamp}.json`);
  fs.writeFileSync(residentsPath, JSON.stringify(allResidents, null, 2));
  console.log(`Residents: ${allResidents.length} records -> ${path.basename(residentsPath)}`);

  // Backup credentials
  const allCredentials = await db.select().from(credentials);
  const credentialsPath = path.join(backupDir, `credentials-${timestamp}.json`);
  fs.writeFileSync(credentialsPath, JSON.stringify(allCredentials, null, 2));
  console.log(`Credentials: ${allCredentials.length} records -> ${path.basename(credentialsPath)}`);

  // Summary
  console.log("\n=== Backup Complete ===");
  console.log(`Total records backed up: ${allFacilities.length + allOwners.length + allTeamMembers.length + allResidents.length + allCredentials.length}`);
  console.log(`Backup location: ${backupDir}`);

  process.exit(0);
}

backupDatabase().catch((err) => {
  console.error("Backup failed:", err);
  process.exit(1);
});
