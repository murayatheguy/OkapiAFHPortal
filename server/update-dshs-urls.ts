import { db } from "./db";
import { facilities } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";

async function updateDshsUrls() {
  console.log("Updating DSHS report URLs for existing facilities...");
  
  const filePath = "attached_assets/AFListing_(1)_1764743659064.xls";
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n');
  
  console.log(`Found ${lines.length} lines in file`);
  
  const header = lines[0].split('\t');
  const colIndex: Record<string, number> = {};
  header.forEach((col, idx) => {
    colIndex[col.trim()] = idx;
  });
  
  let updated = 0;
  let notFound = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const cols = line.split('\t');
    
    try {
      const licenseNumber = cols[colIndex['LicenseNumber']]?.trim();
      const reportsLocation = cols[colIndex['Reports Location']]?.trim();
      
      if (!licenseNumber || !reportsLocation) continue;
      
      const result = await db
        .update(facilities)
        .set({ dshsReportUrl: reportsLocation })
        .where(eq(facilities.licenseNumber, licenseNumber))
        .returning({ id: facilities.id });
      
      if (result.length > 0) {
        updated++;
      } else {
        notFound++;
      }
      
      if (updated % 100 === 0 && updated > 0) {
        console.log(`Updated ${updated} facilities...`);
      }
    } catch (err) {
      console.error(`Error on line ${i}: ${err}`);
    }
  }
  
  console.log(`\nUpdate complete!`);
  console.log(`Facilities updated: ${updated}`);
  console.log(`Not found: ${notFound}`);
}

updateDshsUrls().catch(console.error);
