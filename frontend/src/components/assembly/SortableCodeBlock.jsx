import React from 'react';
import { ArrowUp, ArrowDown, GripVertical } from 'lucide-react';

/**
 * SortableCodeBlock — one fragment row on the assembly board.
 * Multi-line code is preserved with whitespace-pre.
 * Remove button is hidden in new model (all fragments always on board).
 */
export default function SortableCodeBlock({
  block,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
}) {
  const lines    = (block.code || '').split('\n');
  const lineCount = lines.length;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      className="p-3.5 bg-[#07080D]/90 border border-purple-500/25 rounded-xl flex items-start justify-between gap-3 group hover:border-purple-500/60 hover:bg-purple-950/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition cursor-grab active:cursor-grabbing shadow-sm"
    >
      <div className="flex items-start gap-2.5 flex-1 overflow-hidden">
        {/* drag handle */}
        <div className="flex items-center text-purple-400/50 group-hover:text-purple-300 pt-0.5 transition">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* index badge */}
        <span className="text-xs font-mono font-bold text-purple-200 px-2 py-0.5 bg-purple-950/80 rounded border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)] shrink-0">
          {index + 1}
        </span>

        {/* code + meta */}
        <div className="flex-1 overflow-hidden space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold text-purple-300/70 uppercase">
              {block.role || block.type || 'fragment'}
            </span>
            {lineCount > 1 && (
              <span className="text-[10px] font-mono text-slate-500">{lineCount} lines</span>
            )}
          </div>
          <pre
            className="text-xs font-mono text-slate-200 whitespace-pre overflow-x-auto leading-relaxed max-h-32 scrollbar-thin"
            aria-label={`Fragment ${index + 1}: ${block.role || ''}`}
          >
            {block.code}
          </pre>
        </div>
      </div>

      {/* move buttons */}
      <div className="flex flex-col items-center gap-1 opacity-70 group-hover:opacity-100 transition pt-0.5 shrink-0">
        <button
          disabled={index === 0}
          onClick={onMoveUp}
          className="p-1 text-slate-400 hover:text-purple-300 hover:bg-purple-900/40 rounded transition disabled:opacity-20"
          title="Move Up"
          aria-label="Move fragment up"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          disabled={index === total - 1}
          onClick={onMoveDown}
          className="p-1 text-slate-400 hover:text-purple-300 hover:bg-purple-900/40 rounded transition disabled:opacity-20"
          title="Move Down"
          aria-label="Move fragment down"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
