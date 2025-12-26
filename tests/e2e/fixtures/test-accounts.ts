/**
 * Test Account Credentials
 * All 10 AFH owner accounts for E2E testing
 */

export interface TestAccount {
  id: string;
  email: string;
  password: string;
  facilityName: string;
  ownerName: string;
  specialty: string;
  city: string;
}

export const TEST_PASSWORD = 'test123';

export const TEST_ACCOUNTS: TestAccount[] = [
  {
    id: 'afh-001',
    email: 'test@example.com',
    password: TEST_PASSWORD,
    facilityName: 'Test Adult Family Home',
    ownerName: 'Test Owner',
    specialty: 'General',
    city: 'Seattle',
  },
  {
    id: 'afh-002',
    email: 'test1@example.com',
    password: TEST_PASSWORD,
    facilityName: 'Sunrise Memory Care',
    ownerName: 'Sarah Johnson',
    specialty: 'Dementia',
    city: 'Tacoma',
  },
  {
    id: 'afh-003',
    email: 'test2@example.com',
    password: TEST_PASSWORD,
    facilityName: 'Harmony Mental Health Home',
    ownerName: 'Michael Chen',
    specialty: 'Mental Health',
    city: 'Bellevue',
  },
  {
    id: 'afh-004',
    email: 'test3@example.com',
    password: TEST_PASSWORD,
    facilityName: 'Golden Hearts DD Care',
    ownerName: 'Emily Williams',
    specialty: 'Developmental Disabilities',
    city: 'Everett',
  },
  {
    id: 'afh-005',
    email: 'test4@example.com',
    password: TEST_PASSWORD,
    facilityName: 'Comfort Hospice Home',
    ownerName: 'Robert Martinez',
    specialty: 'Hospice',
    city: 'Kent',
  },
  {
    id: 'afh-006',
    email: 'test5@example.com',
    password: TEST_PASSWORD,
    facilityName: 'Evergreen Senior Living',
    ownerName: 'Linda Davis',
    specialty: 'Budget',
    city: 'Renton',
  },
  {
    id: 'afh-007',
    email: 'test6@example.com',
    password: TEST_PASSWORD,
    facilityName: 'Prestige Estates AFH',
    ownerName: 'William Thompson',
    specialty: 'Premium',
    city: 'Kirkland',
  },
  {
    id: 'afh-008',
    email: 'test7@example.com',
    password: TEST_PASSWORD,
    facilityName: 'Phuc Loc Family Home',
    ownerName: 'Linh Nguyen',
    specialty: 'Vietnamese',
    city: 'Federal Way',
  },
  {
    id: 'afh-009',
    email: 'test8@example.com',
    password: TEST_PASSWORD,
    facilityName: 'Casa de Carino',
    ownerName: 'Maria Garcia',
    specialty: 'Spanish',
    city: 'Yakima',
  },
  {
    id: 'afh-010',
    email: 'test9@example.com',
    password: TEST_PASSWORD,
    facilityName: 'Veterans Haven AFH',
    ownerName: 'James Wilson',
    specialty: 'Veterans',
    city: 'Spokane',
  },
];

export function getTestAccount(identifier: number | string): TestAccount {
  if (typeof identifier === 'number') {
    return TEST_ACCOUNTS[identifier];
  }
  const account = TEST_ACCOUNTS.find(a => a.email === identifier);
  if (!account) throw new Error(`Account not found: ${identifier}`);
  return account;
}

export function getAllTestAccounts(): TestAccount[] {
  return TEST_ACCOUNTS;
}
