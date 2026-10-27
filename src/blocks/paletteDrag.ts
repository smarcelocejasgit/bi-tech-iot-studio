export const BITECH_BLOCK_DRAG_MIME =
  'application/x-bitech-iot-studio-block';

const TEXT_FALLBACK_PREFIX = 'bitech-block:';

export function writePaletteBlockDragData(
  dataTransfer: DataTransfer,
  blockType: string
): void {
  dataTransfer.effectAllowed = 'copy';
  dataTransfer.setData(BITECH_BLOCK_DRAG_MIME, blockType);
  dataTransfer.setData('text/plain', `${TEXT_FALLBACK_PREFIX}${blockType}`);
}

export function isPaletteBlockDrag(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.types).includes(BITECH_BLOCK_DRAG_MIME);
}

export function readPaletteBlockDragData(
  dataTransfer: DataTransfer
): string | null {
  const customValue = dataTransfer.getData(BITECH_BLOCK_DRAG_MIME).trim();
  if (customValue) return customValue;

  const textValue = dataTransfer.getData('text/plain').trim();
  return textValue.startsWith(TEXT_FALLBACK_PREFIX)
    ? textValue.slice(TEXT_FALLBACK_PREFIX.length)
    : null;
}
