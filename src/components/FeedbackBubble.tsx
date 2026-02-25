import { useState } from 'react';
import { MessageCircle } from 'react-feather';
import { TicketModal } from './TicketModal';
import type { TicketSuccessInfo } from './TicketModal';
import './FeedbackBubble.css';

type Props = {
  onTicketSuccess?: (info: TicketSuccessInfo) => void;
};

export function FeedbackBubble({ onTicketSuccess }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="feedback-bubble"
        onClick={() => setModalOpen(true)}
        aria-label="Report an issue"
      >
        <MessageCircle size={24} strokeWidth={2} />
      </button>
      <TicketModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={onTicketSuccess}
      />
    </>
  );
}
