import { FormEvent, useRef, useState } from 'react';
import { Download, FileUp, Send, X } from 'lucide-react';
import { apiRequest, getStoredToken } from '../../lib/api';

const API_BASE_URL = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || 'http://localhost:5000/api';
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
  const [fileDrafts, setFileDrafts] = useState<Array<{
    key: string;
    previewUrl: string;
    name: string;
    type: string;
    size: number;
  }>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download via backend proxy to avoid S3 CORS restrictions.
  // The browser cannot fetch() a cross-origin S3 presigned URL directly
  // because the bucket does not have a CORS policy that allows it.
  // Instead we hit our own backend which streams the file from S3 and sets
  // Content-Disposition: attachment so the browser downloads it normally.
  const handleDownload = async (url: string, fileName: string) => {
    if (downloading) return;
    try {
      setDownloading(url);

      // Extract the S3 key from a presigned URL or use the value directly if
      // it's already a raw key (shouldn't normally happen here but safe guard).
      let key: string;
      if (url.startsWith('http')) {
        // Presigned URL path looks like: /uploads/scope/userId/date/uuid-name.ext?X-Amz-...
        const urlObj = new URL(url);
        // pathname starts with /  e.g. "/uploads/project-submission/..."
        key = urlObj.pathname.replace(/^\//, '');
      } else {
        key = url;
      }

      const apiBase = API_BASE_URL;
      const token = getStoredToken();
      const params = new URLSearchParams({ key, name: fileName });
      const response = await fetch(`${apiBase}/uploads/proxy-download?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error('Download gagal');

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);
    } catch {
      setError(t('Gagal mengunduh file. Coba lagi.', 'Failed to download file. Please try again.'));
    } finally {
      setDownloading(null);
    }
  };

  const pendingSubmission = submissions.find((submission) => submission.status === 'PENDING');
  const normalizedProjectStatus = projectStatus.toUpperCase().replace(/[\s-]+/g, '_');
  const statusAliases: Record<string, string> = {
    DIBAYAR: 'PAID',
    DIKONFIRMASI: 'CONFIRMED',
    DIKERJAKAN: 'IN_PROGRESS',
    DIREVIEW: 'UNDER_REVIEW',
    DALAM_REVIEW: 'UNDER_REVIEW',
  };
  const canonicalProjectStatus = statusAliases[normalizedProjectStatus] || normalizedProjectStatus;
  const canSubmitDraft = userType === 'freelancer' && ['PAID', 'CONFIRMED', 'IN_PROGRESS', 'UNDER_REVIEW'].includes(canonicalProjectStatus);

  const attachFile = async (files?: FileList) => {
    if (!files || files.length === 0) return;
    
    const newFiles = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validationError = validateSubmissionFile(file, PROJECT_SUBMISSION_MAX_BYTES);
      if (validationError) {
        setError(validationError);
        return;
      }

      try {
        const uploaded = await uploadFileToS3(file, 'project-submission');
        newFiles.push({
          key: uploaded.key,
          previewUrl: uploaded.url,
          name: uploaded.fileName,
          type: uploaded.fileType,
          size: uploaded.fileSize,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : t('Gagal upload hasil kerja. Cek konfigurasi storage atau ukuran file.', 'Failed to upload work result. Check storage configuration or file size.'));
        return;
      }
    }
    
    setFileDrafts([...fileDrafts, ...newFiles]);
    setError('');
    
    // Reset file input so user can upload the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const submitDraft = async (event: FormEvent) => {
    event.preventDefault();
    if (!comment.trim() || fileDrafts.length === 0) {
      setError(t('Komentar dan minimal 1 file hasil wajib diisi', 'Comment and at least 1 result file are required'));
      return;
    }

    try {
      setSaving(true);
      setError('');
      const response = await apiRequest<{ project: unknown }>(`/projects/${projectId}/submissions`, {
        method: 'POST',
        body: JSON.stringify({
          comment,
          files: fileDrafts.map(f => ({
            fileUrl: f.key,
            fileName: f.name,
            fileType: f.type,
            fileSize: f.size,
          })),
        }),
      });
      setComment('');
      setFileDrafts([]);
      
      // Reset file input after successful submission
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
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

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎬';
    if (fileType === 'application/pdf') return '📄';
    return '📁';
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes >= 1024 * 1024) return ` · ${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return ` · ${(bytes / 1024).toFixed(0)} KB`;
  };

  const renderFile = (submission: ProjectSubmission) => {
    if (!submission.fileUrl) return null;

    // Normalize to arrays regardless of single or multi-file
    const fileUrls = submission.fileUrl.split('|');
    const fileNames = submission.fileName?.split('|') || [];
    const fileTypes = submission.fileType?.split('|') || [];
    // fileSize is the total combined size — only shown on single-file for accuracy
    const isSingle = fileUrls.length === 1;

    return (
      <div className="mt-4 space-y-2">
        <div className="text-xs font-bold text-[#888888] uppercase tracking-wider">
          {t('File Hasil', 'Result Files')} ({fileUrls.length})
        </div>
        {fileUrls.map((url, index) => {
          const fileName = fileNames[index] || `file-${index + 1}`;
          const fileType = fileTypes[index] || '';
          const isImage = fileType.startsWith('image/');
          const isVideo = fileType.startsWith('video/');

          return (
            <div key={`${url}-${index}`} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg overflow-hidden">
              {/* Preview for images */}
              {isImage && (
                <img
                  src={url}
                  alt={fileName}
                  className="w-full max-h-72 object-contain bg-[#0A0A0A]"
                />
              )}
              {/* Preview for videos */}
              {isVideo && (
                <video
                  src={url}
                  controls
                  className="w-full max-h-72 bg-[#0A0A0A]"
                />
              )}
              {/* File info + download row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-lg">{getFileIcon(fileType)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{fileName}</div>
                  {isSingle && submission.fileSize && (
                    <div className="text-xs text-[#888888]">{formatFileSize(submission.fileSize)}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDownload(url, fileName)}
                  disabled={downloading === url}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-[#F5C800] text-black text-xs font-bold rounded-lg hover:bg-[#e6b800] transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloading === url
                    ? t('Mengunduh...', 'Downloading...')
                    : t('Download', 'Download')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
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
            {t('Tersedia ketika freelancer mengirim hasil', 'Available when freelancer sends results')}
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
              {t('Upload hasil', 'Upload result')} {fileDrafts.length > 0 && `(${fileDrafts.length})`}
              <input ref={fileInputRef} type="file" multiple accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,video/mp4,video/quicktime,video/webm" className="hidden" onChange={(event) => attachFile(event.target.files || undefined)} />
            </label>
            <span className="text-sm text-[#888888]">{t('Foto, video berapapun. PNG, JPEG, GIF, WebP, PDF, MP4, MOV, WebM. Maksimal 500MB per file.', 'Any photos or videos. PNG, JPEG, GIF, WebP, PDF, MP4, MOV, WebM. Max 500MB per file.')}</span>
          </div>

          {fileDrafts.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-sm font-bold text-white">{t('File yang dipilih:', 'Selected files:')}</div>
              {fileDrafts.map((file, index) => (
                <div key={`${file.key}-${index}`} className="flex items-center gap-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white truncate">{file.name}</div>
                    <div className="text-sm text-[#888888]">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  <button type="button" onClick={() => setFileDrafts(fileDrafts.filter((_, i) => i !== index))} className="text-[#888888] hover:text-[#EF4444]">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
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
