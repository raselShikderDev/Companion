export interface ICreateExplorer {
  email: string;
  password: string;
  explorer: {
    fullName: string;
    phone: string;
    gender: string;
    profilePicture: string;
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