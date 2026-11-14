import { openai, embed } from "./embedding.js";
import Hotel from "../models/Hotel.js";
import RoomType from "../models/RoomType.js";
import Destination from "../models/Destination.js";
import Coupon from "../models/Coupon.js";
import User from "../models/User.js";
import Wishlist from "../models/Wishlist.js";
import "../models/Amenity.js";

const SYSTEM = `Bạn là trợ lý đặt phòng khách sạn. Trả lời bằng ngôn ngữ của người dùng (Việt hoặc Anh).
- Luôn dùng công cụ để lấy dữ liệu thật. Không bịa khách sạn, giá, phòng hay mã giảm giá.
- Giá là VND/đêm (giá cơ bản). Chưa kiểm tra phòng trống theo ngày; hãy nói rõ nếu người dùng hỏi về ngày.
- Với yêu cầu mơ hồ (yên tĩnh, lãng mạn, gần biển...) dùng semantic_search_hotels. Với bộ lọc rõ ràng (thành phố, giá, số khách) dùng search_hotels / find_rooms.
- Tên thành phố nên viết tiếng Việt có dấu (vd: Đà Nẵng).
- Gợi ý 2-4 lựa chọn, mỗi lựa chọn kèm lý do ngắn.
- Nếu thiếu thông tin quan trọng, hỏi một câu ngắn.`;

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function fromPrices(ids) {
  const rows = await RoomType.aggregate([
    { $match: { hotelId: { $in: ids }, status: "ACTIVE" } },
    { $group: { _id: "$hotelId", fromPrice: { $min: "$basePrice" } } },
  ]);
  return Object.fromEntries(rows.map((r) => [String(r._id), r.fromPrice]));
}

const shape = (h, prices) => ({
  id: String(h._id),
  name: h.name,
  stars: h.starRating,
  type: h.hotelType,
  rating: h.averageRating,
  city: h.address?.city,
  district: h.address?.district,
  fromPrice: prices[String(h._id)] ?? null,
  summary: (h.description || "").slice(0, 200),
  ...(h.score !== undefined && { score: Number(h.score.toFixed(3)) }),
});

const handlers = {
  async semantic_search_hotels({ query, minStars, hotelType, limit = 4 }) {
    const filter = { status: "APPROVED" };
    if (minStars) filter.starRating = { $gte: minStars };
    if (hotelType) filter.hotelType = hotelType;

    const hotels = await Hotel.aggregate([
      {
        $vectorSearch: {
          index: "hotel_vector_index",
          path: "embedding",
          queryVector: await embed(query),
          numCandidates: 50,
          limit: Math.min(limit, 8),
          filter,
        },
      },
      {
        $project: {
          name: 1, starRating: 1, hotelType: 1, averageRating: 1, description: 1,
          "address.city": 1, "address.district": 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);
    const good = hotels.filter((h) => h.score > 0.5);
    const prices = await fromPrices(good.map((h) => h._id));
    return good.map((h) => shape(h, prices));
  },

  async search_hotels({ city, minStars, hotelType, minPrice, maxPrice, guests, limit = 5 }) {
    const q = { status: "APPROVED" };
    if (city) {
      const rx = new RegExp(esc(city), "i");
      const dests = await Destination.find({ status: "ACTIVE", $or: [{ name: rx }, { slug: rx }] })
        .select("_id").lean();
      q.$or = [
        { destinationId: { $in: dests.map((d) => d._id) } },
        { "address.city": rx },
        { name: rx },
      ];
    }
    if (minStars) q.starRating = { $gte: minStars };
    if (hotelType) q.hotelType = hotelType;

    if (minPrice || maxPrice || guests) {
      const rq = { status: "ACTIVE" };
      if (minPrice || maxPrice) {
        rq.basePrice = {};
        if (minPrice) rq.basePrice.$gte = minPrice;
        if (maxPrice) rq.basePrice.$lte = maxPrice;
      }
      if (guests) rq["capacity.total"] = { $gte: guests };
      q._id = { $in: await RoomType.distinct("hotelId", rq) };
    }

    const hotels = await Hotel.find(q)
      .sort({ averageRating: -1, isFeatured: -1 })
      .limit(Math.min(limit, 10))
      .select("name starRating hotelType averageRating description address.city address.district")
      .lean();
    const prices = await fromPrices(hotels.map((h) => h._id));
    return hotels.map((h) => shape(h, prices));
  },

  async find_rooms({ hotelId, maxPrice, adults, children = 0, limit = 8 }) {
    const q = { status: "ACTIVE" };
    if (hotelId) q.hotelId = hotelId;
    if (maxPrice) q.basePrice = { $lte: maxPrice };
    if (adults) {
      q["capacity.adults"] = { $gte: adults };
      q["capacity.total"] = { $gte: adults + children };
    }
    const rooms = await RoomType.find(q)
      .sort({ basePrice: 1 })
      .limit(Math.min(limit, 15))
      .populate("hotelId", "name starRating status address.city")
      .select("name bedType size basePrice capacity hotelId")
      .lean();

    return rooms
      .filter((r) => r.hotelId?.status === "APPROVED")
      .map((r) => ({
        roomTypeId: String(r._id),
        room: r.name,
        bed: r.bedType,
        sizeM2: r.size,
        pricePerNight: r.basePrice,
        capacity: r.capacity,
        hotel: { id: String(r.hotelId._id), name: r.hotelId.name, stars: r.hotelId.starRating, city: r.hotelId.address?.city },
      }));
  },

  async get_coupons() {
    const now = new Date();
    const coupons = await Coupon.find({ status: "ACTIVE", startDate: { $lte: now }, endDate: { $gte: now } })
      .select("code title shortDescription discountType discountValue minBookingAmount maxDiscount usageLimit usedCount endDate")
      .lean();
    return coupons.filter((c) => !c.usageLimit || c.usedCount < c.usageLimit);
  },

  // userId comes from your auth middleware, never from the model
  async get_user_profile(_args, { userId }) {
    if (!userId) return { error: "User not logged in" };
    const [user, wishlist] = await Promise.all([
      User.findById(userId).select("fullName preferences").lean(),
      Wishlist.find({ userId }).populate("hotelId", "name address.city").limit(10).lean(),
    ]);
    return {
      name: user?.fullName,
      preferences: user?.preferences,
      wishlist: wishlist.filter((w) => w.hotelId).map((w) => ({ id: String(w.hotelId._id), name: w.hotelId.name, city: w.hotelId.address?.city })),
    };
  },
};

const fn = (name, description, properties = {}, required = []) => ({
  type: "function",
  function: { name, description, parameters: { type: "object", properties, required } },
});

const HOTEL_TYPES = ["HOTEL", "RESORT", "VILLA", "APARTMENT", "HOMESTAY", "BOUTIQUE"];

const tools = [
  fn("semantic_search_hotels", "Tìm khách sạn theo ý nghĩa/phong cách (yên tĩnh, lãng mạn, gần biển, gia đình...).", {
    query: { type: "string", description: "Mô tả nhu cầu của khách" },
    minStars: { type: "number" },
    hotelType: { type: "string", enum: HOTEL_TYPES },
    limit: { type: "number" },
  }, ["query"]),
  fn("search_hotels", "Lọc khách sạn theo thành phố, sao, loại, khoảng giá/đêm, số khách.", {
    city: { type: "string" },
    minStars: { type: "number" },
    hotelType: { type: "string", enum: HOTEL_TYPES },
    minPrice: { type: "number" },
    maxPrice: { type: "number" },
    guests: { type: "number" },
    limit: { type: "number" },
  }),
  fn("find_rooms", "Tìm loại phòng theo giá và sức chứa, rẻ nhất trước.", {
    hotelId: { type: "string" },
    maxPrice: { type: "number" },
    adults: { type: "number" },
    children: { type: "number" },
    limit: { type: "number" },
  }),
  fn("get_coupons", "Danh sách mã giảm giá đang có hiệu lực."),
  fn("get_user_profile", "Sở thích và wishlist của người dùng đang đăng nhập."),
];

export async function chat(history, userId) {
  const model = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
  const messages = [{ role: "system", content: SYSTEM }, ...history];

  for (let i = 0; i < 5; i++) {
    const res = await openai.chat.completions.create({ model, messages, tools, temperature: 0.3 });
    const msg = res.choices[0].message;
    messages.push(msg);
    if (!msg.tool_calls?.length) return msg.content;

    for (const call of msg.tool_calls) {
      let out;
      try {
        out = await handlers[call.function.name](JSON.parse(call.function.arguments || "{}"), { userId });
      } catch (e) {
        out = { error: e.message };
      }
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(out) });
    }
  }
  return "Xin lỗi, mình chưa xử lý được yêu cầu này. Bạn thử hỏi lại nhé.";
}