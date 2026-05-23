'use client';
import { BudgetItem, Guest, ChecklistItem, TorontoBudgetItem, TorontoChecklistItem } from './types';

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

export function getBudgetItems(): BudgetItem[] { return getLS('budget_items', []); }
export function saveBudgetItems(items: BudgetItem[]) { saveLS('budget_items', items); }

export function getGuests(): Guest[] { return getLS('guests', []); }
export function saveGuests(guests: Guest[]) { saveLS('guests', guests); }

export function getChecklist(): ChecklistItem[] { return getLS('checklist', []); }
export function saveChecklist(items: ChecklistItem[]) { saveLS('checklist', items); }

export function getTorontoBudget(): TorontoBudgetItem[] { return getLS('toronto_budget', []); }
export function saveTorontoBudget(items: TorontoBudgetItem[]) { saveLS('toronto_budget', items); }

export function getTorontoChecklist(): TorontoChecklistItem[] { return getLS('toronto_checklist', []); }
export function saveTorontoChecklist(items: TorontoChecklistItem[]) { saveLS('toronto_checklist', items); }
