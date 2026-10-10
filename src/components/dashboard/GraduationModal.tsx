import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Award, GraduationCap, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GraduationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GraduationModal: React.FC<GraduationModalProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 }
      });
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleAcknowledgeAndComplete = async () => {
    await api.acknowledgeGraduation(user.id);
    onClose();
    logout();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border-2 border-amber-300 shadow-2xl text-center animate-scale-in">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4 border border-amber-300">
          <GraduationCap className="w-9 h-9" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-2">
          Class of {new Date().getFullYear()}
        </span>

        <h2 className="text-2xl font-black text-stone-900 mb-2">
          Congratulations, {user.full_name}!
        </h2>

        <p className="text-sm text-stone-700 leading-relaxed mb-6">
          You have successfully completed your 4-year Bachelor of Education teacher training curriculum at{' '}
          <strong>Christ the Teacher College of Education (CTCE)</strong>.
        </p>

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 font-medium text-left space-y-1 mb-6">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <Award className="w-4 h-4" /> Degree Completion Status: Verified
          </div>
          <p>
            Your training records have been archived into the National Teachers Council (NTC) registry.
          </p>
        </div>

        <button
          onClick={handleAcknowledgeAndComplete}
          className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md min-h-[48px] flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5 text-amber-300" />
          Acknowledge & Complete Graduation
        </button>
      </div>
    </div>
  );
};
