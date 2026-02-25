import { useState, useEffect, useCallback } from 'react';
import { FeedbackBubble } from './components/FeedbackBubble';
import { DataSections } from './components/DataSections';
import { TicketSuccessBanner } from './components/TicketSuccessBanner';
import type { TicketSuccessInfo } from './components/TicketModal';
import type { FetchedData } from './types/api';
import { fetchPageData } from './utils/fetchData';
import './App.css';

function App() {
  const [data, setData] = useState<FetchedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketSuccess, setTicketSuccess] = useState<TicketSuccessInfo | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    // Defer fetch to next tick so StrictMode cleanup can cancel before any request is sent
    const timeoutId = setTimeout(() => {
      fetchPageData(controller.signal)
        .then((fetched) => {
          setData(fetched);
          setError(null);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            setError(err instanceof Error ? err.message : 'Failed to load data');
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const handleTicketSuccess = useCallback((info: TicketSuccessInfo) => {
    setTicketSuccess(info);
  }, []);

  const handleDismissSuccess = useCallback(() => {
    setTicketSuccess(null);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Demo Platform</h1>
        <p className="app-subtitle">
          Sample data from JSONPlaceholder. Use the bubble in the bottom right to report an issue.
        </p>
      </header>

      <main className="app-main">
        {ticketSuccess && (
          <TicketSuccessBanner
            info={ticketSuccess}
            onDismiss={handleDismissSuccess}
          />
        )}

        <DataSections
          users={data?.users ?? []}
          posts={data?.posts ?? []}
          comments={data?.comments ?? []}
          loading={loading}
          error={error}
        />
      </main>

      <FeedbackBubble onTicketSuccess={handleTicketSuccess} />
    </div>
  );
}

export default App;
