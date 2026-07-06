import { MyRegistration } from "../api/events";

type LoadState = "idle" | "loading" | "success" | "error";

type MyRegistrationsPanelProps = {
  registrations: MyRegistration[];
  state: LoadState;
  error: string | null;
  formatDate: (value: string) => string;
  onSelectEvent: (eventId: string) => void;
};

export function MyRegistrationsPanel({
  registrations,
  state,
  error,
  formatDate,
  onSelectEvent
}: MyRegistrationsPanelProps) {
  return (
    <section className="my-registrations-panel" aria-label="Мои регистрации">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Participant</p>
          <h3>Мои регистрации</h3>
        </div>
        <span>{registrations.length}</span>
      </div>

      {state === "loading" && (
        <div className="panel-message">Загрузка твоих регистраций...</div>
      )}

      {state === "error" && (
        <div className="form-alert error">
          {error ?? "Не удалось загрузить твои регистрации"}
        </div>
      )}

      {state === "success" && registrations.length === 0 && (
        <div className="panel-message">Ты пока не зарегистрирован на события.</div>
      )}

      {state === "success" && registrations.length > 0 && (
        <div className="my-registration-list">
          {registrations.map((registration) => (
            <button
              className="my-registration-row"
              key={registration.id}
              type="button"
              onClick={() => onSelectEvent(registration.eventId)}
            >
              <div>
                <strong>{registration.eventTitle}</strong>
                <span>{registration.city} · {formatDate(registration.startsAtUtc)}</span>
              </div>
              <div className="my-registration-meta">
                <span>{registration.registrationStatus}</span>
                <strong>{registration.checkInCode}</strong>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
