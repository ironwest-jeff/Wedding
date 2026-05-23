export type WeddingDay = 'Aug 31 — Welcome Dinner' | 'Sep 1 — Wedding Day' | 'Sep 2 — Pool Party' | 'Sep 3 — Checkout' | 'All Days' | 'N/A';
export type Payer = 'Nat/Jeff' | 'Mike' | 'Tony' | 'Shared' | 'Vendor';
export type PayStatus = 'Paid' | 'Pending' | 'Deposit Paid';

export interface BudgetItem {
  id: string;
  category: string;
  description: string;
  vendor?: string;
  day: WeddingDay;
  totalAmount: number;
  paidBy: Payer;
  status: PayStatus;
  notes?: string;
  dueDate?: string;
}

export type DietaryRestriction = 'None' | 'Vegetarian' | 'Vegan' | 'Gluten-Free' | 'Kosher' | 'Halal' | 'Nut Allergy' | 'Dairy-Free' | 'Other';
export type RSVPStatus = 'Confirmed' | 'Pending' | 'Declined';
export type Accommodation = 'Hotel' | 'Airbnb' | 'Family Home' | 'Other' | 'Local — No Stay';
export type GuestSide = 'J' | 'N' | 'Both';

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  side: GuestSide;
  rsvp: RSVPStatus;
  dietary: DietaryRestriction;
  dietaryNotes?: string;
  accommodation: Accommodation;
  accommodationNotes?: string;
  days: WeddingDay[];
  plusOne?: string;
  notes?: string;
  group?: string;
}

export type VillaLocation = 'Main Villa' | 'Second Villa';

export interface VillaRoom {
  id: string;
  roomName: string;
  location: VillaLocation;
  roomType: string;
  guests: string;
  guestCount: number;
  costEUR: number;
  amountPaidEUR: number;
  payStatus: PayStatus;
  includedInVenue: boolean;
  notes?: string;
}

export type ChecklistCategory = 'Venue' | 'Catering' | 'Music' | 'Flowers' | 'Attire' | 'Photography' | 'Logistics' | 'Invitations' | 'Legal' | 'Other';
export type ChecklistPriority = 'High' | 'Medium' | 'Low';

export interface ChecklistItem {
  id: string;
  task: string;
  category: ChecklistCategory;
  priority: ChecklistPriority;
  done: boolean;
  dueDate?: string;
  notes?: string;
  assignedTo?: string;
}

// Toronto Wedding types
export interface TorontoBudgetItem {
  id: string;
  category: string;
  description: string;
  vendor?: string;
  totalAmount: number;
  paidBy: string;
  status: PayStatus;
  notes?: string;
}

export interface TorontoChecklistItem {
  id: string;
  task: string;
  category: string;
  priority: ChecklistPriority;
  done: boolean;
  dueDate?: string;
  notes?: string;
}
