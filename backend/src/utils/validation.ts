export function validateEmail(raw: unknown): { valid: true; value: string } | { valid: false; message: string } {
  const email = String(raw || '').trim().toLowerCase();
  if (!email) return { valid: false, message: 'Email is required' };
  return { valid: true, value: email };
}

export function validatePassword(raw: unknown): { valid: true } | { valid: false; message: string } {
  const password = String(raw || '');
  if (!password) return { valid: false, message: 'Password is required' };
  if (password.length < 6) return { valid: false, message: 'Password must be at least 6 characters' };
  return { valid: true };
}
