import { Plus } from 'lucide-react';

interface TopBarProps {
  onNewNote: () => void;
}

export function TopBar({ onNewNote }: TopBarProps) {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
        <a
          href="/"
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          Notes Theory
        </a>

        <div className="shrink-0">
          <button
            type="button"
            onClick={onNewNote}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Catatan Baru</span>
          </button>
        </div>
      </div>
    </header>
  );
}
