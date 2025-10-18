export function formatSats(sats: number): string {
  if (sats >= 100000000) {
    return `${(sats / 100000000).toFixed(2)} BTC`;
  }
  if (sats >= 1000) {
    return `${(sats / 1000).toFixed(1)}k sats`;
  }
  return `${sats.toLocaleString()} sats`;
}

export function formatSatsWithUnit(sats: number): { value: string; unit: string } {
  if (sats >= 100000000) {
    return {
      value: (sats / 100000000).toFixed(2),
      unit: "BTC",
    };
  }
  if (sats >= 1000) {
    return {
      value: (sats / 1000).toFixed(1),
      unit: "k sats",
    };
  }
  return {
    value: sats.toLocaleString(),
    unit: "sats",
  };
}

export function truncatePubkey(pubkey: string, start = 6, end = 4): string {
  if (pubkey.length <= start + end) {
    return pubkey;
  }
  return `${pubkey.slice(0, start)}...${pubkey.slice(-end)}`;
}

export function truncateAddress(address: string, start = 6, end = 4): string {
  return truncatePubkey(address, start, end);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
}

export function formatUsername(username: string): string {
  return username.startsWith("@") ? username : `@${username}`;
}

export function formatPercentage(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

export function formatNumberWithDecimals(num: number, decimals = 2): string {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
