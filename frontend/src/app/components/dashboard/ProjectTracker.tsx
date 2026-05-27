import { FormEvent, useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { apiRequest } from '../../lib/api';

interface TrackingStage {
  status: string;
  label: string;
  progress: number;
  done: boolean;
  active: boolean;
}

interface ProjectHistory {
  id: string;
  title: string;
  body: string | null;
  eventType: string;
  createdAt: string;
}

interface ProjectTrackerProps {
  projectId: string;
  stages: TrackingStage[];
  histories: ProjectHistory[];
  canUpdate: boolean;
  onUpdated: (project: unknown) => void;
}

const updateStages = [
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'UNDER_REVIEW', label: 'Under Review' },
  { status: 'WAITING_PAYMENT', label: 'Waiting Payment' },
  { status: 'COMPLETED', label: 'Completed' },
];

export default function ProjectTracker({ projectId, stages, histories, canUpdate, onUpdated }: ProjectTrackerProps) {
  const [status, setStatus] = useState('IN_PROGRESS');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateProgress = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError('');
      const response = await apiRequest<{ project: unknown }>(`/projects/${projectId}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note }),
      });
      setNote('');
      onUpdated(response.project);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal update progress');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
      <h2 className="text-3xl mb-5" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        Project Tracking
      </h2>

      <div className="grid md:grid-cols-5 gap-3 mb-6">
        {stages.map((stage) => {
          const Icon = stage.done ? CheckCircle2 : Circle;
          return (
            <div
              key={`${stage.status}-${stage.label}`}
              className={`rounded-xl border p-4 ${
                stage.active
                  ? 'border-[#F5C800] bg-[#F5C800]/10'
                  : stage.done
                    ? 'border-[#22C55E]/50 bg-[#22C55E]/10'
                    : 'border-[#2A2A2A] bg-[#141414]'
              }`}
            >
              <Icon className={`w-5 h-5 mb-3 ${stage.done ? 'text-[#22C55E]' : 'text-[#888888]'}`} />
              <div className="font-bold text-white">{stage.label}</div>
              <div className="text-sm text-[#888888]">{stage.progress}%</div>
            </div>
          );
        })}
      </div>

      {canUpdate && (
        <form onSubmit={updateProgress} className="grid md:grid-cols-[220px_1fr_auto] gap-3 mb-6">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
          >
            {updateStages.map((stage) => (
              <option key={stage.status} value={stage.status}>{stage.label}</option>
            ))}
          </select>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Catatan update progress, contoh: File draft sudah dikirim ke client"
            className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
          />
          <button disabled={saving} className="px-5 py-3 bg-[#F5C800] text-black font-bold rounded-lg disabled:opacity-60">
            {saving ? 'Saving...' : 'Update'}
          </button>
        </form>
      )}

      {error && <div className="mb-4 text-[#EF4444]">{error}</div>}

      <div className="space-y-3">
        {histories.length === 0 && <p className="text-[#888888]">Belum ada riwayat progress.</p>}
        {histories.map((history) => (
          <div key={history.id} className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="font-bold text-white">{history.title}</div>
              <div className="text-sm text-[#888888]">{history.createdAt}</div>
            </div>
            {history.body && <p className="text-[#888888] mt-1">{history.body}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
