import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { TorrentResult, Category } from './types';
import { searchTorrents, fetchCategories } from './services/jackettService';
import SearchBar from './components/SearchBar';
import ResultsTable from './components/ResultsTable';
import CategoryFilter from './components/CategoryFilter';
import ProgressBar from './components/ProgressBar';
import DonationPopup from './components/DonationPopup';
import { LogoIcon, CryptoIcon } from './components/Icons';

// Default Jackett configuration.
const DEFAULT_JACKETT_URL = 'http://43.160.202.61:9117';
const DEFAULT_API_KEY = '';

const jackettUrl = import.meta.env?.VITE_JACKETT_URL || DEFAULT_JACKETT_URL;
const apiKey = import.meta.env?.VITE_JACKETT_API_KEY || DEFAULT_API_KEY;

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const App: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<TorrentResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  
  // Category state
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Sorting and Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof TorrentResult; direction: 'ascending' | 'descending' }>({
      key: 'Seeders',
      direction: 'descending',
  });

  // Donation Popup State
  const [showDonationPopup, setShowDonationPopup] = useState<boolean>(false);
  const [hasShownDonationPopup, setHasShownDonationPopup] = useState<boolean>(false);

  const areSettingsConfigured = useMemo(() => !!(jackettUrl && apiKey), []);

  // DEBUG: Log state changes
  useEffect(() => {
    console.log('🔄 App State - showDonationPopup:', showDonationPopup, 'hasShownDonationPopup:', hasShownDonationPopup);
  }, [showDonationPopup, hasShownDonationPopup]);

  // Initialize Google Analytics
  useEffect(() => {
    const measurementId = 'G-JF0E0PJETX';
    if (document.getElementById('ga-script')) return;

    const script = document.createElement('script');
    script.id = 'ga-script';
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.async = true;
    document.head.appendChild(script);

    const inlineScript = document.createElement('script');
    inlineScript.id = 'ga-inline-script';
    inlineScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}');
    `;
    document.head.appendChild(inlineScript);
  }, []);

  // Fetch categories when settings are configured
  useEffect(() => {
    const loadCategories = async () => {
      if (areSettingsConfigured) {
        try {
          const fetchedCategories = await fetchCategories(jackettUrl, apiKey);
          setCategories(fetchedCategories);
        } catch (error) {
          console.error("Failed to fetch categories:", error);
          setError("Could not load categories from Jackett. Please check your configuration and connection.");
        }
      }
    };
    loadCategories();
  }, [areSettingsConfigured]);

  const handleSearch = useCallback(async () => {
    if (!areSettingsConfigured) {
        setError('Jackett server is not configured. Please provide the URL and API key via environment variables.');
        return;
    }
    if (!query.trim()) {
      setError('Please enter a search term.');
      return;
    }
    
    // Track search event with Google Analytics
    if (typeof window.gtag === 'function') {
      const categoryName = categories.find(c => c.id === selectedCategory)?.name || 'All Categories';
      window.gtag('event', 'search', {
        search_term: query,
        event_category: 'Torrent Search',
        event_label: categoryName,
      });
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setCurrentPage(1);
    try {
      const data = await searchTorrents(query, jackettUrl, apiKey, selectedCategory);
      setResults(data);
      
      // DEBUG: Add detailed logging
      console.log('🔍 Search completed:', {
        query,
        resultsCount: data.length,
        hasShownDonationPopup,
        shouldShowPopup: !hasShownDonationPopup,
        showDonationPopup: !hasShownDonationPopup
      });
      
      if (!hasShownDonationPopup) {
        console.log('🎯 Setting donation popup to show!');
        setShowDonationPopup(true);
        setHasShownDonationPopup(true);
      } else {
        console.log('❌ Popup already shown, not showing again');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to fetch results: ${errorMessage}`);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, areSettingsConfigured, selectedCategory, categories, hasShownDonationPopup]);

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
      setCurrentPage(1);
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
      <DonationPopup 
        isOpen={showDonationPopup}
        onClose={() => {
          console.log('👋 Closing donation popup');
          setShowDonationPopup(false);
        }}
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
              </div>
              <p className="text-slate-400 mt-2">Your gateway to the world of torrents.</p>
          </header>

          <main>
            <div className="max-w-3xl mx-auto mb-8">
               <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="w-full md:flex-grow">
                  <SearchBar 
                    query={query}
                    setQuery={setQuery}
                    onSearch={handleSearch}
                    isLoading={isLoading}
                    disabled={!areSettingsConfigured && !isLoading}
                  />
                </div>
                <div className="w-full md:w-64">
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
            <div className="flex flex-col gap-2 items-center">
              <button
                onClick={() => {
                  console.log('🔄 Manual popup trigger');
                  setShowDonationPopup(true);
                }}
                className="flex items-center justify-center gap-2 font-semibold text-slate-400 hover:text-sky-400 transition-colors mx-auto"
              >
                  <CryptoIcon className="w-5 h-5" />
                  <span>Support with Crypto</span>
              </button>
              
              {/* Temporary debug info */}
              <div className="text-xs text-slate-600 mt-2">
                Debug: Popup state: {showDonationPopup ? 'OPEN' : 'closed'}
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default App;
