/** biome-ignore-all lint/style/useImportType: > */
import { TripStatus } from "@prisma/client";

export interface createTripInput {
  title: string;
  destination: string;
  departureLocation: string;
  startDate: Date;
  endDate: Date;
  description?: string;
  budget: string;
  image: string;
  journeyType: string[]; // ["Phising", "Mountain", "Campigning",]
  duration: string;
  Languages: string[]; // ["Bengali", "English"]
}

export interface UpdateTripInput {
  title?: string;
  destination?: string;
  departureLocation?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  description?: string;
  budget?: string;
  image?: string;
  journeyType?: string[];
  duration?: string;
  Languages?: string[];
  status?: TripStatus;
}
