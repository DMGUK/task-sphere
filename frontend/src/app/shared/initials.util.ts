export function getInitials(name: string | null | undefined, emailFallback?: string | null): string {
  const trimmed = (name || '').trim();
  if (trimmed.length >= 2) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const second = parts.length > 1 ? (parts[1]?.[0] ?? '') : (parts[0]?.[1] ?? '');
    return (first + second).toUpperCase();
  }
  return (emailFallback || '').slice(0, 2).toUpperCase() || 'U';
}
