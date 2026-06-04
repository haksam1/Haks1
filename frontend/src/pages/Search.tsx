import React, { useState } from 'react';
import { usePersons } from '../hooks/usePersons';
import { Search as SearchIcon, Calendar, ArrowRight, X, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import DecompressedImage from '../components/DecompressedImage';

const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const { useSearch } = usePersons();
  const { data: results, isLoading } = useSearch(query);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f7f4ef] md:min-h-screen" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div className="relative overflow-hidden bg-[#0d2218]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(#a8d5b5 1px, transparent 1px), linear-gradient(90deg, #a8d5b5 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
        <div
          className="pointer-events-none absolute -top-32 right-0 h-[420px] w-[420px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #2d6a4f 0%, transparent 70%)' }}
        />

        <div className="relative mx-auto max-w-5xl px-6 py-12">
          <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#95d5b2] bg-[#1a3a2a]">
            People Finder
          </span>
          <h1
            className="mt-5 text-4xl font-bold leading-tight text-white md:text-5xl"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Search the Family Archive
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#a8b8a8]">
            Find relatives, profiles, and recorded life details across every family you manage.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div
          className="-mt-16 relative z-10 rounded-2xl bg-white p-4 shadow-xl"
          style={{ border: '1px solid #e8e0d0' }}
        >
          <div className="relative">
            <SearchIcon
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: '#a09080' }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a name to search..."
              className="block w-full rounded-xl py-3 pl-10 pr-10 text-sm outline-none transition-all sm:text-base"
              style={{
                background: '#f7f4ef',
                border: '1.5px solid #e8e0d0',
                color: '#2d3a2a',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#2d6a4f')}
              onBlur={(e) => (e.target.style.borderColor = '#e8e0d0')}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#a09080' }}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {isLoading && (
            <div className="flex justify-center py-16">
              <div
                className="h-10 w-10 animate-spin rounded-full"
                style={{ border: '3px solid #e8e0d0', borderTopColor: '#2d6a4f' }}
              />
            </div>
          )}
          
          {results?.map((person) => (
            <Link
              key={person.id}
              to={`/trees/${person.treeId}/persons/${person.id}`}
              className="group flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              style={{ border: '1px solid #e8e0d0' }}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl ${person.deathDate ? 'grayscale opacity-75' : ''}`}
                  style={{ background: '#f7f4ef', border: '1px solid #e8e0d0' }}
                >
                  <DecompressedImage photoUrl={person.photoUrl} fallbackIconSize={22} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold transition-colors flex items-center gap-1" style={{ color: '#2d3a2a' }}>
                    <span>{person.firstName} {person.lastName}</span>
                    {person.deathDate && (
                      <span title="Deceased" className="flex shrink-0">
                        <Flame size={12} className="text-amber-600 fill-amber-300" />
                      </span>
                    )}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: '#a09080' }}>
                    <Calendar size={12} />
                    <span>{person.birthDate ? new Date(person.birthDate).toLocaleDateString() : 'Unknown Date'}</span>
                  </p>
                </div>
              </div>
              <div className="pr-2 transition-colors group-hover:translate-x-1" style={{ color: '#2d6a4f' }}>
                <ArrowRight size={18} />
              </div>
            </Link>
          ))}
          
          {query.trim().length > 0 && results?.length === 0 && !isLoading && (
            <div
              className="rounded-2xl bg-white p-10 text-center"
              style={{ border: '1px solid #e8e0d0', color: '#a09080' }}
            >
              <p>No family members found matching "{query}"</p>
            </div>
          )}

          {!query.trim() && !isLoading && (
            <div
              className="rounded-2xl border border-dashed bg-white/60 p-10 text-center"
              style={{ borderColor: '#d4c9b0', color: '#a09080' }}
            >
              <p>Start typing a name to search your family records.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
