import { TripStatus } from "@prisma/client";
import { z } from "zod";

// If you accept date strings (e.g. via JSON), you can coerce them into Date:
const dateSchema = z.preprocess((arg) => {
  if (typeof arg === "string" || arg instanceof Date) {
    const d = new Date(arg);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return arg;
}, z.date());

export const createTripZodSchema = z.object({
  title: z.string().min(1, "Title is required"),
  destination: z.string().min(1, "Destination is required"),
  departureLocation: z.string().min(1, "Departure location is required"),
  startDate: dateSchema,
  endDate: dateSchema,
  description: z.string().optional(),
  budget: z.string().min(1, "Budget is required"),
  image: z.url( "Valid url person is required"),
  journeyType: z.array(z.string().min(1)).nonempty("At least one journey type is required"),
  duration: z.string().min(1, "Duration is required"),
  Languages: z.array(z.string().min(1)).nonempty("At least one language is required"),
});

// Infer TS type if needed
export type CreateTripInput = z.infer<typeof createTripZodSchema>;

// {
//   "title": "Backpacking Adventure in Kyoto",
//   "destination": "Kyoto, Japan",
//   "departureLocation": "San Francisco, USA",
//   "startDate": "2024-04-10T00:00:00.000Z",
//   "endDate": "2024-04-20T00:00:00.000Z",
//   "description": "Experience the cherry blossoms and ancient temples on a budget.",
//   "budget": "2500 USD",
//   "requiredPerson": "3",
//   "journeyType": [
//     "Adventure",
//     "Cultural",
//     "Sightseeing"
//   ],
//   "duration": "10 Days",
//   "Languages": [
//     "English",
//     "Japanese"
//   ]
// }

export const updateTripSchema = z.object({
  title: z.string().min(1).optional(),
  destination: z.string().min(1).optional(),
  departureLocation: z.string().min(1).optional(),
  startDate: z.preprocess((arg) => (arg ? new Date(arg as string) : undefined), z.date().optional()),
  endDate: z.preprocess((arg) => (arg ? new Date(arg as string) : undefined), z.date().optional()),
  description: z.string().optional(),
  budget: z.string().optional(),
  image: z.url().optional(),
  journeyType: z.array(z.string()).optional(),
  duration: z.string().optional(),
  Languages: z.array(z.string()).optional(),
  status: z.enum(TripStatus).optional(),
});

export const updateTripStausSchema = z.object({
  status: z.enum(TripStatus)
});