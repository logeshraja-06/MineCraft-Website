import React, { useState } from 'react';
import SortableCodeBlock from './SortableCodeBlock';
import { Blocks, RotateCcw } from 'lucide-react';

/**
 * AssemblyBoard — Reorder all fragments on the board.
 * Fits cleanly alongside AssemblyPreview with zero forced height truncation.
 */
export default function AssemblyBoard({ blocks = [], onReorder, onRemove, onClear }) {
  const [draggedIdx, setDraggedIdx] = useState(null);

  const handleDragStart = (e, idx) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx !== null && draggedIdx !== targetIdx) {
      onReorder(draggedIdx, targetIdx);
    }
    setDraggedIdx(null);
  };

  return (
    <div className="h-full flex flex-col p-4 bg-white/95 border-2 border-slate-200/90 rounded-2xl shadow-sm space-y-3 font-sans">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 select-none">
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Blocks className="w-4 h-4 text-orange-500" />
            <span>Assemble Program Sequence</span>
          </h4>
          <span className="text-[11px] font-mono text-orange-600 font-semibold">
            {blocks.length} fragments — drag or use ▲▼ to reorder
          </span>
        </div>

        {blocks.length > 0 && onClear && (
          <button
            onClick={onClear}
            className="text-[11px] font-mono text-slate-600 hover:text-rose-600 flex items-center gap-1 px-2.5 py-1 hover:bg-rose-50 rounded-lg border border-slate-200 transition cursor-pointer"
            title="Reset to default shuffled order"
          >
            <RotateCcw className="w-3 h-3 text-rose-500" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {blocks.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2 flex-1 flex flex-col items-center justify-center">
          <p className="text-xs font-mono text-slate-600 font-semibold">Assembly board is empty.</p>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
            Complete all tasks to unlock code fragments.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 flex-1">
          {blocks.map((block, idx) => (
            <SortableCodeBlock
              key={block.id || block.blockId || idx}
              block={block}
              index={idx}
              total={blocks.length}
              onMoveUp={() => onReorder(idx, idx - 1)}
              onMoveDown={() => onReorder(idx, idx + 1)}
              onRemove={() => onRemove?.(idx)}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}
