import { CheckCircle, FileText, Image, Video, Terminal, Wifi } from 'react-feather';
import './TicketSuccessBanner.css';

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
  info: TicketSuccessInfo;
  onDismiss?: () => void;
};

export function TicketSuccessBanner({ info, onDismiss }: Props) {
  return (
    <section
      className="ticket-success-banner"
      role="status"
      aria-live="polite"
      aria-label="Ticket submitted successfully"
    >
      <div className="ticket-success-header">
        <div className="ticket-success-badge">
          <CheckCircle size={24} />
          <span>Ticket Submitted</span>
        </div>
        {onDismiss && (
          <button
            type="button"
            className="ticket-success-dismiss"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>

      <div className="ticket-success-body">
        <p className="ticket-success-message">
          Your support ticket has been received. Our team will review it and get back to you soon.
        </p>

        <div className="ticket-success-id">
          <strong>Ticket ID:</strong> <code>{info.ticketId}</code>
        </div>

        <div className="ticket-success-details">
          <div className="ticket-success-detail">
            <FileText size={18} />
            <span>{info.title}</span>
          </div>
          {info.description && (
            <div className="ticket-success-detail ticket-success-desc">
              <span>{info.description}</span>
            </div>
          )}
        </div>

        <div className="ticket-success-meta">
          {info.imageCount > 0 && (
            <span className="ticket-success-meta-item">
              <Image size={16} />
              {info.imageCount} image{info.imageCount !== 1 ? 's' : ''}
            </span>
          )}
          {info.hasVideo && (
            <span className="ticket-success-meta-item">
              <Video size={16} />
              Video attached
            </span>
          )}
          <span className="ticket-success-meta-item">
            <Terminal size={16} />
            {info.consoleLogCount} console log{info.consoleLogCount !== 1 ? 's' : ''}
          </span>
          <span className="ticket-success-meta-item">
            <Wifi size={16} />
            {info.networkLogCount} network request{info.networkLogCount !== 1 ? 's' : ''}
          </span>
        </div>

        <p className="ticket-success-note">
          All diagnostic data (console logs, network activity) has been included with your ticket to help us resolve your issue faster.
        </p>
      </div>
    </section>
  );
}
