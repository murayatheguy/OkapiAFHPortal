import { db } from "./db";
import { facilities, teamMembers, credentials, admins, reviews, inquiries, transportProviders } from "@shared/schema";
import { sql } from "drizzle-orm";

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
];

const getImagesForIndex = (index: number, count: number = 4): string[] => {
  const images: string[] = [];
  for (let i = 0; i < count; i++) {
    images.push(UNSPLASH_IMAGES[(index + i) % UNSPLASH_IMAGES.length]);
  }
  return images;
};

const slugify = (text: string): string => {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

// Real Adult Family Home data from King County DSHS
const FACILITY_DATA = [
  {
    name: "1st Care AFH LLC",
    address: "14131 SE Fairwood Blvd",
    city: "Renton",
    zipCode: "98058",
    county: "King",
    phone: "(425) 245-4276",
    licenseNumber: "755337",
    capacity: 6,
    specialties: ["Mental Health", "Dementia"],
    contracts: ["HCS Meaningful Day", "DDA Meaningful Day", "Adult Family Home"],
    pointOfContact: "Seifu, Hiwot",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=755337",
  },
  {
    name: "A Plus Adult Family Home",
    address: "1036 S 325th St",
    city: "Federal Way",
    zipCode: "98003",
    county: "King",
    phone: "(253) 632-6086",
    licenseNumber: "755642",
    capacity: 6,
    specialties: ["Mental Health", "Dementia", "Developmental Disabilities"],
    contracts: ["DDA Meaningful Day", "Adult Family Home"],
    pointOfContact: "Cavada, Dolores E.",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=755642",
  },
  {
    name: "AA Suite Adult Family Home LLC",
    address: "10215 SE 224th St",
    city: "Kent",
    zipCode: "98031",
    county: "King",
    phone: "(602) 472-0571",
    licenseNumber: "757752",
    capacity: 6,
    specialties: ["Mental Health", "Dementia", "Developmental Disabilities"],
    contracts: ["HCS Meaningful Day", "Expanded Community Services", "DDA Meaningful Day", "Adult Family Home"],
    pointOfContact: "Rizal, Giri",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=757752",
  },
  {
    name: "Always Home AFH",
    address: "20121 8th Avenue NE",
    city: "Shoreline",
    zipCode: "98155",
    county: "King",
    phone: "(206) 588-1100",
    licenseNumber: "754734",
    capacity: 6,
    specialties: ["Mental Health", "Dementia"],
    contracts: ["Specialized Behavior Support", "HCS Meaningful Day", "Expanded Community Services", "DDA Meaningful Day", "Adult Family Home"],
    pointOfContact: "Solomon, Saba H.",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=754734",
  },
  {
    name: "Bright Rose AFH LLC",
    address: "26308 185th Ave SE",
    city: "Covington",
    zipCode: "98042",
    county: "King",
    phone: "(253) 981-4868",
    licenseNumber: "755908",
    capacity: 6,
    specialties: ["Mental Health", "Dementia", "Developmental Disabilities"],
    contracts: ["Private Duty Nursing", "HCS Meaningful Day", "DDA Meaningful Day", "Adult Family Home"],
    pointOfContact: "Assen, Abiy B.",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=755908",
  },
  {
    name: "Dynasty AFH LLC",
    address: "2715 SW 323rd St",
    city: "Federal Way",
    zipCode: "98023",
    county: "King",
    phone: "(253) 944-1007",
    licenseNumber: "756657",
    capacity: 6,
    specialties: ["Mental Health", "Dementia", "Developmental Disabilities"],
    contracts: ["Specialized Behavior Support", "HCS Meaningful Day", "Expanded Community Services", "DDA Meaningful Day", "Adult Family Home"],
    pointOfContact: "Paul, Bernard K.",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=756657",
  },
  {
    name: "Neighbors Choice Care LLC",
    address: "2525 26th St SE",
    city: "Auburn",
    zipCode: "98002",
    county: "King",
    phone: "(253) 561-4696",
    licenseNumber: "756353",
    capacity: 6,
    specialties: ["Mental Health", "Dementia", "Developmental Disabilities"],
    contracts: ["Adult Family Home"],
    pointOfContact: "Dimanga Kutambula, Leiticia",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=756353",
  },
  {
    name: "Safe Haven AFH",
    address: "14811 SE 172nd Pl",
    city: "Renton",
    zipCode: "98058",
    county: "King",
    phone: "(206) 841-7111",
    licenseNumber: "754712",
    capacity: 6,
    specialties: ["Mental Health", "Dementia", "Developmental Disabilities"],
    contracts: ["Specialized Behavior Support", "HCS Meaningful Day", "Expanded Community Services", "DDA Meaningful Day", "Adult Family Home"],
    pointOfContact: "Mekonnen, Girmachew T.",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=754712",
  },
  {
    name: "#1 Freedom Adult Family Home LLC",
    address: "21403 4th Pl S",
    city: "Des Moines",
    zipCode: "98198",
    county: "King",
    phone: "(206) 592-2166",
    licenseNumber: "755888",
    capacity: 6,
    specialties: ["Mental Health", "Dementia", "Developmental Disabilities"],
    contracts: ["HCS Meaningful Day", "DDA Meaningful Day", "Adult Family Home"],
    pointOfContact: "Tesfamicael, Natsnet G.",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=755888",
  },
  {
    name: "#1st Ivanna AFH",
    address: "1610 3rd St NE",
    city: "Auburn",
    zipCode: "98002",
    county: "King",
    phone: "(253) 737-4676",
    licenseNumber: "754177",
    capacity: 6,
    specialties: ["Mental Health", "Dementia", "Developmental Disabilities"],
    contracts: ["HCS Meaningful Day", "DDA Meaningful Day", "Adult Family Home"],
    pointOfContact: "Kiuna, Damaris W.",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=754177",
  },
  {
    name: "#I Care AFH LLC",
    address: "3834 I Place NE",
    city: "Auburn",
    zipCode: "98002",
    county: "King",
    phone: "(206) 412-0235",
    licenseNumber: "755284",
    capacity: 5,
    specialties: ["Mental Health", "Dementia", "Developmental Disabilities"],
    contracts: ["Specialized Behavior Support", "HCS Meaningful Day", "Expanded Community Services", "DDA Meaningful Day", "Adult Family Home"],
    pointOfContact: "Enyew, Ephrem",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=755284",
  },
  {
    name: "#1 Amen Adult Family Home LLC",
    address: "7339 NE 140th St",
    city: "Kirkland",
    zipCode: "98034",
    county: "King",
    phone: "(425) 898-4876",
    licenseNumber: "755603",
    capacity: 6,
    specialties: ["Mental Health", "Dementia", "Developmental Disabilities"],
    contracts: ["HCS Meaningful Day", "DDA Meaningful Day", "Adult Family Home"],
    pointOfContact: "Kindane, Haregu",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=755603",
  },
  {
    name: "#1 Helping Hand AFH LLC",
    address: "11805 SE 64th St",
    city: "Bellevue",
    zipCode: "98006",
    county: "King",
    phone: "(425) 687-7127",
    licenseNumber: "756797",
    capacity: 6,
    specialties: ["Mental Health", "Dementia"],
    contracts: ["HCS Meaningful Day", "DDA Meaningful Day", "Adult Family Home"],
    pointOfContact: "Cislaru, Natalia",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=756797",
  },
  {
    name: "#1 Little Angel Adult Family Home LLC",
    address: "4610 Kent Ct",
    city: "Kent",
    zipCode: "98032",
    county: "King",
    phone: "(253) 236-4440",
    licenseNumber: "755763",
    capacity: 6,
    specialties: ["Mental Health", "Dementia"],
    contracts: ["Adult Family Home"],
    pointOfContact: "Mwaura, Tabitha M.",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=755763",
  },
  {
    name: "#1 The Rock of Mercy LLC",
    address: "1536 Maple Ln",
    city: "Kent",
    zipCode: "98030",
    county: "King",
    phone: "(253) 236-5538",
    licenseNumber: "754142",
    capacity: 6,
    specialties: ["Mental Health", "Dementia", "Developmental Disabilities"],
    contracts: ["Adult Family Home"],
    pointOfContact: "Aho, Mohokoi",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=754142",
  },
  {
    name: "1st Northgate Adult Family Home",
    address: "2103 N 115th St",
    city: "Seattle",
    zipCode: "98133",
    county: "King",
    phone: "(206) 257-0203",
    licenseNumber: "754459",
    capacity: 5,
    specialties: ["Mental Health", "Dementia", "Developmental Disabilities"],
    contracts: ["HCS Meaningful Day", "Expanded Community Services", "DDA Meaningful Day", "Adult Family Home"],
    pointOfContact: "Sahile, Helen A.",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=754459",
  },
  {
    name: "Cedar Park",
    address: "11110 NE 164th Pl",
    city: "Bothell",
    zipCode: "98011",
    county: "King",
    phone: "(425) 489-1816",
    licenseNumber: "754361",
    capacity: 6,
    specialties: ["Mental Health", "Dementia"],
    contracts: ["Adult Family Home"],
    pointOfContact: "Drammeh, Jainaba",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=754361",
  },
  {
    name: "Ethos AFH LLC",
    address: "29933 2nd Place SW",
    city: "Federal Way",
    zipCode: "98023",
    county: "King",
    phone: "(206) 212-6303",
    licenseNumber: "756015",
    capacity: 5,
    specialties: ["Mental Health", "Dementia"],
    contracts: ["HCS Meaningful Day", "DDA Meaningful Day", "Adult Family Home"],
    pointOfContact: "Kassa, Abraham H.",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=756015",
  },
  {
    name: "Mulu's Golden Care AFH LLC",
    address: "15226 30th Ave S",
    city: "SeaTac",
    zipCode: "98188",
    county: "King",
    phone: "(206) 535-8370",
    licenseNumber: "754281",
    capacity: 4,
    specialties: ["Mental Health", "Dementia"],
    contracts: ["HCS Meaningful Day", "DDA Meaningful Day", "Adult Family Home"],
    pointOfContact: "Wereta, Mulu A.",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=754281",
  },
  {
    name: "Palm House LLC",
    address: "25450 111th Ave SE",
    city: "Kent",
    zipCode: "98030",
    county: "King",
    phone: "(206) 403-0640",
    licenseNumber: "754316",
    capacity: 6,
    specialties: ["Mental Health", "Dementia"],
    contracts: ["Specialized Behavior Support", "HCS Meaningful Day", "Expanded Community Services", "DDA Meaningful Day", "Adult Family Home"],
    pointOfContact: "Girma, Azeb M.",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=754316",
  },
  {
    name: "Trinity Elderly Care AFH 2",
    address: "23332 106th Ave SE",
    city: "Kent",
    zipCode: "98031",
    county: "King",
    phone: "(253) 981-4533",
    licenseNumber: "757496",
    capacity: 6,
    specialties: ["Mental Health", "Dementia"],
    contracts: ["HCS Meaningful Day", "Expanded Community Services", "DDA Meaningful Day", "Adult Family Home"],
    pointOfContact: "Worku, Alemtsehay T.",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=757496",
  },
  {
    name: "Simren AFH",
    address: "8816 S 122nd St",
    city: "Seattle",
    zipCode: "98178",
    county: "King",
    phone: "(206) 230-3531",
    licenseNumber: "758357",
    capacity: 5,
    specialties: ["Mental Health", "Dementia", "Developmental Disabilities"],
    contracts: ["Adult Family Home"],
    pointOfContact: "Segni Gemeda, Tirunesh",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=758357",
  },
  {
    name: "Living At Lake Meridian AFH",
    address: "26331 143rd Ave SE",
    city: "Kent",
    zipCode: "98042",
    county: "King",
    phone: "(253) 981-4344",
    licenseNumber: "755352",
    capacity: 6,
    specialties: ["Mental Health", "Dementia"],
    contracts: [],
    pointOfContact: "Powell, Olimpia B.",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=755352",
  },
  {
    name: "Elizabeth's Care Home LLC",
    address: "12513 SE 172nd St",
    city: "Renton",
    zipCode: "98058",
    county: "King",
    phone: "(425) 271-8416",
    licenseNumber: "758096",
    capacity: 6,
    specialties: ["Mental Health", "Dementia", "Developmental Disabilities"],
    contracts: ["Specialized Behavior Support", "HCS Meaningful Day", "Expanded Community Services", "DDA Meaningful Day", "Adult Family Home"],
    pointOfContact: "Otieno, Josephine A.",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=758096",
  },
  {
    name: "Perfect Care LLC",
    address: "17940 51st Ave S",
    city: "SeaTac",
    zipCode: "98188",
    county: "King",
    phone: "(206) 436-9425",
    licenseNumber: "754032",
    capacity: 5,
    specialties: ["Mental Health", "Dementia"],
    contracts: ["HCS Meaningful Day", "Expanded Community Services", "DDA Meaningful Day", "Adult Family Home"],
    pointOfContact: "Solomon, Bezawit T.",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=754032",
  },
  {
    name: "Comfort Care AFH",
    address: "18630 SE 280th St",
    city: "Covington",
    zipCode: "98042",
    county: "King",
    phone: "(253) 630-5200",
    licenseNumber: "754500",
    capacity: 6,
    specialties: ["Mental Health", "Dementia", "Developmental Disabilities"],
    contracts: ["HCS Meaningful Day", "DDA Meaningful Day", "Adult Family Home"],
    pointOfContact: "Johnson, Mary L.",
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHForms.aspx?Lic=754500",
  },
];

// Generate descriptions based on specialties
const generateDescription = (facility: typeof FACILITY_DATA[0]): string => {
  const hasDD = facility.specialties.includes("Developmental Disabilities");
  const hasMH = facility.specialties.includes("Mental Health");
  const hasDementia = facility.specialties.includes("Dementia");
  const hasSpecializedBehavior = facility.contracts.includes("Specialized Behavior Support");
  const hasNursing = facility.contracts.includes("Private Duty Nursing");
  
  let description = `${facility.name} is a licensed Adult Family Home in ${facility.city}, Washington, providing compassionate care in a home-like setting. `;
  
  if (hasDementia && hasMH) {
    description += "Our experienced caregivers specialize in memory care and mental health support, creating a safe and nurturing environment for residents. ";
  } else if (hasDementia) {
    description += "We specialize in memory care, providing specialized support for residents with dementia and Alzheimer's. ";
  } else if (hasMH) {
    description += "Our team is experienced in mental health support, offering therapeutic care in a calm environment. ";
  }
  
  if (hasDD) {
    description += "We also provide dedicated care for adults with developmental disabilities. ";
  }
  
  if (hasSpecializedBehavior) {
    description += "Our staff is trained in specialized behavior support to meet complex care needs. ";
  }
  
  if (hasNursing) {
    description += "Private duty nursing services are available for residents requiring medical care. ";
  }
  
  description += `With a capacity of ${facility.capacity} residents, we offer personalized attention and 24/7 care.`;
  
  return description;
};

// Generate pricing based on capacity and services
const generatePricing = (facility: typeof FACILITY_DATA[0]): { min: number; max: number } => {
  let baseMin = 5000;
  let baseMax = 7000;
  
  if (facility.contracts.includes("Specialized Behavior Support")) {
    baseMin += 1000;
    baseMax += 1500;
  }
  if (facility.contracts.includes("Private Duty Nursing")) {
    baseMin += 1500;
    baseMax += 2000;
  }
  if (facility.specialties.includes("Developmental Disabilities")) {
    baseMin += 500;
    baseMax += 800;
  }
  
  // Add some variation
  const variation = Math.floor(Math.random() * 500);
  return { min: baseMin + variation, max: baseMax + variation };
};

// Generate random rating between 4.2 and 5.0
const generateRating = (): string => {
  return (4.2 + Math.random() * 0.8).toFixed(1);
};

// Generate random review count between 5 and 60
const generateReviewCount = (): number => {
  return Math.floor(5 + Math.random() * 55);
};

// Generate available beds (0-3)
const generateAvailableBeds = (): number => {
  return Math.floor(Math.random() * 4);
};

// Sample review content
const REVIEW_TEMPLATES = [
  { title: "Excellent care for my mother", content: "The staff at {name} has been wonderful with my mother. They treat her with dignity and respect, and the home environment is clean and comfortable.", rating: 5 },
  { title: "Highly recommend", content: "After visiting many facilities, we chose {name} and couldn't be happier. The caregivers are attentive and truly care about the residents.", rating: 5 },
  { title: "Great experience overall", content: "My father has been at {name} for six months now. The communication with family is excellent, and he's getting the specialized care he needs.", rating: 4 },
  { title: "Professional and caring staff", content: "The team at {name} goes above and beyond. They've helped my loved one adjust well and maintain their quality of life.", rating: 5 },
  { title: "Peace of mind", content: "Knowing my grandmother is well cared for at {name} gives our family peace of mind. The staff is responsive and keeps us informed.", rating: 5 },
  { title: "Good care, responsive team", content: "We've had a positive experience with {name}. The home is well-maintained and the caregivers are trained professionals.", rating: 4 },
  { title: "Wonderful memory care", content: "The specialized dementia care at {name} has been exceptional. They understand the unique needs of memory care patients.", rating: 5 },
  { title: "Like family", content: "The caregivers at {name} treat residents like family. It truly feels like a home, not an institution.", rating: 5 },
];

// Sample inquiry content
const INQUIRY_TEMPLATES = [
  { name: "Sarah Johnson", email: "sarah.j@email.com", message: "I'm looking for care for my 78-year-old mother who has early-stage dementia. Can you tell me about availability and pricing?", careType: "Memory Care", timeline: "Within 1 month" },
  { name: "Michael Chen", email: "m.chen@email.com", message: "My father needs assistance with daily activities but is still fairly independent. Is this the right fit for assisted living care?", careType: "Assisted Living", timeline: "Within 3 months" },
  { name: "Patricia Williams", email: "pwilliams@email.com", message: "Looking for respite care while I'm traveling. Do you offer short-term stays?", careType: "Respite Care", timeline: "Immediate" },
  { name: "Robert Garcia", email: "rgarcia@email.com", message: "My brother has developmental disabilities and we're seeking long-term care. What services do you provide?", careType: "Developmental Disabilities", timeline: "Within 2 months" },
  { name: "Jennifer Martinez", email: "jen.martinez@email.com", message: "We need specialized care for our aunt who has mental health needs. Can we schedule a tour?", careType: "Mental Health", timeline: "Within 1 month" },
];

export async function seedDatabase() {
  console.log("Starting database seed with real King County AFH data...");

  // Clear existing data
  await db.execute(sql`TRUNCATE TABLE credentials, team_members, reviews, inquiries, facilities, admins CASCADE`);

  // Seed admin
  const adminData = {
    email: "admin@okapicare.com",
    passwordHash: "$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lLGsxSyalC", // AdminPassword123!
    name: "Okapi Admin",
    role: "super_admin",
  };
  await db.insert(admins).values(adminData);
  console.log("Created admin account");

  // Seed facilities with real data
  const facilityIds: string[] = [];
  
  for (let i = 0; i < FACILITY_DATA.length; i++) {
    const data = FACILITY_DATA[i];
    const pricing = generatePricing(data);
    const rating = generateRating();
    const reviewCount = generateReviewCount();
    const availableBeds = generateAvailableBeds();
    
    // Map contracts to amenities
    const amenities: string[] = ["24/7 Care", "Home-Cooked Meals", "Medication Management"];
    if (data.contracts.includes("Private Duty Nursing")) amenities.push("Nursing Services");
    if (data.contracts.includes("Specialized Behavior Support")) amenities.push("Behavioral Support");
    if (data.contracts.includes("HCS Meaningful Day")) amenities.push("Day Activities");
    amenities.push("Private Rooms", "Family Visits");
    
    // Determine care types from specialties
    const careTypes: string[] = [];
    if (data.specialties.includes("Dementia")) careTypes.push("Memory Care");
    if (data.specialties.includes("Mental Health")) careTypes.push("Mental Health");
    if (data.specialties.includes("Developmental Disabilities")) careTypes.push("Developmental Disabilities");
    careTypes.push("Assisted Living");
    
    const facility = {
      name: data.name,
      slug: slugify(data.name),
      facilityType: 'afh', // All real data is Adult Family Homes
      address: data.address,
      city: data.city,
      state: "WA",
      zipCode: data.zipCode,
      county: data.county,
      phone: data.phone,
      email: `contact@${slugify(data.name).substring(0, 20)}.com`,
      capacity: data.capacity,
      availableBeds,
      priceMin: pricing.min,
      priceMax: pricing.max,
      rating,
      reviewCount,
      licenseNumber: data.licenseNumber,
      licenseStatus: "Active",
      lastInspectionDate: "2024-10-15",
      violationsCount: 0,
      acceptsMedicaid: data.contracts.length > 0,
      acceptsPrivatePay: true,
      specialties: data.specialties,
      amenities,
      careTypes,
      certifications: ["DSHS Licensed", ...data.specialties.map(s => `${s} Certified`)],
      images: getImagesForIndex(i),
      description: generateDescription(data),
      yearEstablished: 2010 + Math.floor(Math.random() * 14),
      status: "active",
      featured: i < 6, // First 6 are featured
      acceptingInquiries: availableBeds > 0 ? "accepting" : "waitlist",
      dshsReportUrl: data.disclosureUrl,
    };

    const result = await db.insert(facilities).values(facility).returning({ id: facilities.id });
    facilityIds.push(result[0].id);
  }
  console.log(`Created ${facilityIds.length} AFH facilities from real King County data`);

  // Mock data for other facility types (ALF, SNF, Hospice) - 60 fictional facilities
  const ASSISTED_LIVING_DATA = [
    { name: "Emerald City Senior Living", address: "1200 Pine Street", city: "Seattle", zipCode: "98101", county: "King", phone: "(206) 555-0101", licenseNumber: "ALF-001001", capacity: 85, specialties: ["Memory Care", "Respite Care"], priceMin: 5200, priceMax: 7500 },
    { name: "Cascade View Assisted Living", address: "4500 Bellevue Way", city: "Bellevue", zipCode: "98004", county: "King", phone: "(425) 555-0102", licenseNumber: "ALF-001002", capacity: 120, specialties: ["Independent Living", "Assisted Living", "Memory Care"], priceMin: 5800, priceMax: 8200 },
    { name: "Olympic Gardens Senior Community", address: "789 Harbor Drive", city: "Tacoma", zipCode: "98402", county: "Pierce", phone: "(253) 555-0103", licenseNumber: "ALF-001003", capacity: 65, specialties: ["Assisted Living", "Diabetic Care"], priceMin: 4800, priceMax: 6500 },
    { name: "Puget Sound Senior Residence", address: "2100 Waterfront Lane", city: "Kirkland", zipCode: "98033", county: "King", phone: "(425) 555-0104", licenseNumber: "ALF-001004", capacity: 95, specialties: ["Memory Care", "Physical Therapy"], priceMin: 5500, priceMax: 7800 },
    { name: "Rainier Vista Senior Living", address: "3300 Mountain View Blvd", city: "Renton", zipCode: "98055", county: "King", phone: "(425) 555-0105", licenseNumber: "ALF-001005", capacity: 72, specialties: ["Assisted Living"], priceMin: 4900, priceMax: 6800 },
    { name: "Evergreen Terrace Assisted Living", address: "5600 Cedar Road", city: "Redmond", zipCode: "98052", county: "King", phone: "(425) 555-0106", licenseNumber: "ALF-001006", capacity: 88, specialties: ["Memory Care", "Respite Care"], priceMin: 5600, priceMax: 7900 },
    { name: "Lake Washington Senior Living", address: "1800 Lakeside Ave", city: "Seattle", zipCode: "98122", county: "King", phone: "(206) 555-0107", licenseNumber: "ALF-001007", capacity: 110, specialties: ["Luxury Assisted Living", "Memory Care"], priceMin: 6200, priceMax: 8500 },
    { name: "Spokane Valley Senior Community", address: "9200 Sprague Ave", city: "Spokane Valley", zipCode: "99206", county: "Spokane", phone: "(509) 555-0108", licenseNumber: "ALF-001008", capacity: 75, specialties: ["Assisted Living", "Diabetic Care"], priceMin: 4200, priceMax: 5800 },
    { name: "Columbia River Senior Residence", address: "450 River Road", city: "Vancouver", zipCode: "98661", county: "Clark", phone: "(360) 555-0109", licenseNumber: "ALF-001009", capacity: 68, specialties: ["Assisted Living", "Respite Care"], priceMin: 4500, priceMax: 6200 },
    { name: "Whidbey Island Senior Living", address: "200 Main Street", city: "Oak Harbor", zipCode: "98277", county: "Island", phone: "(360) 555-0110", licenseNumber: "ALF-001010", capacity: 45, specialties: ["Assisted Living"], priceMin: 4800, priceMax: 6500 },
    { name: "Bellingham Bay Senior Community", address: "1500 Bay Street", city: "Bellingham", zipCode: "98225", county: "Whatcom", phone: "(360) 555-0111", licenseNumber: "ALF-001011", capacity: 82, specialties: ["Memory Care", "Assisted Living"], priceMin: 5100, priceMax: 7200 },
    { name: "Federal Way Senior Residence", address: "32000 Pacific Highway", city: "Federal Way", zipCode: "98003", county: "King", phone: "(253) 555-0112", licenseNumber: "ALF-001012", capacity: 90, specialties: ["Assisted Living", "Physical Therapy"], priceMin: 4700, priceMax: 6400 },
    { name: "Mercer Island Senior Living", address: "7800 Island Crest Way", city: "Mercer Island", zipCode: "98040", county: "King", phone: "(206) 555-0113", licenseNumber: "ALF-001013", capacity: 55, specialties: ["Luxury Assisted Living", "Memory Care", "Concierge Services"], priceMin: 7500, priceMax: 10500 },
    { name: "Kennewick Senior Community", address: "5500 Clearwater Ave", city: "Kennewick", zipCode: "99336", county: "Benton", phone: "(509) 555-0114", licenseNumber: "ALF-001014", capacity: 70, specialties: ["Assisted Living"], priceMin: 4100, priceMax: 5600 },
    { name: "Olympia Gardens Senior Living", address: "1200 Capitol Way", city: "Olympia", zipCode: "98501", county: "Thurston", phone: "(360) 555-0115", licenseNumber: "ALF-001015", capacity: 78, specialties: ["Assisted Living", "Memory Care"], priceMin: 4900, priceMax: 6700 },
    { name: "Issaquah Highlands Senior Residence", address: "2200 Highlands Drive", city: "Issaquah", zipCode: "98029", county: "King", phone: "(425) 555-0116", licenseNumber: "ALF-001016", capacity: 65, specialties: ["Memory Care", "Wellness Programs"], priceMin: 5900, priceMax: 8100 },
    { name: "Edmonds Waterfront Senior Living", address: "400 Admiral Way", city: "Edmonds", zipCode: "98020", county: "Snohomish", phone: "(425) 555-0117", licenseNumber: "ALF-001017", capacity: 58, specialties: ["Assisted Living", "Respite Care"], priceMin: 5400, priceMax: 7600 },
    { name: "Yakima Valley Senior Community", address: "3100 Tieton Drive", city: "Yakima", zipCode: "98902", county: "Yakima", phone: "(509) 555-0118", licenseNumber: "ALF-001018", capacity: 62, specialties: ["Assisted Living", "Diabetic Care"], priceMin: 3900, priceMax: 5400 },
    { name: "Bainbridge Island Senior Residence", address: "600 Winslow Way", city: "Bainbridge Island", zipCode: "98110", county: "Kitsap", phone: "(206) 555-0119", licenseNumber: "ALF-001019", capacity: 42, specialties: ["Luxury Assisted Living", "Memory Care"], priceMin: 6800, priceMax: 9200 },
    { name: "Shoreline Senior Living", address: "18500 Aurora Ave N", city: "Shoreline", zipCode: "98133", county: "King", phone: "(206) 555-0120", licenseNumber: "ALF-001020", capacity: 76, specialties: ["Assisted Living", "Physical Therapy"], priceMin: 5000, priceMax: 7000 },
  ];

  const SKILLED_NURSING_DATA = [
    { name: "Seattle Medical & Rehabilitation Center", address: "500 Minor Ave", city: "Seattle", zipCode: "98104", county: "King", phone: "(206) 555-0201", licenseNumber: "SNF-002001", capacity: 120, specialties: ["Physical Therapy", "Cardiac Rehab", "Stroke Recovery"], priceMin: 9500, priceMax: 14000, medicareRating: 4 },
    { name: "Bellevue Post-Acute Care Center", address: "1200 116th Ave NE", city: "Bellevue", zipCode: "98004", county: "King", phone: "(425) 555-0202", licenseNumber: "SNF-002002", capacity: 95, specialties: ["Orthopedic Rehab", "Physical Therapy", "Occupational Therapy"], priceMin: 10200, priceMax: 15000, medicareRating: 5 },
    { name: "Tacoma Rehabilitation & Nursing", address: "3400 South Union Ave", city: "Tacoma", zipCode: "98409", county: "Pierce", phone: "(253) 555-0203", licenseNumber: "SNF-002003", capacity: 110, specialties: ["Wound Care", "IV Therapy", "Respiratory Care"], priceMin: 8800, priceMax: 12500, medicareRating: 3 },
    { name: "Evergreen Skilled Nursing Center", address: "12000 NE 128th St", city: "Kirkland", zipCode: "98034", county: "King", phone: "(425) 555-0204", licenseNumber: "SNF-002004", capacity: 85, specialties: ["Memory Care", "Physical Therapy", "Speech Therapy"], priceMin: 9800, priceMax: 14200, medicareRating: 4 },
    { name: "Spokane Valley Nursing & Rehab", address: "6500 E Sprague Ave", city: "Spokane Valley", zipCode: "99212", county: "Spokane", phone: "(509) 555-0205", licenseNumber: "SNF-002005", capacity: 100, specialties: ["Long-Term Care", "Physical Therapy"], priceMin: 8200, priceMax: 11500, medicareRating: 3 },
    { name: "Vancouver Rehabilitation Center", address: "2900 Main Street", city: "Vancouver", zipCode: "98660", county: "Clark", phone: "(360) 555-0206", licenseNumber: "SNF-002006", capacity: 88, specialties: ["Cardiac Rehab", "Physical Therapy", "Diabetic Care"], priceMin: 8500, priceMax: 12000, medicareRating: 4 },
    { name: "Renton Care & Rehabilitation", address: "4500 Talbot Road S", city: "Renton", zipCode: "98055", county: "King", phone: "(425) 555-0207", licenseNumber: "SNF-002007", capacity: 92, specialties: ["Stroke Recovery", "Physical Therapy", "Occupational Therapy"], priceMin: 9200, priceMax: 13500, medicareRating: 4 },
    { name: "Federal Way Skilled Nursing", address: "1800 S 320th St", city: "Federal Way", zipCode: "98003", county: "King", phone: "(253) 555-0208", licenseNumber: "SNF-002008", capacity: 78, specialties: ["Wound Care", "IV Therapy"], priceMin: 8600, priceMax: 12200, medicareRating: 3 },
    { name: "Olympia Nursing & Rehabilitation", address: "2200 Lilly Road NE", city: "Olympia", zipCode: "98506", county: "Thurston", phone: "(360) 555-0209", licenseNumber: "SNF-002009", capacity: 82, specialties: ["Physical Therapy", "Respiratory Care"], priceMin: 8800, priceMax: 12800, medicareRating: 4 },
    { name: "Bellingham Transitional Care", address: "3000 Squalicum Pkwy", city: "Bellingham", zipCode: "98225", county: "Whatcom", phone: "(360) 555-0210", licenseNumber: "SNF-002010", capacity: 72, specialties: ["Orthopedic Rehab", "Physical Therapy"], priceMin: 9000, priceMax: 13000, medicareRating: 4 },
    { name: "Kent Skilled Nursing Center", address: "25000 104th Ave SE", city: "Kent", zipCode: "98030", county: "King", phone: "(253) 555-0211", licenseNumber: "SNF-002011", capacity: 96, specialties: ["Long-Term Care", "Wound Care", "Diabetic Care"], priceMin: 8700, priceMax: 12400, medicareRating: 3 },
    { name: "Redmond Post-Acute Care", address: "8800 160th Ave NE", city: "Redmond", zipCode: "98052", county: "King", phone: "(425) 555-0212", licenseNumber: "SNF-002012", capacity: 68, specialties: ["Cardiac Rehab", "Stroke Recovery", "Physical Therapy"], priceMin: 10500, priceMax: 15500, medicareRating: 5 },
    { name: "Yakima Rehabilitation & Care", address: "1700 Tieton Drive", city: "Yakima", zipCode: "98902", county: "Yakima", phone: "(509) 555-0213", licenseNumber: "SNF-002013", capacity: 85, specialties: ["Long-Term Care", "Physical Therapy"], priceMin: 7800, priceMax: 11000, medicareRating: 3 },
    { name: "Kennewick Nursing Center", address: "4200 W Clearwater Ave", city: "Kennewick", zipCode: "99336", county: "Benton", phone: "(509) 555-0214", licenseNumber: "SNF-002014", capacity: 76, specialties: ["Wound Care", "Respiratory Care"], priceMin: 7900, priceMax: 11200, medicareRating: 3 },
    { name: "Everett Medical & Rehab Center", address: "3200 Colby Ave", city: "Everett", zipCode: "98201", county: "Snohomish", phone: "(425) 555-0215", licenseNumber: "SNF-002015", capacity: 104, specialties: ["Physical Therapy", "Occupational Therapy", "Speech Therapy"], priceMin: 9100, priceMax: 13200, medicareRating: 4 },
    { name: "Burien Skilled Nursing", address: "15800 1st Ave S", city: "Burien", zipCode: "98148", county: "King", phone: "(206) 555-0216", licenseNumber: "SNF-002016", capacity: 72, specialties: ["Cardiac Rehab", "IV Therapy"], priceMin: 8900, priceMax: 12600, medicareRating: 4 },
    { name: "Lacey Rehabilitation Center", address: "5500 Corporate Center Lane", city: "Lacey", zipCode: "98503", county: "Thurston", phone: "(360) 555-0217", licenseNumber: "SNF-002017", capacity: 80, specialties: ["Orthopedic Rehab", "Physical Therapy"], priceMin: 8600, priceMax: 12300, medicareRating: 4 },
    { name: "Puyallup Nursing & Care Center", address: "1100 Shaw Road", city: "Puyallup", zipCode: "98372", county: "Pierce", phone: "(253) 555-0218", licenseNumber: "SNF-002018", capacity: 88, specialties: ["Long-Term Care", "Wound Care", "Diabetic Care"], priceMin: 8500, priceMax: 12100, medicareRating: 3 },
    { name: "Bothell Post-Acute & Rehab", address: "10200 Main Street", city: "Bothell", zipCode: "98011", county: "King", phone: "(425) 555-0219", licenseNumber: "SNF-002019", capacity: 70, specialties: ["Stroke Recovery", "Physical Therapy", "Speech Therapy"], priceMin: 9600, priceMax: 14000, medicareRating: 4 },
    { name: "Lynnwood Transitional Care", address: "19800 44th Ave W", city: "Lynnwood", zipCode: "98036", county: "Snohomish", phone: "(425) 555-0220", licenseNumber: "SNF-002020", capacity: 82, specialties: ["Cardiac Rehab", "Physical Therapy", "Respiratory Care"], priceMin: 9300, priceMax: 13600, medicareRating: 4 },
  ];

  const HOSPICE_DATA = [
    { name: "Peaceful Harbor Hospice", address: "1500 Madison Street", city: "Seattle", zipCode: "98104", county: "King", phone: "(206) 555-0301", licenseNumber: "HSP-003001", capacity: 24, specialties: ["Residential Hospice", "Respite Care", "Family Support"] },
    { name: "Cascade Comfort Care", address: "800 112th Ave NE", city: "Bellevue", zipCode: "98004", county: "King", phone: "(425) 555-0302", licenseNumber: "HSP-003002", capacity: 18, specialties: ["Palliative Care", "Pain Management", "Family Counseling"] },
    { name: "Olympic Serenity Hospice", address: "2100 Pacific Ave", city: "Tacoma", zipCode: "98402", county: "Pierce", phone: "(253) 555-0303", licenseNumber: "HSP-003003", capacity: 20, specialties: ["Residential Hospice", "Bereavement Support"] },
    { name: "Evergreen Hospice Care", address: "10500 NE 8th Street", city: "Kirkland", zipCode: "98033", county: "King", phone: "(425) 555-0304", licenseNumber: "HSP-003004", capacity: 16, specialties: ["Palliative Care", "Family Support", "Spiritual Care"] },
    { name: "Spokane Valley Hospice", address: "5800 E Broadway Ave", city: "Spokane Valley", zipCode: "99212", county: "Spokane", phone: "(509) 555-0305", licenseNumber: "HSP-003005", capacity: 22, specialties: ["Residential Hospice", "Pain Management"] },
    { name: "Columbia Comfort Hospice", address: "1800 Main Street", city: "Vancouver", zipCode: "98660", county: "Clark", phone: "(360) 555-0306", licenseNumber: "HSP-003006", capacity: 18, specialties: ["Palliative Care", "Bereavement Support"] },
    { name: "Rainier Hospice Services", address: "3600 Talbot Road S", city: "Renton", zipCode: "98055", county: "King", phone: "(425) 555-0307", licenseNumber: "HSP-003007", capacity: 14, specialties: ["Pain Management", "Family Counseling"] },
    { name: "Bellingham Hospice Care", address: "2500 Lakeway Drive", city: "Bellingham", zipCode: "98229", county: "Whatcom", phone: "(360) 555-0308", licenseNumber: "HSP-003008", capacity: 16, specialties: ["Residential Hospice", "Spiritual Care"] },
    { name: "Olympia Comfort Care Hospice", address: "1000 Capitol Way S", city: "Olympia", zipCode: "98501", county: "Thurston", phone: "(360) 555-0309", licenseNumber: "HSP-003009", capacity: 18, specialties: ["Palliative Care", "Family Support"] },
    { name: "Puget Sound Hospice", address: "600 University Street", city: "Seattle", zipCode: "98101", county: "King", phone: "(206) 555-0310", licenseNumber: "HSP-003010", capacity: 28, specialties: ["Residential Hospice", "Pain Management", "Music Therapy"] },
    { name: "Federal Way Hospice Care", address: "2400 S 320th St", city: "Federal Way", zipCode: "98003", county: "King", phone: "(253) 555-0311", licenseNumber: "HSP-003011", capacity: 14, specialties: ["Palliative Care", "Bereavement Support"] },
    { name: "Redmond Hospice Services", address: "16300 NE 80th St", city: "Redmond", zipCode: "98052", county: "King", phone: "(425) 555-0312", licenseNumber: "HSP-003012", capacity: 12, specialties: ["Pain Management", "Family Counseling", "Spiritual Care"] },
    { name: "Yakima Valley Hospice", address: "2800 Castlevale Road", city: "Yakima", zipCode: "98902", county: "Yakima", phone: "(509) 555-0313", licenseNumber: "HSP-003013", capacity: 20, specialties: ["Residential Hospice", "Respite Care"] },
    { name: "Kennewick Comfort Hospice", address: "3500 W Kennewick Ave", city: "Kennewick", zipCode: "99336", county: "Benton", phone: "(509) 555-0314", licenseNumber: "HSP-003014", capacity: 16, specialties: ["Palliative Care", "Family Support"] },
    { name: "Everett Hospice Care", address: "2700 Hoyt Ave", city: "Everett", zipCode: "98201", county: "Snohomish", phone: "(425) 555-0315", licenseNumber: "HSP-003015", capacity: 18, specialties: ["Residential Hospice", "Bereavement Support"] },
    { name: "Kent Serenity Hospice", address: "22400 84th Ave S", city: "Kent", zipCode: "98032", county: "King", phone: "(253) 555-0316", licenseNumber: "HSP-003016", capacity: 14, specialties: ["Pain Management", "Spiritual Care"] },
    { name: "Issaquah Hospice Services", address: "100 NW Gilman Blvd", city: "Issaquah", zipCode: "98027", county: "King", phone: "(425) 555-0317", licenseNumber: "HSP-003017", capacity: 12, specialties: ["Palliative Care", "Family Counseling", "Art Therapy"] },
    { name: "Lacey Comfort Care Hospice", address: "4400 Meridian Road", city: "Lacey", zipCode: "98503", county: "Thurston", phone: "(360) 555-0318", licenseNumber: "HSP-003018", capacity: 16, specialties: ["Residential Hospice", "Respite Care"] },
    { name: "Puyallup Valley Hospice", address: "800 S Meridian", city: "Puyallup", zipCode: "98371", county: "Pierce", phone: "(253) 555-0319", licenseNumber: "HSP-003019", capacity: 18, specialties: ["Palliative Care", "Bereavement Support"] },
    { name: "Shoreline Hospice Care", address: "17500 Aurora Ave N", city: "Shoreline", zipCode: "98133", county: "King", phone: "(206) 555-0320", licenseNumber: "HSP-003020", capacity: 14, specialties: ["Pain Management", "Family Support", "Spiritual Care"] },
  ];

  const OTHER_FACILITY_DATA = [
    ...ASSISTED_LIVING_DATA.map(f => ({ ...f, facilityType: 'alf' as const })),
    ...SKILLED_NURSING_DATA.map(f => ({ ...f, facilityType: 'snf' as const })),
    ...HOSPICE_DATA.map(f => ({ ...f, facilityType: 'hospice' as const, priceMin: 0, priceMax: 6000 })),
  ];

  // Generate description for fictional facilities
  const generateFictionalDescription = (name: string, type: string, city: string, specialties: string[]): string => {
    if (type === 'alf') {
      return `${name} is a premier assisted living community in ${city}, Washington. Our elegant facility offers personalized care plans, restaurant-style dining, and a vibrant social calendar. Specializing in ${specialties.slice(0, 2).join(' and ')}, our dedicated staff ensures residents feel at home while receiving the support they need.`;
    } else if (type === 'snf') {
      return `${name} provides skilled nursing care and comprehensive rehabilitation services in ${city}. Our Medicare-certified facility specializes in ${specialties.slice(0, 2).join(' and ')}, helping patients recover from surgery, illness, or injury with state-of-the-art therapy facilities and 24-hour nursing care.`;
    } else {
      return `${name} provides compassionate end-of-life care focused on comfort, dignity, and quality of life in ${city}. Our interdisciplinary team offers ${specialties.slice(0, 2).join(' and ')}, providing medical care, emotional support, and spiritual guidance for patients and families.`;
    }
  };

  for (let i = 0; i < OTHER_FACILITY_DATA.length; i++) {
    const data = OTHER_FACILITY_DATA[i];
    const facility = {
      name: data.name,
      slug: slugify(data.name),
      facilityType: data.facilityType,
      address: data.address,
      city: data.city,
      state: "WA",
      zipCode: data.zipCode,
      county: data.county,
      phone: data.phone,
      email: `info@${slugify(data.name).substring(0, 15)}.com`,
      capacity: data.capacity,
      availableBeds: Math.floor(Math.random() * Math.min(15, data.capacity * 0.2)) + 1,
      priceMin: data.priceMin,
      priceMax: data.priceMax,
      rating: (4.3 + Math.random() * 0.6).toFixed(1),
      reviewCount: Math.floor(Math.random() * 40) + 10,
      licenseNumber: data.licenseNumber,
      licenseStatus: "Active",
      lastInspectionDate: "2024-11-01",
      violationsCount: 0,
      acceptsMedicaid: data.facilityType === 'hospice' || data.facilityType === 'snf',
      acceptsPrivatePay: true,
      specialties: data.specialties,
      amenities: data.facilityType === 'alf' 
        ? ["Restaurant Dining", "Fitness Center", "Transportation", "24/7 Care", "Activities Program"]
        : data.facilityType === 'snf'
        ? ["Therapy Gym", "Private Rooms", "Medical Equipment", "24/7 Nursing", "Family Lounge"]
        : ["Private Suites", "Gardens", "Chapel", "Family Rooms", "Grief Counseling"],
      careTypes: data.specialties,
      certifications: data.facilityType === 'snf' 
        ? ["Medicare Certified", "Medicaid Certified", "DSHS Licensed"]
        : data.facilityType === 'hospice'
        ? ["DOH Licensed", "Medicare Certified", "NHPCO Member"]
        : ["DSHS Licensed", "State Certified"],
      images: getImagesForIndex(FACILITY_DATA.length + i),
      description: generateFictionalDescription(data.name, data.facilityType, data.city, data.specialties),
      yearEstablished: 2005 + Math.floor(Math.random() * 15),
      status: "active",
      featured: i % 20 === 0, // First of each type featured
      acceptingInquiries: "accepting",
      isDemo: true, // Mark all fictional facilities as demo data
    };

    const result = await db.insert(facilities).values(facility).returning({ id: facilities.id });
    facilityIds.push(result[0].id);
  }
  console.log(`Created ${OTHER_FACILITY_DATA.length} fictional facilities (20 ALF, 20 SNF, 20 Hospice)`);

  // Seed reviews for facilities
  let reviewsCreated = 0;
  for (let i = 0; i < facilityIds.length; i++) {
    const facilityId = facilityIds[i];
    const facilityName = FACILITY_DATA[i].name;
    const numReviews = 2 + Math.floor(Math.random() * 3); // 2-4 reviews per facility
    
    for (let j = 0; j < numReviews; j++) {
      const template = REVIEW_TEMPLATES[(i + j) % REVIEW_TEMPLATES.length];
      const reviewData = {
        facilityId,
        authorName: ["Maria S.", "John D.", "Linda P.", "Robert M.", "Susan K.", "James T.", "Patricia H.", "William C."][(i + j) % 8],
        authorEmail: `reviewer${i}_${j}@email.com`,
        rating: template.rating,
        title: template.title,
        content: template.content.replace("{name}", facilityName),
        status: "approved",
      };
      await db.insert(reviews).values(reviewData);
      reviewsCreated++;
    }
  }
  console.log(`Created ${reviewsCreated} reviews`);

  // Seed inquiries for some facilities
  let inquiriesCreated = 0;
  for (let i = 0; i < Math.min(15, facilityIds.length); i++) {
    const facilityId = facilityIds[i];
    const numInquiries = 1 + Math.floor(Math.random() * 3); // 1-3 inquiries
    
    for (let j = 0; j < numInquiries; j++) {
      const template = INQUIRY_TEMPLATES[(i + j) % INQUIRY_TEMPLATES.length];
      const inquiryData = {
        facilityId,
        name: template.name,
        email: template.email,
        phone: `(206) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
        message: template.message,
        careType: template.careType,
        moveInTimeline: template.timeline,
        status: ["new", "contacted", "toured"][Math.floor(Math.random() * 3)],
      };
      await db.insert(inquiries).values(inquiryData);
      inquiriesCreated++;
    }
  }
  console.log(`Created ${inquiriesCreated} inquiries`);

  // Seed team members for the first facility (for owner portal demo)
  const firstFacilityId = facilityIds[0];
  const teamMemberData = [
    {
      facilityId: firstFacilityId,
      name: "Hiwot Seifu",
      email: "hiwot.seifu@1stcareafh.com",
      role: "Owner/Administrator",
      status: "Active",
      isManualEntry: false,
    },
    {
      facilityId: firstFacilityId,
      name: "Maria Santos",
      email: "maria.santos@1stcareafh.com",
      role: "Caregiver (CNA)",
      status: "Active",
      isManualEntry: false,
    },
    {
      facilityId: firstFacilityId,
      name: "James Williams",
      email: "james.williams@1stcareafh.com",
      role: "Caregiver (HCA)",
      status: "Active",
      isManualEntry: false,
    },
    {
      facilityId: firstFacilityId,
      name: "Sarah Johnson",
      email: "sarah.johnson@1stcareafh.com",
      role: "Caregiver (HCA)",
      status: "Invited",
      isManualEntry: false,
    },
  ];

  const teamMemberIds: string[] = [];
  for (const member of teamMemberData) {
    const result = await db.insert(teamMembers).values(member).returning({ id: teamMembers.id });
    teamMemberIds.push(result[0].id);
  }
  console.log(`Created ${teamMemberIds.length} team members`);

  // Seed credentials for team members
  const credentialData = [
    {
      teamMemberId: teamMemberIds[0],
      name: "Administrator License",
      type: "Required",
      status: "Current",
      issuedDate: "2023-01-15",
      expiryDate: "2025-01-15",
      source: "External",
      issuer: "DSHS",
    },
    {
      teamMemberId: teamMemberIds[1],
      name: "Certified Nursing Assistant",
      type: "Required",
      status: "Current",
      issuedDate: "2022-06-01",
      expiryDate: "2025-06-01",
      source: "External",
      issuer: "WA DOH",
    },
    {
      teamMemberId: teamMemberIds[1],
      name: "Dementia Care Training",
      type: "Specialty",
      status: "Current",
      issuedDate: "2024-03-15",
      expiryDate: "2026-03-15",
      source: "Okapi Academy",
      issuer: "Okapi Academy",
    },
    {
      teamMemberId: teamMemberIds[2],
      name: "Home Care Aide Certificate",
      type: "Required",
      status: "Expiring Soon",
      issuedDate: "2022-12-01",
      expiryDate: "2024-12-01",
      source: "External",
      issuer: "DSHS",
    },
    {
      teamMemberId: teamMemberIds[2],
      name: "Mental Health First Aid",
      type: "Specialty",
      status: "Current",
      issuedDate: "2024-05-20",
      expiryDate: "2027-05-20",
      source: "Okapi Academy",
      issuer: "Okapi Academy",
    },
  ];

  for (const cred of credentialData) {
    await db.insert(credentials).values(cred);
  }
  console.log(`Created ${credentialData.length} credentials`);

  // Seed transport providers (NEMT marketplace)
  await db.delete(transportProviders);
  
  const transportProviderData = [
    {
      name: "Seattle Accessible Transportation",
      slug: "seattle-accessible-transportation",
      description: "Seattle Accessible Transportation is a trusted leader in non-emergency medical transportation across King County. We specialize in wheelchair-accessible vehicles, stretcher transport, and ambulatory services. Our trained drivers provide door-to-door service for dialysis, doctor appointments, and hospital discharges. With a commitment to safety and punctuality, we serve Adult Family Homes, skilled nursing facilities, and individual clients throughout the greater Seattle area.",
      phone: "(206) 555-0142",
      email: "dispatch@seattleaccessible.com",
      website: "https://seattleaccessibletransport.com/book",
      services: ["Wheelchair Transport", "Stretcher Service", "Ambulatory", "Door-to-Door"],
      serviceCounties: ["King County", "South King County", "Seattle Metro"],
      vehicleTypes: ["Wheelchair Van", "Stretcher Van", "Sedan"],
      operatingHours: "24/7 Service Available",
      acceptsMedicaid: true,
      acceptsMedicare: true,
      acceptsPrivatePay: true,
      acceptsInsurance: true,
      acceptedInsuranceList: "Most major insurance plans accepted",
      baseRateCents: 4500,
      pricePerMileCents: 275,
      pricingNotes: "Medicaid rates apply for eligible patients. Call for quotes on specialized transport.",
      rating: "4.8",
      reviewCount: 156,
      isVerified: true,
      isFeatured: true,
      displayOrder: 1,
      status: "active",
    },
    {
      name: "Rainier Mobility Solutions",
      slug: "rainier-mobility-solutions",
      description: "Rainier Mobility Solutions provides compassionate, reliable medical transportation throughout the Puget Sound region. Founded by healthcare professionals, we understand the unique needs of elderly and disabled passengers. Our fleet includes bariatric-capable vehicles, wheelchair lifts, and climate-controlled transport. We partner with Adult Family Homes to coordinate recurring rides for dialysis, therapy, and specialist appointments with flexible scheduling.",
      phone: "(253) 555-0198",
      email: "bookings@rainiermobility.com",
      website: "https://rainiermobility.com/schedule",
      services: ["Wheelchair Transport", "Bariatric Transport", "Ambulatory", "Recurring Rides"],
      serviceCounties: ["King County", "Pierce County", "South Sound"],
      vehicleTypes: ["Wheelchair Van", "Bariatric Van", "SUV"],
      operatingHours: "Mon-Sat 6am-10pm, Sun 8am-6pm",
      acceptsMedicaid: true,
      acceptsMedicare: true,
      acceptsPrivatePay: true,
      acceptsInsurance: true,
      acceptedInsuranceList: "Medicaid, Medicare, Molina, CHPW, Amerigroup",
      baseRateCents: 4000,
      pricePerMileCents: 250,
      pricingNotes: "Discounts available for recurring weekly rides. AFH partnership rates available.",
      rating: "4.6",
      reviewCount: 89,
      isVerified: true,
      isFeatured: true,
      displayOrder: 2,
      status: "active",
    },
    {
      name: "Upako Mobility",
      slug: "upako-mobility",
      description: "Upako Mobility is a community-focused NEMT provider serving diverse communities across Washington State. Our multilingual drivers and staff ensure comfortable, culturally sensitive transportation for all passengers. We specialize in non-emergency medical transport including dialysis, mental health appointments, and hospital discharges. With competitive Medicaid rates and flexible scheduling, we're the trusted choice for Adult Family Homes seeking reliable transport partners.",
      phone: "(206) 555-0267",
      email: "rides@upakomobility.com",
      website: "https://upakomobility.com/request",
      services: ["Wheelchair Transport", "Ambulatory", "Mental Health Transport", "Hospital Discharge"],
      serviceCounties: ["King County", "Snohomish County", "Seattle Metro"],
      vehicleTypes: ["Wheelchair Van", "Sedan", "Minivan"],
      operatingHours: "24/7 Dispatch Available",
      acceptsMedicaid: true,
      acceptsMedicare: false,
      acceptsPrivatePay: true,
      acceptsInsurance: true,
      acceptedInsuranceList: "Medicaid, Molina, Community Health Plan",
      baseRateCents: 3800,
      pricePerMileCents: 225,
      pricingNotes: "Multilingual drivers available upon request. Same-day booking when available.",
      rating: "4.5",
      reviewCount: 67,
      isVerified: true,
      isFeatured: false,
      displayOrder: 3,
      status: "active",
    },
    {
      name: "Seattle Flex Care",
      slug: "seattle-flex-care",
      description: "Seattle Flex Care offers premium non-emergency medical transportation with a focus on flexibility and patient comfort. Our modern fleet features wheelchair-accessible vehicles with extra legroom, climate control, and smooth suspension for a comfortable ride. We excel at last-minute bookings and accommodate schedule changes with ease. Perfect for Adult Family Homes that need a reliable backup transport partner or specialized long-distance medical transport.",
      phone: "(425) 555-0334",
      email: "schedule@seattleflexcare.com",
      website: "https://seattleflexcare.com/book-now",
      services: ["Wheelchair Transport", "Gurney Service", "Long-Distance Transport", "Same-Day Booking"],
      serviceCounties: ["King County", "Snohomish County", "Kitsap County", "Pierce County"],
      vehicleTypes: ["Wheelchair Van", "Gurney Van", "Luxury Sedan"],
      operatingHours: "Mon-Sun 5am-11pm",
      acceptsMedicaid: true,
      acceptsMedicare: true,
      acceptsPrivatePay: true,
      acceptsInsurance: true,
      acceptedInsuranceList: "All major insurance accepted",
      baseRateCents: 5000,
      pricePerMileCents: 300,
      pricingNotes: "Premium comfort transport. Long-distance trips to Spokane, Portland available.",
      rating: "4.7",
      reviewCount: 112,
      isVerified: true,
      isFeatured: true,
      displayOrder: 4,
      status: "active",
    },
  ];

  for (const provider of transportProviderData) {
    await db.insert(transportProviders).values(provider as any);
  }
  console.log(`Created ${transportProviderData.length} transport providers`);

  console.log("Database seeding completed successfully!");
  console.log(`Summary: ${facilityIds.length} facilities, ${reviewsCreated} reviews, ${inquiriesCreated} inquiries, ${teamMemberIds.length} team members, ${transportProviderData.length} transport providers`);
}

// Run if called directly
seedDatabase().catch(console.error);
