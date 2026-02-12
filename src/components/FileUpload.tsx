'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface AttachmentRecord {
  id: string;
  reportId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  label: string | null;
  createdAt: string;
}

interface FileUploadProps {
  reportId: string;
  maxFiles?: number;
}

const ALLOWED_EXTENSIONS = ['pdf', 'mp4', 'mov', 'jpg', 'jpeg', 'png', 'webp'];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType: string): string {
  if (fileType === 'application/pdf') return '📄';
  if (fileType.startsWith('video/')) return '🎬';
  if (fileType.startsWith('image/')) return '🖼️';
  return '📎';
}

function getFileCategory(fileType: string): 'pdf' | 'video' | 'image' | 'other' {
  if (fileType === 'application/pdf') return 'pdf';
  if (fileType.startsWith('video/')) return 'video';
  if (fileType.startsWith('image/')) return 'image';
  return 'other';
}

export function FileUpload({ reportId, maxFiles = 5 }: FileUploadProps) {
  const [attachments, setAttachments] = useState<AttachmentRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [labelInputs, setLabelInputs] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Load existing attachments
  useEffect(() => {
    if (!reportId) return;
    fetch(`/api/attachments/${reportId}`)
      .then(res => {
        if (res.ok) return res.json();
        return [];
      })
      .then(data => {
        if (Array.isArray(data)) setAttachments(data);
      })
      .catch(() => {/* ignore - report might not exist yet */});
  }, [reportId]);

  const validateFile = (file: File): string | null => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `File type .${ext} not allowed. Use: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }
    if (file.size > MAX_SIZE) {
      return `File too large (${formatFileSize(file.size)}). Max: 50MB`;
    }
    return null;
  };

  const uploadFile = useCallback(async (file: File, label?: string) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (attachments.length >= maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('reportId', reportId);
      if (label) formData.append('label', label);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const attachment = await res.json();
      setAttachments(prev => [attachment, ...prev]);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [reportId, attachments.length, maxFiles]);

  const handleDelete = async (attachmentId: string) => {
    try {
      const res = await fetch(`/api/attachments/${reportId}?id=${attachmentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete');
      }
    } catch {
      setError('Failed to delete attachment');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  }, [uploadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
    // Reset so same file can be selected again
    e.target.value = '';
  };

  const remainingSlots = maxFiles - attachments.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs text-zinc-500">
          Attachments ({attachments.length}/{maxFiles})
        </label>
        {attachments.length > 0 && (
          <span className="text-xs text-zinc-600">
            PDFs, images, videos (max 50MB each)
          </span>
        )}
      </div>

      {/* Drop zone */}
      {remainingSlots > 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/50'
          } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            ref={inputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.mp4,.mov,.jpg,.jpeg,.png,.webp"
            className="hidden"
          />

          {uploading ? (
            <div className="space-y-2">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-zinc-400">Uploading...</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-2xl">📎</p>
              <p className="text-sm text-zinc-400">
                Drag & drop or <span className="text-blue-400 underline">browse</span>
              </p>
              <p className="text-xs text-zinc-600">
                PDF, MP4, MOV, JPG, PNG, WebP • Max 50MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-900/30 border border-red-800 rounded text-sm text-red-400">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-300">✕</button>
        </div>
      )}

      {/* File list */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map(att => (
            <div
              key={att.id}
              className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg border border-zinc-700 group"
            >
              <span className="text-lg flex-shrink-0">{getFileIcon(att.fileType)}</span>

              <div className="flex-1 min-w-0">
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-200 hover:text-blue-400 truncate block transition-colors"
                >
                  {att.fileName}
                </a>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-zinc-500">{formatFileSize(att.fileSize)}</span>
                  {att.label && (
                    <span className="text-xs text-zinc-400 bg-zinc-700 px-1.5 py-0.5 rounded">
                      {att.label}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDelete(att.id)}
                className="flex-shrink-0 p-1.5 text-zinc-600 hover:text-red-400 hover:bg-zinc-700 rounded transition-colors opacity-0 group-hover:opacity-100"
                title="Delete attachment"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Max files reached notice */}
      {remainingSlots <= 0 && (
        <p className="text-xs text-zinc-500 text-center py-2">
          Maximum {maxFiles} attachments reached. Delete one to add more.
        </p>
      )}
    </div>
  );
}
