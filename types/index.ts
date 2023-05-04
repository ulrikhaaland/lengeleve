export type Dish = {
  id: number;
  name: string;
  price: number;
  description: string;
  imgUrl: string;
};

export type Restaurant = {
  id: number;
  name: string;
  address: string;
  rating: number;
  priceLevel: number;
  coverImg: string;
  categories: string;
  dishes: Dish[];
  openingHours: string;
  homepage: string;
  phone: string;
  popular: boolean;
};
