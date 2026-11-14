import "dotenv/config";
import mongoose from "mongoose";
import Hotel from "../src/models/Hotel.js";
import Review from "../src/models/Review.js";
import { embed } from "../src/services/embedding.js";
import { buildHotelText } from "../src/services/hotelText.js";
import "../src/models/Amenity.js";

await mongoose.connect(process.env.MONGODB_URI);

const hotels = await Hotel.find({ status: "APPROVED" }).populate("amenities", "name");

for (const h of hotels) {
  const reviews = await Review.find({ hotelId: h._id, status: "PUBLISHED" })
    .sort({ createdAt: -1 }).limit(5).select("comment").lean();
  const vector = await embed(buildHotelText(h, reviews));
  await Hotel.updateOne({ _id: h._id }, { $set: { embedding: vector } });
  console.log("done:", h.name);
}

await mongoose.disconnect();