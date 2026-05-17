export function isValidIp(value: string): boolean {
  if (!value.trim()) {
    return true;
  }
  return isValidIpv4(value) || isValidIpv6(value);
}

function isValidIpv4(value: string): boolean {
  const parts = value.split('.');
  return parts.length === 4 && parts.every((part) => {
    if (!/^\d+$/.test(part)) {
      return false;
    }
    const number = Number(part);
    return number >= 0 && number <= 255 && String(number) === String(Number(part));
  });
}

function isValidIpv6(value: string): boolean {
  if (!/^[0-9a-fA-F:]+$/.test(value) || !value.includes(':')) {
    return false;
  }
  const doubleColonCount = (value.match(/::/g) ?? []).length;
  if (doubleColonCount > 1) {
    return false;
  }
  const groups = value.split(':').filter(Boolean);
  return groups.length <= 8 && groups.every((group) => group.length <= 4);
}
