// Shared disposal/replacement domain logic.
// Centralized here (rather than duplicated per-route) to resolve TD-6
// in Technical_Debt_Plan.docx.

// TD-2: effective-life threshold is currently hard-coded per intervention
// type. Move this to a config table editable by Admins in a future
// iteration (see Technical_Debt_Plan.docx, TD-2).
const EFFECTIVE_LIFE_YEARS = {
  ITN: 3,
  IRS: 1, // indoor residual spraying is typically re-applied annually
};

/**
 * Computes the disposal/replacement due date for a distribution cycle.
 * @param {string} interventionType - 'ITN' | 'IRS'
 * @param {string} distributionDate - ISO date string (YYYY-MM-DD)
 * @returns {string} ISO date string for the computed due date
 */
export function computeDueDate(interventionType, distributionDate) {
  const years = EFFECTIVE_LIFE_YEARS[interventionType] ?? 3;
  const d = new Date(distributionDate);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns true if a disposal item's due date has passed and it is still pending.
 */
export function isOverdue(disposalItem) {
  if (disposalItem.status !== 'pending') return false;
  return new Date(disposalItem.due_date) < new Date();
}
