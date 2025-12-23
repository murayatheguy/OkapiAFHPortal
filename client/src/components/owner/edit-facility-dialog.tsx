import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Building2, Phone, Bed, Heart, Image, X, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Facility } from "@shared/schema";

interface EditFacilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facility: Facility;
  onSuccess?: () => void;
}

const COMMON_AMENITIES = [
  "Private Rooms", "Shared Rooms", "Private Bathroom", "Garden/Outdoor Space",
  "Common Area", "TV/Entertainment", "WiFi", "Laundry Service",
  "Meal Preparation", "Transportation", "Pet Friendly", "24/7 Care",
  "Wheelchair Accessible", "Emergency Call System", "Secured Entry"
];

const COMMON_SPECIALTIES = [
  "Memory Care", "Dementia Care", "Alzheimer's Care", "Mobility Assistance",
  "Diabetes Management", "Heart Condition Care", "Stroke Recovery",
  "Parkinson's Care", "Mental Health Support", "Hospice Care",
  "Respite Care", "Post-Surgery Recovery", "Medication Management"
];

const COMMON_CARE_TYPES = [
  "Activities of Daily Living (ADL)", "Medication Administration",
  "Behavioral Support", "Nursing Services", "Physical Therapy",
  "Occupational Therapy", "Speech Therapy", "Wound Care"
];

export function EditFacilityDialog({ open, onOpenChange, facility, onSuccess }: EditFacilityDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
    email: "",
    website: "",
    capacity: 0,
    availableBeds: 0,
    priceMin: 0,
    priceMax: 0,
    amenities: [] as string[],
    specialties: [] as string[],
    careTypes: [] as string[],
    acceptsMedicaid: false,
    acceptsPrivatePay: false,
    images: [] as string[],
  });

  const [newAmenity, setNewAmenity] = useState("");
  const [newSpecialty, setNewSpecialty] = useState("");
  const [newCareType, setNewCareType] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");

  // Initialize form data when facility changes
  useEffect(() => {
    if (facility) {
      setFormData({
        name: facility.name || "",
        description: facility.description || "",
        phone: facility.phone || "",
        email: facility.email || "",
        website: facility.website || "",
        capacity: facility.capacity || 0,
        availableBeds: facility.availableBeds || 0,
        priceMin: facility.priceMin || 0,
        priceMax: facility.priceMax || 0,
        amenities: facility.amenities || [],
        specialties: facility.specialties || [],
        careTypes: facility.careTypes || [],
        acceptsMedicaid: facility.acceptsMedicaid || false,
        acceptsPrivatePay: facility.acceptsPrivatePay || false,
        images: facility.images || [],
      });
    }
  }, [facility]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiRequest("PATCH", `/api/owners/facilities/${facility.id}`, formData);
      toast({
        title: "Facility Updated",
        description: "Your changes have been saved successfully.",
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update facility",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = (field: 'amenities' | 'specialties' | 'careTypes', value: string) => {
    if (value && !formData[field].includes(value)) {
      setFormData({ ...formData, [field]: [...formData[field], value] });
    }
  };

  const removeItem = (field: 'amenities' | 'specialties' | 'careTypes' | 'images', value: string) => {
    setFormData({ ...formData, [field]: formData[field].filter(item => item !== value) });
  };

  const addImageUrl = () => {
    if (newImageUrl && !formData.images.includes(newImageUrl)) {
      setFormData({ ...formData, images: [...formData.images, newImageUrl] });
      setNewImageUrl("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-teal-300 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-teal-700 flex items-center gap-2" style={{ fontFamily: "'Cormorant', serif" }}>
            <Building2 className="h-5 w-5" />
            Edit Facility
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Update your facility information and listing details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-gray-50">
              <TabsTrigger value="basic" className="text-xs data-[state=active]:bg-teal-100">
                Basic
              </TabsTrigger>
              <TabsTrigger value="contact" className="text-xs data-[state=active]:bg-teal-100">
                Contact
              </TabsTrigger>
              <TabsTrigger value="capacity" className="text-xs data-[state=active]:bg-teal-100">
                Capacity
              </TabsTrigger>
              <TabsTrigger value="features" className="text-xs data-[state=active]:bg-teal-100">
                Features
              </TabsTrigger>
              <TabsTrigger value="photos" className="text-xs data-[state=active]:bg-teal-100">
                Photos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-gray-500">Facility Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-gray-50 border-teal-300 text-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-500">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your facility, the care you provide, and what makes it special..."
                  className="bg-gray-50 border-teal-300 text-gray-700 min-h-[150px]"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-gray-500">Accepts Medicaid</Label>
                  <p className="text-xs text-stone-500">Show in Medicaid-friendly searches</p>
                </div>
                <Switch
                  checked={formData.acceptsMedicaid}
                  onCheckedChange={(checked) => setFormData({ ...formData, acceptsMedicaid: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-gray-500">Accepts Private Pay</Label>
                  <p className="text-xs text-stone-500">Show in private pay searches</p>
                </div>
                <Switch
                  checked={formData.acceptsPrivatePay}
                  onCheckedChange={(checked) => setFormData({ ...formData, acceptsPrivatePay: checked })}
                />
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-gray-500 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="bg-gray-50 border-teal-300 text-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-500">Email Address</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@facility.com"
                  className="bg-gray-50 border-teal-300 text-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-500">Website</Label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.yourfacility.com"
                  className="bg-gray-50 border-teal-300 text-gray-700"
                />
              </div>
            </TabsContent>

            <TabsContent value="capacity" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-500 flex items-center gap-2">
                    <Bed className="h-4 w-4" />
                    Total Capacity
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    className="bg-gray-50 border-teal-300 text-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Available Beds</Label>
                  <Input
                    type="number"
                    min="0"
                    max={formData.capacity}
                    value={formData.availableBeds}
                    onChange={(e) => setFormData({ ...formData, availableBeds: parseInt(e.target.value) || 0 })}
                    className="bg-gray-50 border-teal-300 text-gray-700"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-500">Minimum Monthly Rate ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.priceMin || ""}
                    onChange={(e) => setFormData({ ...formData, priceMin: parseInt(e.target.value) || 0 })}
                    placeholder="3500"
                    className="bg-gray-50 border-teal-300 text-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Maximum Monthly Rate ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.priceMax || ""}
                    onChange={(e) => setFormData({ ...formData, priceMax: parseInt(e.target.value) || 0 })}
                    placeholder="6000"
                    className="bg-gray-50 border-teal-300 text-gray-700"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="features" className="space-y-6 mt-4">
              {/* Amenities */}
              <div className="space-y-3">
                <Label className="text-gray-500 flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Amenities
                </Label>
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map((amenity) => (
                    <Badge key={amenity} className="bg-teal-100 text-teal-600 hover:bg-amber-900/50">
                      {amenity}
                      <button type="button" onClick={() => removeItem('amenities', amenity)} className="ml-1">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    placeholder="Add custom amenity..."
                    className="bg-gray-50 border-teal-300 text-gray-700 flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addItem('amenities', newAmenity);
                        setNewAmenity("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => { addItem('amenities', newAmenity); setNewAmenity(""); }}
                    className="border-teal-300"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {COMMON_AMENITIES.filter(a => !formData.amenities.includes(a)).slice(0, 8).map((amenity) => (
                    <Badge
                      key={amenity}
                      variant="outline"
                      className="text-gray-500 border-gray-200 cursor-pointer hover:bg-gray-50 text-xs"
                      onClick={() => addItem('amenities', amenity)}
                    >
                      + {amenity}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Specialties */}
              <div className="space-y-3">
                <Label className="text-gray-500">Care Specialties</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.specialties.map((specialty) => (
                    <Badge key={specialty} className="bg-teal-900/30 text-teal-200 hover:bg-teal-900/50">
                      {specialty}
                      <button type="button" onClick={() => removeItem('specialties', specialty)} className="ml-1">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    placeholder="Add custom specialty..."
                    className="bg-gray-50 border-teal-300 text-gray-700 flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addItem('specialties', newSpecialty);
                        setNewSpecialty("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => { addItem('specialties', newSpecialty); setNewSpecialty(""); }}
                    className="border-teal-300"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {COMMON_SPECIALTIES.filter(s => !formData.specialties.includes(s)).slice(0, 6).map((specialty) => (
                    <Badge
                      key={specialty}
                      variant="outline"
                      className="text-gray-500 border-gray-200 cursor-pointer hover:bg-gray-50 text-xs"
                      onClick={() => addItem('specialties', specialty)}
                    >
                      + {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Care Types */}
              <div className="space-y-3">
                <Label className="text-gray-500">Care Services</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.careTypes.map((careType) => (
                    <Badge key={careType} className="bg-purple-900/30 text-purple-200 hover:bg-purple-900/50">
                      {careType}
                      <button type="button" onClick={() => removeItem('careTypes', careType)} className="ml-1">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newCareType}
                    onChange={(e) => setNewCareType(e.target.value)}
                    placeholder="Add custom care service..."
                    className="bg-gray-50 border-teal-300 text-gray-700 flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addItem('careTypes', newCareType);
                        setNewCareType("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => { addItem('careTypes', newCareType); setNewCareType(""); }}
                    className="border-teal-300"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {COMMON_CARE_TYPES.filter(c => !formData.careTypes.includes(c)).slice(0, 5).map((careType) => (
                    <Badge
                      key={careType}
                      variant="outline"
                      className="text-gray-500 border-gray-200 cursor-pointer hover:bg-gray-50 text-xs"
                      onClick={() => addItem('careTypes', careType)}
                    >
                      + {careType}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="photos" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-gray-500 flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Photo URLs
                </Label>
                <p className="text-xs text-stone-500">
                  Add URLs to photos of your facility. Photos help families get a better sense of your home.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Facility photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-teal-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder-facility.jpg";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem('images', image)}
                      className="absolute top-2 right-2 bg-red-900/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="bg-gray-50 border-teal-300 text-gray-700 flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addImageUrl();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addImageUrl}
                  className="border-teal-300 text-gray-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Photo
                </Button>
              </div>

              <p className="text-xs text-stone-500">
                Tip: Use image hosting services like Imgur, Cloudinary, or Google Photos to get shareable image URLs.
              </p>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-teal-300 text-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-500"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
