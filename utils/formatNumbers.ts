export function formatLargeNumber(number: number): string {
  if (number / 1000000 > 1) {
    return `${(number / 1000000).toFixed(0)}M`;
  } else if (number / 1000 > 1) {
    return `${(number / 1000).toFixed(0)}K`;
  }
  return `${number}`;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = [
    "Bytes",
    "KiB",
    "MiB",
    "GiB",
    "TiB",
    "PiB",
    "EiB",
    "ZiB",
    "YiB",
  ];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
