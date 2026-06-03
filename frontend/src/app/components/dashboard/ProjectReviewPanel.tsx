import { FormEvent, useState } from 'react';
import { FileUp, Send, X } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { PROJECT_SUBMISSION_MAX_BYTES, validateSubmissionFile } from '../../lib/uploadLimits';
import { uploadFileToS3 } from '../../lib/s3Upload';
import { useLanguage } from '../../context/LanguageContext';

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
  const { t } = useLanguage();
  const [comment, setComment] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [fileDraft, setFileDraft] = useState<{
    key: string;
    previewUrl: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const pendingSubmission = submissions.find((submission) => submission.status === 'PENDING');
  const canSubmitDraft = userType === 'freelancer' && ['Paid', 'Confirmed', 'In Progress', 'Under Review'].includes(projectStatus);

  const attachFile = async (file?: File) => {
    if (!file) return;
    const validationError = validateSubmissionFile(file, PROJECT_SUBMISSION_MAX_BYTES);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const uploaded = await uploadFileToS3(file, 'project-submission');
      setFileDraft({
        key: uploaded.key,
        previewUrl: uploaded.url,
        name: uploaded.fileName,
        type: uploaded.fileType,
        size: uploaded.fileSize,
      });
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Gagal upload hasil kerja. Cek konfigurasi storage atau ukuran file.', 'Failed to upload work result. Check storage configuration or file size.'));
    }
  };

  const submitDraft = async (event: FormEvent) => {
    event.preventDefault();
    if (!comment.trim() || !fileDraft) {
      setError(t('Komentar dan file hasil wajib diisi', 'Comment and result file are required'));
      return;
    }

    try {
      setSaving(true);
      setError('');
      const response = await apiRequest<{ project: unknown }>(`/projects/${projectId}/submissions`, {
        method: 'POST',
        body: JSON.stringify({
          comment,
          fileUrl: fileDraft.key,
          fileName: fileDraft.name,
          fileType: fileDraft.type,
          fileSize: fileDraft.size,
        }),
      });
      setComment('');
      setFileDraft(null);
      onUpdated(response.project);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Gagal mengirim hasil', 'Failed to send result'));
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
      setError(err instanceof Error ? err.message : t('Gagal mereview hasil', 'Failed to review result'));
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
        {t('Download', 'Download')} {submission.fileName || t('file draft', 'draft file')}
      </a>
    );
  };

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-3xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            {t('Review Pengiriman', 'Delivery Review')}
          </h2>
          <p className="text-sm text-[#888888]">
            {t('Freelancer mengirim hasil pekerjaan, klien menyetujui atau meminta revisi. Dana escrow diteruskan setelah disetujui.', 'Freelancers send work results, clients approve or request revisions. Escrow funds are released after approval.')}
          </p>
        </div>
        {pendingSubmission && (
          <span className="px-3 py-1 bg-[#3B82F6] text-white rounded-full text-xs font-bold">
            {t('Menunggu Review', 'Waiting Review')}
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
          <h3 className="font-bold text-white mb-3">{t('Kirim hasil ke klien', 'Send result to client')}</h3>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={t('Jelaskan hasil pekerjaan, file yang dikirim, dan catatan tambahan jika ada...', 'Explain the work result, sent files, and any additional notes...')}
            rows={4}
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
          />
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <label className="inline-flex items-center gap-2 px-4 py-3 border border-[#888888] text-white rounded-lg hover:border-[#F5C800] hover:text-[#F5C800] cursor-pointer transition-colors">
              <FileUp className="w-4 h-4" />
              {t('Upload hasil', 'Upload result')}
              <input type="file" accept="image/png,image/jpeg,application/pdf,video/mp4,video/quicktime,video/webm" className="hidden" onChange={(event) => attachFile(event.target.files?.[0])} />
            </label>
            <span className="text-sm text-[#888888]">{t('PNG, JPEG, PDF, MP4, MOV, atau WebM. Maksimal 500MB.', 'PNG, JPEG, PDF, MP4, MOV, or WebM. Maximum 500MB.')}</span>
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
            {saving ? t('Mengirim...', 'Sending...') : t('Kirim Hasil', 'Send Result')}
          </button>
        </form>
      )}

      {userType === 'client' && pendingSubmission && (
        <div className="mb-6 bg-[#141414] border border-[#F5C800] rounded-xl p-5">
          <h3 className="font-bold text-white mb-2">{t('Hasil pekerjaan menunggu review Anda', 'Work result is waiting for your review')}</h3>
          <p className="text-[#888888]">{pendingSubmission.comment}</p>
          {renderFile(pendingSubmission)}
          <textarea
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
            placeholder={t('Komentar approval atau instruksi revisi...', 'Approval comment or revision instructions...')}
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
              {t('Konfirmasi Selesai', 'Confirm Complete')}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => reviewSubmission(pendingSubmission.id, 'revision')}
              className="px-5 py-3 border border-[#EF4444] text-[#EF4444] font-bold rounded-lg hover:bg-[#EF4444] hover:text-white disabled:opacity-60"
            >
              {t('Minta Revisi', 'Request Revision')}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {submissions.length === 0 && <p className="text-[#888888]">{t('Belum ada hasil yang dikirim.', 'No results have been sent yet.')}</p>}
        {submissions.map((submission) => (
          <div key={submission.id} className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-bold text-white">{t('Hasil dikirim', 'Result sent')}</div>
                <div className="text-sm text-[#888888]">{submission.createdAt}</div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                submission.status === 'APPROVED'
                  ? 'bg-[#22C55E] text-white'
                  : submission.status === 'REVISION_REQUESTED'
                    ? 'bg-[#EF4444] text-white'
                    : 'bg-[#3B82F6] text-white'
              }`}>
                {{
                  APPROVED: t('Disetujui', 'Approved'),
                  REVISION_REQUESTED: t('Revisi Diminta', 'Revision Requested'),
                  PENDING: t('Menunggu Review', 'Waiting Review'),
                }[submission.status]}
              </span>
            </div>
            <p className="text-[#888888] mt-2">{submission.comment}</p>
            {renderFile(submission)}
            {submission.reviewComment && (
              <div className="mt-3 p-3 bg-[#1A1A1A] rounded-lg text-sm">
                <div className="font-bold text-white">{t('Review Klien', 'Client Review')}</div>
                <p className="text-[#888888]">{submission.reviewComment}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
