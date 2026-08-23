/**
 * Bundled showroom photos.
 *
 * Multiple images are available for each vehicle type so that
 * vehicles of the same type do not always display the same photo.
 */

import sedanSilver from "@/assets/vehicles/sedan-silver.jpg";
import suvWhite from "@/assets/vehicles/suv-white.jpg";
import truckBlue from "@/assets/vehicles/truck-blue.jpg";
import evRed from "@/assets/vehicles/ev-red.jpg";
import convertibleBlack from "@/assets/vehicles/convertible-black.jpg";
import suvGray from "@/assets/vehicles/suv-gray.jpg";
import coupeYellow from "@/assets/vehicles/coupe-yellow.jpg";
import offroadOrange from "@/assets/vehicles/offroad-orange.jpg";

import type { VehicleType } from "./types";

export const VEHICLE_IMAGES = [
  { label: "Silver Sedan", value: sedanSilver },
  { label: "White SUV", value: suvWhite },
  { label: "Blue Truck", value: truckBlue },
  { label: "Red Electric", value: evRed },
  { label: "Black Convertible", value: convertibleBlack },
  { label: "Gray SUV", value: suvGray },
  { label: "Yellow Coupe", value: coupeYellow },
  { label: "Orange Off-Road", value: offroadOrange },
];

/*
 * Image pools for each vehicle type.
 * The same type can now use different images.
 */
const BY_TYPE: Partial<Record<VehicleType, string[]>> = {
  Sedan: [
    sedanSilver,
    suvGray,
    coupeYellow,
  ],

  SUV: [
    suvWhite,
    suvGray,
    offroadOrange,
  ],

  Truck: [
    truckBlue,
    offroadOrange,
  ],

  Electric: [
    evRed,
    sedanSilver,
  ],

  Convertible: [
    convertibleBlack,
    coupeYellow,
  ],

  Coupe: [
    coupeYellow,
    convertibleBlack,
  ],
};

/**
 * Generates a deterministic number from the vehicle ID.
 * This ensures the same vehicle gets the same image
 * after refreshing the page.
 */
function hashId(id: string): number {
  let hash = 0;

  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }

  return hash;
}

/**
 * Returns a deterministic image based on:
 * 1. Vehicle type
 * 2. Vehicle ID
 *
 * Therefore, multiple vehicles of the same type can
 * display different images.
 */
export function fallbackImageFor(
  id: string,
  type: VehicleType,
): string {
  const images = BY_TYPE[type];

  if (images && images.length > 0) {
    return images[hashId(id) % images.length]!;
  }

  return VEHICLE_IMAGES[
    hashId(id) % VEHICLE_IMAGES.length
  ]!.value;
}