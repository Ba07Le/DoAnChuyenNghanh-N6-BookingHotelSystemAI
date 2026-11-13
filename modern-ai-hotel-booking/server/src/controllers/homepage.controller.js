import "../models/Amenity.js";
import Hotel from "../models/Hotel.js"; import Destination from "../models/Destination.js"; import HotelType from "../models/HotelType.js"; import Coupon from "../models/Coupon.js"; import RoomType from "../models/RoomType.js";
export const getHomepageData=async(req,res)=>{try{const now=new Date(); const [destinations,featuredHotels,hotelTypes,deals]=await Promise.all([
Destination.find({status:"ACTIVE",featured:true}).sort({sortOrder:1}).limit(8).lean(),
Hotel.find({status:"APPROVED",isFeatured:true}).populate("hotelTypeId","name slug").populate("destinationId","name slug").populate("amenities","name slug icon").sort({averageRating:-1,reviewCount:-1}).limit(6).lean(),
HotelType.find({status:"ACTIVE"}).sort({sortOrder:1}).lean(),
Coupon.find({status:"ACTIVE",startDate:{$lte:now},endDate:{$gte:now}}).sort({featured:-1,discountValue:-1}).limit(6).lean()]);
const featuredIds=featuredHotels.map(h=>h._id); const featuredRooms=await RoomType.find({hotelId:{$in:featuredIds},status:"ACTIVE"}).sort({basePrice:1}).lean(); const priceMap=new Map(); featuredRooms.forEach(r=>{const k=String(r.hotelId);if(!priceMap.has(k))priceMap.set(k,r.basePrice)});
const typeCounts=await Hotel.aggregate([{$match:{status:"APPROVED"}},{$group:{_id:"$hotelType",hotelCount:{$sum:1}}}]); const typeCountMap=Object.fromEntries(typeCounts.map(x=>[x._id,x.hotelCount]));
const formattedTypes=hotelTypes.map(t=>({...t,type:t.slug.toUpperCase(),hotelCount:typeCountMap[t.slug.toUpperCase()]||0}));
const formattedHotels=featuredHotels.map(h=>({...h,priceFrom:priceMap.get(String(h._id))||0}));
res.json({success:true,data:{destinations:destinations.map(d=>({...d,city:d.name,image:d.image?.url||""})),featuredHotels:formattedHotels,hotelTypes:formattedTypes,deals}});}catch(e){console.error(e);res.status(500).json({success:false,message:"Không thể tải dữ liệu trang chủ."});}};
