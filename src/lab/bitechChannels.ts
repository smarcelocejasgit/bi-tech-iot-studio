export const BITECH_CHANNEL_MIN = 1;
export const BITECH_CHANNEL_MAX = 9;

export function parseBiTechChannel(value: unknown): number | null {
  if (typeof value === 'string' && value.trim() === '') return null;
  const channel = Number(value);
  return Number.isInteger(channel) &&
    channel >= BITECH_CHANNEL_MIN &&
    channel <= BITECH_CHANNEL_MAX
    ? channel
    : null;
}

export function gardenLatestEndpoint(
  channel: number,
  gatewayBaseUrl: string
): string {
  return `${gatewayBaseUrl.replace(/\/$/, '')}/garden/channel/${channel}/latest`;
}
