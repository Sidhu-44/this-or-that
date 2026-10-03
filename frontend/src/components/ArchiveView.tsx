import React, { useState, useEffect } from 'react';
import type { ArchivePollItem } from '../types';
import { fetchArchive } from '../services/api';
import { ImageWithFallback } from './ImageWithFallback';
import { Archive, Calendar, Users, X, Award, AlertCircle, RefreshCw } from 'lucide-react';

interface ArchiveViewProps {
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ onShowToast }) => {
  const [archiveList, setArchiveList] = useState<ArchivePollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoll, setSelectedPoll] = useState<ArchivePollItem | null>(null);

  const loadArchive = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchArchive();
      setArchiveList(items);
    } catch (err: any) {
      setError(err.message || 'Failed to load archive');
      onShowToast('Could not load past polls', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArchive();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Archive Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warm-200 border border-warm-300 text-ink-600 text-xs font-semibold mb-3">
          <Archive className="w-3.5 h-3.5 text-accent" />
          <span>Past Matchups</span>
        </div>
        <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight sm:text-4xl">
          The Archive
        </h1>
        <p className="text-ink-500 text-sm sm:text-base mt-2">
          Explore past daily matchups and see how the community decided.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 rounded-full border-4 border-accent/20 border-t-accent animate-spin mb-4" />
          <p className="text-ink-500 text-sm font-medium">Fetching past polls...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="max-w-md mx-auto p-6 bg-white border border-red-200 rounded-3xl text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-ink-700 font-medium mb-4">{error}</p>
          <button
            onClick={loadArchive}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink-900 text-white text-xs font-bold hover:bg-ink-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && archiveList.length === 0 && (
        <div className="max-w-md mx-auto py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-warm-200 text-ink-400 flex items-center justify-center mx-auto mb-4">
            <Archive className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-ink-900 mb-1">No Past Polls Yet</h2>
          <p className="text-xs text-ink-500">
            Past daily polls will automatically show up here as days pass in India Standard Time.
          </p>
        </div>
      )}

      {/* Archive Grid */}
      {!loading && !error && archiveList.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {archiveList.map((item) => {
            const winner = item.votes_a > item.votes_b ? 'A' : item.votes_b > item.votes_a ? 'B' : 'Tie';

            return (
              <div
                key={item.id}
                onClick={() => setSelectedPoll(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedPoll(item);
                  }
                }}
                tabIndex={0}
                className="group bg-white rounded-3xl border border-warm-300 overflow-hidden hover:border-accent hover:shadow-card transition-all duration-300 cursor-pointer flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {/* Dual Thumbnail Comparison Header */}
                <div className="relative h-44 w-full grid grid-cols-2 overflow-hidden bg-warm-200">
                  <div className="relative h-full overflow-hidden border-r border-white/50">
                    <ImageWithFallback
                      src={item.option_a_image_url}
                      alt={item.option_a_label}
                      className="group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-transparent to-transparent" />
                    <span className="absolute bottom-2 left-2 text-[11px] font-extrabold text-white truncate max-w-[90%]">
                      {item.option_a_label}
                    </span>
                  </div>

                  <div className="relative h-full overflow-hidden">
                    <ImageWithFallback
                      src={item.option_b_image_url}
                      alt={item.option_b_label}
                      className="group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-transparent to-transparent" />
                    <span className="absolute bottom-2 right-2 text-[11px] font-extrabold text-white truncate max-w-[90%] text-right">
                      {item.option_b_label}
                    </span>
                  </div>

                  {/* Winner Pill */}
                  {winner !== 'Tie' && (
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ink-900/80 backdrop-blur-md text-[10px] font-bold text-white shadow-sm">
                        <Award className="w-3 h-3 text-amber-400" />
                        {winner === 'A' ? item.option_a_label : item.option_b_label} won
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-ink-500 mb-2 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(item.scheduled_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {item.total_votes.toLocaleString()} votes
                      </span>
                    </div>

                    <h3 className="font-extrabold text-ink-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                      {item.question}
                    </h3>
                  </div>

                  {/* Mini Percentage Bar */}
                  <div className="mt-4 pt-3 border-t border-warm-200">
                    <div className="flex justify-between text-[11px] font-bold text-ink-700 mb-1">
                      <span>{item.percentage_a}%</span>
                      <span>{item.percentage_b}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-warm-200 overflow-hidden flex">
                      <div className="bg-accent h-full" style={{ width: `${item.percentage_a}%` }} />
                      <div className="bg-ink-700 h-full" style={{ width: `${item.percentage_b}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Results Modal */}
      {selectedPoll && (
        <div 
          className="fixed inset-0 z-50 bg-ink-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-headline"
        >
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-warm-300">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPoll(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-warm-200 text-ink-600 hover:text-ink-900 hover:bg-warm-300 flex items-center justify-center transition-colors"
              aria-label="Close details"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="mb-5 pr-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warm-200 text-ink-600 text-xs font-semibold mb-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(selectedPoll.scheduled_date)} • Read-only</span>
              </div>
              <h2 id="modal-headline" className="text-xl sm:text-2xl font-extrabold text-ink-900 leading-snug">
                {selectedPoll.question}
              </h2>
            </div>

            {/* Choices Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              
              {/* Option A */}
              <div className="rounded-2xl border border-warm-300 overflow-hidden bg-warm-50 flex flex-col">
                <div className="h-36 overflow-hidden relative">
                  <ImageWithFallback
                    src={selectedPoll.option_a_image_url}
                    alt={selectedPoll.option_a_label}
                  />
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-ink-900/80 text-white text-xs font-bold flex items-center justify-center">
                    A
                  </div>
                </div>
                <div className="p-3">
                  <div className="font-bold text-ink-900 text-sm truncate">{selectedPoll.option_a_label}</div>
                  <div className="text-xs text-ink-500 mt-1 flex justify-between">
                    <span>{selectedPoll.votes_a.toLocaleString()} votes</span>
                    <span className="font-bold text-accent">{selectedPoll.percentage_a}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-warm-200 mt-2 overflow-hidden">
                    <div className="bg-accent h-full" style={{ width: `${selectedPoll.percentage_a}%` }} />
                  </div>
                </div>
              </div>

              {/* Option B */}
              <div className="rounded-2xl border border-warm-300 overflow-hidden bg-warm-50 flex flex-col">
                <div className="h-36 overflow-hidden relative">
                  <ImageWithFallback
                    src={selectedPoll.option_b_image_url}
                    alt={selectedPoll.option_b_label}
                  />
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-ink-900/80 text-white text-xs font-bold flex items-center justify-center">
                    B
                  </div>
                </div>
                <div className="p-3">
                  <div className="font-bold text-ink-900 text-sm truncate">{selectedPoll.option_b_label}</div>
                  <div className="text-xs text-ink-500 mt-1 flex justify-between">
                    <span>{selectedPoll.votes_b.toLocaleString()} votes</span>
                    <span className="font-bold text-ink-800">{selectedPoll.percentage_b}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-warm-200 mt-2 overflow-hidden">
                    <div className="bg-ink-700 h-full" style={{ width: `${selectedPoll.percentage_b}%` }} />
                  </div>
                </div>
              </div>

            </div>

            {/* Total Votes and Read Only Notice */}
            <div className="bg-warm-100 rounded-2xl p-4 text-center border border-warm-200">
              <span className="text-xs text-ink-500 font-medium">
                Total Community Votes: <strong className="text-ink-900">{selectedPoll.total_votes.toLocaleString()}</strong>
              </span>
              <p className="text-[11px] text-ink-400 mt-0.5">
                Voting on past daily polls is closed to preserve official historical results.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
