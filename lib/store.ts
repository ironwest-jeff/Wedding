'use client';
import { BudgetItem, Guest, ChecklistItem, TorontoBudgetItem, TorontoChecklistItem, VillaRoom, TorontoGuest, BudgetSettings } from './types';

const DEFAULT_BUDGET_SETTINGS: BudgetSettings = { mainGuestCount: 106, poolGuestCount: 60, jeffNatTarget: 18000, mikeTarget: 10000 };
import { GUEST_SEED, BUDGET_SEED, VILLA_SEED, CHECKLIST_SEED } from './seedData';
import { supabase } from './supabase';

// ── Wedding ID (set once after login, scopes all data access) ─────────────────

let _weddingId: string | null = null;

export function setWeddingId(id: string): void { _weddingId = id; }
export function getWeddingId(): string | null { return _weddingId; }

/** Prefix a localStorage key with the current wedding ID */
function lk(key: string): string {
  return _weddingId ? `${_weddingId}_${key}` : key;
}

// ── One-time migration: copy unprefixed LS keys → prefixed keys ───────────────

const LEGACY_KEYS = [
  'budget_items', 'guests_v2', 'checklist_v2', 'toronto_budget',
  'toronto_checklist', 'villa_rooms', 'toronto_guests', 'budget_settings', 'seating_v1',
];

/**
 * Call immediately after setWeddingId() on first load.
 * Copies any existing (un-prefixed) localStorage data into the new
 * wedding-scoped keys so Jeff & Nat's data is preserved automatically.
 */
export function migrateLegacyLocalStorage(): void {
  if (typeof window === 'undefined') return;
  // Data is now in Supabase scoped by wedding_id — just wipe any old unprefixed keys
  // so a new user on the same device never inherits another couple's data
  for (const key of LEGACY_KEYS) {
    localStorage.removeItem(key);
  }
}

// ── Local storage helpers ─────────────────────────────────────────────────────

function getLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

export function saveLS<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

/**
 * Push a value to Supabase (fire-and-forget).
 * Scoped to the current wedding via wedding_id column.
 */
function sbPush(key: string, value: unknown): void {
  if (!_weddingId) return;
  supabase
    .from('app_data')
    .upsert(
      { key, value, wedding_id: _weddingId, updated_at: new Date().toISOString() },
      { onConflict: 'wedding_id,key' },
    )
    .then();
}

/**
 * On mount: fetch the latest value from Supabase for this wedding.
 * • Found → update local cache and return it.
 * • Not found → push current local data up (first-run seed).
 */
async function sbSync<T>(key: string, current: T): Promise<T> {
  if (!_weddingId) return current;
  try {
    const { data, error } = await supabase
      .from('app_data')
      .select('value')
      .eq('key', key)
      .eq('wedding_id', _weddingId)
      .single();

    if (error || !data) {
      // First time this key has been accessed — seed Supabase with local data
      sbPush(key, current);
      return current;
    }

    const fresh = data.value as T;
    saveLS(lk(key), fresh);   // keep local cache in sync
    return fresh;
  } catch {
    return current;           // offline fallback — use whatever is local
  }
}

// ── Budget ────────────────────────────────────────────────────────────────────

export function getBudgetItems(): BudgetItem[] { return getLS(lk('budget_items'), []); }
export function saveBudgetItems(items: BudgetItem[]) {
  saveLS(lk('budget_items'), items);
  sbPush('budget_items', items);
}
export async function syncBudgetItems(current: BudgetItem[]): Promise<BudgetItem[]> {
  return sbSync('budget_items', current);
}

// ── Guests ────────────────────────────────────────────────────────────────────

export function getGuests(): Guest[] { return getLS(lk('guests_v2'), []); }
export function saveGuests(guests: Guest[]) {
  saveLS(lk('guests_v2'), guests);
  sbPush('guests_v2', guests);
}
export async function syncGuests(current: Guest[]): Promise<Guest[]> {
  return sbSync('guests_v2', current);
}

// ── Checklist ─────────────────────────────────────────────────────────────────

export function getChecklist(): ChecklistItem[] { return getLS(lk('checklist_v2'), []); }
export function saveChecklist(items: ChecklistItem[]) {
  saveLS(lk('checklist_v2'), items);
  sbPush('checklist_v2', items);
}
export async function syncChecklist(current: ChecklistItem[]): Promise<ChecklistItem[]> {
  return sbSync('checklist_v2', current);
}

// ── Toronto Budget ────────────────────────────────────────────────────────────

export function getTorontoBudget(): TorontoBudgetItem[] { return getLS(lk('toronto_budget'), []); }
export function saveTorontoBudget(items: TorontoBudgetItem[]) {
  saveLS(lk('toronto_budget'), items);
  sbPush('toronto_budget', items);
}
export async function syncTorontoBudget(current: TorontoBudgetItem[]): Promise<TorontoBudgetItem[]> {
  return sbSync('toronto_budget', current);
}

// ── Toronto Checklist ─────────────────────────────────────────────────────────

export function getTorontoChecklist(): TorontoChecklistItem[] { return getLS(lk('toronto_checklist'), []); }
export function saveTorontoChecklist(items: TorontoChecklistItem[]) {
  saveLS(lk('toronto_checklist'), items);
  sbPush('toronto_checklist', items);
}
export async function syncTorontoChecklist(current: TorontoChecklistItem[]): Promise<TorontoChecklistItem[]> {
  return sbSync('toronto_checklist', current);
}

// ── Villa Rooms ───────────────────────────────────────────────────────────────

export function getVillaRooms(): VillaRoom[] { return getLS(lk('villa_rooms'), []); }
export function saveVillaRooms(rooms: VillaRoom[]) {
  saveLS(lk('villa_rooms'), rooms);
  sbPush('villa_rooms', rooms);
}
export async function syncVillaRooms(current: VillaRoom[]): Promise<VillaRoom[]> {
  return sbSync('villa_rooms', current);
}

// ── Toronto Guests ────────────────────────────────────────────────────────────

export function getTorontoGuests(): TorontoGuest[] { return getLS(lk('toronto_guests'), []); }
export function saveTorontoGuests(guests: TorontoGuest[]) {
  saveLS(lk('toronto_guests'), guests);
  sbPush('toronto_guests', guests);
}
export async function syncTorontoGuests(current: TorontoGuest[]): Promise<TorontoGuest[]> {
  return sbSync('toronto_guests', current);
}

// ── Budget Settings ───────────────────────────────────────────────────────────

export function getBudgetSettings(): BudgetSettings { return getLS(lk('budget_settings'), DEFAULT_BUDGET_SETTINGS); }
export function saveBudgetSettings(s: BudgetSettings) {
  saveLS(lk('budget_settings'), s);
  sbPush('budget_settings', s);
}
export async function syncBudgetSettings(current: BudgetSettings): Promise<BudgetSettings> {
  return sbSync('budget_settings', current);
}

// ── Seating ───────────────────────────────────────────────────────────────────

export function getSeating(): Record<string, string> { return getLS(lk('seating_v1'), {}); }
export function saveSeating(seating: Record<string, string>) {
  saveLS(lk('seating_v1'), seating);
  sbPush('seating_v1', seating);
}
export async function syncSeating(current: Record<string, string>): Promise<Record<string, string>> {
  return sbSync('seating_v1', current);
}
