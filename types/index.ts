export type Category = {
  id: string;
  name: string;
  slug?: string;
};

export type Product = {
  id: string;
  name: string;
  code: string;
  description?: string;
  price: number;
  category_id?: string | null;
  images: string[];
  available: boolean;
  published: boolean;
};