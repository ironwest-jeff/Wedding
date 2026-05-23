'use client';
import { BudgetItem, Guest, ChecklistItem, TorontoBudgetItem, TorontoChecklistItem, VillaRoom } from './types';
import { GUEST_SEED, BUDGET_SEED, VILLA_SEED } from './seedData';

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

export function getBudgetItems(): BudgetItem[] { return getLS('budget_items', BUDGET_SEED); }
export function saveBudgetItems(items: BudgetItem[]) { saveLS('budget_items', items); }

export function getGuests(): Guest[] { return getLS('guests_v2', GUEST_SEED); }
export function saveGuests(guests: Guest[]) { saveLS('guests_v2', guests); }

export function getChecklist(): ChecklistItem[] { return getLS('checklist', []); }
export function saveChecklist(items: ChecklistItem[]) { saveLS('checklist', items); }

export function getTorontoBudget(): TorontoBudgetItem[] { return getLS('toronto_budget', []); }
export function saveTorontoBudget(items: TorontoBudgetItem[]) { saveLS('toronto_budget', items); }

export function getTorontoChecklist(): TorontoChecklistItem[] { return getLS('toronto_checklist', []); }
export function saveTorontoChecklist(items: TorontoChecklistItem[]) { saveLS('toronto_checklist', items); }

export function getVillaRooms(): VillaRoom[] { return getLS('villa_rooms', VILLA_SEED); }
export function saveVillaRooms(rooms: VillaRoom[]) { saveLS('villa_rooms', rooms); }
