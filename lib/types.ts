export type WeddingDay = 'Aug 31 — Welcome Dinner' | 'Sep 1 — Wedding Day' | 'Sep 2 — Pool Party' | 'Sep 3 — Checkout' | 'All Days' | 'N/A';
export type Payer = string; // dynamic — driven by Contributor names

export interface Contributor {
  id: string;
  name: string;
  type: 'fixed' | 'remaining';  // fixed target or gets all remaining
  target?: number;               // only for 'fixed' type
  color: string;
  payerNames: string[];          // payment.paidBy values that count toward this contributor
}
export type PayStatus = 'Paid' | 'Pending' | 'Deposit Paid';

export interface Payment {
  id: string;
  amount: number;
  paidBy: string;   // "Jeff" | "Nat" | "Mike" | "Tony" | etc.
  date: string;
  note: string;
  isCash: boolean;
}

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
  payments: Payment[];          // payment history (deposits, partials, cash, etc.)
  taxRate?: number;             // optional tax % for non-variable items, e.g. 22 for Italy IVA
  isVariable?: boolean;         // amount computed from per-person rate × guest count
  perPersonRate?: number;       // per-person rate in €
  variableTaxRate?: number;     // tax rate % applied to per-person rate
  variableGuestType?: 'main' | 'pool'; // which guest count to use
}

export interface BudgetSettings {
  mainGuestCount: number;
  poolGuestCount: number;
  contributors: Contributor[];
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
export interface TorontoGuest {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  rsvp: 'Confirmed' | 'Pending' | 'Declined';
  dietary: 'None' | 'Vegetarian' | 'Vegan' | 'Gluten-Free' | 'Nut Allergy' | 'Dairy-Free' | 'Other';
  dietaryNotes?: string;
  side: 'J' | 'N' | 'Both';
  notes?: string;
  group?: string;
}

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

// ── Wedding Events (set by couple, shown on public page + RSVP form) ─
export interface WeddingEvent {
  id: string;
  name: string;         // "Welcome Dinner", "Wedding Ceremony", etc.
  date: string;         // ISO date "2026-08-31"
  time?: string;        // "7:00 PM"
  description?: string; // Short note for guests
  dresscode?: string;   // "Black Tie", "Cocktail Attire", etc.
}

// ── RSVP Submissions (from public guest portal) ─────────────────────
export interface RsvpSubmission {
  id: string;
  wedding_id: string;
  first_name: string;
  last_name: string;
  email: string;
  rsvp: 'Confirmed' | 'Declined';
  dietary: string;
  dietary_notes: string;
  meal_choice: string;
  notes: string;
  submitted_at: string;
  imported: boolean;
}

// ── Multi-tenant: one record per couple ────────────────────────────
export interface Wedding {
  id: string;
  owner_id: string;
  slug: string | null;
  partner1_name: string;
  partner2_name: string;
  wedding_date: string | null;      // ISO date e.g. "2026-08-31"
  wedding_end_date: string | null;  // ISO date e.g. "2026-09-02"
  venue_name: string;
  venue_location: string;
  welcome_message: string;
  is_public: boolean;
  member_emails: string[];          // other users who can access this wedding
  events: WeddingEvent[];           // schedule shown on public page
  meal_choices: string[];           // meal options shown on RSVP form
  created_at: string;
  updated_at: string;
}
