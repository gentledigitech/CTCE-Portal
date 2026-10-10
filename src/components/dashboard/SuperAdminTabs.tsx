import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TraineeUser, SmsLogEntry, AuditLogEntry } from '../../types';
import { api } from '../../lib/api';
import {
  ShieldAlert,
  UserCheck,
  UserPlus,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface UserManagementTabProps {
  trainees: TraineeUser[];
  onRefreshData: () => Promise<void>;
}

export const UserManagementTab: React.FC<UserManagementTabProps> = ({
  trainees,
  onRefreshData
}) => {
  const { user } = useAuth();
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [adminMsg, setAdminMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;
  const isSuperAdmin = user.role === 'super_admin';

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMsg(null);
    setIsCreatingAdmin(true);
    try {
      await api.signUp({
        fullName: newAdminName.trim(),
        email: newAdminEmail.trim().toLowerCase(),
        phoneE164: newAdminPhone.trim(),
        password: 'AdminPassword123',
        isContinuingStudent: false,
        programme: 'College Administration'
      });

      // Update role to admin in mock DB
      const all = await api.getAllUsersAdmin();
      const created = all.find((u) => u.email === newAdminEmail.trim().toLowerCase());
      if (created) {
        await api.updateTraineeDetails(created.id, { role: 'admin' }, user.id, 'Appointed as Staff Admin');
      }

      await onRefreshData();
      setAdminMsg({
        type: 'success',
        text: `Admin account for ${newAdminName} created successfully.`
      });
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPhone('');
    } catch (err: any) {
      setAdminMsg({ type: 'error', text: err.message || 'Failed to create admin.' });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleToggleViewerRole = async (target: TraineeUser) => {
    try {
      const nextRole = target.role === 'viewer' ? 'applicant' : 'viewer';
      await api.updateTraineeDetails(
        target.id,
        { role: nextRole },
        user.id,
        `Toggled viewer status to ${nextRole}`
      );
      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Error updating viewer role');
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Staff Admin (Super Admin Only) */}
      {isSuperAdmin && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-5 h-5 text-emerald-800" />
            <h3 className="text-lg font-bold text-stone-900">Create Staff Administrator</h3>
          </div>
          <p className="text-xs text-stone-500 mb-4">
            Only the Super Admin can appoint staff administrators with management privileges.
          </p>

          {adminMsg && (
            <div
              className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                adminMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-red-50 text-red-900 border border-red-200'
              }`}
            >
              <span>{adminMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Phone Contact
              </label>
              <input
                type="tel"
                value={newAdminPhone}
                onChange={(e) => setNewAdminPhone(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm min-h-[44px]"
              />
            </div>
            <div className="sm:col-span-3 pt-2">
              <button
                type="submit"
                disabled={isCreatingAdmin}
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs min-h-[44px]"
              >
                {isCreatingAdmin ? 'Creating...' : 'Register Staff Admin'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff & Viewers Registry */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-4">
        <h3 className="text-lg font-bold text-stone-900">
          User Permissions & Viewer Roster
        </h3>
        <p className="text-xs text-stone-500">
          Super Admin and Admin accounts, plus verified Viewers with search capabilities.
        </p>

        <div className="space-y-3 pt-2">
          {trainees.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-stone-900">{t.full_name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      t.role === 'super_admin'
                        ? 'bg-amber-100 text-amber-900'
                        : t.role === 'admin'
                        ? 'bg-blue-100 text-blue-900'
                        : t.role === 'viewer'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {t.role}
                  </span>
                </div>
                <div className="text-xs text-stone-500 mt-0.5">
                  {t.email} • {t.phone_e164}
                </div>
              </div>

              {isSuperAdmin && t.role !== 'super_admin' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleViewerRole(t)}
                    className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-white min-h-[40px]"
                  >
                    {t.role === 'viewer' ? 'Revoke Viewer Access' : 'Grant Viewer Role'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const SmsLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<SmsLogEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'sms' | 'audit'>('sms');

  useEffect(() => {
    const fetchLogs = async () => {
      const s = await api.getSmsLogs();
      const a = await api.getAuditLogs();
      setLogs(s);
      setAuditLogs(a);
    };
    fetchLogs();
  }, []);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-900">
            Activity & Dispatch Logs
          </h2>
          <p className="text-xs text-stone-500">
            Immutable audit records and plain SMS dispatch logs (codes securely redacted).
          </p>
        </div>

        <div className="flex items-center bg-stone-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('sms')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'sms'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            SMS Logs ({logs.length})
          </button>
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'audit'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Audit Trail ({auditLogs.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'sms' ? (
        <div className="space-y-2.5">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-stone-400 text-xs">No SMS logs recorded yet.</div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-stone-900">{log.recipient_phone}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-200 text-stone-700">
                      {log.kind}
                    </span>
                    <span className="text-[10px] text-stone-500 font-medium">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-stone-600 leading-snug">{log.message_preview}</p>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  {log.provider_status}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-stone-400 text-xs">No audit logs recorded yet.</div>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-stone-900">{log.action}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 text-stone-700 uppercase font-semibold">
                      {log.actor_type}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <pre className="text-[11px] text-stone-600 font-mono overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(log.detail, null, 2)}
                  </pre>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
