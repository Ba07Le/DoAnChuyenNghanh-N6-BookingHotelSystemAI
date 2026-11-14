import "dotenv/config";
import mongoose from "mongoose";
import Hotel from "../src/models/Hotel.js";
import { embed } from "../src/services/embedding.js";

await mongoose.connect(process.env.MONGODB_URI);

const query = process.argv[2] || "quiet beach hotel with a pool";
const queryVector = await embed(query);

const results = await Hotel.aggregate([
  {
    $vectorSearch: {
      index: "hotel_vector_index",
      path: "embedding",
      queryVector,
      numCandidates: 50,
      limit: 3,
      filter: { status: "APPROVED" },
    },
  },
  { $project: { name: 1, "address.city": 1, score: { $meta: "vectorSearchScore" } } },
]);

console.log(results);
await mongoose.disconnect();