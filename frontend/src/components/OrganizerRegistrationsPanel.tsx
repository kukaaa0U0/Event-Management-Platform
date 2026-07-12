import { FormEvent } from "react";
import { Registration } from "../api/events";
import { formatRegistrationStatus, getRegistrationStatusClassName } from "../utils/statusLabels";

type LoadState = "idle" | "loading" | "success" | "error";

type OrganizerRegistrationsPanelProps = {
  isManaged: boolean;
  isAuthenticated: boolean;
  isCheckInOpen: boolean;
  registrations: Registration[];
  registrationsState: LoadState;
  registrationsError: string | null;
  checkInCode: string;
  checkInState: LoadState;
  checkInError: string | null;
  checkInResult: Registration | null;
  onCheckInCodeChange: (value: string) => void;
  onCheckInSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRegistrationCheckIn: (checkInCode: string) => void;
  onRegistrationsExport: () => void;
};

export function OrganizerRegistrationsPanel({
  isManaged,
  isAuthenticated,
  isCheckInOpen,
  registrations,
  registrationsState,
  registrationsError,
  checkInCode,
  checkInState,
  checkInError,
  checkInResult,
  onCheckInCodeChange,
  onCheckInSubmit,
  onRegistrationCheckIn,
  onRegistrationsExport
}: OrganizerRegistrationsPanelProps) {
  const checkedInCount = registrations.filter((registration) => registration.status === "CheckedIn").length;
  const waitingCount = Math.max(registrations.length - checkedInCount, 0);

  if (!isManaged) {
    return (
      <section className="registrations-panel">
        <div className="section-heading">
          <h3>{isAuthenticated ? "Управление событием" : "Участники"}</h3>
        </div>
        <div className="panel-message">
          {isAuthenticated
            ? "Это событие принадлежит другому организатору. Переключись на вкладку \"Мои\", чтобы управлять своими событиями."
            : "Войди как организатор события, чтобы видеть участников и выполнять check-in."}
        </div>
      </section>
    );
  }

  return (
    <section className="registrations-panel">
      <div className="section-heading">
        <h3>Участники</h3>
        <div className="section-heading-actions">
          <span>{registrations.length}</span>
          <button
            className="small-button"
            type="button"
            disabled={registrationsState === "loading"}
            title="Download participants CSV"
            onClick={onRegistrationsExport}
          >
            CSV
          </button>
        </div>
      </div>

      <div className="registrations-summary">
        <div>
          <span>Всего записей</span>
          <strong>{registrations.length}</strong>
        </div>
        <div>
          <span>Отмечены</span>
          <strong>{checkedInCount}</strong>
        </div>
        <div>
          <span>Ожидают вход</span>
          <strong>{waitingCount}</strong>
        </div>
      </div>

      {!isCheckInOpen && (
        <div className="panel-message">Check-in для этого события сейчас выключен.</div>
      )}

      <form className="check-in-form" onSubmit={onCheckInSubmit}>
        <label>
          <span>Check-in код</span>
          <input
            value={checkInCode}
            onChange={(event) => onCheckInCodeChange(event.target.value)}
            placeholder="CHK-..."
            disabled={!isCheckInOpen || checkInState === "loading"}
          />
        </label>
        <button className="secondary-button" type="submit" disabled={!isCheckInOpen || checkInState === "loading"}>
          {checkInState === "loading" ? "Отмечаем..." : "Отметить"}
        </button>
      </form>

      {checkInError && <div className="form-alert error">{checkInError}</div>}

      {checkInResult && (
        <div className="form-alert success">
          {checkInResult.participantName} отмечен на событии.
        </div>
      )}

      {registrationsState === "loading" && (
        <div className="panel-message">Загрузка участников...</div>
      )}

      {registrationsState === "error" && (
        <div className="form-alert error">
          {registrationsError ?? "Не удалось загрузить участников"}
        </div>
      )}

      {registrationsState === "success" && registrations.length === 0 && (
        <div className="panel-message">На это событие пока никто не зарегистрирован.</div>
      )}

      {registrationsState === "success" && registrations.length > 0 && (
        <div className="registrations-list">
          {registrations.map((registration) => (
            <div className="registration-row" key={registration.id}>
              <div>
                <strong>{registration.participantName}</strong>
                <span>{registration.participantEmail}</span>
              </div>
              <div className="registration-code">
                <strong>{registration.checkInCode}</strong>
                <span className={getRegistrationStatusClassName(registration.status)}>
                  {formatRegistrationStatus(registration.status)}
                </span>
              </div>
              <button
                className="small-button"
                type="button"
                disabled={registration.status === "CheckedIn" || checkInState === "loading"}
                onClick={() => onRegistrationCheckIn(registration.checkInCode)}
              >
                {registration.status === "CheckedIn" ? "Отмечен" : "Check-in"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
