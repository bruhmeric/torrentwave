import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { TorrentResult, Category } from './types';
import { searchTorrents, fetchCategories } from './services/jackettService';
import SearchBar from './components/SearchBar';
import ResultsTable from './components/ResultsTable';
import SettingsPanel from './components/SettingsPanel';
import CategoryFilter from './components/CategoryFilter';
import ProgressBar from './components/ProgressBar';
import { LogoIcon, SettingsIcon } from './components/Icons';

// Default Jackett configuration.
// For a self-hosted or pre-configured setup, you can replace these placeholder values.
const DEFAULT_JACKETT_URL = 'http://localhost:9117';
const DEFAULT_API_KEY = ''; // It's recommended to leave this blank for security unless it's a private deployment.

const App: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<TorrentResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  
  // Settings state
  const [jackettUrl, setJackettUrl] = useState<string>(() => localStorage.getItem('jackettUrl') || DEFAULT_JACKETT_URL);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('apiKey') || import.meta.env?.VITE_JACKETT_API_KEY || DEFAULT_API_KEY);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // Determine if the API key is set via environment variables and not overridden in local storage.
  const isVercelApiKeySet = !!import.meta.env?.VITE_JACKETT_API_KEY;
  const isApiKeyHidden = isVercelApiKeySet && !localStorage.getItem('apiKey');

  // Category state
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Sorting and Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof TorrentResult; direction: 'ascending' | 'descending' }>({
      key: 'Seeders',
      direction: 'descending',
  });

  const areSettingsConfigured = jackettUrl && apiKey;

  // Fetch categories when settings are configured
  useEffect(() => {
    const loadCategories = async () => {
      if (areSettingsConfigured) {
        try {
          // Don't set global loading for this background fetch
          const fetchedCategories = await fetchCategories(jackettUrl, apiKey);
          setCategories(fetchedCategories);
        } catch (error) {
          console.error("Failed to fetch categories:", error);
          setError("Could not load categories from Jackett. Please check your settings and connection.");
        }
      }
    };
    loadCategories();
  }, [areSettingsConfigured, jackettUrl, apiKey]);

  const handleSearch = useCallback(async () => {
    if (!areSettingsConfigured) {
        setError('Please configure your Jackett server URL and API key in the settings.');
        setShowSettings(true);
        return;
    }
    if (!query.trim()) {
      setError('Please enter a search term.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setCurrentPage(1); // Reset to first page on new search
    try {
      const data = await searchTorrents(query, jackettUrl, apiKey, selectedCategory);
      setResults(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to fetch results: ${errorMessage}`);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, jackettUrl, apiKey, areSettingsConfigured, selectedCategory]);

  const handleSaveSettings = (url: string, key: string) => {
    setJackettUrl(url);
    localStorage.setItem('jackettUrl', url);

    // Only save the API key if it's not hidden (i.e., not set by an env var)
    if (!isApiKeyHidden) {
      setApiKey(key);
      localStorage.setItem('apiKey', key);
    }

    setShowSettings(false);
    setError(null); // Clear settings-related errors
  };

  const sortedResults = useMemo(() => {
      let sortableResults = [...results];
      if (sortConfig !== null) {
          sortableResults.sort((a, b) => {
              const aValue = a[sortConfig.key];
              const bValue = b[sortConfig.key];
              
              if (aValue === null || aValue === undefined) return 1;
              if (bValue === null || bValue === undefined) return -1;
              
              let comparison = 0;
              if (sortConfig.key === 'PublishDate') {
                  comparison = new Date(aValue as string).getTime() - new Date(bValue as string).getTime();
              } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                  comparison = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
              } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                  comparison = aValue - bValue;
              }

              return sortConfig.direction === 'ascending' ? comparison : -comparison;
          });
      }
      return sortableResults;
  }, [results, sortConfig]);

  const requestSort = (key: keyof TorrentResult) => {
      let direction: 'ascending' | 'descending' = 'descending';
      if (sortConfig.key === key && sortConfig.direction === 'descending') {
          direction = 'ascending';
      }
      setSortConfig({ key, direction });
      setCurrentPage(1); // Reset to first page on sort
  };
  
  // Pagination logic
  const resultsPerPage = 50;
  const totalPages = Math.ceil(sortedResults.length / resultsPerPage);
  const paginatedResults = sortedResults.slice(
      (currentPage - 1) * resultsPerPage,
      currentPage * resultsPerPage
  );

  return (
    <>
      <ProgressBar isLoading={isLoading} />
      <SettingsPanel 
        isOpen={showSettings}
        initialUrl={jackettUrl}
        initialApiKey={apiKey}
        onSave={handleSaveSettings}
        onClose={() => setShowSettings(false)}
        isApiKeyHidden={isApiKeyHidden}
      />
      <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
        <div className="container mx-auto px-4 py-8">
          <header className="flex flex-col items-center justify-center text-center mb-8">
              <div className="relative w-full max-w-3xl flex items-center justify-center">
                  <div className="flex items-center gap-4">
                      <LogoIcon />
                      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
                          Torrent Wave
                      </h1>
                  </div>
                   <button 
                        onClick={() => setShowSettings(true)}
                        className="absolute right-0 p-2 text-slate-400 hover:text-sky-400 transition-colors"
                        aria-label="Open settings"
                    >
                        <SettingsIcon />
                    </button>
              </div>
              <p className="text-slate-400 mt-2">Your gateway to the world of torrents.</p>
          </header>

          <main>
            <div className="max-w-3xl mx-auto mb-8">
               <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="w-full sm:flex-grow">
                  <SearchBar 
                    query={query}
                    setQuery={setQuery}
                    onSearch={handleSearch}
                    isLoading={isLoading}
                    disabled={!areSettingsConfigured && !isLoading}
                  />
                </div>
                <div className="w-full sm:w-64">
                    <CategoryFilter
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                        disabled={!areSettingsConfigured || isLoading}
                    />
                </div>
              </div>
            </div>

            {error && (
              <div className="max-w-3xl mx-auto text-center p-4 bg-red-900/50 border border-red-700 rounded-lg">
                <p className="text-red-400">{error}</p>
              </div>
            )}
            
            <div className="mt-8">
              <ResultsTable 
                results={paginatedResults}
                isLoading={isLoading} 
                hasSearched={hasSearched}
                needsConfiguration={!areSettingsConfigured}
                onOpenSettings={() => setShowSettings(true)}
                sortConfig={sortConfig}
                requestSort={requestSort}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalResults={results.length}
              />
            </div>
          </main>
          
          <footer className="text-center mt-12 text-slate-500 text-sm">
          </footer>
        </div>
      </div>
    </>
  );
};

export default App;