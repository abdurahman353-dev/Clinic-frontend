import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SearchableSelect({ options, value, onChange, placeholder = "Select...", disabled = false }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={wrapperRef} className="relative">
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all outline-none text-sm text-slate-900 flex justify-between items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-slate-300'}`}
      >
        <span className={selectedOption ? "text-slate-900 truncate pr-4" : "text-slate-400 truncate pr-4"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100 flex items-center bg-slate-50/50">
            <Search className="h-4 w-4 text-slate-400 ml-2 shadow-none" />
            <input 
              type="text"
              autoFocus
              className="w-full px-3 py-1.5 outline-none text-sm text-slate-700 bg-transparent placeholder-slate-400"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto w-full p-1.5 scrollbar-thin scrollbar-thumb-slate-200">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-4 text-sm text-slate-500 text-center italic">No results found</div>
            ) : (
              filteredOptions.map((opt, i) => (
                <div
                  key={i}
                  onClick={() => {
                    if (opt.disabled) return;
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`px-3 py-2.5 text-sm rounded-lg flex items-center justify-between transition-colors
                    ${opt.disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 text-slate-500' : 'hover:bg-primary-50 text-slate-700 hover:text-primary-700 cursor-pointer'}
                    ${opt.value === value ? 'bg-primary-50 font-semibold text-primary-700' : ''}
                  `}
                >
                  <span className="truncate pr-4">{opt.label}</span>
                  {opt.value === value && <Check className="h-4 w-4 text-primary-600 flex-shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
