import { useState, useCallback, useEffect } from 'react';
import { X, Image, Video } from 'react-feather';
import { installConsoleLogger } from '../utils/consoleLogger';
import { submitTicket } from '../utils/submitTicket';
import './TicketModal.css';

export type TicketSuccessInfo = {
  ticketId: string;
  title: string;
  description: string;
  imageCount: number;
  hasVideo: boolean;
  consoleLogCount: number;
  networkLogCount: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (info: TicketSuccessInfo) => void;
};

export function TicketModal({ open, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageDragOver, setImageDragOver] = useState(false);
  const [videoDragOver, setVideoDragOver] = useState(false);

  useEffect(() => {
    if (open) installConsoleLogger();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, submitting, onClose]);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setImages((prev) => [...prev, ...files.filter((f) => f.type.startsWith('image/'))]);
    e.target.value = '';
  }, []);

  const handleVideoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setVideo(file && file.type.startsWith('video/') ? file : null);
    e.target.value = '';
  }, []);

  const handleImageDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setImageDragOver(false);
    const files = Array.from(e.dataTransfer.files ?? []).filter((f) => f.type.startsWith('image/'));
    setImages((prev) => [...prev, ...files]);
  }, []);

  const handleVideoDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setVideoDragOver(false);
    const file = Array.from(e.dataTransfer.files ?? []).find((f) => f.type.startsWith('video/'));
    if (file) setVideo(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleImageDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setImageDragOver(true);
  }, []);

  const handleImageDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setImageDragOver(false);
  }, []);

  const handleVideoDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setVideoDragOver(true);
  }, []);

  const handleVideoDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setVideoDragOver(false);
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await submitTicket({
        title: title.trim(),
        description: description.trim(),
        images,
        video,
      });
      if (result.success) {
        setSuccess(true);
        console.log('Ticket submitted successfully');
        onSuccess?.({
          ticketId: result.ticketId ?? `TKT-${Date.now()}`,
          title: result.title ?? title.trim(),
          description: result.description ?? description.trim(),
          imageCount: result.imageCount ?? images.length,
          hasVideo: result.hasVideo ?? !!video,
          consoleLogCount: result.consoleLogCount ?? 0,
          networkLogCount: result.networkLogCount ?? 0,
        });
        setTimeout(() => {
          setSuccess(false);
          setTitle('');
          setDescription('');
          setImages([]);
          setVideo(null);
          onClose();
        }, 1200);
      } else {
        setError(result.message ?? 'Submission failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }, [title, description, images, video, onClose, onSuccess]);

  const handleClose = useCallback(() => {
    if (!submitting) onClose();
  }, [submitting, onClose]);

  if (!open) return null;

  return (
    <div
      className="ticket-modal-overlay"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-modal-title"
    >
      <div className="ticket-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ticket-modal-header">
          <h2 id="ticket-modal-title" className="ticket-modal-title">Report an Issue</h2>
          <button
            type="button"
            className="ticket-modal-close"
            onClick={handleClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="ticket-modal-body">
          <p className="ticket-modal-desc">
            Send a support ticket with your issue details. Console and network logs will be included automatically.
          </p>

          {error && (
            <div className="ticket-alert ticket-alert-error">
              {error}
              <button type="button" onClick={() => setError(null)}>×</button>
            </div>
          )}
          {success && (
            <div className="ticket-alert ticket-alert-success">
              Ticket submitted successfully!
            </div>
          )}

          <div className="ticket-form">
            <div className="ticket-field">
              <label htmlFor="ticket-title">Title <span>*</span></label>
              <input
                id="ticket-title"
                type="text"
                placeholder="Brief summary of the issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="ticket-field">
              <label htmlFor="ticket-description">Description</label>
              <textarea
                id="ticket-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue in detail..."
                rows={4}
              />
            </div>

            <div className="ticket-uploads">
              <div className="upload-group">
                <label htmlFor="ticket-images">Images</label>
                <div className="ticket-file-wrapper">
                  <input
                    id="ticket-images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="ticket-file-input"
                    aria-describedby="images-hint"
                  />
                  <div
                    className={`ticket-file-zone${imageDragOver ? ' drag-over' : ''}`}
                    onDrop={handleImageDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={handleImageDragEnter}
                    onDragLeave={handleImageDragLeave}
                  >
                    <Image size={32} className="ticket-file-zone-icon" />
                    <span className="ticket-file-zone-text">
                      Click or drag to upload images
                    </span>
                    <span id="images-hint" className="ticket-file-zone-hint">
                      PNG, JPG, GIF up to 10MB
                    </span>
                  </div>
                </div>
                {images.length > 0 && (
                  <div className="file-preview">
                    {images.map((f, i) => (
                      <span key={`${f.name}-${i}`} className="file-chip">
                        <span title={f.name}>{f.name}</span>
                        <button type="button" onClick={() => removeImage(i)} aria-label={`Remove ${f.name}`}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="upload-group">
                <label htmlFor="ticket-video">Video (optional)</label>
                <div className="ticket-file-wrapper">
                  <input
                    id="ticket-video"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="ticket-file-input"
                    aria-describedby="video-hint"
                  />
                  <div
                    className={`ticket-file-zone${videoDragOver ? ' drag-over' : ''}`}
                    onDrop={handleVideoDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={handleVideoDragEnter}
                    onDragLeave={handleVideoDragLeave}
                  >
                    <Video size={32} className="ticket-file-zone-icon" />
                    <span className="ticket-file-zone-text">
                      Click to upload video
                    </span>
                    <span id="video-hint" className="ticket-file-zone-hint">
                      MP4, WebM up to 50MB
                    </span>
                  </div>
                </div>
                {video && (
                  <div className="file-preview">
                    <span className="file-chip">
                      <span title={video.name}>{video.name}</span>
                      <button
                        type="button"
                        onClick={() => setVideo(null)}
                        aria-label={`Remove ${video.name}`}
                      >
                        ×
                      </button>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="ticket-actions">
              <button
                type="button"
                className="ticket-btn ticket-btn-secondary"
                onClick={handleClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ticket-btn ticket-btn-primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
