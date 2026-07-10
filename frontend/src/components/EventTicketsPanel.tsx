import { FormEvent } from "react";
import { Registration, Ticket } from "../api/events";

type LoadState = "idle" | "loading" | "success" | "error";

export type CreateTicketFormState = {
  name: string;
  type: string;
  priceAmount: string;
  priceCurrency: string;
  capacity: string;
};

type EventTicketsPanelProps = {
  tickets: Ticket[];
  registrations: Registration[];
  isManaged: boolean;
  isCreateOpen: boolean;
  form: CreateTicketFormState;
  state: LoadState;
  error: string | null;
  successMessage: string | null;
  formatPrice: (amount: number, currency: string) => string;
  onCreateOpenChange: (isOpen: boolean) => void;
  onFieldChange: (field: keyof CreateTicketFormState, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function EventTicketsPanel({
  tickets,
  registrations,
  isManaged,
  isCreateOpen,
  form,
  state,
  error,
  successMessage,
  formatPrice,
  onCreateOpenChange,
  onFieldChange,
  onSubmit
}: EventTicketsPanelProps) {
  const totalCapacity = tickets.reduce((sum, ticket) => sum + ticket.capacity, 0);
  const occupiedSeats = isManaged ? registrations.length : null;
  const occupiedPercent = occupiedSeats === null || totalCapacity === 0
    ? 0
    : Math.min(100, Math.round((occupiedSeats / totalCapacity) * 100));

  return (
    <section className="tickets-section">
      <div className="section-heading">
        <h3>Билеты</h3>
        <span>{tickets.length}</span>
      </div>

      <div className="ticket-capacity-summary">
        <div>
          <span>Всего мест</span>
          <strong>{totalCapacity}</strong>
        </div>
        <div>
          <span>{isManaged ? "Занято" : "Доступность"}</span>
          <strong>{isManaged ? `${occupiedSeats}/${totalCapacity}` : "по билетам"}</strong>
        </div>
        {isManaged && (
          <div className="ticket-progress" aria-label="Заполненность события">
            <span style={{ width: `${occupiedPercent}%` }} />
          </div>
        )}
      </div>

      <div className="ticket-list">
        {tickets.map((ticket) => {
          const occupiedForTicket = isManaged
            ? registrations.filter((registration) => registration.ticketId === ticket.id).length
            : null;

          return (
            <div className="ticket-row" key={ticket.id}>
              <div>
                <strong>{ticket.name}</strong>
                <span className="ticket-type-pill">{ticket.type}</span>
              </div>
              <div className="ticket-meta">
                <div>
                  <span>Цена</span>
                  <strong>{formatPrice(ticket.priceAmount, ticket.priceCurrency)}</strong>
                </div>
                <div>
                  <span>{occupiedForTicket === null ? "Мест" : "Занято"}</span>
                  <strong>{occupiedForTicket === null ? ticket.capacity : `${occupiedForTicket}/${ticket.capacity}`}</strong>
                </div>
              </div>
            </div>
          );
        })}
        {tickets.length === 0 && (
          <div className="panel-message inside-list">Билеты для этого события пока не созданы.</div>
        )}
      </div>

      {isManaged && (
        <button
          className="secondary-button ticket-toggle-button"
          type="button"
          onClick={() => onCreateOpenChange(!isCreateOpen)}
        >
          {isCreateOpen ? "Скрыть форму билета" : "Добавить билет"}
        </button>
      )}

      {isManaged && isCreateOpen && (
        <form className="ticket-form" onSubmit={onSubmit}>
          <div className="section-heading compact">
            <h3>Добавить билет</h3>
            <button className="small-button" type="button" onClick={() => onCreateOpenChange(false)}>
              Закрыть
            </button>
          </div>

          <label className="wide-field">
            <span>Название</span>
            <input
              value={form.name}
              onChange={(event) => onFieldChange("name", event.target.value)}
              placeholder="Regular"
              disabled={state === "loading"}
            />
          </label>

          <label>
            <span>Тип</span>
            <select
              value={form.type}
              onChange={(event) => onFieldChange("type", event.target.value)}
              disabled={state === "loading"}
            >
              <option value="Regular">Regular</option>
              <option value="EarlyBird">Early Bird</option>
              <option value="Vip">VIP</option>
            </select>
          </label>

          <label>
            <span>Цена</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.priceAmount}
              onChange={(event) => onFieldChange("priceAmount", event.target.value)}
              disabled={state === "loading"}
            />
          </label>

          <label>
            <span>Валюта</span>
            <input
              value={form.priceCurrency}
              onChange={(event) => onFieldChange("priceCurrency", event.target.value)}
              maxLength={3}
              disabled={state === "loading"}
            />
          </label>

          <label>
            <span>Мест</span>
            <input
              type="number"
              min="1"
              step="1"
              value={form.capacity}
              onChange={(event) => onFieldChange("capacity", event.target.value)}
              disabled={state === "loading"}
            />
          </label>

          <button className="secondary-button" type="submit" disabled={state === "loading"}>
            {state === "loading" ? "Добавляем..." : "Добавить билет"}
          </button>

          {error && <div className="form-alert error wide-field">{error}</div>}
          {successMessage && <div className="form-alert success wide-field">{successMessage}</div>}
        </form>
      )}
    </section>
  );
}
