'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface FilterBarProps {
  currentCategory: string;
  searchQuery: string;
}

const CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: 'Smartphones', value: 'smartphones' },
  { label: 'Laptops', value: 'laptops' },
  { label: 'Fragrances', value: 'fragrances' },
  { label: 'Skincare', value: 'skincare' },
  { label: 'Groceries', value: 'groceries' },
];

export default function FilterBar({ currentCategory, searchQuery }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleCategoryChange(cat: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === 'all') {
      params.delete('category');
    } else {
      params.set('category', cat);
    }
    router.push(`/auctions?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get('q') as string;
    const params = new URLSearchParams(searchParams.toString());
    if (q) {
      params.set('q', q);
    } else {
      params.delete('q');
    }
    router.push(`/auctions?${params.toString()}`);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-purple-100 shadow-sm">
      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategoryChange(cat.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              currentCategory === cat.value || (cat.value === 'all' && !currentCategory)
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="w-full sm:w-72 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={searchQuery}
          placeholder="Search items..."
          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
        />
        <button
          type="submit"
          className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all"
        >
          Search
        </button>
      </form>
    </div>
  );
}
