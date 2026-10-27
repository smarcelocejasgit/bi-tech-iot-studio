import { describe, expect, it } from 'vitest';
import {
  BITECH_BLOCK_DRAG_MIME,
  isPaletteBlockDrag,
  readPaletteBlockDragData,
  writePaletteBlockDragData,
} from '../blocks/paletteDrag';

function createDataTransferStub(): DataTransfer {
  const values = new Map<string, string>();
  const types: string[] = [];

  return {
    effectAllowed: 'none',
    types,
    setData(type: string, value: string) {
      values.set(type, value);
      if (!types.includes(type)) types.push(type);
    },
    getData(type: string) {
      return values.get(type) ?? '';
    },
  } as unknown as DataTransfer;
}

describe('Bi-Tech IoT Studio V0.5C — transferencia de bloques desde la paleta', () => {
  it('escribe y recupera el tipo de bloque con una transferencia de copia identificable', () => {
    const dataTransfer = createDataTransferStub();

    writePaletteBlockDragData(dataTransfer, 'bitech_wait');

    expect(dataTransfer.effectAllowed).toBe('copy');
    expect(dataTransfer.types).toContain(BITECH_BLOCK_DRAG_MIME);
    expect(isPaletteBlockDrag(dataTransfer)).toBe(true);
    expect(readPaletteBlockDragData(dataTransfer)).toBe('bitech_wait');
  });

  it('ignora transferencias ajenas a la paleta Bi-Tech', () => {
    const dataTransfer = createDataTransferStub();
    dataTransfer.setData('text/plain', 'texto externo');

    expect(isPaletteBlockDrag(dataTransfer)).toBe(false);
    expect(readPaletteBlockDragData(dataTransfer)).toBeNull();
  });
});
