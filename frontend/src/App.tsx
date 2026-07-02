import { useEffect, useMemo, useState } from "react";
import { EventDetails, EventSummary, getEventDetails, getEvents } from "./api/events";

type LoadState = "idle" | "loading" | "success" | "error";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency
  }).format(amount);
}

export default function App() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
  const [eventsState, setEventsState] = useState<LoadState>("idle");
  const [detailsState, setDetailsState] = useState<LoadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    setEventsState("loading");
    getEvents()
      .then((items) => {
        if (!isActive) {
          return;
        }

        setEvents(items);
        setSelectedEventId(items[0]?.id ?? null);
        setEventsState("success");
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Не удалось загрузить события");
        setEventsState("error");
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setSelectedEvent(null);
      return;
    }

    let isActive = true;

    setDetailsState("loading");
    getEventDetails(selectedEventId)
      .then((item) => {
        if (!isActive) {
          return;
        }

        setSelectedEvent(item);
        setDetailsState("success");
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Не удалось загрузить событие");
        setDetailsState("error");
      });

    return () => {
      isActive = false;
    };
  }, [selectedEventId]);

  const selectedSummary = useMemo(
    () => events.find((eventItem) => eventItem.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Список событий">
        <div className="sidebar-header">
          <p className="eyebrow">Event Management</p>
          <h1>События</h1>
        </div>

        {eventsState === "loading" && <div className="state-message">Загрузка событий...</div>}

        {eventsState === "error" && (
          <div className="state-message state-message-error">
            API недоступен. Проверь, что Docker Compose запущен.
          </div>
        )}

        {eventsState === "success" && events.length === 0 && (
          <div className="state-message">Пока нет событий.</div>
        )}

        <div className="event-list">
          {events.map((eventItem) => (
            <button
              className={eventItem.id === selectedEventId ? "event-list-item active" : "event-list-item"}
              key={eventItem.id}
              type="button"
              onClick={() => setSelectedEventId(eventItem.id)}
            >
              <span className="event-list-title">{eventItem.title}</span>
              <span className="event-list-meta">
                {eventItem.city} · {formatDate(eventItem.startsAtUtc)}
              </span>
              <span className="status-pill">{eventItem.status}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="content" aria-label="Детали события">
        {errorMessage && <div className="top-alert">{errorMessage}</div>}

        {!selectedEventId && eventsState !== "loading" && (
          <div className="empty-panel">
            <h2>Выбери событие</h2>
            <p>Когда события появятся в базе, их можно будет открыть здесь.</p>
          </div>
        )}

        {selectedEventId && detailsState === "loading" && (
          <div className="empty-panel">
            <h2>{selectedSummary?.title ?? "Событие"}</h2>
            <p>Загрузка деталей...</p>
          </div>
        )}

        {selectedEvent && detailsState === "success" && (
          <article className="event-details">
            <div className="details-header">
              <div>
                <p className="eyebrow">{selectedEvent.city}</p>
                <h2>{selectedEvent.title}</h2>
              </div>
              <span className="status-pill large">{selectedEvent.status}</span>
            </div>

            <p className="description">{selectedEvent.description}</p>

            <div className="details-grid">
              <div className="info-block">
                <span>Начало</span>
                <strong>{formatDate(selectedEvent.startsAtUtc)}</strong>
              </div>
              <div className="info-block">
                <span>Окончание</span>
                <strong>{formatDate(selectedEvent.endsAtUtc)}</strong>
              </div>
              <div className="info-block">
                <span>Адрес</span>
                <strong>{selectedEvent.address}</strong>
              </div>
              <div className="info-block">
                <span>Площадка</span>
                <strong>{selectedEvent.venueName ?? "Не указана"}</strong>
              </div>
            </div>

            <section className="tickets-section">
              <div className="section-heading">
                <h3>Билеты</h3>
                <span>{selectedEvent.tickets.length}</span>
              </div>

              <div className="ticket-list">
                {selectedEvent.tickets.map((ticket) => (
                  <div className="ticket-row" key={ticket.id}>
                    <div>
                      <strong>{ticket.name}</strong>
                      <span>{ticket.type}</span>
                    </div>
                    <div className="ticket-meta">
                      <strong>{formatPrice(ticket.priceAmount, ticket.priceCurrency)}</strong>
                      <span>мест: {ticket.capacity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </article>
        )}
      </section>
    </main>
  );
}
