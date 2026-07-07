import { FormEvent } from "react";
import { Ticket } from "../api/events";

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
  return (
    <section className="tickets-section">
      <div className="section-heading">
        <h3>Билеты</h3>
        <span>{tickets.length}</span>
      </div>

      <div className="ticket-list">
        {tickets.map((ticket) => (
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
