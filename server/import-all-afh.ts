import { db } from "./db";
import { facilities, reviews, inquiries } from "@shared/schema";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const UNSPLASH_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600573472591-ee6981cf35b6?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600566752547-33a300e65718?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600210491892-ed7f4a455770?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600047508788-786f3865b4b9?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&auto=format&fit=crop&q=80",
];

const getImagesForIndex = (index: number, count: number = 4): string[] => {
  const images: string[] = [];
  for (let i = 0; i < count; i++) {
    images.push(UNSPLASH_IMAGES[(index + i) % UNSPLASH_IMAGES.length]);
  }
  return images;
};

const slugify = (text: string): string => {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 100);
};

const cleanName = (name: string): string => {
  return name.replace(/^[#*\s]+/, '').replace(/\s+/g, ' ').trim();
};

const parseSpecialties = (specialtyStr: string): string[] => {
  if (!specialtyStr) return [];
  return specialtyStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
};

const parseContracts = (contractStr: string): string[] => {
  if (!contractStr) return [];
  return contractStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
};

const generateDescription = (name: string, city: string, specialties: string[], contracts: string[]): string => {
  const hasDD = specialties.some(s => s.toLowerCase().includes('developmental'));
  const hasMH = specialties.some(s => s.toLowerCase().includes('mental'));
  const hasDementia = specialties.some(s => s.toLowerCase().includes('dementia'));
  const hasSpecializedBehavior = contracts.some(c => c.toLowerCase().includes('behavior'));
  const hasNursing = contracts.some(c => c.toLowerCase().includes('nursing'));
  
  let description = `${cleanName(name)} is a licensed Adult Family Home in ${city}, Washington, providing compassionate care in a home-like setting. `;
  
  if (hasDementia && hasMH) {
    description += "Our experienced caregivers specialize in memory care and mental health support, creating a safe and nurturing environment. ";
  } else if (hasDementia) {
    description += "We specialize in memory care, providing specialized support for residents with dementia. ";
  } else if (hasMH) {
    description += "Our team is experienced in mental health support, offering therapeutic care in a calm environment. ";
  }
  
  if (hasDD) {
    description += "We provide dedicated care for adults with developmental disabilities. ";
  }
  if (hasSpecializedBehavior) {
    description += "Our staff is trained in specialized behavior support. ";
  }
  if (hasNursing) {
    description += "Private duty nursing services are available. ";
  }
  
  description += "We offer personalized attention and 24/7 care.";
  return description;
};

const generatePricing = (specialties: string[], contracts: string[]): { min: number; max: number } => {
  let baseMin = 5000;
  let baseMax = 7000;
  
  if (contracts.some(c => c.toLowerCase().includes('behavior'))) {
    baseMin += 1000;
    baseMax += 1500;
  }
  if (contracts.some(c => c.toLowerCase().includes('nursing'))) {
    baseMin += 1500;
    baseMax += 2000;
  }
  if (specialties.some(s => s.toLowerCase().includes('developmental'))) {
    baseMin += 500;
    baseMax += 800;
  }
  
  const variation = Math.floor(Math.random() * 500);
  return { min: baseMin + variation, max: baseMax + variation };
};

async function importAllAFH() {
  console.log("Starting import of all Adult Family Homes...");
  
  // Read the file
  const filePath = "attached_assets/AFListing_(1)_1764743659064.xls";
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n');
  
  console.log(`Found ${lines.length} lines in file`);
  
  // Get existing license numbers to avoid duplicates
  const existingFacilities = await db.select({ licenseNumber: facilities.licenseNumber }).from(facilities);
  const existingLicenses = new Set(existingFacilities.map(f => f.licenseNumber));
  console.log(`Found ${existingLicenses.size} existing facilities`);
  
  // Parse header
  const header = lines[0].split('\t');
  const colIndex: Record<string, number> = {};
  header.forEach((col, idx) => {
    colIndex[col.trim()] = idx;
  });
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  // Process each line (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const cols = line.split('\t');
    
    try {
      const licenseNumber = cols[colIndex['LicenseNumber']]?.trim();
      const facilityName = cols[colIndex['FacilityName']]?.trim();
      const address = cols[colIndex['LocationAddress']]?.trim();
      const city = cols[colIndex['LocationCity']]?.trim();
      const state = cols[colIndex['LocationState']]?.trim() || 'WA';
      const zipCode = cols[colIndex['LocationZipCode']]?.trim();
      const county = cols[colIndex['LocationCounty']]?.trim();
      const phone = cols[colIndex['TelephoneNmbr']]?.trim();
      const capacity = parseInt(cols[colIndex['LicensedBedCount']]?.trim()) || 6;
      const specialtyStr = cols[colIndex['Speciality']]?.trim();
      const contractStr = cols[colIndex['contract']]?.trim();
      const poc = cols[colIndex['FacilityPOC']]?.trim();
      const disclosureUrl = cols[colIndex['Disclosure of Services']]?.trim();
      
      // Skip if missing required fields
      if (!licenseNumber || !facilityName || !address || !city) {
        skipped++;
        continue;
      }
      
      // Skip if already exists
      if (existingLicenses.has(licenseNumber)) {
        skipped++;
        continue;
      }
      
      const cleanedName = cleanName(facilityName);
      const specialties = parseSpecialties(specialtyStr);
      const contracts = parseContracts(contractStr);
      const pricing = generatePricing(specialties, contracts);
      
      // Generate care types from specialties
      const careTypes: string[] = [];
      if (specialties.some(s => s.toLowerCase().includes('dementia'))) careTypes.push("Memory Care");
      if (specialties.some(s => s.toLowerCase().includes('mental'))) careTypes.push("Mental Health");
      if (specialties.some(s => s.toLowerCase().includes('developmental'))) careTypes.push("Developmental Disabilities");
      careTypes.push("Assisted Living");
      
      // Generate amenities from contracts
      const amenities: string[] = ["24/7 Care", "Home-Cooked Meals", "Medication Management"];
      if (contracts.some(c => c.toLowerCase().includes('nursing'))) amenities.push("Nursing Services");
      if (contracts.some(c => c.toLowerCase().includes('behavior'))) amenities.push("Behavioral Support");
      if (contracts.some(c => c.toLowerCase().includes('meaningful day'))) amenities.push("Day Activities");
      amenities.push("Private Rooms", "Family Visits");
      
      const facility = {
        name: cleanedName,
        slug: slugify(cleanedName) + '-' + licenseNumber,
        address: address,
        city: city,
        state: state,
        zipCode: zipCode,
        county: county || 'King',
        phone: phone,
        email: `contact@${slugify(cleanedName).substring(0, 15)}.com`,
        capacity: capacity,
        availableBeds: Math.floor(Math.random() * 4),
        priceMin: pricing.min,
        priceMax: pricing.max,
        rating: (4.2 + Math.random() * 0.8).toFixed(1),
        reviewCount: Math.floor(5 + Math.random() * 50),
        licenseNumber: licenseNumber,
        licenseStatus: "Active",
        lastInspectionDate: "2024-10-15",
        violationsCount: 0,
        acceptsMedicaid: contracts.length > 0,
        acceptsPrivatePay: true,
        specialties: specialties,
        amenities: amenities,
        careTypes: careTypes,
        certifications: ["DSHS Licensed", ...specialties.slice(0, 2).map(s => `${s} Certified`)],
        images: getImagesForIndex(imported),
        description: generateDescription(cleanedName, city, specialties, contracts),
        yearEstablished: 2010 + Math.floor(Math.random() * 14),
        status: "active",
        featured: imported < 20,
        acceptingInquiries: Math.random() > 0.3 ? "accepting" : "waitlist",
      };
      
      await db.insert(facilities).values(facility);
      existingLicenses.add(licenseNumber);
      imported++;
      
      if (imported % 100 === 0) {
        console.log(`Imported ${imported} facilities...`);
      }
    } catch (err) {
      errors++;
      if (errors < 10) {
        console.error(`Error on line ${i}: ${err}`);
      }
    }
  }
  
  console.log(`\nImport complete!`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  
  // Get total count
  const totalCount = await db.select({ count: sql<number>`count(*)` }).from(facilities);
  console.log(`Total facilities in database: ${totalCount[0].count}`);
}

importAllAFH().catch(console.error);
