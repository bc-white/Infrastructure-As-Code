// Card Types and Interfaces

export type CardStatus = 'active' | 'expired' | 'suspended' | 'pending';
export type CardType = 'digital' | 'physical';

export interface Card {
  id: string;
  userId: string;
  cardNumber: string; // Format: XXXX-XXXX-XXXX-XXXX
  cardType: CardType;
  status: CardStatus;
  issuedDate: string; // ISO date
  expiryDate: string; // ISO date
  lastVerified: string; // ISO date
  holderName: string;
  universityName?: string;
  universityLogo?: string;
  qrCodeData?: string; // Encrypted QR data
  createdAt: string;
  updatedAt: string;
}

export interface QRCodeData {
  userId: string;
  cardId: string;
  discountId?: string;
  timestamp: string;
  expiresAt: string;
  signature: string;
  sessionToken: string;
}

export interface CardRedemption {
  id: string;
  userId: string;
  discountId: string;
  merchantId: string;
  merchantName: string;
  merchantLogo?: string;
  discountTitle: string;
  discountValue: string;
  pointsEarned: number;
  redeemedAt: string;
  location?: string;
  category: string;
}

export interface CardStatusInfo {
  status: CardStatus;
  reason?: string;
  actionRequired?: string;
  actionLabel?: string;
  actionUrl?: string;
}
