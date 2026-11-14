export function buildHotelText(hotel, reviews) {
  return [
    `${hotel.name} - ${hotel.starRating} star ${hotel.hotelType}`,
    `Location: ${[hotel.address?.district, hotel.address?.city].filter(Boolean).join(", ")}`,
    hotel.description,
    `Amenities: ${hotel.amenities.map((a) => a.name).join(", ")}`,
    reviews.length ? `Guest reviews: ${reviews.map((r) => r.comment).filter(Boolean).join(" | ")}` : "",
  ].filter(Boolean).join("\n");
}
