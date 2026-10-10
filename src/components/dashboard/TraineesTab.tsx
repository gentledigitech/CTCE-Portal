import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TraineeUser, Hall } from '../../types';
import { maskPhoneNumber } from '../../lib/validators';
import { api } from '../../lib/api';
import {
  Users,
  Search,
  Download,
  Edit3,
  Trash2,
  RotateCcw,
  Building,
  Phone,
  Shield,
  CheckCircle,
  Clock,
  Filter
} from 'lucide-react';

interface TraineesTabProps {
  trainees: TraineeUser[];
  halls: Hall[];
  onRefreshData: () => Promise<void>;
}

export const TraineesTab: React.FC<TraineesTabProps> = ({
  trainees,
  halls,
  onRefreshData
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingTrainee, setEditingTrainee] = useState<TraineeUser | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editProgramme, setEditProgramme] = useState('');
  const [editTraineeId, setEditTraineeId] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!user) return null;

  const isStaff = user.role === 'admin' || user.role === 'super_admin';
  const isSuperAdmin = user.role === 'super_admin';

  // Filter trainees
  const filtered = trainees.filter((t) => {
    // Only show un-deleted unless super admin is viewing
    const matchesSearch =
      t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.trainee_id && t.trainee_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.hall_name && t.hall_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Export CSV
  const handleExportCsv = () => {
    const csvContent = api.exportApplicantsCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CTCE_Trainees_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Edit Modal
  const handleOpenEdit = (target: TraineeUser) => {
    setEditingTrainee(target);
    setEditFullName(target.full_name);
    setEditPhone(target.phone_e164);
    setEditProgramme(target.programme);
    setEditTraineeId(target.trainee_id || '');
    setEditError(null);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrainee) return;
    setEditError(null);
    setIsSaving(true);
    try {
      await api.updateTraineeDetails(
        editingTrainee.id,
        {
          full_name: editFullName.trim(),
          phone_e164: editPhone.trim(),
          programme: editProgramme,
          trainee_id: editTraineeId.trim() || undefined
        },
        user.id,
        'Staff directory update'
      );
      await onRefreshData();
      setEditingTrainee(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update trainee details.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Trainee
  const handleDelete = async (targetId: string) => {
    if (!confirm('Are you sure you want to delete this trainee record?')) return;
    try {
      await api.deleteTrainee(targetId, user.id);
      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Could not delete trainee');
    }
  };

  // Restore Trainee
  const handleRestore = async (targetId: string) => {
    try {
      await api.restoreTrainee(targetId, user.id);
      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Could not restore trainee');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Search */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-800" />
              <h2 className="text-xl sm:text-2xl font-black text-stone-900">
                Trainees Directory
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Active registered trainees count: <strong className="text-stone-800">{trainees.length}</strong>
            </p>
          </div>

          {/* Export CSV for Admin & Super Admin */}
          {isStaff && (
            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs rounded-xl transition border border-emerald-300 flex items-center gap-2 self-start sm:self-auto min-h-[44px]"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              Export CSV
            </button>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, Trainee ID, or hall..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 text-sm min-h-[44px]"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm min-h-[44px]"
            >
              <option value="all">All Statuses</option>
              <option value="allocated">Allocated to Hall</option>
              <option value="pending">Pending</option>
              <option value="waitlisted">Waitlisted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trainees List / Table (Vertical Mobile-Friendly Cards) */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center text-stone-500 text-sm">
            No trainees found matching your criteria.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs hover:border-emerald-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                {/* Passport photo or Initials */}
                <div className="w-11 h-11 rounded-full overflow-hidden bg-emerald-100 border border-emerald-300 shrink-0">
                  {item.passport_url ? (
                    <img
                      src={item.passport_url}
                      alt={item.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-xs text-emerald-800">
                      {item.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm sm:text-base text-stone-900 truncate">
                      {item.full_name}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[11px] font-bold">
                      Level {item.level}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-stone-500 mt-1 flex-wrap">
                    <span>
                      Trainee ID:{' '}
                      <strong className="text-stone-800">
                        {item.trainee_id || 'PENDING'}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>{item.programme}</span>
                  </div>

                  {/* Masked phone for Viewer, full for Staff */}
                  <div className="text-xs text-stone-500 mt-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{isStaff ? item.phone_e164 : maskPhoneNumber(item.phone_e164)}</span>
                  </div>
                </div>
              </div>

              {/* Hall Status & Action Buttons */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100 shrink-0">
                {item.hall_name ? (
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800">
                      <Building className="w-3.5 h-3.5" />
                      {item.hall_name}
                    </span>
                  </div>
                ) : item.status === 'waitlisted' ? (
                  <span className="text-xs font-bold text-amber-700 inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Waitlisted
                  </span>
                ) : (
                  <span className="text-xs text-stone-400">Unallocated</span>
                )}

                {/* Edit & Delete for Staff */}
                {isStaff && (
                  <div className="flex items-center gap-1 pl-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      title="Edit Trainee Details"
                      className="p-2 text-stone-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center transition"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        title="Delete Trainee"
                        className="p-2 text-stone-500 hover:text-red-700 hover:bg-red-50 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Trainee Modal */}
      {editingTrainee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-stone-200 shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-stone-900 mb-1">
              Edit Trainee Record
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Update information for {editingTrainee.full_name}
            </p>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Trainee ID (e.g. CTCE/BEE/25/0123)
                </label>
                <input
                  type="text"
                  value={editTraineeId}
                  onChange={(e) => setEditTraineeId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm uppercase min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Phone Contact (E.164)
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Programme of Study
                </label>
                <input
                  type="text"
                  value={editProgramme}
                  onChange={(e) => setEditProgramme(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm min-h-[44px]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingTrainee(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs min-h-[44px]"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
