import "dotenv/config";
import { db } from "../server/db";
import { owners, facilities } from "../shared/schema";
import bcrypt from "bcryptjs";

async function createTestOwner() {
  console.log("Creating test owner and facility...");

  // Hash password
  const passwordHash = await bcrypt.hash("test123", 10);

  // Create owner
  const [owner] = await db
    .insert(owners)
    .values({
      email: "test@example.com",
      passwordHash,
      name: "Test Owner",
      phone: "555-123-4567",
      status: "active",
      emailVerified: true,
    })
    .onConflictDoUpdate({
      target: owners.email,
      set: {
        passwordHash,
        name: "Test Owner",
        status: "active",
        emailVerified: true,
      },
    })
    .returning();

  console.log("Owner created:", owner.id, owner.email);

  // Create facility
  const [facility] = await db
    .insert(facilities)
    .values({
      name: "Test Adult Family Home",
      address: "123 Test Street",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
      county: "King",
      phone: "555-987-6543",
      email: "test@facility.com",
      capacity: 6,
      availableBeds: 2,
      currentOccupancy: 4,
      licenseNumber: "TEST-12345",
      licenseStatus: "Active",
      ownerName: owner.name,
      ownerId: owner.id,
      description: "A test facility for development purposes",
      amenities: ["Private Rooms", "Garden", "24/7 Care"],
      specialties: ["Memory Care", "Mobility Assistance"],
      photos: [],
      acceptsMedicaid: true,
      acceptsMedicare: true,
      acceptsPrivatePay: true,
      isVerified: true,
      status: "active",
      slug: "test-adult-family-home",
    } as any)
    .onConflictDoNothing()
    .returning();

  if (facility) {
    console.log("Facility created:", facility.id, facility.name);
  } else {
    // Get existing facility
    const existingFacilities = await db
      .select()
      .from(facilities)
      .where((f: any) => f.ownerId === owner.id);
    console.log("Facility already exists or linked to owner");
  }

  console.log("\n✅ Test account ready!");
  console.log("Email: test@example.com");
  console.log("Password: test123");
  console.log("\nLogin at: http://localhost:5000/owner/login");

  process.exit(0);
}

createTestOwner().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
