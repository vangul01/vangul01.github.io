export interface SanityProduct {
    _id: string;
    _type: 'product';
    slug: {
      current: string;
    };
    name: string;
    description?: string;
    price: number;
    materials?: string;
    dimensions?: string;
    quantity: number;
    stripePriceId: string;
    images: {
        asset: {
          url: string;
        };
    }[];
    category: 'paintings' | 'digital' | 'stationary' | 'textiles' | 'misc';
    featured?: 'new' | 'popular';
  }

  export interface Product {
    _id: string;
    slug: string;
    name: string;
    description?: string;
    price: number;
    materials?: string;
    dimensions?: string;
    quantity: number;
    stripePriceId: string;
    images: string[];
    category: SanityProduct['category'];
    featured?: SanityProduct['featured'];
  }