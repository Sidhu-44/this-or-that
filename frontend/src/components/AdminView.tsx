import React, { useState, useEffect } from 'react';
import type { ArchivePollItem, PollInput } from '../types';
import {
  getAdminKey,
  setAdminKey,
  removeAdminKey,
  verifyAdminKey,
  fetchAdminPolls,
  createAdminPoll,
  updateAdminPoll,
  deleteAdminPoll,
  seedAdminData
} from '../services/api';
import { ImageWithFallback } from './ImageWithFallback';
import {
  ShieldCheck,
  Key,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  Lock,
  LogOut,
  X,
  AlertCircle
} from 'lucide-react';

interface AdminViewProps {
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  onAdminAuthChange: (isAuth: boolean) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onShowToast, onAdminAuthChange }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [keyInput, setKeyInput] = useState<string>('');
  const [polls, setPolls] = useState<ArchivePollItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPollId, setEditingPollId] = useState<number | null>(null);

  // Form State
  const [formQuestion, setFormQuestion] = useState('');
  const [formOptionALabel, setFormOptionALabel] = useState('');
  const [formOptionAUrl, setFormOptionAUrl] = useState('');
  const [formOptionBLabel, setFormOptionBLabel] = useState('');
  const [formOptionBUrl, setFormOptionBUrl] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Check existing credentials on mount
  useEffect(() => {
    const existing = getAdminKey();
    if (existing) {
      verifyAdminKey(existing).then((valid) => {
        setIsAuthenticated(valid);
        onAdminAuthChange(valid);
        if (valid) {
          loadPolls();
        }
      });
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    setLoading(true);
    const valid = await verifyAdminKey(keyInput.trim());
    setLoading(false);

    if (valid) {
      setAdminKey(keyInput.trim());
      setIsAuthenticated(true);
      onAdminAuthChange(true);
      onShowToast('Admin authenticated successfully', 'success');
      loadPolls();
    } else {
      onShowToast('Invalid Admin Secret Key', 'error');
    }
  };

  const handleLogout = () => {
    removeAdminKey();
    setIsAuthenticated(false);
    onAdminAuthChange(false);
    setKeyInput('');
    setPolls([]);
    onShowToast('Logged out of Admin Portal', 'info');
  };

  const loadPolls = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminPolls();
      setPolls(data);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to fetch polls', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPollId(null);
    setFormQuestion('');
    setFormOptionALabel('');
    setFormOptionAUrl('');
    setFormOptionBLabel('');
    setFormOptionBUrl('');

    // Default to tomorrow or next available date
    const today = new Date().toISOString().split('T')[0];
    setFormDate(today);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (poll: ArchivePollItem) => {
    setEditingPollId(poll.id);
    setFormQuestion(poll.question);
    setFormOptionALabel(poll.option_a_label);
    setFormOptionAUrl(poll.option_a_image_url);
    setFormOptionBLabel(poll.option_b_label);
    setFormOptionBUrl(poll.option_b_image_url);
    setFormDate(poll.scheduled_date);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSavePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formQuestion.trim() || !formOptionALabel.trim() || !formOptionBLabel.trim() || !formDate) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (!formOptionAUrl.startsWith('http://') && !formOptionAUrl.startsWith('https://')) {
      setFormError('Option A image URL must start with http:// or https://');
      return;
    }

    if (!formOptionBUrl.startsWith('http://') && !formOptionBUrl.startsWith('https://')) {
      setFormError('Option B image URL must start with http:// or https://');
      return;
    }

    // Check for duplicate date client-side
    const duplicate = polls.find(
      (p) => p.scheduled_date === formDate && p.id !== editingPollId
    );
    if (duplicate) {
      setFormError(`A poll is already scheduled for ${formDate}. Pick a different date.`);
      return;
    }

    const payload: PollInput = {
      question: formQuestion.trim(),
      option_a_label: formOptionALabel.trim(),
      option_a_image_url: formOptionAUrl.trim(),
      option_b_label: formOptionBLabel.trim(),
      option_b_image_url: formOptionBUrl.trim(),
      scheduled_date: formDate,
    };

    setIsSaving(true);
    try {
      if (editingPollId) {
        await updateAdminPoll(editingPollId, payload);
        onShowToast('Poll updated successfully', 'success');
      } else {
        await createAdminPoll(payload);
        onShowToast('New poll scheduled successfully', 'success');
      }
      setIsModalOpen(false);
      loadPolls();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save poll');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (pollId: number, date: string) => {
    if (!window.confirm(`Are you sure you want to delete the poll scheduled for ${date}? This will also delete any cast votes.`)) {
      return;
    }

    try {
      await deleteAdminPoll(pollId);
      onShowToast('Poll deleted', 'info');
      loadPolls();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to delete poll', 'error');
    }
  };

  const handleSeed = async () => {
    try {
      const res = await seedAdminData();
      onShowToast(res.message, 'success');
      loadPolls();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to seed sample data', 'error');
    }
  };

  // 1. Unauthenticated Login Gate
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-warm-300 p-8 shadow-card text-center">
          <div className="w-14 h-14 rounded-2xl bg-warm-200 text-accent flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-ink-900 mb-2">Admin Portal</h2>
          <p className="text-xs text-ink-500 mb-6">
            Enter your secret admin key configured in the backend environment (<code className="bg-warm-200 px-1 py-0.5 rounded">ADMIN_API_KEY</code>).
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Enter Admin API Key..."
                className="w-full px-4 py-3 rounded-2xl border border-warm-300 focus:outline-none focus:ring-2 focus:ring-accent text-sm text-ink-900 bg-warm-50 placeholder:text-ink-400"
              />
              <Key className="w-4 h-4 text-ink-400 absolute right-3.5 top-3.5" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-ink-900 text-white font-bold text-sm hover:bg-ink-800 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Unlock Admin Dashboard'}
            </button>
          </form>

          <p className="text-[11px] text-ink-400 mt-4">
            Default dev key: <code className="text-accent font-mono font-medium">thisorthat-admin-secret-2026</code>
          </p>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-warm-300">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900">
            Daily Poll Schedule
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
            Create, preview, and organize featured polls. New daily poll unlocks automatically at 12:00 AM IST.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-accent text-white text-xs sm:text-sm font-bold hover:bg-accent-hover transition-colors shadow-vote"
          >
            <Plus className="w-4 h-4" /> Schedule Poll
          </button>

          <button
            onClick={handleSeed}
            title="Pre-populate 7 sample polls"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-warm-200 text-ink-800 text-xs sm:text-sm font-semibold hover:bg-warm-300 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-orange-500" /> Seed Week
          </button>

          <button
            onClick={handleLogout}
            title="Log out"
            className="p-2.5 rounded-full bg-warm-200 text-ink-600 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Polls Listing */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 rounded-full border-4 border-accent/20 border-t-accent animate-spin mx-auto mb-3" />
          <p className="text-sm text-ink-500 font-medium">Loading polls...</p>
        </div>
      ) : polls.length === 0 ? (
        <div className="bg-white rounded-3xl border border-warm-300 p-12 text-center">
          <Calendar className="w-12 h-12 text-ink-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-ink-900 mb-1">No polls scheduled yet</h3>
          <p className="text-xs text-ink-500 mb-4">Click "Schedule Poll" or "Seed Week" to get started.</p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-ink-900 text-white text-xs font-bold"
          >
            <Plus className="w-4 h-4" /> Create First Poll
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((p) => {
            const isToday = p.scheduled_date === todayStr;
            const isUpcoming = p.scheduled_date > todayStr;
            const isArchived = p.scheduled_date < todayStr;

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-warm-300 p-5 hover:border-warm-400 hover:shadow-subtle transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Left Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-ink-700 bg-warm-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-ink-500" />
                      {p.scheduled_date}
                    </span>

                    {isToday && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                        ● Active Today
                      </span>
                    )}
                    {isUpcoming && (
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-700 text-xs font-bold">
                        Upcoming
                      </span>
                    )}
                    {isArchived && (
                      <span className="px-2.5 py-0.5 rounded-full bg-warm-200 text-ink-500 text-xs font-semibold">
                        Archived
                      </span>
                    )}

                    <span className="text-xs text-ink-400 font-medium ml-1">
                      {p.total_votes.toLocaleString()} total votes
                    </span>
                  </div>

                  <h3 className="font-extrabold text-ink-900 text-base leading-snug">
                    {p.question}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-ink-600">
                    <span className="font-medium">
                      <strong>A:</strong> {p.option_a_label} ({p.percentage_a}%)
                    </span>
                    <span className="text-warm-400">•</span>
                    <span className="font-medium">
                      <strong>B:</strong> {p.option_b_label} ({p.percentage_b}%)
                    </span>
                  </div>
                </div>

                {/* Right Thumbnails & Actions */}
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-warm-200">
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-warm-200 border border-warm-300" title={p.option_a_label}>
                      <ImageWithFallback src={p.option_a_image_url} alt={p.option_a_label} />
                    </div>
                    <span className="text-[10px] font-bold text-ink-400">VS</span>
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-warm-200 border border-warm-300" title={p.option_b_label}>
                      <ImageWithFallback src={p.option_b_image_url} alt={p.option_b_label} />
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(p)}
                      title="Edit Poll"
                      className="p-2 rounded-xl text-ink-600 hover:text-ink-900 hover:bg-warm-200 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.scheduled_date)}
                      title="Delete Poll"
                      className="p-2 rounded-xl text-ink-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Poll Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-ink-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-warm-300">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-warm-200 text-ink-600 hover:text-ink-900 hover:bg-warm-300 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-extrabold text-ink-900 mb-1">
              {editingPollId ? 'Edit Daily Poll' : 'Schedule New Daily Poll'}
            </h2>
            <p className="text-xs text-ink-500 mb-6">
              Each calendar day in IST must have a unique featured poll.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSavePoll} className="space-y-4">
              
              {/* Scheduled Date */}
              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Scheduled Date (IST) *
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-warm-300 text-sm text-ink-900 bg-warm-50 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Question */}
              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Poll Question *
                </label>
                <input
                  type="text"
                  required
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="e.g. Which destination would you pick?"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-warm-300 text-sm text-ink-900 bg-warm-50 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Option A Section */}
              <div className="p-4 rounded-2xl bg-warm-100 border border-warm-200 space-y-3">
                <span className="text-xs font-extrabold text-ink-900 uppercase tracking-wider">
                  Option A
                </span>
                <div>
                  <label className="block text-[11px] font-semibold text-ink-600 mb-1">Label *</label>
                  <input
                    type="text"
                    required
                    value={formOptionALabel}
                    onChange={(e) => setFormOptionALabel(e.target.value)}
                    placeholder="e.g. Tropical Beach"
                    className="w-full px-3 py-2 rounded-xl border border-warm-300 text-xs text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-ink-600 mb-1">Image URL *</label>
                  <input
                    type="url"
                    required
                    value={formOptionAUrl}
                    onChange={(e) => setFormOptionAUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 rounded-xl border border-warm-300 text-xs text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                {formOptionAUrl && (
                  <div className="h-28 rounded-xl overflow-hidden bg-warm-200 border border-warm-300">
                    <ImageWithFallback src={formOptionAUrl} alt={formOptionALabel || 'Option A'} />
                  </div>
                )}
              </div>

              {/* Option B Section */}
              <div className="p-4 rounded-2xl bg-warm-100 border border-warm-200 space-y-3">
                <span className="text-xs font-extrabold text-ink-900 uppercase tracking-wider">
                  Option B
                </span>
                <div>
                  <label className="block text-[11px] font-semibold text-ink-600 mb-1">Label *</label>
                  <input
                    type="text"
                    required
                    value={formOptionBLabel}
                    onChange={(e) => setFormOptionBLabel(e.target.value)}
                    placeholder="e.g. Mountain Chalet"
                    className="w-full px-3 py-2 rounded-xl border border-warm-300 text-xs text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-ink-600 mb-1">Image URL *</label>
                  <input
                    type="url"
                    required
                    value={formOptionBUrl}
                    onChange={(e) => setFormOptionBUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 rounded-xl border border-warm-300 text-xs text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                {formOptionBUrl && (
                  <div className="h-28 rounded-xl overflow-hidden bg-warm-200 border border-warm-300">
                    <ImageWithFallback src={formOptionBUrl} alt={formOptionBLabel || 'Option B'} />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-ink-600 hover:bg-warm-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-full bg-accent text-white text-xs font-bold hover:bg-accent-hover transition-colors shadow-vote disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingPollId ? 'Update Poll' : 'Schedule Poll'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
