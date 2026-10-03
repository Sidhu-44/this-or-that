import React, { useState } from 'react';
import type { DailyPollResponse, PollStats } from '../types';
import { ImageWithFallback } from './ImageWithFallback';
import { CountdownTimer } from './CountdownTimer';
import { castVote } from '../services/api';
import { CheckCircle2, Share2, Sparkles, AlertCircle, RefreshCw, BarChart3, HelpCircle } from 'lucide-react';

interface DailyPollViewProps {
  data: DailyPollResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const DailyPollView: React.FC<DailyPollViewProps> = ({
  data,
  loading,
  error,
  onRefresh,
  onShowToast
}) => {
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [localStats, setLocalStats] = useState<PollStats | null>(null);
  const [localUserVote, setLocalUserVote] = useState<'A' | 'B' | null>(null);

  // Sync state with props
  const hasVoted = data?.has_voted || !!localUserVote;
  const currentVote = localUserVote || data?.user_vote;
  const stats = localStats || data?.stats;
  const poll = data?.poll;

  const handleVote = async (option: 'A' | 'B') => {
    if (!poll || hasVoted || submitting) return;

    setSelectedOption(option);
    setSubmitting(true);

    try {
      const response = await castVote(poll.id, option);
      setLocalStats(response.stats);
      setLocalUserVote(option);
      onShowToast(`Vote counted for ${option === 'A' ? poll.option_a_label : poll.option_b_label}!`, 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to submit vote', 'error');
      // If error indicates already voted, refresh to fetch updated state
      if (err.message && err.message.toLowerCase().includes('already voted')) {
        onRefresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'ThisOrThat — Daily Choice',
      text: poll ? `This or That? "${poll.question}" — ${poll.option_a_label} vs ${poll.option_b_label}. What's your pick?` : 'Check out today\'s pick on ThisOrThat!',
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        onShowToast('Poll link copied to clipboard!', 'info');
      } catch (err) {
        onShowToast('Could not copy link to clipboard', 'error');
      }
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-4 border-accent/20 border-t-accent animate-spin mb-4" />
        <p className="text-ink-600 font-medium text-sm animate-pulse">Loading today's choice...</p>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-ink-900 mb-2">Couldn't load today's poll</h2>
        <p className="text-sm text-ink-600 mb-6">{error}</p>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink-900 text-white text-sm font-semibold hover:bg-ink-800 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  // 3. Fallback / Empty State (No poll scheduled for today)
  if (!poll) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-warm-200 text-accent flex items-center justify-center mx-auto mb-5 shadow-subtle">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-ink-900 mb-2">No Poll Scheduled Today</h2>
        <p className="text-ink-600 text-sm leading-relaxed mb-6">
          The daily question for today hasn't been posted yet. The curator might be crafting something great for 12:00 AM IST!
        </p>
        <div className="flex justify-center mb-6">
          <CountdownTimer initialSeconds={data?.countdown_seconds || 3600} onExpire={onRefresh} />
        </div>
        <p className="text-xs text-ink-400">
          Tip: Explore past daily matchups in the <span className="font-semibold text-ink-700">Archive</span>.
        </p>
      </div>
    );
  }

  const formattedDate = new Date(poll.scheduled_date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      
      {/* Hero Section */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-warm-200 border border-warm-300 text-ink-600 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Daily Poll • {formattedDate}</span>
        </div>
        
        <h1 className="text-2xl sm:text-4xl font-extrabold text-ink-900 tracking-tight max-w-2xl mx-auto leading-snug">
          {poll.question}
        </h1>
        
        <p className="text-sm sm:text-base text-ink-500 mt-2 font-medium">
          One question. Two choices. What's your pick?
        </p>
      </div>

      {/* Main Choice Cards Grid */}
      <div 
        className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 relative"
        role="radiogroup" 
        aria-label="Choice cards for today's poll"
      >
        
        {/* OPTION A */}
        <div
          role="radio"
          aria-checked={currentVote === 'A' || selectedOption === 'A'}
          tabIndex={hasVoted ? -1 : 0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !hasVoted) {
              e.preventDefault();
              handleVote('A');
            }
          }}
          onClick={() => !hasVoted && handleVote('A')}
          className={`group relative rounded-3xl overflow-hidden bg-white border-2 transition-all duration-300 flex flex-col ${
            hasVoted
              ? currentVote === 'A'
                ? 'border-accent shadow-card'
                : 'border-warm-300/80 opacity-90'
              : 'border-warm-300/80 hover:border-accent hover:shadow-card-hover cursor-pointer'
          } ${submitting && selectedOption === 'A' ? 'scale-[0.99] opacity-80' : ''}`}
        >
          {/* Badge A */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-ink-900/80 backdrop-blur-md text-white font-extrabold text-sm flex items-center justify-center shadow-md">
              A
            </span>
            {currentVote === 'A' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent text-white text-xs font-bold shadow-md">
                <CheckCircle2 className="w-3.5 h-3.5" /> Your Pick
              </span>
            )}
          </div>

          {/* Image */}
          <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden bg-warm-200">
            <ImageWithFallback
              src={poll.option_a_image_url}
              alt={poll.option_a_label}
              className="group-hover:scale-105 transition-transform duration-500 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 via-transparent to-transparent opacity-80" />
            
            {/* Label overlay on image bottom */}
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-sm">
                {poll.option_a_label}
              </h2>
            </div>
          </div>

          {/* Card Footer: Pre-vote or Post-vote */}
          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-white">
            {!hasVoted ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-500 font-medium">Click or tap to choose</span>
                <button
                  type="button"
                  tabIndex={-1}
                  className="px-4 py-2 rounded-full text-xs font-bold bg-warm-200 text-ink-900 group-hover:bg-accent group-hover:text-white transition-colors"
                >
                  Pick This
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-ink-900">
                    {stats?.percentage_a ?? 0}%
                  </span>
                  <span className="text-xs text-ink-500 font-medium">
                    {stats?.votes_a ?? 0} {stats?.votes_a === 1 ? 'vote' : 'votes'}
                  </span>
                </div>
                {/* Animated Progress Bar */}
                <div className="w-full h-3 rounded-full bg-warm-200 overflow-hidden">
                  <div
                    className={`h-full progress-fill rounded-full ${
                      currentVote === 'A' ? 'bg-accent' : 'bg-ink-700'
                    }`}
                    style={{ width: `${stats?.percentage_a ?? 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* VS Badge in Center */}
        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-warm-100 border-2 border-warm-300 text-ink-900 font-black text-sm flex items-center justify-center shadow-lg">
            VS
          </div>
        </div>

        {/* OPTION B */}
        <div
          role="radio"
          aria-checked={currentVote === 'B' || selectedOption === 'B'}
          tabIndex={hasVoted ? -1 : 0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !hasVoted) {
              e.preventDefault();
              handleVote('B');
            }
          }}
          onClick={() => !hasVoted && handleVote('B')}
          className={`group relative rounded-3xl overflow-hidden bg-white border-2 transition-all duration-300 flex flex-col ${
            hasVoted
              ? currentVote === 'B'
                ? 'border-accent shadow-card'
                : 'border-warm-300/80 opacity-90'
              : 'border-warm-300/80 hover:border-accent hover:shadow-card-hover cursor-pointer'
          } ${submitting && selectedOption === 'B' ? 'scale-[0.99] opacity-80' : ''}`}
        >
          {/* Badge B */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-ink-900/80 backdrop-blur-md text-white font-extrabold text-sm flex items-center justify-center shadow-md">
              B
            </span>
            {currentVote === 'B' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent text-white text-xs font-bold shadow-md">
                <CheckCircle2 className="w-3.5 h-3.5" /> Your Pick
              </span>
            )}
          </div>

          {/* Image */}
          <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden bg-warm-200">
            <ImageWithFallback
              src={poll.option_b_image_url}
              alt={poll.option_b_label}
              className="group-hover:scale-105 transition-transform duration-500 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 via-transparent to-transparent opacity-80" />
            
            {/* Label overlay on image bottom */}
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-sm">
                {poll.option_b_label}
              </h2>
            </div>
          </div>

          {/* Card Footer: Pre-vote or Post-vote */}
          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-white">
            {!hasVoted ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-500 font-medium">Click or tap to choose</span>
                <button
                  type="button"
                  tabIndex={-1}
                  className="px-4 py-2 rounded-full text-xs font-bold bg-warm-200 text-ink-900 group-hover:bg-accent group-hover:text-white transition-colors"
                >
                  Pick This
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-ink-900">
                    {stats?.percentage_b ?? 0}%
                  </span>
                  <span className="text-xs text-ink-500 font-medium">
                    {stats?.votes_b ?? 0} {stats?.votes_b === 1 ? 'vote' : 'votes'}
                  </span>
                </div>
                {/* Animated Progress Bar */}
                <div className="w-full h-3 rounded-full bg-warm-200 overflow-hidden">
                  <div
                    className={`h-full progress-fill rounded-full ${
                      currentVote === 'B' ? 'bg-accent' : 'bg-ink-700'
                    }`}
                    style={{ width: `${stats?.percentage_b ?? 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post-Vote Info & Actions Banner */}
      {hasVoted && (
        <div className="mt-8 bg-white border border-warm-300/90 rounded-3xl p-6 sm:p-8 text-center shadow-card animate-fadeIn">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          
          <h3 className="text-lg sm:text-xl font-bold text-ink-900 mb-1">
            Your vote is locked in!
          </h3>
          
          <p className="text-sm text-ink-500 max-w-md mx-auto mb-4">
            Total community votes today: <span className="font-bold text-ink-900">{stats?.total_votes.toLocaleString() || 0}</span>.
            Come back tomorrow for a fresh matchup!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-5">
            <CountdownTimer initialSeconds={data?.countdown_seconds || 3600} onExpire={onRefresh} />
            
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent text-white text-xs sm:text-sm font-bold hover:bg-accent-hover transition-colors shadow-vote focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Share2 className="w-4 h-4" /> Share Poll
            </button>
          </div>
        </div>
      )}

      {/* Pre-Vote Share / Countdown Note */}
      {!hasVoted && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 rounded-2xl bg-warm-200/60 border border-warm-300 text-ink-600 text-xs font-medium">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent" />
            <span>Vote percentages will be revealed immediately after your pick.</span>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-ink-700 hover:text-accent font-semibold transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" /> Share with friends
          </button>
        </div>
      )}

    </div>
  );
};
