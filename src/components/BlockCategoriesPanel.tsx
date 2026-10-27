import React, { useRef, useState } from 'react';
import {
  BarChart3,
  Camera,
  Cloud,
  Flag,
  GitBranch,
  LayoutGrid,
  Leaf,
  Plus,
  Settings,
} from 'lucide-react';
import { getCatalogForDevice } from '../blocks/bitechBlocks';
import { writePaletteBlockDragData } from '../blocks/paletteDrag';
import { DeviceProfileId } from '../types/hardware';
import { BlockCategoryId } from '../types/studio';

interface BlockCategoriesPanelProps {
  activeDevice: DeviceProfileId;
  selectedCategory: BlockCategoryId;
  onSelectCategory: (cat: BlockCategoryId) => void;
  onInsertBlock: (blockType: string) => void;
}

interface CategoryStyleConfig {
  bg: string;
  activeBorder: string;
  iconColor: string;
  textColor: string;
  itemHoverBg: string;
  itemBorder: string;
  badgeBg: string;
  badgeText: string;
  dotBg: string;
  icon: React.FC<{ className?: string }>;
}

const CATEGORY_STYLES: Record<BlockCategoryId, CategoryStyleConfig> = {
  inicio: {
    bg: 'bg-[#eaf7ee] hover:bg-[#daf2e1]',
    activeBorder: 'ring-2 ring-emerald-600 border-emerald-500 bg-[#d8f0df]',
    iconColor: 'text-emerald-700',
    textColor: 'text-emerald-950',
    itemHoverBg: 'hover:bg-emerald-50/70',
    itemBorder: 'hover:border-emerald-300',
    badgeBg: 'bg-emerald-100/80',
    badgeText: 'text-emerald-800',
    dotBg: 'bg-emerald-600',
    icon: Flag,
  },
  sensores: {
    bg: 'bg-[#edf5fd] hover:bg-[#dbebfb]',
    activeBorder: 'ring-2 ring-sky-600 border-sky-500 bg-[#dcecfb]',
    iconColor: 'text-sky-700',
    textColor: 'text-sky-950',
    itemHoverBg: 'hover:bg-sky-50/70',
    itemBorder: 'hover:border-sky-300',
    badgeBg: 'bg-sky-100/80',
    badgeText: 'text-sky-800',
    dotBg: 'bg-sky-600',
    icon: Leaf,
  },
  control: {
    bg: 'bg-[#fef6e7] hover:bg-[#fdeecf]',
    activeBorder: 'ring-2 ring-amber-600 border-amber-500 bg-[#fdecc8]',
    iconColor: 'text-amber-700',
    textColor: 'text-amber-950',
    itemHoverBg: 'hover:bg-amber-50/70',
    itemBorder: 'hover:border-amber-300',
    badgeBg: 'bg-amber-100/80',
    badgeText: 'text-amber-800',
    dotBg: 'bg-amber-600',
    icon: GitBranch,
  },
  actuadores: {
    bg: 'bg-[#f5eefa] hover:bg-[#eee1f9]',
    activeBorder: 'ring-2 ring-purple-600 border-purple-500 bg-[#efe3fc]',
    iconColor: 'text-purple-700',
    textColor: 'text-purple-950',
    itemHoverBg: 'hover:bg-purple-50/70',
    itemBorder: 'hover:border-purple-300',
    badgeBg: 'bg-purple-100/80',
    badgeText: 'text-purple-800',
    dotBg: 'bg-purple-600',
    icon: Settings,
  },
  camara: {
    bg: 'bg-[#eaf8fa] hover:bg-[#d8f1f5]',
    activeBorder: 'ring-2 ring-cyan-600 border-cyan-500 bg-[#d6f4f7]',
    iconColor: 'text-cyan-700',
    textColor: 'text-cyan-950',
    itemHoverBg: 'hover:bg-cyan-50/70',
    itemBorder: 'hover:border-cyan-300',
    badgeBg: 'bg-cyan-100/80',
    badgeText: 'text-cyan-800',
    dotBg: 'bg-cyan-600',
    icon: Camera,
  },
  datos: {
    bg: 'bg-[#fdf0f5] hover:bg-[#fae1ee]',
    activeBorder: 'ring-2 ring-pink-600 border-pink-500 bg-[#fbe2ee]',
    iconColor: 'text-pink-700',
    textColor: 'text-pink-950',
    itemHoverBg: 'hover:bg-pink-50/70',
    itemBorder: 'hover:border-pink-300',
    badgeBg: 'bg-pink-100/80',
    badgeText: 'text-pink-800',
    dotBg: 'bg-pink-600',
    icon: BarChart3,
  },
  iot: {
    bg: 'bg-[#e8f7f8] hover:bg-[#d7f0f2]',
    activeBorder: 'ring-2 ring-teal-600 border-teal-500 bg-[#d5f2f5]',
    iconColor: 'text-teal-700',
    textColor: 'text-teal-950',
    itemHoverBg: 'hover:bg-teal-50/70',
    itemBorder: 'hover:border-teal-300',
    badgeBg: 'bg-teal-100/80',
    badgeText: 'text-teal-800',
    dotBg: 'bg-teal-600',
    icon: Cloud,
  },
};

export const BlockCategoriesPanel: React.FC<BlockCategoriesPanelProps> = ({
  activeDevice,
  selectedCategory,
  onSelectCategory,
  onInsertBlock,
}) => {
  const [draggingBlockType, setDraggingBlockType] = useState<string | null>(
    null
  );
  const suppressClickUntilRef = useRef<number>(0);

  // Obtiene las categorías y bloques filtrados por las capacidades del hardware activo
  const visibleCategories = getCatalogForDevice(activeDevice);

  const currentCatalog =
    visibleCategories.find((c) => c.id === selectedCategory) ||
    visibleCategories[0];

  const currentStyle = CATEGORY_STYLES[currentCatalog.id];

  return (
    <aside className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3 flex flex-col justify-between h-full overflow-y-auto">
      <div>
        <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
          <LayoutGrid className="w-4 h-4 text-emerald-700" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
            BLOQUES
          </h2>
        </div>

        {/* Botones de categorías filtrados según capacidades de hardware */}
        <div className="space-y-1.5" role="tablist" aria-label="Categorías de bloques">
          {visibleCategories.map((cat) => {
            const style = CATEGORY_STYLES[cat.id];
            const IconComponent = style.icon;
            const isSelected = currentCatalog.id === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                data-testid={`category-${cat.id}`}
                onClick={() => onSelectCategory(cat.id)}
                className={`w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-left font-bold text-xs tracking-wide border transition cursor-pointer ${
                  style.bg
                } ${
                  isSelected
                    ? style.activeBorder + ' shadow-2xs'
                    : 'border-transparent text-slate-700 hover:text-slate-900'
                }`}
              >
                <IconComponent
                  className={`w-4 h-4 shrink-0 ${style.iconColor}`}
                />
                <span className={isSelected ? style.textColor : 'text-slate-700'}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Paleta rápida de bloques compatibles de la categoría seleccionada */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex-1 min-h-[120px] flex flex-col">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${currentStyle.dotBg}`}
            />
            <span>{currentCatalog.label}:</span>
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">
            Arrastrar o hacer clic
          </span>
        </div>

        <div className="space-y-1.5 flex-1 overflow-y-auto pr-0.5">
          {currentCatalog.blocks.map((b) => (
            <button
              key={b.type}
              type="button"
              draggable
              data-testid={`insert-block-${b.type}`}
              data-dragging={draggingBlockType === b.type ? 'true' : 'false'}
              onClick={() => {
                if (Date.now() <= suppressClickUntilRef.current) return;
                onInsertBlock(b.type);
              }}
              onDragStart={(event) => {
                suppressClickUntilRef.current = Number.POSITIVE_INFINITY;
                writePaletteBlockDragData(event.dataTransfer, b.type);
                setDraggingBlockType(b.type);
              }}
              onDragEnd={() => {
                suppressClickUntilRef.current = Date.now() + 250;
                setDraggingBlockType(null);
              }}
              className={`w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-between gap-1.5 transition cursor-grab active:cursor-grabbing hover:shadow-2xs active:scale-[0.98] group ${currentStyle.itemHoverBg} ${currentStyle.itemBorder} ${
                draggingBlockType === b.type
                  ? 'opacity-60 ring-2 ring-offset-1 ring-slate-400 shadow-md'
                  : ''
              }`}
              title={`Clic para insertar "${b.label}" en el área de programación`}
              aria-label={`${b.label}. Arrastrar al área de programación o hacer clic para insertar.`}
            >
              <span className="truncate flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${currentStyle.dotBg} shrink-0 opacity-70 group-hover:opacity-100`} />
                <span className="truncate">{b.label}</span>
              </span>
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-200/80 shadow-3xs shrink-0 ${currentStyle.badgeBg} ${currentStyle.badgeText}`}
              >
                <Plus className="w-2.5 h-2.5" />
                {b.badge}
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
