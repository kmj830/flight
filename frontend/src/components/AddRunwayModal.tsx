import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { RunwayType, RunwayDto } from '../types';

interface AddRunwayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, type: RunwayType, crossingId?: number | null) => void;
  existingRunways: RunwayDto[];
}

export const AddRunwayModal: React.FC<AddRunwayModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  existingRunways,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<RunwayType>('ALL');
  const [crossingId, setCrossingId] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cId = crossingId ? parseInt(crossingId, 10) : null;
    onAdd(name || `활주로 ${existingRunways.length + 1}`, type, cId);
    setName('');
    setCrossingId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-radar-border bg-radar-panel p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-radar-border pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-radar-cyan" />
            <h3 className="text-sm font-bold text-slate-100">
              신규 활주로 동적 증설 (EXPAND RUNWAY)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1 font-semibold">
              활주로 명칭
            </label>
            <input
              type="text"
              placeholder={`예: 활주로 ${existingRunways.length + 1} (36L/18R)`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200 focus:border-radar-cyan focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold">
              활주로 운영 유형
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as RunwayType)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200 focus:border-radar-cyan focus:outline-none"
            >
              <option value="ALL">이착륙 겸용 (ALL)</option>
              <option value="TAKEOFF_ONLY">이륙 전용 (TAKEOFF ONLY)</option>
              <option value="EMERGENCY_ONLY">비상 착륙 전용 (EMERGENCY ONLY)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold">
              X자 교차 상호배제 연동 활주로 (선택)
            </label>
            <select
              value={crossingId}
              onChange={(e) => setCrossingId(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200 focus:border-radar-cyan focus:outline-none"
            >
              <option value="">교차 활주로 없음 (독립 운영)</option>
              {existingRunways.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (ID: {r.id})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              선택한 활주로와 동시에 운항할 수 없도록 물리적 상호배제(Mutex)가 적용됩니다.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-radar-cyan/20 border border-radar-cyan/40 px-4 py-2 font-semibold text-radar-cyan hover:bg-radar-cyan/30 transition"
            >
              <Plus className="h-4 w-4" />
              활주로 증설 완료
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
