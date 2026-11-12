'use client';

import { useState } from 'react';
import {
  DownloadSimple,
  LockKey,
  ShieldCheck,
  Trash,
  UploadSimple,
  UserCircle,
} from '@phosphor-icons/react';
import { useSathiStore } from '@/lib/store/useSathiStore';
import { decryptLocalBackup, encryptLocalBackup } from '@/lib/tracker';

export default function SettingsPrivacyPage() {
  const {
    profiles,
    activeProfileId,
    bookmarksByProfile,
    applicationsByProfile,
    addProfile,
    importFullWorkspace,
    clearAllData,
    catalogue,
  } = useSathiStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [authMsg, setAuthMsg] = useState('');

  const [backupPass, setBackupPass] = useState('');
  const [backupMsg, setBackupMsg] = useState('');
  const [restoreText, setRestoreText] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: authMode, email, password }),
    });
    const data = await res.json();
    if (!res.ok) setAuthMsg(data.error ?? 'Failed');
    else setAuthMsg(`Signed in locally as ${data.user.email} (bcrypt + httpOnly cookie).`);
  };

  const handleExportPlain = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      profiles,
      activeProfileId,
      bookmarksByProfile,
      applicationsByProfile,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scheme-sathi-my-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Extra Feature #12: AES-GCM Encrypted Backup
  const handleEncryptedExport = async () => {
    if (backupPass.length < 4) {
      setBackupMsg('Enter a passphrase of at least 4 characters.');
      return;
    }
    const payload = {
      profiles,
      activeProfileId,
      bookmarksByProfile,
      applicationsByProfile,
    };
    const encrypted = await encryptLocalBackup(payload, backupPass);
    const blob = new Blob([encrypted], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scheme-sathi-encrypted-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    setBackupMsg('AES-GCM encrypted backup downloaded locally.');
  };

  const handleEncryptedRestore = async () => {
    try {
      const restored = await decryptLocalBackup<{
        profiles: typeof profiles;
        activeProfileId: string;
        bookmarksByProfile: typeof bookmarksByProfile;
        applicationsByProfile: typeof applicationsByProfile;
      }>(restoreText, backupPass);
      importFullWorkspace(restored);
      setBackupMsg('Restored profiles, bookmarks, and tracked applications!');
    } catch {
      setBackupMsg('Decryption failed — check passphrase or backup JSON.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass p-6 space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
          <ShieldCheck size={15} weight="duotone" />
          100% Local • Zero Tracking • No Third-Party Analytics
        </span>
        <h1 className="font-display text-3xl font-bold text-ink">
          Privacy, Local Account &amp; Encrypted Backup
        </h1>
        <p className="text-sm text-ink/75">
          Guest mode works without any login. You can export your data, encrypt a backup with AES-GCM, or erase everything permanently.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Export, Encrypted Backup & Erase */}
        <div className="glass p-6 space-y-4">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
            <LockKey size={20} weight="duotone" className="text-blue" />
            Data Control &amp; AES-GCM Encrypted Backup
          </h2>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExportPlain}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-blue px-5 text-xs font-bold text-white"
            >
              <DownloadSimple size={16} weight="bold" />
              Export My Data (JSON)
            </button>

            <button
              type="button"
              onClick={() => {
                const cur = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
                addProfile(`${cur.label} (Copy)`, { ...cur });
                setBackupMsg(`Cloned profile '${cur.label}' for family member use.`);
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-yellow px-4 text-xs font-bold text-ink"
            >
              Clone Active Profile
            </button>

            <button
              type="button"
              onClick={async () => {
                await clearAllData();
                setBackupMsg('All local browser & SQLite citizen data erased.');
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-blue bg-white px-5 text-xs font-bold text-blue-700 hover:bg-blue-50"
            >
              <Trash size={16} weight="duotone" />
              Erase All My Data
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-chip border border-blue/15 bg-white/85 p-3">
              <div className="text-[11px] font-bold text-ink/70">Local Profiles</div>
              <div className="font-mono-num text-lg font-bold text-ink">{profiles.length}</div>
            </div>
            <div className="rounded-chip border border-blue/15 bg-white/85 p-3">
              <div className="text-[11px] font-bold text-ink/70">Cached Schemes</div>
              <div className="font-mono-num text-lg font-bold text-blue">{catalogue.schemes.length}</div>
            </div>
            <div className="rounded-chip border border-blue/15 bg-white/85 p-3">
              <div className="text-[11px] font-bold text-ink/70">Tracked Apps</div>
              <div className="font-mono-num text-lg font-bold text-green-700">
                {Object.values(applicationsByProfile).reduce((s, arr) => s + arr.length, 0)}
              </div>
            </div>
          </div>

          <div className="rounded-card border border-blue/15 bg-white/85 p-4 space-y-3">
            <div className="text-xs font-bold text-ink">
              Password-Protected Local Backup (Web Crypto AES-256-GCM)
            </div>
            <input
              type="password"
              placeholder="Backup passphrase..."
              value={backupPass}
              onChange={(e) => setBackupPass(e.target.value)}
              className="min-h-[42px] w-full rounded-pill border border-blue/25 bg-white px-4 text-xs font-semibold"
            />
            <button
              type="button"
              onClick={handleEncryptedExport}
              className="min-h-[40px] w-full rounded-pill bg-yellow px-4 text-xs font-bold text-ink"
            >
              Download Encrypted Backup
            </button>

            <textarea
              rows={3}
              placeholder="Paste encrypted backup JSON to restore..."
              value={restoreText}
              onChange={(e) => setRestoreText(e.target.value)}
              className="w-full rounded-chip border border-blue/20 bg-white p-2 font-mono-num text-[11px]"
            />
            <button
              type="button"
              onClick={handleEncryptedRestore}
              className="inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-pill border border-blue/25 bg-white px-4 text-xs font-bold text-ink hover:bg-blue-50"
            >
              <UploadSimple size={14} />
              Decrypt &amp; Restore Backup
            </button>
            {backupMsg && <p className="text-xs font-bold text-blue-700">{backupMsg}</p>}
          </div>
        </div>

        {/* Optional Local Account */}
        <form onSubmit={handleAuth} className="glass p-6 space-y-4">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
            <UserCircle size={20} weight="duotone" className="text-blue" />
            Optional Local Account (SQLite + bcrypt)
          </h2>
          <p className="text-xs text-ink/75">
            Completely optional — stored only in your local SQLite file, never sent anywhere.
          </p>

          <div className="flex gap-2">
            {(['register', 'login'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setAuthMode(m)}
                className={`min-h-[38px] rounded-pill px-4 text-xs font-bold capitalize ${
                  authMode === m ? 'bg-blue text-white' : 'bg-white text-ink border border-blue/20'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-bold">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-input border border-blue/25 bg-white px-4 text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-bold">Password (min 6 chars)</label>
            <input
              required
              minLength={6}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-input border border-blue/25 bg-white px-4 text-xs"
            />
          </div>

          <button
            type="submit"
            className="min-h-[46px] w-full rounded-pill bg-blue px-5 text-sm font-bold text-white"
          >
            {authMode === 'register' ? 'Create Local Account' : 'Sign In Locally'}
          </button>
          {authMsg && <p className="text-xs font-bold text-blue-700">{authMsg}</p>}
        </form>
      </div>
    </div>
  );
}

