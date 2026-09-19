import React, { useState, useMemo } from 'react';
import {
  Search,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Download,
  Trash2,
  Plus,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Filter,
  Flame,
} from 'lucide-react';
import { SearchAnalyticsSummary, SearchAnalyticsTerm } from '../../types';
import { api } from '../../lib/api';

interface SearchAnalyticsTrackerProps {
  searchAnalytics?: SearchAnalyticsSummary | null;
  onRefresh: () => void;
  onLaunchGarment?: (term: string, category?: string) => void;
  showToast: (msg: string) => void;
}

export const SearchAnalyticsTracker: React.FC<SearchAnalyticsTrackerProps> = ({
  searchAnalytics,
  onRefresh,
  onLaunchGarment,
  showToast,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'unmet' | 'found'>('all');
  const [keywordFilter, setKeywordFilter] = useState('');
  const [showRecentStream, setShowRecentStream] = useState(false);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [simQuery, setSimQuery] = useState('');
  const [simResults, setSimResults] = useState(0);
  const [isClearing, setIsClearing] = useState(false);

  const topTerms = searchAnalytics?.topSearchTerms || [];
  const maxSearchCount = useMemo(() => {
    if (topTerms.length === 0) return 1;
    return Math.max(...topTerms.map((t) => t.count), 1);
  }, [topTerms]);

  // Filtered terms based on tabs & keyword
  const filteredTerms = useMemo(() => {
    return topTerms.filter((item) => {
      // Tab filter
      if (filterMode === 'unmet' && item.resultCount > 0) return false;
      if (filterMode === 'found' && item.resultCount === 0) return false;

      // Text filter
      if (keywordFilter.trim()) {
        const q = keywordFilter.trim().toLowerCase();
        const matchesTerm = item.term.toLowerCase().includes(q);
        const matchesCat = item.category?.toLowerCase().includes(q);
        const matchesRec = item.recommendation?.toLowerCase().includes(q);
        if (!matchesTerm && !matchesCat && !matchesRec) return false;
      }

      return true;
    });
  }, [topTerms, filterMode, keywordFilter]);

  // Top unmet demand item for highlight banner
  const topUnmetTerm = useMemo(() => {
    const unmet = topTerms.filter((t) => t.resultCount === 0);
    return unmet.length > 0 ? unmet[0] : null;
  }, [topTerms]);

  // Export CSV
  const handleExportCsv = () => {
    if (topTerms.length === 0) {
      showToast('⚠️ No search term data available to export');
      return;
    }

    const headers = 'SearchTerm,QueryCount,CatalogResults,Status,Category,LastSearchedAt,Recommendation\n';
    const rows = topTerms
      .map(
        (t) =>
          `"${t.term}",${t.count},${t.resultCount},"${t.resultCount === 0 ? 'UNMET DEMAND' : 'FOUND'}","${t.category || 'archive'}","${t.lastSearchedAt}","${t.recommendation || ''}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storefront-search-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ Search analytics CSV exported');
  };

  // Reset / Clear Search Logs
  const handleClearLogs = async () => {
    if (!window.confirm('Clear all recorded search term logs? This cannot be undone.')) {
      return;
    }
    setIsClearing(true);
    const res = await api.clearSearchAnalytics();
    setIsClearing(false);
    if (res.success) {
      showToast('✓ Search analytics history cleared');
      onRefresh();
    } else {
      showToast('⚠️ Failed to clear search analytics');
    }
  };

  // Simulate or Test Search Query
  const handleSimulateSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simQuery.trim()) return;

    const res = await api.trackSearch(simQuery.trim(), Number(simResults));
    if (res.success) {
      showToast(`✓ Logged query "${simQuery.trim()}" (${simResults} results)`);
      setSimQuery('');
      setSimResults(0);
      setIsSimulateOpen(false);
      onRefresh();
    } else {
      showToast('⚠️ Failed to record simulation query');
    }
  };

  return (
    <div id="searchAnalyticsTrackerContainer" className="space-y-3 font-mono-tag">
      {/* Top Header Card */}
      <div className="bg-white border-2 border-black p-3 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-neutral-300 pb-2.5 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 bg-yellow-300 border border-black text-black">
                <Search className="w-4 h-4" />
              </span>
              <h3 className="font-headline font-black text-sm sm:text-base text-black uppercase tracking-tight">
                STOREFRONT SEARCH ANALYTICS & UNMET DEMAND
              </h3>
            </div>
            <p className="text-[11px] text-neutral-600 mt-1 font-typewriter">
              Captures customer queries entered into the storefront search bar. Pinpoints high-volume terms
              and identifies zero-result searches where customers are looking for products that aren't available.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-1 bg-[#feef89] hover:bg-yellow-300 text-black border border-black text-[10px] font-bold px-2 py-1 shadow-xs transition-colors"
              title="Refresh search analytics"
            >
              <RefreshCw className="w-3 h-3" />
              <span>SYNC</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1 bg-white hover:bg-neutral-100 text-black border border-black text-[10px] font-bold px-2 py-1 shadow-xs transition-colors"
              title="Export search terms as CSV"
            >
              <Download className="w-3 h-3" />
              <span>EXPORT CSV</span>
            </button>
            <button
              onClick={() => setIsSimulateOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 bg-black hover:bg-neutral-800 text-yellow-300 border border-black text-[10px] font-bold px-2 py-1 shadow-xs transition-colors"
              title="Test log a customer search term"
            >
              <Plus className="w-3 h-3" />
              <span>TEST QUERY</span>
            </button>
            <button
              onClick={handleClearLogs}
              disabled={isClearing || topTerms.length === 0}
              className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 text-[10px] font-bold px-2 py-1 shadow-xs transition-colors disabled:opacity-50"
              title="Clear all search tracking logs"
            >
              <Trash2 className="w-3 h-3" />
              <span>RESET</span>
            </button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-[#fdfcf8] border border-black p-2.5">
            <div className="flex items-center justify-between text-neutral-500 text-[10px] uppercase">
              <span>TOTAL SEARCHES</span>
              <Search className="w-3 h-3 text-neutral-400" />
            </div>
            <div className="font-headline font-black text-xl text-black mt-1">
              {searchAnalytics?.totalSearches ?? 0}
            </div>
            <span className="text-[9px] text-neutral-500 font-mono-tag block mt-0.5">
              Cumulative search queries
            </span>
          </div>

          <div className="bg-[#fdfcf8] border border-black p-2.5">
            <div className="flex items-center justify-between text-neutral-500 text-[10px] uppercase">
              <span>UNIQUE TERMS</span>
              <TrendingUp className="w-3 h-3 text-neutral-400" />
            </div>
            <div className="font-headline font-black text-xl text-black mt-1">
              {searchAnalytics?.uniqueTermsCount ?? 0}
            </div>
            <span className="text-[9px] text-neutral-500 font-mono-tag block mt-0.5">
              Distinct keywords entered
            </span>
          </div>

          <div className={`p-2.5 border ${((searchAnalytics?.zeroResultRate ?? 0) > 20) ? 'bg-amber-50 border-amber-400' : 'bg-[#fdfcf8] border-black'}`}>
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-amber-800">
              <span>UNMET DEMAND RATE</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="font-headline font-black text-xl text-amber-900 mt-1">
              {searchAnalytics?.zeroResultRate ?? 0}%
            </div>
            <span className="text-[9px] text-amber-700 font-mono-tag block mt-0.5 font-bold">
              {searchAnalytics?.zeroResultCount ?? 0} queries with 0 catalog matches
            </span>
          </div>

          <div className="bg-[#fdfcf8] border border-black p-2.5">
            <div className="flex items-center justify-between text-neutral-500 text-[10px] uppercase">
              <span>TOP MISSED ITEM</span>
              <Flame className="w-3 h-3 text-red-500" />
            </div>
            <div className="font-headline font-black text-base text-red-700 truncate mt-1" title={topUnmetTerm?.term || 'None'}>
              {topUnmetTerm ? `"${topUnmetTerm.term}"` : 'None'}
            </div>
            <span className="text-[9px] text-neutral-600 font-mono-tag block mt-0.5">
              {topUnmetTerm ? `${topUnmetTerm.count} customer searches` : 'All queries matched'}
            </span>
          </div>
        </div>

        {/* Highlight Alert for Store Owner: Immediate Actionable Insight */}
        {topUnmetTerm && (
          <div className="mt-3 p-2.5 bg-[#feef89] border-2 border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-[2px_2px_0px_#000]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
              <div>
                <span className="text-[11px] font-headline font-bold text-black uppercase block">
                  ACTIONABLE UNMET DEMAND: &ldquo;{topUnmetTerm.term.toUpperCase()}&rdquo; ({topUnmetTerm.count} SEARCHES // 0 RESULTS)
                </span>
                <span className="text-[10px] text-neutral-800 font-typewriter">
                  {topUnmetTerm.recommendation || 'Customers are actively looking for this item. Consider creating a new garment or launching a waitlist.'}
                </span>
              </div>
            </div>
            {onLaunchGarment && (
              <button
                onClick={() => onLaunchGarment(topUnmetTerm.term, topUnmetTerm.category)}
                className="bg-black hover:bg-neutral-800 text-yellow-300 font-mono-tag font-bold text-[10px] px-2.5 py-1.5 border border-black uppercase flex items-center gap-1 shadow-xs flex-shrink-0 cursor-pointer"
              >
                <span>+ ADD GARMENT TO CATALOG</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Test Query / Simulation Drawer */}
      {isSimulateOpen && (
        <form
          onSubmit={handleSimulateSearch}
          className="bg-[#faf8f2] border-2 border-black p-3 space-y-2.5 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-headline font-bold text-xs text-black uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
              SIMULATE STOREFRONT SEARCH EVENT (DEV / TEST)
            </h4>
            <button
              type="button"
              onClick={() => setIsSimulateOpen(false)}
              className="text-xs font-bold text-neutral-500 hover:text-black"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2">
              <label className="text-[10px] text-neutral-600 block uppercase mb-0.5">Search Query / Term:</label>
              <input
                type="text"
                placeholder="e.g. vintage zip hoodie, knit beanie, acid shorts..."
                value={simQuery}
                onChange={(e) => setSimQuery(e.target.value)}
                className="w-full border border-black px-2 py-1 text-xs font-mono-tag bg-white outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-600 block uppercase mb-0.5">Simulated Match Count:</label>
              <input
                type="number"
                min="0"
                max="20"
                value={simResults}
                onChange={(e) => setSimResults(Number(e.target.value))}
                className="w-full border border-black px-2 py-1 text-xs font-mono-tag bg-white outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsSimulateOpen(false)}
              className="bg-neutral-200 text-black px-2.5 py-1 text-[10px] font-bold border border-black"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="bg-black text-yellow-300 px-3 py-1 text-[10px] font-bold border border-black shadow-xs hover:bg-neutral-800"
            >
              LOG SEARCH EVENT
            </button>
          </div>
        </form>
      )}

      {/* Filter and View Controls Bar */}
      <div className="bg-white border-2 border-black p-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        {/* Mode Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-bold">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 border border-black transition-colors ${
              filterMode === 'all'
                ? 'bg-black text-yellow-300'
                : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
            }`}
          >
            ALL QUERIES ({topTerms.length})
          </button>
          <button
            onClick={() => setFilterMode('unmet')}
            className={`px-2.5 py-1 border border-black transition-colors flex items-center gap-1 ${
              filterMode === 'unmet'
                ? 'bg-red-600 text-white font-black'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>UNMET DEMAND / 0 RESULTS ({searchAnalytics?.zeroResultCount ?? 0})</span>
          </button>
          <button
            onClick={() => setFilterMode('found')}
            className={`px-2.5 py-1 border border-black transition-colors flex items-center gap-1 ${
              filterMode === 'found'
                ? 'bg-emerald-700 text-white font-black'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>IN CATALOG ({topTerms.filter((t) => t.resultCount > 0).length})</span>
          </button>
        </div>

        {/* Search within terms */}
        <div className="relative min-w-[200px]">
          <Search className="w-3 h-3 absolute left-2 top-2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter search queries..."
            value={keywordFilter}
            onChange={(e) => setKeywordFilter(e.target.value)}
            className="w-full border border-black pl-7 pr-6 py-1 text-[11px] font-mono-tag bg-neutral-50 outline-none"
          />
          {keywordFilter && (
            <button
              onClick={() => setKeywordFilter('')}
              className="absolute right-2 top-1.5 text-neutral-400 hover:text-black text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Search Terms Table */}
      <div className="bg-white border-2 border-black overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-900 text-white border-b-2 border-black text-[10px] uppercase font-bold tracking-wider">
                <th className="py-2 px-3">RANK & QUERY TERM</th>
                <th className="py-2 px-3">SEARCH FREQUENCY</th>
                <th className="py-2 px-3">CATALOG STATUS</th>
                <th className="py-2 px-3">CUSTOMER INTENT & INSIGHT</th>
                <th className="py-2 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredTerms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-500 font-typewriter">
                    No search terms match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredTerms.map((term, index) => {
                  const percentOfMax = Math.round((term.count / maxSearchCount) * 100);
                  const isUnmet = term.resultCount === 0;

                  return (
                    <tr
                      key={term.term}
                      className={`hover:bg-[#fbf9f3] transition-colors ${
                        isUnmet ? 'bg-red-50/40' : ''
                      }`}
                    >
                      {/* Rank & Term */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold border border-black ${
                              index === 0
                                ? 'bg-[#feef89] text-black font-black'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            #{index + 1}
                          </span>
                          <div>
                            <span className="font-headline font-bold text-xs text-black uppercase">
                              &ldquo;{term.term}&rdquo;
                            </span>
                            {term.category && (
                              <span className="ml-1.5 text-[9px] bg-neutral-100 border border-neutral-300 px-1 py-0.2 text-neutral-600 uppercase font-mono-tag">
                                {term.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Frequency & Progress Bar */}
                      <td className="py-2.5 px-3 min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-black">{term.count} searches</span>
                            <span className="text-neutral-500">{percentOfMax}%</span>
                          </div>
                          <div className="w-full bg-neutral-200 h-2 border border-black overflow-hidden">
                            <div
                              className={`h-full ${
                                isUnmet ? 'bg-red-500' : 'bg-black'
                              }`}
                              style={{ width: `${percentOfMax}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Catalog Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {isUnmet ? (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 border border-red-400 font-bold px-2 py-0.5 text-[10px] uppercase">
                            <AlertTriangle className="w-3 h-3 text-red-600 flex-shrink-0" />
                            <span>0 MATCHES // UNMET DEMAND</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-400 font-bold px-2 py-0.5 text-[10px] uppercase">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                            <span>{term.resultCount} PRODUCT{term.resultCount > 1 ? 'S' : ''} IN CATALOG</span>
                          </span>
                        )}
                      </td>

                      {/* Recommendation & Opportunity */}
                      <td className="py-2.5 px-3 max-w-[280px]">
                        <p className="text-[10px] text-neutral-700 font-typewriter line-clamp-2 leading-relaxed">
                          {term.recommendation || (isUnmet ? 'Customers looking for this garment. Consider manufacturing.' : 'Catalog matches available.')}
                        </p>
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {isUnmet && onLaunchGarment ? (
                          <button
                            onClick={() => onLaunchGarment(term.term, term.category)}
                            className="inline-flex items-center gap-1 bg-black hover:bg-neutral-800 text-yellow-300 font-bold text-[10px] px-2.5 py-1 border border-black uppercase shadow-xs cursor-pointer"
                            title={`Add "${term.term}" to catalog`}
                          >
                            <Plus className="w-3 h-3" />
                            <span>CREATE GARMENT</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-neutral-400 font-mono-tag">
                            In Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Search Event Feed (Collapsible) */}
      <div className="bg-white border-2 border-black p-3 space-y-2">
        <div
          onClick={() => setShowRecentStream((prev) => !prev)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <h4 className="font-headline font-bold text-xs text-black uppercase">
              LIVE SEARCH QUERY STREAM ({searchAnalytics?.recentQueries?.length ?? 0} RECENT EVENTS)
            </h4>
          </div>
          <button className="text-xs font-bold text-neutral-600 hover:text-black flex items-center gap-1">
            <span>{showRecentStream ? 'HIDE STREAM' : 'VIEW STREAM'}</span>
            {showRecentStream ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showRecentStream && (
          <div className="border-t border-dashed border-neutral-300 pt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {!searchAnalytics?.recentQueries || searchAnalytics.recentQueries.length === 0 ? (
              <p className="text-[10px] text-neutral-500 font-typewriter py-2 text-center">
                No recent storefront search queries recorded yet.
              </p>
            ) : (
              searchAnalytics.recentQueries.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between text-[11px] p-1.5 bg-[#fdfcf8] border border-neutral-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400 font-mono-tag text-[9px]">
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="font-headline font-bold text-black uppercase">
                      &ldquo;{event.term}&rdquo;
                    </span>
                  </div>
                  <div>
                    {event.resultCount === 0 ? (
                      <span className="text-[9px] bg-red-100 text-red-800 border border-red-300 px-1.5 py-0.5 font-bold">
                        0 RESULTS (UNMET)
                      </span>
                    ) : (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 font-bold">
                        {event.resultCount} FOUND
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
