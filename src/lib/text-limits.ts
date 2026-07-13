// Shared max lengths for free-text fields in public forms (issue reports,
// venue-booking requests, account forms). Imported by both client forms
// (validation + maxLength + character counter) and API routes (server-side check),
// so the limits can never drift out of sync.
export const TEXT_LIMITS = {
  name: 100,
  email: 100,
  phone: 30,
  title: 100,
  room: 100,
  description: 2000,
  organization: 100,
  shortNote: 200,
  longNote: 2000,
  password: 72,
  personalNumber: 13,
  address: 200,
  postalCode: 10,
  city: 100,
} as const;
