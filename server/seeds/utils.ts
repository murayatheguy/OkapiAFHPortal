/**
 * Seed Utility Functions
 *
 * Helper functions for generating test data.
 */

import bcrypt from "bcryptjs";

// ============ NAME POOLS ============

export const FIRST_NAMES = [
  "Maria", "James", "Linda", "Robert", "Patricia", "Michael", "Barbara",
  "William", "Elizabeth", "David", "Jennifer", "Richard", "Susan", "Joseph",
  "Margaret", "Thomas", "Dorothy", "Charles", "Lisa", "Daniel", "Nancy",
  "Matthew", "Karen", "Anthony", "Betty", "Donald", "Helen", "Steven",
  "Sandra", "Paul", "Donna", "Andrew", "Carol", "Joshua", "Ruth", "Kenneth",
  "Sharon", "Kevin", "Michelle", "Brian", "Emily", "George", "Amanda",
  "Edward", "Melissa", "Ronald", "Deborah", "Timothy", "Stephanie", "Jason"
];

export const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
  "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
  "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
  "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
  "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green",
  "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell"
];

export const CITIES_WA = [
  "Seattle", "Tacoma", "Bellevue", "Everett", "Kent", "Renton", "Spokane",
  "Federal Way", "Yakima", "Bellingham", "Kirkland", "Auburn", "Redmond",
  "Olympia", "Sammamish", "Lakewood", "Burien", "Shoreline", "Bothell"
];

export const COUNTIES_WA: Record<string, string> = {
  "Seattle": "King",
  "Bellevue": "King",
  "Kent": "King",
  "Renton": "King",
  "Kirkland": "King",
  "Auburn": "King",
  "Redmond": "King",
  "Sammamish": "King",
  "Burien": "King",
  "Shoreline": "King",
  "Tacoma": "Pierce",
  "Lakewood": "Pierce",
  "Everett": "Snohomish",
  "Bothell": "Snohomish",
  "Spokane": "Spokane",
  "Yakima": "Yakima",
  "Bellingham": "Whatcom",
  "Federal Way": "King",
  "Olympia": "Thurston",
};

export const STREET_NAMES = [
  "Oak", "Maple", "Cedar", "Pine", "Elm", "Willow", "Birch", "Cherry",
  "Walnut", "Spruce", "Ash", "Magnolia", "Cypress", "Hickory", "Poplar"
];

// ============ RANDOM GENERATORS ============

/**
 * Get random item from array
 */
export function randomFrom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get random integer between min and max (inclusive)
 */
export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get random date between two dates
 */
export function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Generate a unique name that hasn't been used yet
 */
export function generateUniqueName(usedNames: Set<string>): { first: string; last: string } {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const first = randomFrom(FIRST_NAMES);
    const last = randomFrom(LAST_NAMES);
    const fullName = `${first} ${last}`;

    if (!usedNames.has(fullName)) {
      usedNames.add(fullName);
      return { first, last };
    }
    attempts++;
  }

  // Fallback: add number suffix
  const first = randomFrom(FIRST_NAMES);
  const last = `${randomFrom(LAST_NAMES)}-${Date.now()}`;
  return { first, last };
}

/**
 * Generate a phone number
 */
export function generatePhone(areaCode: string = "206"): string {
  const exchange = randomBetween(200, 999);
  const subscriber = randomBetween(1000, 9999);
  return `${areaCode}-${exchange}-${subscriber}`;
}

/**
 * Generate an address
 */
export function generateAddress(): string {
  const number = randomBetween(100, 9999);
  const street = randomFrom(STREET_NAMES);
  const type = randomFrom(["Street", "Avenue", "Lane", "Drive", "Way", "Court"]);
  return `${number} ${street} ${type}`;
}

/**
 * Generate a birth date for an elderly resident
 */
export function generateElderlyBirthDate(minAge: number = 65, maxAge: number = 95): string {
  const age = randomBetween(minAge, maxAge);
  const today = new Date();
  const birthYear = today.getFullYear() - age;
  const birthMonth = randomBetween(0, 11);
  const birthDay = randomBetween(1, 28);
  return new Date(birthYear, birthMonth, birthDay).toISOString().split("T")[0];
}

/**
 * Generate a date within the past N years as string
 */
export function generatePastDateStr(yearsBack: number): string {
  const end = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - yearsBack);
  const date = randomDate(start, end);
  return date.toISOString().split("T")[0];
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Generate a PIN (4 digits)
 */
export function generatePin(): string {
  return String(randomBetween(1000, 9999));
}

/**
 * Format a date for logging
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Create a slug from text
 */
export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ============ LOGGING ============

export const log = {
  info: (msg: string) => console.log(`   ${msg}`),
  success: (msg: string) => console.log(`   ✅ ${msg}`),
  skip: (msg: string) => console.log(`   ⏭️  ${msg}`),
  warn: (msg: string) => console.log(`   ⚠️  ${msg}`),
  error: (msg: string) => console.error(`   ❌ ${msg}`),
  header: (msg: string) => console.log(`\n📍 ${msg}`),
  divider: () => console.log("─".repeat(60)),
};
