export interface SanityProduct {
  _id: string;
  _type: 'product';
  slug: {
    current: string;
  };
  name: string;
  description?: string;
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

export interface SanityCollaboration {
  _id: string;
  _type: 'collab';
  title: string;
  client: string;
  company?: string;
  description?: string;
  completedDate?: string;
  link?: string;
  clientLink?: string;
  clientReview?: string;
  tags?: string[];
  images: {
    asset: {
      url: string;
    };
  }[];
}

export interface Product {
  _id: string;
  slug: string;
  name: string;
  description?: string;
  materials?: string;
  dimensions?: string;
  quantity: number;
  stripePriceId: string;
  images: string[];
  category: SanityProduct['category'];
  featured?: SanityProduct['featured'];
}

export interface Collaboration {
  _id: string;
  title: string;
  client: string;
  company?: string;
  description?: string;
  completedDate?: string;
  link?: string;
  clientLink?: string;
  clientReview?: string;
  tags?: string[];
  images: string[];
}

export interface CartItem {
  priceId: string;
  name: string;
  quantity: number;
  image?: string;
}
