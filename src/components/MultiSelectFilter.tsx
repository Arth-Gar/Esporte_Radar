import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface MultiSelectOption {
  value: string;
  label: string;
  count?: number;
  badge?: string;
  icon?: string;
}

interface MultiSelectFilterProps {
  id: string;
  label: string;
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  allLabel?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'amber' | 'emerald';
}

export function MultiSelectFilter({
  id,
  label,
  options,
  selectedValues,
  onChange,
  placeholder = 'Selecionar...',
  allLabel = 'Todas',
  icon,
  variant = 'default',
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const isAllSelected = selectedValues.length === 0;

  const handleToggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      const next = selectedValues.filter(v => v !== value);
      onChange(next);
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const handleSelectAll = () => {
    onChange([]); // Empty array means "All"
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  // Determine display text for the trigger button
  const getDisplayText = () => {
    if (isAllSelected) {
      return allLabel;
    }
    if (selectedValues.length === 1) {
      const opt = options.find(o => o.value === selectedValues[0]);
      return opt ? opt.label : selectedValues[0];
    }
    return `${selectedValues.length} selecionados`;
  };

  return (
    <div id={id} ref={containerRef} className="relative flex flex-col gap-1 w-full">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-seagreen uppercase tracking-widest flex items-center gap-1">
          {icon}
          {label}
        </span>
        {!isAllSelected && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[9px] text-green-400 hover:text-white font-mono uppercase underline cursor-pointer"
          >
            Limpar ({selectedValues.length})
          </button>
        )}
      </div>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold rounded border transition-all cursor-pointer text-left ${
          !isAllSelected
            ? 'bg-[#0b2b1a] border-seagreen/60 text-white shadow-sm ring-1 ring-seagreen/30'
            : 'bg-[#092215] border-green-950/60 text-slate-200 hover:border-green-800/80 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <span className="truncate">{getDisplayText()}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!isAllSelected && (
            <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono bg-seagreen text-white font-black">
              {selectedValues.length}
            </span>
          )}
          <ChevronDown
            className={`h-3.5 w-3.5 text-green-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-seagreen' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-[#04120a] border border-green-800/80 rounded-lg shadow-2xl p-1.5 space-y-1 custom-scrollbar backdrop-blur-md"
          >
            {/* "All" Option */}
            <button
              type="button"
              onClick={handleSelectAll}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-bold transition-all text-left cursor-pointer uppercase tracking-wider ${
                isAllSelected
                  ? 'bg-seagreen text-white font-black'
                  : 'text-slate-300 hover:bg-[#092215] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                    isAllSelected
                      ? 'bg-white text-[#020704] border-white'
                      : 'border-green-700 bg-black/40'
                  }`}
                >
                  {isAllSelected && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
                <span>{allLabel}</span>
              </div>
            </button>

            <div className="h-px bg-green-950/80 my-1" />

            {/* Individual Options with Multi-Select Checkboxes */}
            {options.map(opt => {
              const isChecked = selectedValues.includes(opt.value);
              const isLibertadores = opt.value.toLowerCase().includes('libertadores');

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleToggleOption(opt.value)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-all text-left cursor-pointer ${
                    isChecked
                      ? isLibertadores
                        ? 'bg-amber-950/70 border border-amber-500/50 text-amber-200 font-bold'
                        : 'bg-seagreen/20 border border-seagreen/50 text-white font-bold'
                      : 'text-slate-300 hover:bg-[#092215] hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
                        isChecked
                          ? isLibertadores
                            ? 'bg-amber-500 text-black border-amber-400'
                            : 'bg-seagreen text-white border-seagreen'
                          : 'border-green-700 bg-black/40'
                      }`}
                    >
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>

                    <span className="truncate">
                      {isLibertadores ? `🏆 ${opt.label}` : opt.label}
                    </span>
                  </div>

                  {typeof opt.count === 'number' && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded shrink-0 ml-1.5 ${
                        isChecked
                          ? 'bg-black/60 text-green-300 font-bold'
                          : 'bg-black/40 text-green-500'
                      }`}
                    >
                      {opt.count}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
