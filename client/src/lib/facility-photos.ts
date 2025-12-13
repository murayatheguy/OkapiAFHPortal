import type { Facility } from "@shared/schema";

export type PhotoSource = 'owner' | 'google' | 'placeholder';

export interface FacilityPhotosResult {
  photos: string[];
  source: PhotoSource;
  showAttribution: boolean;
  isPlaceholder: boolean;
}

const PLACEHOLDER_PATHS: Record<string, string> = {
  afh: '/placeholders/afh-placeholder.svg',
  alf: '/placeholders/alf-placeholder.svg',
  snf: '/placeholders/snf-placeholder.svg',
  hospice: '/placeholders/hospice-placeholder.svg',
  default: '/placeholders/default-placeholder.svg',
};

export function getPlaceholderForFacilityType(facilityType?: string): string {
  if (!facilityType) return PLACEHOLDER_PATHS.default;
  const type = facilityType.toLowerCase();
  return PLACEHOLDER_PATHS[type] || PLACEHOLDER_PATHS.default;
}

export function getFacilityPhotos(facility: Facility): FacilityPhotosResult {
  if (facility.images && facility.images.length > 0) {
    return {
      photos: facility.images,
      source: 'owner',
      showAttribution: false,
      isPlaceholder: false,
    };
  }

  if (facility.googlePhotos && Array.isArray(facility.googlePhotos) && facility.googlePhotos.length > 0) {
    return {
      photos: facility.googlePhotos as string[],
      source: 'google',
      showAttribution: true,
      isPlaceholder: false,
    };
  }

  const placeholder = getPlaceholderForFacilityType(facility.facilityType);
  return {
    photos: [placeholder],
    source: 'placeholder',
    showAttribution: false,
    isPlaceholder: true,
  };
}

export function getPrimaryPhoto(facility: Facility): string {
  const { photos } = getFacilityPhotos(facility);
  return photos[0];
}

export function hasRealPhotos(facility: Facility): boolean {
  const { source } = getFacilityPhotos(facility);
  return source !== 'placeholder';
}
