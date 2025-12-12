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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=755337",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=755642",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=757752",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=754734",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=755908",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=756657",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=756353",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=754712",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=755888",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=754177",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=755284",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=755603",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=756797",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=755763",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=754142",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=754459",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=754361",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=756015",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=754281",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=754316",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=757496",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=758357",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=755352",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=758096",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=754032",
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
    disclosureUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?Lic=754500",
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
    };

    const result = await db.insert(facilities).values(facility).returning({ id: facilities.id });
    facilityIds.push(result[0].id);
  }
  console.log(`Created ${facilityIds.length} AFH facilities from real King County data`);

  // Mock data for other facility types (ALF, SNF, Hospice)
  const OTHER_FACILITY_DATA = [
    // Assisted Living Facilities
    {
      name: "Sunrise Senior Living Seattle",
      facilityType: 'alf',
      address: "1515 Eastlake Ave E",
      city: "Seattle",
      zipCode: "98102",
      county: "King",
      phone: "(206) 555-0201",
      licenseNumber: "ALF-001234",
      capacity: 85,
      specialties: ["Memory Care", "Respite Care", "Independent Living"],
      description: "Sunrise Senior Living offers a welcoming community for seniors seeking assisted living in the heart of Seattle. Our elegant facility features restaurant-style dining, engaging activities, and compassionate care available 24/7.",
      priceMin: 5200,
      priceMax: 8500,
    },
    {
      name: "Bellevue Gardens Assisted Living",
      facilityType: 'alf',
      address: "4500 148th Ave NE",
      city: "Bellevue",
      zipCode: "98007",
      county: "King",
      phone: "(425) 555-0302",
      licenseNumber: "ALF-001235",
      capacity: 120,
      specialties: ["Memory Care", "Rehabilitation", "Respite Care"],
      description: "A premier assisted living community in Bellevue offering luxury accommodations, personalized care plans, and a vibrant social calendar. Our dedicated staff ensures residents feel at home while receiving the support they need.",
      priceMin: 5800,
      priceMax: 9200,
    },
    // Skilled Nursing Facilities
    {
      name: "Evergreen Rehabilitation Center",
      facilityType: 'snf',
      address: "2200 NE 150th St",
      city: "Shoreline",
      zipCode: "98155",
      county: "King",
      phone: "(206) 555-0403",
      licenseNumber: "SNF-002341",
      capacity: 75,
      specialties: ["Physical Therapy", "Cardiac Rehab", "Post-Surgery Recovery"],
      description: "Evergreen Rehabilitation Center provides skilled nursing care and comprehensive rehabilitation services. Our medical team specializes in helping patients recover from surgery, illness, or injury with state-of-the-art therapy facilities.",
      priceMin: 8500,
      priceMax: 12000,
    },
    {
      name: "Pacific Northwest Nursing & Rehab",
      facilityType: 'snf',
      address: "5600 California Ave SW",
      city: "Seattle",
      zipCode: "98136",
      county: "King",
      phone: "(206) 555-0504",
      licenseNumber: "SNF-002342",
      capacity: 90,
      specialties: ["Stroke Recovery", "Wound Care", "Respiratory Therapy"],
      description: "Pacific Northwest Nursing & Rehabilitation offers 24-hour skilled nursing care and specialized rehabilitation programs. Our Medicare-certified facility provides comprehensive medical care in a comfortable, healing environment.",
      priceMin: 9200,
      priceMax: 14000,
    },
    // Hospice Care
    {
      name: "Peaceful Journey Hospice",
      facilityType: 'hospice',
      address: "789 Totem Lake Way",
      city: "Kirkland",
      zipCode: "98034",
      county: "King",
      phone: "(425) 555-0605",
      licenseNumber: "HSP-003451",
      capacity: 16,
      specialties: ["In-Home Care", "Residential Hospice", "Respite Care"],
      description: "Peaceful Journey Hospice provides compassionate end-of-life care focused on comfort, dignity, and quality of life. Our interdisciplinary team offers medical care, emotional support, and spiritual guidance for patients and families.",
      priceMin: 0, // Often covered by Medicare/insurance
      priceMax: 6000,
    },
    {
      name: "Serenity Hospice House",
      facilityType: 'hospice',
      address: "1234 Redmond Way",
      city: "Redmond",
      zipCode: "98052",
      county: "King",
      phone: "(425) 555-0706",
      licenseNumber: "HSP-003452",
      capacity: 12,
      specialties: ["Residential Hospice", "Family Counseling", "Bereavement Support"],
      description: "Serenity Hospice House offers a peaceful, home-like setting for individuals in their final journey. Our caring staff provides holistic support including pain management, emotional care, and family services in a serene environment.",
      priceMin: 0,
      priceMax: 5500,
    },
  ];

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
      availableBeds: Math.floor(Math.random() * 8) + 1,
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
      description: data.description,
      yearEstablished: 2005 + Math.floor(Math.random() * 15),
      status: "active",
      featured: i === 0 || i === 2 || i === 4, // One of each type featured
      acceptingInquiries: "accepting",
    };

    const result = await db.insert(facilities).values(facility).returning({ id: facilities.id });
    facilityIds.push(result[0].id);
  }
  console.log(`Created ${OTHER_FACILITY_DATA.length} additional facilities (ALF, SNF, Hospice)`);

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
