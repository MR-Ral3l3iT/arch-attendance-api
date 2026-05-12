const DEVICE_BINDING_EXEMPT_ACCOUNTS = new Set<string>([
  'review@archd-attendance.com',
]);

function normalizeAccount(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function isDeviceBindingExemptAccount(account: {
  username?: string | null;
  email?: string | null;
}): boolean {
  return (
    DEVICE_BINDING_EXEMPT_ACCOUNTS.has(normalizeAccount(account.username)) ||
    DEVICE_BINDING_EXEMPT_ACCOUNTS.has(normalizeAccount(account.email))
  );
}
