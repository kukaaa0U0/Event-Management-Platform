import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  EventDetails,
  EventSummary,
  Registration,
  getEventDetails,
  getEvents,
  registerForEvent
} from "./api/events";

type LoadState = "idle" | "loading" | "success" | "error";

type RegistrationFormState = {
  fullName: string;
  email: string;
  ticketId: string;
};

const emptyRegistrationForm: RegistrationFormState = {
  fullName: "",
  email: "",
  ticketId: ""
};

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
  const [registrationState, setRegistrationState] = useState<LoadState>("idle");
  const [registrationForm, setRegistrationForm] = useState<RegistrationFormState>(emptyRegistrationForm);
  const [registrationResult, setRegistrationResult] = useState<Registration | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

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
    setRegistrationResult(null);
    setRegistrationError(null);
    getEventDetails(selectedEventId)
      .then((item) => {
        if (!isActive) {
          return;
        }

        setSelectedEvent(item);
        setRegistrationForm({
          ...emptyRegistrationForm,
          ticketId: item.tickets[0]?.id ?? ""
        });
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

  function updateRegistrationForm(field: keyof RegistrationFormState, value: string) {
    setRegistrationForm((current) => ({
      ...current,
      [field]: value
    }));
    setRegistrationError(null);
  }

  async function handleRegistrationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedEvent) {
      return;
    }

    if (!registrationForm.ticketId) {
      setRegistrationError("Выбери билет.");
      return;
    }

    if (!registrationForm.fullName.trim()) {
      setRegistrationError("Укажи имя участника.");
      return;
    }

    if (!registrationForm.email.trim()) {
      setRegistrationError("Укажи email участника.");
      return;
    }

    setRegistrationState("loading");
    setRegistrationError(null);
    setRegistrationResult(null);

    try {
      const registration = await registerForEvent(selectedEvent.id, {
        ticketId: registrationForm.ticketId,
        fullName: registrationForm.fullName.trim(),
        email: registrationForm.email.trim()
      });

      setRegistrationResult(registration);
      setRegistrationState("success");
    } catch (error: unknown) {
      setRegistrationError(error instanceof Error ? error.message : "Не удалось зарегистрироваться");
      setRegistrationState("error");
    }
  }

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

            <div className="event-action-grid">
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

              <section className="registration-section">
                <div className="section-heading">
                  <h3>Регистрация</h3>
                </div>

                <form className="registration-form" onSubmit={handleRegistrationSubmit}>
                  <label>
                    <span>Билет</span>
                    <select
                      value={registrationForm.ticketId}
                      onChange={(event) => updateRegistrationForm("ticketId", event.target.value)}
                      disabled={selectedEvent.tickets.length === 0 || registrationState === "loading"}
                    >
                      {selectedEvent.tickets.map((ticket) => (
                        <option key={ticket.id} value={ticket.id}>
                          {ticket.name} · {formatPrice(ticket.priceAmount, ticket.priceCurrency)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Имя участника</span>
                    <input
                      value={registrationForm.fullName}
                      onChange={(event) => updateRegistrationForm("fullName", event.target.value)}
                      placeholder="Например, Иван Петров"
                      disabled={registrationState === "loading"}
                    />
                  </label>

                  <label>
                    <span>Email</span>
                    <input
                      type="email"
                      value={registrationForm.email}
                      onChange={(event) => updateRegistrationForm("email", event.target.value)}
                      placeholder="ivan@example.com"
                      disabled={registrationState === "loading"}
                    />
                  </label>

                  {registrationError && <div className="form-alert error">{registrationError}</div>}

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={selectedEvent.tickets.length === 0 || registrationState === "loading"}
                  >
                    {registrationState === "loading" ? "Регистрируем..." : "Зарегистрироваться"}
                  </button>
                </form>

                {registrationResult && (
                  <div className="registration-result">
                    <span>Код для входа</span>
                    <strong>{registrationResult.checkInCode}</strong>
                    <p>{registrationResult.participantName} зарегистрирован на событие.</p>
                  </div>
                )}
              </section>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
