import { memo } from "react";
import { LocationId } from "@jones/shared";

/**
 * Location icons using AI-generated pixel-art building assets.
 * Images served from public/assets/buildings/.
 */

const LOCATION_ASSET_MAP: Record<LocationId, string> = {
  home: "home.png",
  pawn_shop: "pawn-shop.png",
  store: "z-mart.png",
  burger_joint: "monolith-burgers.png",
  clothing_store: "qt-clothing.png",
  electronics: "socket-city.png",
  university: "university.png",
  employment_office: "employment-office.png",
  workplace: "factory.png",
  bank: "bank.png",
  market: "blacks-market.png",
  rent_office: "rent-office.png",
  entertainment: "entertainment.png",
};

interface LocationIconProps {
  locationId: LocationId;
  size?: number;
}

export const LocationIcon = memo(function LocationIcon({ locationId, size = 32 }: LocationIconProps) {
  const asset = LOCATION_ASSET_MAP[locationId];
  if (!asset) return null;

  return (
    <img
      src={`/assets/buildings/${asset}`}
      alt={locationId.replace(/_/g, " ")}
      width={size}
      height={size}
      style={{ imageRendering: "pixelated", objectFit: "contain" }}
      loading="lazy"
    />
  );
});
