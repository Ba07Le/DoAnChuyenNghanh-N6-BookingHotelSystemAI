import { useState } from "react";
import { Link } from "react-router-dom";
import { toggleWishlist } from "../../api/profileApi";
import { Bath, Heart, MapPin, Star, Waves, Wifi, Wind } from "lucide-react";

function HotelCard({ hotel }) {
  const [liked, setLiked] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const getAmenityIcon = (amenity) => {
  const text = (typeof amenity === "string" ? amenity : amenity?.name || "").toLowerCase();
  if (text.includes("wi-fi")) return <Wifi size={14} />;
  if (text.includes("hồ bơi")) return <Waves size={14} />;
  if (text.includes("điều hòa")) return <Wind size={14} />;
  if (text.includes("bồn tắm")) return <Bath size={14} />;
  return null;
};

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
      <div className="flex flex-col md:flex-row">
        {/* IMAGE */}
        <div className="relative h-64 w-full overflow-hidden md:h-auto md:w-[310px] md:shrink-0">
          <img
            src={hotel.image}
            alt={hotel.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-70" />

          {/* Featured */}
          {hotel.featured && (
            <div className="absolute left-4 top-4 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
              Nổi bật
            </div>
          )}

          {/* Wishlist */}
          <button
            type="button"
            onClick={async () => { try { const r = await toggleWishlist(hotel._id || hotel.id); setLiked(r.liked); } catch { setLiked(!liked); } }}
            className="
              absolute right-4 top-4
              flex h-10 w-10
              items-center justify-center
              rounded-full
              bg-white/90
              text-slate-700
              shadow-lg
              backdrop-blur
              transition-all
              duration-200
              hover:scale-105
            "
          >
            <Heart
              size={18}
              className={liked ? "fill-red-500 text-red-500" : "text-slate-700"}
            />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex min-w-0 flex-1 flex-col p-5">
          <div className="flex flex-1 flex-col">
            {/* Hotel type */}
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
              {hotel.hotelType === "RESORT"
                ? "Resort"
                : hotel.hotelType === "BOUTIQUE"
                  ? "Boutique Hotel"
                  : "Khách sạn"}
            </div>

            {/* Name */}
            <h2 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-blue-600">
              {hotel.name}
            </h2>

            {/* Stars */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: hotel.stars || 0 }).map((_, index) => (
                  <Star
                    key={index}
                    size={14}
                    className="fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              <span className="text-xs text-slate-400">{hotel.stars} sao</span>
            </div>

            {/* Location */}
            <div className="mt-3 flex items-start gap-2 text-sm text-slate-500">
              <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />

              <span>
  {typeof hotel.address === "string"
    ? hotel.address
    : [hotel.address?.addressLine, hotel.address?.district, hotel.address?.city]
        .filter(Boolean)
        .join(", ")}
</span>
            </div>

            {/* Rating */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-blue-600 px-2 text-sm font-bold text-white">
                {hotel.rating}
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {hotel.rating >= 4.8
                    ? "Xuất sắc"
                    : hotel.rating >= 4.5
                      ? "Rất tốt"
                      : "Tốt"}
                </p>

                <p className="text-xs text-slate-400">
                  {hotel.reviews} đánh giá
                </p>
              </div>
            </div>

            {/* Amenities */}
            <div className="mt-5 flex flex-wrap gap-2">
              {(hotel.amenities || []).slice(0, 4).map((amenity, i) => {
  const label = typeof amenity === "string" ? amenity : amenity?.name;
  return (
    <span
      key={amenity?._id || label || i}
      className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600"
    >
      {getAmenityIcon(amenity)}
      {label}
    </span>
  );
})}
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-end sm:justify-between">
            {/* Room */}
            <div>
              <p className="text-xs text-slate-400">Phòng đề xuất</p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {hotel.roomType}
              </p>
            </div>

            {/* Price */}
            <div className="sm:text-right">
              <p className="text-xs text-slate-400">Từ</p>

              <div className="mt-1">
                <span className="text-xl font-bold text-slate-900">
                  {formatPrice(hotel.price)}
                </span>

                <span className="ml-1 text-xs text-slate-400">đ / đêm</span>
              </div>

              <p className="mt-1 text-xs text-slate-400">
                Đã bao gồm thuế & phí
              </p>
            </div>

            {/* CTA */}
            <Link
              to={`/hotels/${hotel.slug}`}
              className="
                rounded-xl
                bg-slate-900
                px-5 py-3
                text-sm font-semibold
                text-white
                transition-all
                duration-200
                hover:bg-blue-600
                hover:shadow-lg
                active:scale-[0.98]
              "
            >
              Xem chi tiết
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default HotelCard;
