'use client';
import { BudgetItem, Guest, ChecklistItem, TorontoBudgetItem, TorontoChecklistItem, VillaRoom } from './types';
import { GUEST_SEED, BUDGET_SEED, VILLA_SEED } from './seedData';
import { supabase } from './supabase';

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

// Push a value to Supabase (fire-and-forget — never blocks the UI)
function sbPush(key: string, value: unknown): void {
  supabase
    .from('app_data')
    .upsert({ key, value, updated_at: new Date().toISOString() })
    .then();
}

// On mount: fetch the latest from Supabase.
// • If data exists there → update local cache and return it.
// • If it doesn't exist yet → push the current local data up (first-run seed).
async function sbSync<T>(key: string, current: T): Promise<T> {
  try {
    const { data, error } = await supabase
      .from('app_data')
      .select('value')
      .eq('key', key)
      .single();

    if (error || !data) {
      // First time this key has been accessed — seed Supabase with local data
      sbPush(key, current);
      return current;
    }

    const fresh = data.value as T;
    saveLS(key, fresh);   // keep local cache in sync
    return fresh;
  } catch {
    return current;       // offline fallback — use whatever is local
  }
}

// ── Budget ────────────────────────────────────────────────────────────────────

export function getBudgetItems(): BudgetItem[] { return getLS('budget_items', BUDGET_SEED); }
export function saveBudgetItems(items: BudgetItem[]) {
  saveLS('budget_items', items);
  sbPush('budget_items', items);
}
export async function syncBudgetItems(current: BudgetItem[]): Promise<BudgetItem[]> {
  return sbSync('budget_items', current);
}

// ── Guests ────────────────────────────────────────────────────────────────────

export function getGuests(): Guest[] { return getLS('guests_v2', GUEST_SEED); }
export function saveGuests(guests: Guest[]) {
  saveLS('guests_v2', guests);
  sbPush('guests_v2', guests);
}
export async function syncGuests(current: Guest[]): Promise<Guest[]> {
  return sbSync('guests_v2', current);
}

// ── Checklist ─────────────────────────────────────────────────────────────────

export function getChecklist(): ChecklistItem[] { return getLS('checklist', []); }
export function saveChecklist(items: ChecklistItem[]) {
  saveLS('checklist', items);
  sbPush('checklist', items);
}
export async function syncChecklist(current: ChecklistItem[]): Promise<ChecklistItem[]> {
  return sbSync('checklist', current);
}

// ── Toronto Budget ────────────────────────────────────────────────────────────

export function getTorontoBudget(): TorontoBudgetItem[] { return getLS('toronto_budget', []); }
export function saveTorontoBudget(items: TorontoBudgetItem[]) {
  saveLS('toronto_budget', items);
  sbPush('toronto_budget', items);
}
export async function syncTorontoBudget(current: TorontoBudgetItem[]): Promise<TorontoBudgetItem[]> {
  return sbSync('toronto_budget', current);
}

// ── Toronto Checklist ─────────────────────────────────────────────────────────

export function getTorontoChecklist(): TorontoChecklistItem[] { return getLS('toronto_checklist', []); }
export function saveTorontoChecklist(items: TorontoChecklistItem[]) {
  saveLS('toronto_checklist', items);
  sbPush('toronto_checklist', items);
}
export async function syncTorontoChecklist(current: TorontoChecklistItem[]): Promise<TorontoChecklistItem[]> {
  return sbSync('toronto_checklist', current);
}

// ── Villa Rooms ───────────────────────────────────────────────────────────────

export function getVillaRooms(): VillaRoom[] { return getLS('villa_rooms', VILLA_SEED); }
export function saveVillaRooms(rooms: VillaRoom[]) {
  saveLS('villa_rooms', rooms);
  sbPush('villa_rooms', rooms);
}
export async function syncVillaRooms(current: VillaRoom[]): Promise<VillaRoom[]> {
  return sbSync('villa_rooms', current);
}

// ── Seating ───────────────────────────────────────────────────────────────────

export function getSeating(): Record<string, string> { return getLS('seating_v1', {}); }
export function saveSeating(seating: Record<string, string>) {
  saveLS('seating_v1', seating);
  sbPush('seating_v1', seating);
}
export async function syncSeating(current: Record<string, string>): Promise<Record<string, string>> {
  return sbSync('seating_v1', current);
}
