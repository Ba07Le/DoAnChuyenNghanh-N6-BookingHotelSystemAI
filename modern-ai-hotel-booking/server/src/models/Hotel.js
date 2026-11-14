import mongoose from "mongoose";
const hotelSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  hotelTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "HotelType", required: true },
  destinationId: { type: mongoose.Schema.Types.ObjectId, ref: "Destination", required: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, default: "" },
  starRating: { type: Number, required: true, min: 1, max: 5 },
  address: { addressLine: String, ward: String, district: String, city: { type: String, required: true }, country: { type: String, default: "Vietnam" }, postalCode: String },
  location: { type: { type: String, enum: ["Point"], default: "Point" }, coordinates: { type: [Number], required: true } },
  images: [{ url: { type: String, required: true }, publicId: { type: String, default: "" }, isPrimary: { type: Boolean, default: false } }],
  amenities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Amenity" }],
  policies: { checkInTime: { type: String, default: "14:00" }, checkOutTime: { type: String, default: "12:00" }, cancellationPolicy: String, childPolicy: String, petPolicy: String },
  contact: { phone: String, email: String, website: String },
  status: { type: String, enum: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "SUSPENDED"], default: "DRAFT", index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  hotelType: { type: String, enum: ["HOTEL", "RESORT", "VILLA", "APARTMENT", "HOMESTAY", "BOUTIQUE"], default: "HOTEL", index: true },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  embedding: { type: [Number], select: false }
}, { timestamps: true, collection: "hotels" });
hotelSchema.index({ location: "2dsphere" });
hotelSchema.index({ "address.city": 1, status: 1 });
hotelSchema.index({ destinationId: 1, status: 1, isFeatured: 1 });
hotelSchema.index({ status: 1, isFeatured: 1, averageRating: -1 });
export default mongoose.model("Hotel", hotelSchema);
