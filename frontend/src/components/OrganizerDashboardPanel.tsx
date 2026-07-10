import { OrganizerDashboardEvent } from "../api/events";
import { formatEventStatus } from "../utils/statusLabels";

type LoadState = "idle" | "loading" | "success" | "error";

type OrganizerDashboardPanelProps = {
  events: OrganizerDashboardEvent[];
  state: LoadState;
  error: string | null;
  formatDate: (value: string) => string;
  onSelectEvent: (eventId: string) => void;
};

export function OrganizerDashboardPanel({
  events,
  state,
  error,
  formatDate,
  onSelectEvent
}: OrganizerDashboardPanelProps) {
  const registrationsCount = events.reduce((sum, eventItem) => sum + eventItem.registrationsCount, 0);
  const checkedInCount = events.reduce((sum, eventItem) => sum + eventItem.checkedInCount, 0);
  const ticketCapacity = events.reduce((sum, eventItem) => sum + eventItem.ticketCapacity, 0);

  return (
    <section className="organizer-dashboard-panel" aria-label="Dashboard организатора">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Organizer</p>
          <h3>Dashboard</h3>
        </div>
        <span>{events.length}</span>
      </div>

      <div className="dashboard-metrics">
        <div className="dashboard-metric">
          <span>События</span>
          <strong>{events.length}</strong>
        </div>
        <div className="dashboard-metric">
          <span>Регистрации</span>
          <strong>{registrationsCount}</strong>
        </div>
        <div className="dashboard-metric">
          <span>Отмечены</span>
          <strong>{checkedInCount}</strong>
        </div>
        <div className="dashboard-metric">
          <span>Мест</span>
          <strong>{ticketCapacity}</strong>
        </div>
      </div>

      {state === "loading" && (
        <div className="panel-message">Загрузка dashboard...</div>
      )}

      {state === "error" && (
        <div className="form-alert error">
          {error ?? "Не удалось загрузить dashboard"}
        </div>
      )}

      {state === "success" && events.length === 0 && (
        <div className="panel-message">У тебя пока нет событий для статистики.</div>
      )}

      {state === "success" && events.length > 0 && (
        <div className="dashboard-event-list">
          {events.map((eventItem) => (
            <button
              className="dashboard-event-row"
              key={eventItem.eventId}
              type="button"
              onClick={() => onSelectEvent(eventItem.eventId)}
            >
              <div>
                <strong>{eventItem.title}</strong>
                <span>{formatEventStatus(eventItem.status)} · {formatDate(eventItem.startsAtUtc)}</span>
              </div>
              <div className="dashboard-event-stats">
                <span>{eventItem.registrationsCount}/{eventItem.ticketCapacity} мест</span>
                <strong>{eventItem.checkedInCount} check-in</strong>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
