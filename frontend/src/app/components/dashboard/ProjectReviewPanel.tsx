import { FormEvent, useState } from 'react';
import { FileUp, Send, X } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { PROJECT_SUBMISSION_MAX_BYTES, readFileAsDataUrl, validateSubmissionFile } from '../../lib/uploadLimits';

export interface ProjectSubmission {
  id: string;
  comment: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  status: 'PENDING' | 'APPROVED' | 'REVISION_REQUESTED';
  reviewComment: string | null;
  reviewedAt: string | null;
  createdAt: string;
  isPending: boolean;
}

interface ProjectReviewPanelProps {
  projectId: string;
  userType: 'client' | 'freelancer';
  projectStatus: string;
  submissions: ProjectSubmission[];
  onUpdated: (project: unknown) => void;
}

export default function ProjectReviewPanel({
  projectId,
  userType,
  projectStatus,
  submissions,
  onUpdated,
}: ProjectReviewPanelProps) {
  const [comment, setComment] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [fileDraft, setFileDraft] = useState<{
    url: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const pendingSubmission = submissions.find((submission) => submission.status === 'PENDING');
  const canSubmitDraft = userType === 'freelancer' && ['Confirmed', 'In Progress', 'Under Review'].includes(projectStatus);

  const attachFile = async (file?: File) => {
    if (!file) return;
    const validationError = validateSubmissionFile(file, PROJECT_SUBMISSION_MAX_BYTES);
    if (validationError) {
      setError(validationError);
      return;
    }

    const url = await readFileAsDataUrl(file);
    setFileDraft({
      url,
      name: file.name,
      type: file.type,
      size: file.size,
    });
    setError('');
  };

  const submitDraft = async (event: FormEvent) => {
    event.preventDefault();
    if (!comment.trim() || !fileDraft) {
      setError('Komentar dan file draft wajib diisi');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const response = await apiRequest<{ project: unknown }>(`/projects/${projectId}/submissions`, {
        method: 'POST',
        body: JSON.stringify({
          comment,
          fileUrl: fileDraft.url,
          fileName: fileDraft.name,
          fileType: fileDraft.type,
          fileSize: fileDraft.size,
        }),
      });
      setComment('');
      setFileDraft(null);
      onUpdated(response.project);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim draft');
    } finally {
      setSaving(false);
    }
  };

  const reviewSubmission = async (submissionId: string, action: 'approve' | 'revision') => {
    try {
      setSaving(true);
      setError('');
      const response = await apiRequest<{ project: unknown }>(`/projects/${projectId}/submissions/${submissionId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          action,
          comment: reviewComment,
        }),
      });
      setReviewComment('');
      onUpdated(response.project);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal review draft');
    } finally {
      setSaving(false);
    }
  };

  const renderFile = (submission: ProjectSubmission) => {
    if (!submission.fileUrl) return null;

    if (submission.fileType?.startsWith('image/')) {
      return (
        <img
          src={submission.fileUrl}
          alt={submission.fileName || 'Draft submission'}
          className="mt-3 max-h-72 rounded-lg object-contain bg-[#0A0A0A]"
        />
      );
    }

    return (
      <a
        href={submission.fileUrl}
        download={submission.fileName || 'draft-file'}
        className="inline-flex mt-3 text-[#F5C800] hover:underline"
      >
        Download {submission.fileName || 'draft file'}
      </a>
    );
  };

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-3xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Draft Review
          </h2>
          <p className="text-sm text-[#888888]">
            Freelancer mengirim draft, client approve atau meminta revisi. Payment tetap di-hold dulu.
          </p>
        </div>
        {pendingSubmission && (
          <span className="px-3 py-1 bg-[#3B82F6] text-white rounded-full text-xs font-bold">
            Waiting Review
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg text-[#EF4444]">
          {error}
        </div>
      )}

      {canSubmitDraft && (
        <form onSubmit={submitDraft} className="mb-6 bg-[#141414] border border-[#2A2A2A] rounded-xl p-5">
          <h3 className="font-bold text-white mb-3">Kirim draft ke client</h3>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Jelaskan progress, apa yang perlu dicek client, dan catatan revisi jika ada..."
            rows={4}
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
          />
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <label className="inline-flex items-center gap-2 px-4 py-3 border border-[#888888] text-white rounded-lg hover:border-[#F5C800] hover:text-[#F5C800] cursor-pointer transition-colors">
              <FileUp className="w-4 h-4" />
              Upload draft
              <input type="file" accept="image/png,image/jpeg,application/pdf" className="hidden" onChange={(event) => attachFile(event.target.files?.[0])} />
            </label>
            <span className="text-sm text-[#888888]">PNG, JPEG, atau PDF. Maksimal 1MB sementara mode local.</span>
          </div>

          {fileDraft && (
            <div className="mt-3 flex items-center gap-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3">
              <div className="flex-1">
                <div className="font-bold text-white">{fileDraft.name}</div>
                <div className="text-sm text-[#888888]">{fileDraft.type}</div>
              </div>
              <button type="button" onClick={() => setFileDraft(null)} className="text-[#888888] hover:text-[#EF4444]">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <button
            disabled={saving}
            className="mt-4 inline-flex items-center gap-2 px-5 py-3 bg-[#F5C800] text-black font-bold rounded-lg disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            {saving ? 'Mengirim...' : 'Kirim untuk Review'}
          </button>
        </form>
      )}

      {userType === 'client' && pendingSubmission && (
        <div className="mb-6 bg-[#141414] border border-[#F5C800] rounded-xl p-5">
          <h3 className="font-bold text-white mb-2">Draft menunggu review Anda</h3>
          <p className="text-[#888888]">{pendingSubmission.comment}</p>
          {renderFile(pendingSubmission)}
          <textarea
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
            placeholder="Komentar approval atau instruksi revisi..."
            rows={3}
            className="mt-4 w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
          />
          <div className="flex gap-3 mt-4 flex-wrap">
            <button
              type="button"
              disabled={saving}
              onClick={() => reviewSubmission(pendingSubmission.id, 'approve')}
              className="px-5 py-3 bg-[#22C55E] text-white font-bold rounded-lg disabled:opacity-60"
            >
              Approve Draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => reviewSubmission(pendingSubmission.id, 'revision')}
              className="px-5 py-3 border border-[#EF4444] text-[#EF4444] font-bold rounded-lg hover:bg-[#EF4444] hover:text-white disabled:opacity-60"
            >
              Request Revision
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {submissions.length === 0 && <p className="text-[#888888]">Belum ada draft yang dikirim.</p>}
        {submissions.map((submission) => (
          <div key={submission.id} className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-bold text-white">Draft dikirim</div>
                <div className="text-sm text-[#888888]">{submission.createdAt}</div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                submission.status === 'APPROVED'
                  ? 'bg-[#22C55E] text-white'
                  : submission.status === 'REVISION_REQUESTED'
                    ? 'bg-[#EF4444] text-white'
                    : 'bg-[#3B82F6] text-white'
              }`}>
                {submission.status.replaceAll('_', ' ')}
              </span>
            </div>
            <p className="text-[#888888] mt-2">{submission.comment}</p>
            {renderFile(submission)}
            {submission.reviewComment && (
              <div className="mt-3 p-3 bg-[#1A1A1A] rounded-lg text-sm">
                <div className="font-bold text-white">Client review</div>
                <p className="text-[#888888]">{submission.reviewComment}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
