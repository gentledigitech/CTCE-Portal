import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TraineeUser, Hall } from '../../types';
import { api } from '../../lib/api';
import { MessageSquare, Send, CheckCircle2, AlertCircle, Users } from 'lucide-react';

interface BulkSmsTabProps {
  trainees: TraineeUser[];
  halls: Hall[];
  onRefreshData: () => Promise<void>;
}

export const BulkSmsTab: React.FC<BulkSmsTabProps> = ({
  trainees,
  halls,
  onRefreshData
}) => {
  const { user } = useAuth();
  const [recipientGroup, setRecipientGroup] = useState<'all' | 'level' | 'hall'>('all');
  const [selectedLevel, setSelectedLevel] = useState<number>(100);
  const [selectedHall, setSelectedHall] = useState<string>(halls[0]?.id || '');
  const [smsMessage, setSmsMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;

  // Recipient computation
  const activeTrainees = trainees.filter((t) => !t.is_deleted);
  const targetTrainees = activeTrainees.filter((t) => {
    if (recipientGroup === 'all') return true;
    if (recipientGroup === 'level') return t.level === selectedLevel;
    if (recipientGroup === 'hall') return t.hall_id === selectedHall;
    return true;
  });

  // 140 characters per SMS unit as specified in prompt
  const charLength = smsMessage.length;
  const unitCount = Math.ceil(charLength / 140) || 1;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResultMsg(null);

    if (targetTrainees.length === 0) {
      setResultMsg({ type: 'error', text: 'No active recipients found for the selected group.' });
      return;
    }

    if (!smsMessage.trim()) {
      setResultMsg({ type: 'error', text: 'Please enter a message to broadcast.' });
      return;
    }

    setIsSending(true);
    try {
      const phones = targetTrainees.map((t) => t.phone_e164);
      const res = await api.sendBulkSms(phones, smsMessage.trim(), user.id);
      await onRefreshData();
      setResultMsg({
        type: 'success',
        text: `SMS dispatched successfully to ${res.sentCount} trainee recipient(s) (${res.unitsUsed} units calculated).`
      });
      setSmsMessage('');
    } catch (err: any) {
      setResultMsg({ type: 'error', text: err.message || 'Failed to dispatch SMS.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-stone-900">
            SMS Broadcast Desk
          </h2>
          <p className="text-xs text-stone-500">
            Send official college announcements and notices directly to trainees&apos; phones.
          </p>
        </div>
      </div>

      {resultMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
            resultMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-red-50 border border-red-200 text-red-900'
          }`}
        >
          {resultMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{resultMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSend} className="space-y-4">
        {/* Recipient Target Selection */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
            Target Recipients
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setRecipientGroup('all')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition border min-h-[44px] ${
                recipientGroup === 'all'
                  ? 'bg-emerald-800 text-white border-emerald-800'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              All Trainees ({activeTrainees.length})
            </button>
            <button
              type="button"
              onClick={() => setRecipientGroup('level')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition border min-h-[44px] ${
                recipientGroup === 'level'
                  ? 'bg-emerald-800 text-white border-emerald-800'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              By Level
            </button>
            <button
              type="button"
              onClick={() => setRecipientGroup('hall')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition border min-h-[44px] ${
                recipientGroup === 'hall'
                  ? 'bg-emerald-800 text-white border-emerald-800'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              By Hall
            </button>
          </div>
        </div>

        {/* Group Filter Details */}
        {recipientGroup === 'level' && (
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Select Study Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm min-h-[44px]"
            >
              <option value={100}>Level 100</option>
              <option value={200}>Level 200</option>
              <option value={300}>Level 300</option>
              <option value={400}>Level 400</option>
            </select>
          </div>
        )}

        {recipientGroup === 'hall' && (
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Select Residential Hall
            </label>
            <select
              value={selectedHall}
              onChange={(e) => setSelectedHall(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm min-h-[44px]"
            >
              {halls.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <Users className="w-4 h-4 text-emerald-700" />
            Selected Recipients:
          </span>
          <strong className="text-stone-900">{targetTrainees.length} trainees</strong>
        </div>

        {/* SMS Message Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              SMS Message Content
            </label>
            {/* 140 chars per SMS unit count as instructed */}
            <span className="text-xs text-stone-500 font-medium">
              {charLength} chars ({unitCount} unit{unitCount > 1 ? 's' : ''} • 140 chars/unit)
            </span>
          </div>
          <textarea
            rows={4}
            value={smsMessage}
            onChange={(e) => setSmsMessage(e.target.value)}
            placeholder="Type official SMS announcement here..."
            required
            className="w-full p-3.5 rounded-xl border border-stone-300 focus:border-emerald-600 text-sm leading-relaxed"
          />
        </div>

        <button
          type="submit"
          disabled={isSending || targetTrainees.length === 0}
          className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md min-h-[48px] flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4 text-amber-300" />
          {isSending ? 'Transmitting SMS...' : `Dispatch SMS to ${targetTrainees.length} Recipients`}
        </button>
      </form>
    </div>
  );
};
