import { Router } from "express";
import { db } from "../../db";
import { facilityImages } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { getUploadUrl, deleteFile, isS3Configured } from "../../storage/s3";
import { success, error } from "../../utils/responses";
import { requirePermission } from "../../middleware/permissions";
import { logPHIAccess } from "../../middleware/audit";

export const imagesRouter = Router();

// Check if S3 is configured
imagesRouter.get("/config", (req, res) => {
  res.json(success({
    s3Configured: isS3Configured(),
    maxImages: 10,
  }));
});

// Get presigned upload URL
imagesRouter.post("/upload-url",
  requirePermission("facility:edit"),
  async (req: any, res) => {
    try {
      const { filename, contentType } = req.body;
      const facilityId = req.facilityScope;

      if (!facilityId) {
        return res.status(403).json(error("PERMISSION_DENIED", "No facility access"));
      }

      if (!isS3Configured()) {
        return res.status(503).json(error("SERVICE_UNAVAILABLE", "File storage not configured"));
      }

      // Validate content type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(contentType)) {
        return res.status(400).json(error("VALIDATION_FAILED", "Invalid file type. Allowed: JPEG, PNG, WebP, GIF"));
      }

      // Check current image count
      const existing = await db
        .select()
        .from(facilityImages)
        .where(eq(facilityImages.facilityId, facilityId));

      if (existing.length >= 10) {
        return res.status(400).json(error("VALIDATION_FAILED", "Maximum 10 images allowed. Delete an existing image first."));
      }

      const result = await getUploadUrl({
        facilityId,
        folder: "images",
        filename,
        contentType,
      });

      res.json(success(result));
    } catch (err) {
      console.error("Get upload URL error:", err);
      res.status(500).json(error("INTERNAL_ERROR", "Failed to get upload URL"));
    }
  }
);

// Register uploaded image in database
imagesRouter.post("/",
  requirePermission("facility:edit"),
  async (req: any, res) => {
    try {
      const { imageUrl, caption, isPrimary } = req.body;
      const facilityId = req.facilityScope;

      if (!facilityId) {
        return res.status(403).json(error("PERMISSION_DENIED", "No facility access"));
      }

      if (!imageUrl) {
        return res.status(400).json(error("VALIDATION_FAILED", "Image URL required"));
      }

      // Check image count
      const existing = await db
        .select()
        .from(facilityImages)
        .where(eq(facilityImages.facilityId, facilityId));

      if (existing.length >= 10) {
        return res.status(400).json(error("VALIDATION_FAILED", "Maximum 10 images allowed"));
      }

      // Get next sort order
      const maxOrder = existing.reduce((max, img) =>
        Math.max(max, img.sortOrder || 0), -1);

      // If setting as primary, unset existing primary
      if (isPrimary) {
        await db.update(facilityImages)
          .set({ isPrimary: false })
          .where(eq(facilityImages.facilityId, facilityId));
      }

      const [image] = await db.insert(facilityImages).values({
        facilityId,
        imageUrl,
        caption: caption || null,
        isPrimary: isPrimary || existing.length === 0, // First image is primary by default
        sortOrder: maxOrder + 1,
      }).returning();

      await logPHIAccess(req, {
        action: "create",
        resourceType: "facility_image",
        resourceId: image.id.toString(),
        description: `Added image to facility ${facilityId}`,
      });

      res.status(201).json(success(image));
    } catch (err) {
      console.error("Register image error:", err);
      res.status(500).json(error("INTERNAL_ERROR", "Failed to save image"));
    }
  }
);

// Get facility images
imagesRouter.get("/",
  async (req: any, res) => {
    try {
      const facilityId = req.facilityScope || req.query.facilityId;

      if (!facilityId) {
        return res.status(400).json(error("VALIDATION_FAILED", "Facility ID required"));
      }

      const images = await db
        .select()
        .from(facilityImages)
        .where(eq(facilityImages.facilityId, facilityId))
        .orderBy(facilityImages.sortOrder);

      res.json(success(images));
    } catch (err) {
      console.error("Get images error:", err);
      res.status(500).json(error("INTERNAL_ERROR", "Failed to get images"));
    }
  }
);

// Update image (caption, primary, order)
imagesRouter.patch("/:id",
  requirePermission("facility:edit"),
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const { caption, isPrimary, sortOrder } = req.body;
      const facilityId = req.facilityScope;

      // Verify image belongs to facility
      const [existing] = await db
        .select()
        .from(facilityImages)
        .where(and(
          eq(facilityImages.id, parseInt(id)),
          eq(facilityImages.facilityId, facilityId)
        ));

      if (!existing) {
        return res.status(404).json(error("NOT_FOUND", "Image not found"));
      }

      // If setting as primary, unset existing primary
      if (isPrimary) {
        await db.update(facilityImages)
          .set({ isPrimary: false })
          .where(eq(facilityImages.facilityId, facilityId));
      }

      const [updated] = await db.update(facilityImages)
        .set({
          caption: caption !== undefined ? caption : existing.caption,
          isPrimary: isPrimary !== undefined ? isPrimary : existing.isPrimary,
          sortOrder: sortOrder !== undefined ? sortOrder : existing.sortOrder,
        })
        .where(eq(facilityImages.id, parseInt(id)))
        .returning();

      res.json(success(updated));
    } catch (err) {
      console.error("Update image error:", err);
      res.status(500).json(error("INTERNAL_ERROR", "Failed to update image"));
    }
  }
);

// Delete image
imagesRouter.delete("/:id",
  requirePermission("facility:edit"),
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const facilityId = req.facilityScope;

      // Verify image belongs to facility
      const [image] = await db
        .select()
        .from(facilityImages)
        .where(and(
          eq(facilityImages.id, parseInt(id)),
          eq(facilityImages.facilityId, facilityId)
        ));

      if (!image) {
        return res.status(404).json(error("NOT_FOUND", "Image not found"));
      }

      // Try to delete from S3 (ignore errors - file may not exist)
      if (image.imageUrl.includes("s3.")) {
        try {
          const key = image.imageUrl.split(".amazonaws.com/")[1];
          if (key) {
            await deleteFile(key);
          }
        } catch (err) {
          console.warn("Failed to delete S3 file:", err);
        }
      }

      // Delete from database
      await db.delete(facilityImages).where(eq(facilityImages.id, parseInt(id)));

      await logPHIAccess(req, {
        action: "delete",
        resourceType: "facility_image",
        resourceId: id,
        description: `Deleted image from facility ${facilityId}`,
      });

      res.json(success({ deleted: true }));
    } catch (err) {
      console.error("Delete image error:", err);
      res.status(500).json(error("INTERNAL_ERROR", "Failed to delete image"));
    }
  }
);
