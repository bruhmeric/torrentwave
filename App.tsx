import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { TorrentResult, Category } from './types';
import { searchTorrents, fetchCategories } from './services/jackettService';
import SearchBar from './components/SearchBar';
import ResultsTable from './components/ResultsTable';
import CategoryFilter from './components/CategoryFilter';
import ProgressBar from './components/ProgressBar';
import { LogoIcon, CryptoIcon, UsdtIcon, BtcIcon } from './components/Icons';

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

  // Donation Info State
  const [showDonationInfo, setShowDonationInfo] = useState<boolean>(true);

  const areSettingsConfigured = useMemo(() => !!(jackettUrl && apiKey), []);

  // Crypto addresses
  const usdtAddress = 'TDvs92AbCaizmcorx2rdYF2pyDWiHU3E7X';
  const btcAddress = '14KoMft8bjqQBhdx497gpBH6eGmzZLwEEu';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      console.log('Copied to clipboard:', text);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to fetch results: ${errorMessage}`);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, areSettingsConfigured, selectedCategory, categories]);

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
  
  const resultsPerPage = 50;
  const totalPages = Math.ceil(sortedResults.length / resultsPerPage);
  const paginatedResults = sortedResults.slice(
      (currentPage - 1) * resultsPerPage,
      currentPage * resultsPerPage
  );

  return (
    <>
      <ProgressBar isLoading={isLoading} />
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

            {/* Donation Info Section */}
            {showDonationInfo && (
              <div className="max-w-3xl mx-auto my-8 p-6 bg-slate-800/50 border border-slate-700 rounded-lg text-center">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-slate-100">Support Our Server</h2>
                  <button
                    onClick={() => setShowDonationInfo(false)}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                
                <p className="text-slate-400 mb-6">
                  Your support helps keep the server running.
                </p>
                
                <div className="space-y-4">
                  {/* USDT Section */}
                  <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-center mb-3">
                      <UsdtIcon />
                      <h3 className="text-lg font-semibold text-slate-200 ml-3">USDT (TRC20)</h3>
                    </div>
                    
                    <div className="bg-white p-1 rounded-md inline-block mb-3">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(usdtAddress)}`}
                        alt="USDT QR Code"
                        width="100"
                        height="100"
                        className="block"
                      />
                    </div>

                    <div className="bg-slate-950 p-2 rounded-md">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-sky-400 break-all flex-grow text-left">
                          {usdtAddress}
                        </span>
                        <button
                          onClick={() => copyToClipboard(usdtAddress)}
                          className="flex-shrink-0 flex items-center justify-center gap-2 w-28 px-3 py-2 text-sm rounded-md font-semibold bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bitcoin Section */}
                  <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-center mb-3">
                      <BtcIcon />
                      <h3 className="text-lg font-semibold text-slate-200 ml-3">Bitcoin (BTC)</h3>
                    </div>
                    
                    <div className="bg-white p-1 rounded-md inline-block mb-3">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`bitcoin:${btcAddress}`)}`}
                        alt="Bitcoin QR Code"
                        width="100"
                        height="100"
                        className="block"
                      />
                    </div>

                    <div className="bg-slate-950 p-2 rounded-md">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-sky-400 break-all flex-grow text-left">
                          {btcAddress}
                        </span>
                        <button
                          onClick={() => copyToClipboard(btcAddress)}
                          className="flex-shrink-0 flex items-center justify-center gap-2 w-28 px-3 py-2 text-sm rounded-md font-semibold bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
             <button
                onClick={() => setShowDonationInfo(prev => !prev)}
                className="flex items-center justify-center gap-2 font-semibold text-slate-400 hover:text-sky-400 transition-colors mx-auto"
              >
                  <CryptoIcon className="w-5 h-5" />
                  <span>{showDonationInfo ? 'Hide Support Info' : 'Support with Crypto'}</span>
              </button>
          </footer>
        </div>
      </div>
    </>
  );
};

export default App;
