import React, { useState } from 'react';
import type { TorrentResult } from '../types';
import { 
    CategoryIcon, SeedersIcon, PeersIcon, SizeIcon, ClipboardCopyIcon, 
    ExternalLinkIcon, CloseIcon, SortAscIcon, SortDescIcon, SortIcon 
} from './Icons';

interface ResultsTableProps {
  results: TorrentResult[];
  isLoading: boolean;
  hasSearched: boolean;
  needsConfiguration: boolean;
  sortConfig: { key: keyof TorrentResult; direction: 'ascending' | 'descending' };
  requestSort: (key: keyof TorrentResult) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalResults: number;
}

const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const SeederPeers: React.FC<{ value: number, type: 'seeders' | 'peers' }> = ({ value, type }) => {
    const colorClass = type === 'seeders' 
        ? value > 50 ? 'text-green-400' : value > 10 ? 'text-yellow-400' : 'text-red-400'
        : 'text-sky-400';
    const Icon = type === 'seeders' ? SeedersIcon : PeersIcon;

    return (
        <div className={`flex items-center gap-1 font-mono ${colorClass}`}>
            <Icon />
            {value}
        </div>
    );
};

const SkeletonRow: React.FC = () => (
    <tr className="border-b border-slate-800 animate-pulse">
        <td className="px-4 py-4"><div className="h-4 bg-slate-700 rounded w-24"></div></td>
        <td className="px-4 py-4">
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
            <div className="h-3 bg-slate-700 rounded w-1/4 mt-2"></div>
        </td>
        <td className="px-4 py-4"><div className="h-4 bg-slate-700 rounded w-16"></div></td>
        <td className="px-4 py-4"><div className="h-4 bg-slate-700 rounded w-12"></div></td>
        <td className="px-4 py-4"><div className="h-4 bg-slate-700 rounded w-12"></div></td>
        <td className="px-4 py-4"><div className="h-4 bg-slate-700 rounded w-20"></div></td>
        <td className="px-4 py-4">
            <div className="flex gap-2">
                <div className="h-8 w-8 bg-slate-700 rounded-full"></div>
                <div className="h-8 w-8 bg-slate-700 rounded-full"></div>
            </div>
        </td>
    </tr>
)

const ResultsTable: React.FC<ResultsTableProps> = ({ 
    results, isLoading, hasSearched, needsConfiguration,
    sortConfig, requestSort, currentPage, totalPages, onPageChange, totalResults
}) => {
  const [activeCopyMagnetId, setActiveCopyMagnetId] = useState<number | null>(null);

  const handleCopyMagnet = (magnetUri: string | null, id: number) => {
    if (!magnetUri) {
      console.error('Magnet link is not available.');
      return;
    }
    
    // Always show the manual copy UI on click
    setActiveCopyMagnetId(id);

    const fallbackCopy = (text: string) => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy exception:', err);
      }
      document.body.removeChild(textArea);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(magnetUri).catch(err => {
        console.error('Failed to copy magnet link with Clipboard API, falling back.', err);
        fallbackCopy(magnetUri);
      });
    } else {
      fallbackCopy(magnetUri);
    }
  };
    
  const SortableHeaderCell: React.FC<{
      sortKey: keyof TorrentResult;
      className?: string;
      children: React.ReactNode;
  }> = ({ sortKey, children, className }) => (
      <th scope="col" className={`px-4 py-3 whitespace-nowrap ${className || ''}`}>
          <button
              type="button"
              onClick={() => requestSort(sortKey)}
              className="flex items-center gap-1.5 group text-slate-400 uppercase"
          >
              {children}
              <span className={sortConfig?.key === sortKey ? 'text-sky-400' : 'opacity-0 group-hover:opacity-100 transition-opacity'}>
                  {sortConfig?.key === sortKey
                      ? (sortConfig.direction === 'ascending' ? <SortAscIcon /> : <SortDescIcon />)
                      : <SortIcon />
                  }
              </span>
          </button>
      </th>
  );

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-xs text-slate-400 uppercase bg-slate-800">
            <tr>
              <th scope="col" className="px-4 py-3">Category</th>
              <th scope="col" className="px-4 py-3">Title</th>
              <th scope="col" className="px-4 py-3">Size</th>
              <th scope="col" className="px-4 py-3">Seeders</th>
              <th scope="col" className="px-4 py-3">Peers</th>
              <th scope="col" className="px-4 py-3">Date</th>
              <th scope="col" className="px-4 py-3">Links</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(10)].map((_, i) => <SkeletonRow key={i} />)}
          </tbody>
        </table>
      </div>
    );
  }

  if (!hasSearched) {
      if (needsConfiguration) {
           return (
             <div className="text-center py-16 px-6 bg-slate-800/50 border border-dashed border-slate-700 rounded-lg">
                <h3 className="text-xl font-semibold text-slate-300">Configuration Required</h3>
                <p className="text-slate-500 mt-2">The Jackett server URL and API Key must be configured for the app to function.</p>
                <p className="text-slate-500 mt-1">Please provide them via environment variables.</p>
            </div>
        );
      }
      return (
        <div className="text-center py-16 px-6 bg-slate-800/50 border border-dashed border-slate-700 rounded-lg">
            <h3 className="text-xl font-semibold text-slate-300">Ready to search?</h3>
            <p className="text-slate-500 mt-2">Enter a query above to find torrents.</p>
        </div>
      )
  }

  if (results.length === 0 && totalResults === 0) {
    return (
        <div className="text-center py-16 px-6 bg-slate-800/50 border border-dashed border-slate-700 rounded-lg">
            <h3 className="text-xl font-semibold text-slate-300">No Results Found</h3>
            <p className="text-slate-500 mt-2">Your search did not match any torrents. Try a different query.</p>
        </div>
    );
  }

  return (
    <>
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-x-auto shadow-lg">
        <table className="w-full text-left text-sm">
          <thead className="text-xs bg-slate-800">
            <tr>
              <SortableHeaderCell sortKey="CategoryDesc">Category</SortableHeaderCell>
              <SortableHeaderCell sortKey="Title">Title</SortableHeaderCell>
              <SortableHeaderCell sortKey="Size"><div className="flex items-center gap-1"><SizeIcon/> Size</div></SortableHeaderCell>
              <SortableHeaderCell sortKey="Seeders">Seeders</SortableHeaderCell>
              <SortableHeaderCell sortKey="Peers">Peers</SortableHeaderCell>
              <SortableHeaderCell sortKey="PublishDate">Date</SortableHeaderCell>
              <th scope="col" className="px-4 py-3 uppercase text-slate-400">Links</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.Id} className="border-b border-slate-800 hover:bg-slate-800/60 transition-colors duration-200">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-slate-400">
                      <CategoryIcon />
                      {result.CategoryDesc}
                  </div>
                </td>
                <td className="px-4 py-4 max-w-sm xl:max-w-md">
                  <p className="font-semibold text-slate-200 truncate" title={result.Title}>{result.Title}</p>
                  <p className="text-xs text-slate-500">{result.Tracker}</p>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-slate-300 font-mono">{formatBytes(result.Size)}</td>
                <td className="px-4 py-4 whitespace-nowrap"><SeederPeers value={result.Seeders} type="seeders"/></td>
                <td className="px-4 py-4 whitespace-nowrap"><SeederPeers value={result.Peers} type="peers" /></td>
                <td className="px-4 py-4 whitespace-nowrap text-slate-400 font-mono">
                    {new Date(result.PublishDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-4">
                  {activeCopyMagnetId === result.Id ? (
                    <div className="flex items-center gap-1 w-full">
                      <input
                        type="text"
                        readOnly
                        value={result.MagnetUri || ''}
                        className="w-full min-w-0 flex-1 text-xs bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                        ref={input => input?.select()}
                        onBlur={() => setActiveCopyMagnetId(null)}
                        aria-label="Magnet link"
                      />
                      <button
                        onClick={() => setActiveCopyMagnetId(null)}
                        title="Close"
                        className="p-2 text-slate-400 rounded-full hover:text-sky-400 hover:bg-slate-700"
                        aria-label="Close copy input"
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleCopyMagnet(result.MagnetUri, result.Id)} 
                        title={result.MagnetUri ? "Copy Magnet Link" : "Magnet link not available"} 
                        disabled={!result.MagnetUri}
                        className="p-2 text-slate-400 rounded-full transition-all duration-200 enabled:hover:text-sky-400 enabled:hover:bg-slate-700 disabled:text-slate-600 disabled:cursor-not-allowed"
                        aria-label="Copy magnet link"
                      >
                        <ClipboardCopyIcon />
                      </button>
                      <a href={result.Details} target="_blank" rel="noopener noreferrer" title="View on Tracker" className="p-2 text-slate-400 hover:text-sky-400 hover:bg-slate-700 rounded-full transition-all duration-200" aria-label="View on Tracker">
                        <ExternalLinkIcon />
                      </a>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
          <nav className="flex items-center justify-between mt-4 text-sm text-slate-400" aria-label="Pagination">
              <div>
                  Showing <span className="font-semibold text-slate-200">{(currentPage - 1) * 50 + 1}</span> to <span className="font-semibold text-slate-200">{Math.min(currentPage * 50, totalResults)}</span> of <span className="font-semibold text-slate-200">{totalResults}</span> results
              </div>
              <div className="flex items-center gap-2">
                  <button
                      onClick={() => onPageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                      Previous
                  </button>
                  <span>
                      Page <span className="font-semibold text-slate-200">{currentPage}</span> of <span className="font-semibold text-slate-200">{totalPages}</span>
                  </span>
                  <button
                      onClick={() => onPageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                      Next
                  </button>
              </div>
          </nav>
      )}
    </>
  );
};

export default ResultsTable;