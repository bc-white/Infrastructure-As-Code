import type { Location } from './common';

export interface Merchant {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  location?: Location;
  contact?: string;
  email?: string;
  website?: string;
  category?: string;
  totalDiscounts?: number;
  createdAt: string;
  updatedAt: string;
}
