import { FormEvent } from "react";
import { Registration, Ticket } from "../api/events";

type LoadState = "idle" | "loading" | "success" | "error";

export type RegistrationFormState = {
  fullName: string;
  email: string;
  ticketId: string;
};

type EventRegistrationPanelProps = {
  tickets: Ticket[];
  form: RegistrationFormState;
  state: LoadState;
  error: string | null;
  result: Registration | null;
  isOpen: boolean;
  authEmail: string | null;
  formatPrice: (amount: number, currency: string) => string;
  onFieldChange: (field: keyof RegistrationFormState, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function EventRegistrationPanel({
  tickets,
  form,
  state,
  error,
  result,
  isOpen,
  authEmail,
  formatPrice,
  onFieldChange,
  onSubmit
}: EventRegistrationPanelProps) {
  const isAuthenticated = Boolean(authEmail);
  const selectedTicket = tickets.find((ticket) => ticket.id === form.ticketId) ?? tickets[0] ?? null;

  return (
    <section className="registration-section">
      <div className="section-heading">
        <h3>Запись на событие</h3>
      </div>

      {!isOpen && (
        <div className="panel-message">Запись на это событие сейчас закрыта.</div>
      )}

      {authEmail && isOpen && (
        <div className="panel-message">Запись будет привязана к аккаунту {authEmail}.</div>
      )}

      <div className="registration-context">
        <div>
          <span>Выбранный билет</span>
          <strong>{selectedTicket ? selectedTicket.name : "Билет не выбран"}</strong>
          <p>
            {selectedTicket
              ? `${selectedTicket.type} · ${formatPrice(selectedTicket.priceAmount, selectedTicket.priceCurrency)}`
              : "Создай билет, чтобы открыть запись на событие."}
          </p>
        </div>
        <div>
          <span>{authEmail ? "Аккаунт" : "Участник"}</span>
          <strong>{authEmail ?? "Ручной ввод"}</strong>
          <p>{authEmail ? "Имя и email подтянутся из аккаунта." : "Укажи имя и email участника."}</p>
        </div>
      </div>

      <form className="registration-form" onSubmit={onSubmit}>
        <label>
          <span>Билет</span>
          <select
            value={form.ticketId}
            onChange={(event) => onFieldChange("ticketId", event.target.value)}
            disabled={!isOpen || tickets.length === 0 || state === "loading"}
          >
            {tickets.map((ticket) => (
              <option key={ticket.id} value={ticket.id}>
                {ticket.name} · {formatPrice(ticket.priceAmount, ticket.priceCurrency)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Имя участника</span>
          <input
            value={form.fullName}
            onChange={(event) => onFieldChange("fullName", event.target.value)}
            placeholder="Например, Иван Петров"
            disabled={isAuthenticated || !isOpen || state === "loading"}
          />
        </label>

        <label>
          <span>Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => onFieldChange("email", event.target.value)}
            placeholder="ivan@example.com"
            disabled={isAuthenticated || !isOpen || state === "loading"}
          />
        </label>

        {error && <div className="form-alert error">{error}</div>}

        <button
          className="primary-button"
          type="submit"
          disabled={!isOpen || tickets.length === 0 || state === "loading"}
        >
          {state === "loading" ? "Записываем..." : "Записаться на событие"}
        </button>
      </form>

      {result && (
        <div className="registration-result">
          <span>Код для входа</span>
          <strong>{result.checkInCode}</strong>
          <p>{result.participantName} записан на событие.</p>
        </div>
      )}
    </section>
  );
}
