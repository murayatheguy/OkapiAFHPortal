import { db } from "./db";
import { facilities, teamMembers, credentials, admins, reviews, inquiries } from "@shared/schema";
import { sql } from "drizzle-orm";
import * as fs from "fs";

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
  "https://images.unsplash.com/photo-1613545325278-f24b0cae1224?w=800&auto=format&fit=crop&q=80",
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
  
  let description = `${name} is a licensed Adult Family Home in ${city}, Washington, providing compassionate care in a home-like setting. `;
  
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

// Review templates
const REVIEW_TEMPLATES = [
  { title: "Excellent care for my mother", content: "The staff has been wonderful with my mother. They treat her with dignity and respect, and the home environment is clean and comfortable.", rating: 5 },
  { title: "Highly recommend", content: "After visiting many facilities, we chose this home and couldn't be happier. The caregivers are attentive and truly care about the residents.", rating: 5 },
  { title: "Great experience overall", content: "My father has been here for six months now. The communication with family is excellent, and he's getting the specialized care he needs.", rating: 4 },
  { title: "Professional and caring staff", content: "The team goes above and beyond. They've helped my loved one adjust well and maintain their quality of life.", rating: 5 },
  { title: "Peace of mind", content: "Knowing my grandmother is well cared for gives our family peace of mind. The staff is responsive and keeps us informed.", rating: 5 },
];

async function importAFHOnly() {
  console.log("Starting clean import of Adult Family Homes only...");
  
  // Clear existing data
  console.log("Clearing existing data...");
  await db.execute(sql`TRUNCATE TABLE credentials, team_members, reviews, inquiries, facilities, admins CASCADE`);
  
  // Seed admin
  const adminData = {
    email: "admin@okapicare.com",
    passwordHash: "$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lLGsxSyalC",
    name: "Okapi Admin",
    role: "super_admin",
  };
  await db.insert(admins).values(adminData);
  console.log("Created admin account");
  
  // Read the file
  const filePath = "attached_assets/AFListing_(1)_1764743659064.xls";
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n');
  
  console.log(`Found ${lines.length} lines in file`);
  
  // Parse header
  const header = lines[0].split('\t');
  const colIndex: Record<string, number> = {};
  header.forEach((col, idx) => {
    colIndex[col.trim()] = idx;
  });
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  const facilityIds: string[] = [];
  const seenLicenses = new Set<string>();
  
  // Process each line (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const cols = line.split('\t');
    
    try {
      const contractStr = cols[colIndex['contract']]?.trim() || '';
      
      // ONLY include entries with "Adult Family Home" in the contract column
      if (!contractStr.toLowerCase().includes('adult family home')) {
        skipped++;
        continue;
      }
      
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
      const reportsLocation = cols[colIndex['Reports Location']]?.trim();
      
      // Skip if missing required fields
      if (!licenseNumber || !facilityName || !address || !city) {
        skipped++;
        continue;
      }
      
      // Skip duplicates
      if (seenLicenses.has(licenseNumber)) {
        skipped++;
        continue;
      }
      seenLicenses.add(licenseNumber);
      
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
        dshsReportUrl: reportsLocation || null,
        acceptsMedicaid: true,
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
      
      const result = await db.insert(facilities).values(facility).returning({ id: facilities.id });
      facilityIds.push(result[0].id);
      imported++;
      
      if (imported % 100 === 0) {
        console.log(`Imported ${imported} Adult Family Homes...`);
      }
    } catch (err) {
      errors++;
      if (errors < 10) {
        console.error(`Error on line ${i}: ${err}`);
      }
    }
  }
  
  console.log(`\nFacility import complete!`);
  console.log(`Adult Family Homes imported: ${imported}`);
  console.log(`Skipped (not AFH or duplicates): ${skipped}`);
  console.log(`Errors: ${errors}`);
  
  // Add reviews for first 100 facilities
  console.log("\nAdding reviews...");
  let reviewsCreated = 0;
  for (let i = 0; i < Math.min(100, facilityIds.length); i++) {
    const facilityId = facilityIds[i];
    const numReviews = 2 + Math.floor(Math.random() * 3);
    
    for (let j = 0; j < numReviews; j++) {
      const template = REVIEW_TEMPLATES[(i + j) % REVIEW_TEMPLATES.length];
      const reviewData = {
        facilityId,
        authorName: ["Maria S.", "John D.", "Linda P.", "Robert M.", "Susan K.", "James T.", "Patricia H.", "William C."][(i + j) % 8],
        authorEmail: `reviewer${i}_${j}@email.com`,
        rating: template.rating,
        title: template.title,
        content: template.content,
        status: "approved",
      };
      await db.insert(reviews).values(reviewData);
      reviewsCreated++;
    }
  }
  console.log(`Created ${reviewsCreated} reviews`);
  
  // Add team members for first facility (for owner portal demo)
  console.log("\nAdding team members for owner portal demo...");
  const firstFacilityId = facilityIds[0];
  const teamMemberData = [
    { facilityId: firstFacilityId, name: "Hiwot Seifu", email: "hiwot@1stcareafh.com", role: "Owner/Administrator", status: "Active", isManualEntry: false },
    { facilityId: firstFacilityId, name: "Maria Santos", email: "maria@1stcareafh.com", role: "Caregiver (CNA)", status: "Active", isManualEntry: false },
    { facilityId: firstFacilityId, name: "James Williams", email: "james@1stcareafh.com", role: "Caregiver (HCA)", status: "Active", isManualEntry: false },
  ];
  
  const teamMemberIds: string[] = [];
  for (const member of teamMemberData) {
    const result = await db.insert(teamMembers).values(member).returning({ id: teamMembers.id });
    teamMemberIds.push(result[0].id);
  }
  console.log(`Created ${teamMemberIds.length} team members`);
  
  // Add credentials
  const credentialData = [
    { teamMemberId: teamMemberIds[0], name: "Administrator License", type: "Required", status: "Current", issuedDate: "2023-01-15", expiryDate: "2025-01-15", source: "External", issuer: "DSHS" },
    { teamMemberId: teamMemberIds[1], name: "Certified Nursing Assistant", type: "Required", status: "Current", issuedDate: "2022-06-01", expiryDate: "2025-06-01", source: "External", issuer: "WA DOH" },
    { teamMemberId: teamMemberIds[1], name: "Dementia Care Training", type: "Specialty", status: "Current", issuedDate: "2024-03-15", expiryDate: "2026-03-15", source: "Okapi Academy", issuer: "Okapi Academy" },
  ];
  for (const cred of credentialData) {
    await db.insert(credentials).values(cred);
  }
  console.log(`Created ${credentialData.length} credentials`);
  
  console.log("\n=== Import Complete ===");
  console.log(`Total Adult Family Homes: ${imported}`);
}

importAFHOnly().catch(console.error);
