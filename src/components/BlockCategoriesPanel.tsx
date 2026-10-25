import React from 'react';
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
import { BLOCK_CATEGORIES_CATALOG } from '../blocks/bitechBlocks';
import { DeviceProfileId } from '../types/hardware';
import { BlockCategoryId } from '../types/studio';

interface BlockCategoriesPanelProps {
  activeDevice: DeviceProfileId;
  selectedCategory: BlockCategoryId;
  onSelectCategory: (cat: BlockCategoryId) => void;
  onInsertBlock: (blockType: string) => void;
}

const CATEGORY_STYLES: Record<
  BlockCategoryId,
  {
    bg: string;
    activeBorder: string;
    iconColor: string;
    icon: React.FC<{ className?: string }>;
  }
> = {
  inicio: {
    bg: 'bg-[#d8f0df] hover:bg-[#c8ead2]',
    activeBorder: 'ring-2 ring-emerald-600 border-emerald-500',
    iconColor: 'text-emerald-700',
    icon: Flag,
  },
  sensores: {
    bg: 'bg-[#dcecfb] hover:bg-[#cbe3fa]',
    activeBorder: 'ring-2 ring-sky-600 border-sky-500',
    iconColor: 'text-emerald-700',
    icon: Leaf,
  },
  control: {
    bg: 'bg-[#fdecc8] hover:bg-[#fbe3b0]',
    activeBorder: 'ring-2 ring-amber-600 border-amber-500',
    iconColor: 'text-amber-600',
    icon: GitBranch,
  },
  actuadores: {
    bg: 'bg-[#efe3fc] hover:bg-[#e5d2fa]',
    activeBorder: 'ring-2 ring-purple-600 border-purple-500',
    iconColor: 'text-purple-700',
    icon: Settings,
  },
  camara: {
    bg: 'bg-[#d6f4f7] hover:bg-[#c0ecf1]',
    activeBorder: 'ring-2 ring-cyan-600 border-cyan-500',
    iconColor: 'text-cyan-700',
    icon: Camera,
  },
  datos: {
    bg: 'bg-[#fbe2ee] hover:bg-[#f7d0e3]',
    activeBorder: 'ring-2 ring-pink-600 border-pink-500',
    iconColor: 'text-pink-700',
    icon: BarChart3,
  },
  iot: {
    bg: 'bg-[#d5f2f5] hover:bg-[#c1eaef]',
    activeBorder: 'ring-2 ring-teal-600 border-teal-500',
    iconColor: 'text-cyan-700',
    icon: Cloud,
  },
};

export const BlockCategoriesPanel: React.FC<BlockCategoriesPanelProps> = ({
  activeDevice,
  selectedCategory,
  onSelectCategory,
  onInsertBlock,
}) => {
  const visibleCategories = BLOCK_CATEGORIES_CATALOG.filter(
    (c) => c.deviceScope === 'all' || c.deviceScope === activeDevice
  );

  const currentCatalog =
    visibleCategories.find((c) => c.id === selectedCategory) || visibleCategories[0];

  return (
    <aside className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
          <LayoutGrid className="w-4 h-4 text-emerald-700" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
            BLOQUES
          </h2>
        </div>

        {/* Botones de categorías estilo referencia visual */}
        <div className="space-y-2">
          {visibleCategories.map((cat) => {
            const style = CATEGORY_STYLES[cat.id];
            const IconComponent = style.icon;
            const isSelected = currentCatalog.id === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                data-testid={`category-${cat.id}`}
                onClick={() => onSelectCategory(cat.id)}
                className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 text-left font-semibold text-sm text-slate-800 border border-transparent transition cursor-pointer ${
                  style.bg
                } ${isSelected ? style.activeBorder : ''}`}
              >
                <IconComponent className={`w-4 h-4 shrink-0 ${style.iconColor}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Paleta rápida de bloques de la categoría seleccionada para agregar con 1 clic */}
      <div className="mt-3 pt-2.5 border-t border-slate-100">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Agregar de {currentCatalog.label}:
          </span>
        </div>
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
          {currentCatalog.blocks.map((b) => (
            <button
              key={b.type}
              type="button"
              data-testid={`insert-block-${b.type}`}
              onClick={() => onInsertBlock(b.type)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs font-medium text-slate-700 hover:text-emerald-950 flex items-center justify-between gap-1.5 transition cursor-pointer group"
              title="Haz clic para insertar este bloque en el área de programación y ver su explicación"
            >
              <span className="truncate">{b.label}</span>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 group-hover:border-emerald-300 group-hover:text-emerald-800 shrink-0">
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
