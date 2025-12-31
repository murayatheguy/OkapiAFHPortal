/**
 * Update all facilities with 10 sample images
 */
import "dotenv/config";
import { db } from "../db";
import { facilities } from "../../shared/schema";

const sampleImages = [
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop",
];

async function updateImages() {
  console.log("Updating all facilities with 10 sample images...");

  const result = await db.update(facilities)
    .set({ images: sampleImages })
    .returning({ id: facilities.id, name: facilities.name });

  console.log(`✅ Updated ${result.length} facilities with images:`);
  result.forEach((f, i) => {
    console.log(`   ${i + 1}. ${f.name}`);
  });

  // Verify
  const check = await db.query.facilities.findFirst({
    columns: { name: true, images: true }
  });

  console.log(`\n📸 Verification:`);
  console.log(`   Facility: ${check?.name}`);
  console.log(`   Image count: ${check?.images?.length || 0}`);
}

updateImages()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  });
