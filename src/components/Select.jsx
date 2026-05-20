import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { colorClasses, Icon } from '../lib/icons.jsx';

export default function Select({ value, onChange, options, className = '', placeholder = 'เลือก', disabled = false }) {
  const id = useId();
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;
  const [activeIndex, setActiveIndex] = useState(selectedIndex >= 0 ? selectedIndex : 0);
  const activeOptionId = open && options[activeIndex] ? `${id}-option-${activeIndex}` : undefined;

  useEffect(() => {
    if (!open) {
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open || !listRef.current || !options[activeIndex]) return;
    const optionElement = listRef.current.querySelector(`#${CSS.escape(`${id}-option-${activeIndex}`)}`);
    optionElement?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, id, open, options]);

  const selectedContent = useMemo(() => selectedOption || { label: placeholder }, [placeholder, selectedOption]);

  const selectOption = (nextValue) => {
    onChange(nextValue);
    setOpen(false);
  };

  const moveActive = (direction) => {
    if (options.length === 0) return;
    setActiveIndex((current) => {
      const next = current + direction;
      if (next < 0) return options.length - 1;
      if (next >= options.length) return 0;
      return next;
    });
  };

  const handleKeyDown = (event) => {
    if (disabled) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
      } else {
        moveActive(1);
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : options.length - 1);
      } else {
        moveActive(-1);
      }
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
      } else if (options[activeIndex]) {
        selectOption(options[activeIndex].value);
      }
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-2xl border border-[#EAD8CA] bg-white px-4 py-3 text-left font-semibold text-ink outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/20 disabled:opacity-60"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-activedescendant={activeOptionId}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
          setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
        }}
        onKeyDown={handleKeyDown}
      >
        <OptionContent option={selectedContent} muted={!selectedOption} />
        <ChevronDown className={`h-5 w-5 shrink-0 text-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-2xl border border-[#EAD8CA] bg-white shadow-soft">
          <div ref={listRef} id={`${id}-listbox`} role="listbox" className="max-h-64 overflow-y-auto p-1">
            {options.map((option, index) => {
              const selected = option.value === value;
              const active = index === activeIndex;

              return (
                <button
                  key={option.value}
                  id={`${id}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition ${
                    selected ? 'bg-[#F8D6C8]' : active ? 'bg-cream' : 'bg-white hover:bg-cream'
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option.value)}
                >
                  <OptionContent option={option} />
                  {selected ? <Check className="h-4 w-4 shrink-0 text-coral" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OptionContent({ option, muted = false }) {
  const color = colorClasses[option.color] || colorClasses.coral;

  return (
    <span className="flex min-w-0 flex-1 items-center gap-3">
      {option.icon ? (
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${color}`}>
          <Icon name={option.icon} className="h-[1.125rem] w-[1.125rem]" />
        </span>
      ) : null}
      <span className="min-w-0">
        <span className={`block truncate text-sm font-bold ${muted ? 'text-muted' : 'text-ink'}`}>{option.label}</span>
        {option.description ? <span className="block truncate text-xs font-semibold text-muted">{option.description}</span> : null}
      </span>
    </span>
  );
}
