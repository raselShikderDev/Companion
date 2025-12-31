// import { Gender } from "@prisma/client";

import { Gender } from "@prisma/client";

export interface ICreateExplorer {
  email: string;
  password: string;
  explorer: {
    fullName: string;
    phone: string;
    gender: string;
    // profilePicture: string;
  }
}


export interface ICreateAdmin {
  email: string;
  password: string;
  admin: {
    fullName: string;
    phone: string;
    profilePicture: string;
  };
}

// travelStylesTags e.g., ["Mountain", "Campigning",]
// intrests e.g., ["Backpacker", "Luxury", "Budget"]


export interface UpdateProfilePictureInput {
  profilePicture: string;
}

export interface UpdateUserProfileInput {
  fullName?: string;
  gender?: Gender;
  age?: string;
  address?: string;
  bio?: string;
  phone?: string;
  travelStyleTags?: string[];
  interests?: string[];
  profilePicture?: string; 
}