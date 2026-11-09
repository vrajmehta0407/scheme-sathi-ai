'use client';

import React, { useState, useEffect } from 'react';
import { Scheme, Language } from '@schemesathi/shared';
import { translations } from '../../lib/i18n';
import { fetchSchemes, adminUpdateStatus } from '../../lib/api';
import { X, ShieldCheck, Lock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface AdminReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const AdminReviewModal: React.FC<AdminReviewModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [adminKey, setAdminKey] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string>('');

  const t = translations[language].admin;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      // Test key against admin endpoint
      const res = await fetch(`http://localhost:8000/api/v1/admin/schemes`, {
        headers: { 'X-Admin-Secret': adminKey },
      });
      if (res.ok) {
        const data = await res.json();
        setSchemes(data);
        setIsAuthenticated(true);
      } else {
        setErrorMsg('Invalid Admin Secret Key. Access denied.');
      }
    } catch {
      // In offline mode, allow local dev key
      if (adminKey === 'dev_admin_secret_key_change_in_production' || adminKey === 'admin') {
        const local = await fetchSchemes();
        setSchemes(local);
        setIsAuthenticated(true);
      } else {
        setErrorMsg('Server offline or invalid key.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (schemeId: string, newStatus: string) => {
    try {
      const ok = await adminUpdateStatus(schemeId, newStatus, adminKey);
      if (ok) {
        setSchemes((prev) =>
          prev.map((s) => (s.id === schemeId ? { ...s, status: newStatus as any } : s))
        );
        setActionNotice(`Scheme status updated to '${newStatus}'.`);
        setTimeout(() => setActionNotice(''), 3000);
      }
    } catch {
      setActionNotice('Failed to update status on server.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-navy/50 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-5xl bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(11,25,44,0.25)] border border-editorial-border relative overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Luminous Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-navy via-coral to-coral-light" />
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-editorial-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-display text-ink">
                {t.title}
              </h2>
              <p className="text-xs text-ink-muted">{t.subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 text-ink-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-6">
          {!isAuthenticated ? (
            <div className="max-w-md mx-auto py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-black/5 text-ink-muted flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-ink mb-1">Restricted Administrative Area</h3>
                <p className="text-xs text-ink-muted">{t.passcodePrompt}</p>
              </div>

              <form onSubmit={handleUnlock} className="space-y-3">
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter X-Admin-Secret..."
                  className="w-full p-3 rounded-xl border border-editorial-border bg-canvas text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  autoFocus
                />
                {errorMsg && (
                  <p className="text-xs text-status-error font-medium">{errorMsg}</p>
                )}
                <button
                  type="submit"
                  disabled={loading || !adminKey}
                  className="w-full py-2.5 rounded-full bg-primary hover:bg-primary-hover disabled:opacity-40 text-white text-xs font-bold shadow-sm transition-all"
                >
                  {loading ? 'Verifying...' : t.unlockBtn}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {actionNotice && (
                <div className="p-3 rounded-xl bg-status-success-soft text-status-success text-xs font-semibold border border-status-success/20 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{actionNotice}</span>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-editorial-border text-ink-muted uppercase font-bold text-[11px]">
                      <th className="p-3">{t.schemeCol}</th>
                      <th className="p-3">{t.categoryCol}</th>
                      <th className="p-3">{t.sourceCol}</th>
                      <th className="p-3">{t.verifiedCol}</th>
                      <th className="p-3">{t.statusCol}</th>
                      <th className="p-3 text-right">{t.actionCol}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-editorial-border">
                    {schemes.map((s) => (
                      <tr key={s.id} className="hover:bg-canvas/50 transition-colors">
                        <td className="p-3 font-bold text-ink">
                          {language === 'gu' ? s.name_gu : s.name_en}
                          <div className="text-[10px] text-ink-muted font-mono">{s.slug}</div>
                        </td>
                        <td className="p-3 capitalize">{s.category}</td>
                        <td className="p-3 text-ink-muted max-w-[200px] truncate">
                          {s.source_org}
                          <div className="text-[10px] text-primary">{s.source_domain}</div>
                        </td>
                        <td className="p-3 text-[11px] font-mono">{s.verified_at.split('T')[0]}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              s.status === 'published'
                                ? 'bg-status-success-soft text-status-success'
                                : s.status === 'reviewed'
                                ? 'bg-primary-soft text-primary'
                                : 'bg-status-caution-soft text-status-caution'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1.5">
                          {s.status !== 'published' && (
                            <button
                              onClick={() => handleStatusChange(s.id, 'published')}
                              className="px-2.5 py-1 rounded-lg bg-status-success hover:bg-status-success/90 text-white text-[11px] font-semibold"
                            >
                              {t.publish}
                            </button>
                          )}
                          {s.status !== 'reviewed' && (
                            <button
                              onClick={() => handleStatusChange(s.id, 'reviewed')}
                              className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary-hover text-white text-[11px] font-semibold"
                            >
                              {t.markReview}
                            </button>
                          )}
                          {s.status !== 'needs_verification' && (
                            <button
                              onClick={() => handleStatusChange(s.id, 'needs_verification')}
                              className="px-2.5 py-1 rounded-lg bg-status-caution hover:bg-status-caution/90 text-white text-[11px] font-semibold"
                            >
                              {t.markNeedsVerification}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

