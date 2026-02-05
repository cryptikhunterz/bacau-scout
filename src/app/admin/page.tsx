'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Scout {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  token: string;
  used: boolean;
  createdAt: string;
  expiresAt: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('scout');
  const [generatedLink, setGeneratedLink] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchScouts();
      fetchInvites();
    }
  }, [status]);

  const fetchScouts = async () => {
    const res = await fetch('/api/admin/scouts');
    if (res.ok) setScouts(await res.json());
  };

  const fetchInvites = async () => {
    const res = await fetch('/api/admin/invites');
    if (res.ok) setInvites(await res.json());
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setGeneratedLink('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
      } else {
        setGeneratedLink(data.inviteLink);
        setInviteEmail('');
        fetchInvites();
      }
    } catch {
      setError('Failed to create invite');
    }
    setLoading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') return null;

  const pendingInvites = invites.filter((inv) => !inv.used && new Date(inv.expiresAt) > new Date());

  return (
    <div className="min-h-screen bg-zinc-900 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">⚙️ Admin Panel</h1>
            <p className="text-zinc-400 text-sm">Manage scouts and invitations</p>
          </div>
          <a href="/" className="text-blue-400 hover:text-blue-300 text-sm">
            ← Back to App
          </a>
        </div>

        {/* Invite Form */}
        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
          <h2 className="text-lg font-semibold text-white mb-4">Invite New Scout</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateInvite} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-zinc-400 mb-1">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-zinc-700 border border-zinc-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="scout@email.com"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="px-3 py-2 rounded-lg bg-zinc-700 border border-zinc-600 text-white text-sm"
              >
                <option value="scout">Scout</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? 'Creating...' : 'Generate Invite'}
            </button>
          </form>

          {generatedLink && (
            <div className="mt-4 p-3 bg-zinc-700 rounded-lg">
              <p className="text-xs text-zinc-400 mb-1">Invite Link (expires in 7 days):</p>
              <div className="flex items-center gap-2">
                <code className="text-sm text-green-400 break-all flex-1">{generatedLink}</code>
                <button
                  onClick={copyLink}
                  className="px-3 py-1 bg-zinc-600 hover:bg-zinc-500 text-white rounded text-xs shrink-0"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scouts List */}
        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
          <h2 className="text-lg font-semibold text-white mb-4">
            All Scouts ({scouts.length})
          </h2>
          {scouts.length === 0 ? (
            <p className="text-zinc-500 text-sm">No scouts yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-700 text-zinc-400">
                    <th className="text-left py-2 px-3">Name</th>
                    <th className="text-left py-2 px-3">Email</th>
                    <th className="text-left py-2 px-3">Role</th>
                    <th className="text-left py-2 px-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {scouts.map((scout) => (
                    <tr key={scout.id} className="border-b border-zinc-700/50">
                      <td className="py-2 px-3 text-white">{scout.name}</td>
                      <td className="py-2 px-3 text-zinc-300">{scout.email}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            scout.role === 'admin'
                              ? 'bg-purple-900/50 text-purple-300'
                              : 'bg-blue-900/50 text-blue-300'
                          }`}
                        >
                          {scout.role}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-zinc-400">
                        {new Date(scout.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending Invites */}
        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
          <h2 className="text-lg font-semibold text-white mb-4">
            Pending Invites ({pendingInvites.length})
          </h2>
          {pendingInvites.length === 0 ? (
            <p className="text-zinc-500 text-sm">No pending invites</p>
          ) : (
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 bg-zinc-700/50 rounded-lg"
                >
                  <div>
                    <span className="text-white text-sm">{invite.email}</span>
                    <span
                      className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                        invite.role === 'admin'
                          ? 'bg-purple-900/50 text-purple-300'
                          : 'bg-blue-900/50 text-blue-300'
                      }`}
                    >
                      {invite.role}
                    </span>
                  </div>
                  <span className="text-zinc-500 text-xs">
                    Expires {new Date(invite.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
