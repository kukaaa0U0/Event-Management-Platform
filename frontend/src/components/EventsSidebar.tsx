import { AuthResponse, Category, EventSummary } from "../api/events";
import { formatEventStatus, getEventStatusPillClassName } from "../utils/statusLabels";

type LoadState = "idle" | "loading" | "success" | "error";
export type EventScope = "all" | "mine";
export type EventStatusFilter = "all" | "Published" | "Draft" | "Cancelled";
export type EventCategoryFilter = "all" | string;

const statusFilters: { value: EventStatusFilter; label: string }[] = [
  { value: "all", label: "Все статусы" },
  { value: "Published", label: "Опубликованы" },
  { value: "Draft", label: "Черновики" },
  { value: "Cancelled", label: "Отменены" }
];

type EventsSidebarProps = {
  auth: AuthResponse | null;
  events: EventSummary[];
  categories: Category[];
  totalEventsCount: number;
  eventsState: LoadState;
  eventScope: EventScope;
  statusFilter: EventStatusFilter;
  categoryFilter: EventCategoryFilter;
  searchValue: string;
  selectedEventId: string | null;
  formatDate: (value: string) => string;
  onScopeChange: (scope: EventScope) => void;
  onStatusFilterChange: (filter: EventStatusFilter) => void;
  onCategoryFilterChange: (filter: EventCategoryFilter) => void;
  onSearchChange: (value: string) => void;
  onSelectEvent: (eventId: string) => void;
};

export function EventsSidebar({
  auth,
  events,
  categories,
  totalEventsCount,
  eventsState,
  eventScope,
  statusFilter,
  categoryFilter,
  searchValue,
  selectedEventId,
  formatDate,
  onScopeChange,
  onStatusFilterChange,
  onCategoryFilterChange,
  onSearchChange,
  onSelectEvent
}: EventsSidebarProps) {
  return (
    <aside className="sidebar" aria-label="Список событий">
      <div className="sidebar-header">
        <p className="eyebrow">Event Management</p>
        <h1>События</h1>
      </div>

      {auth && (
        <div className="event-scope-tabs" role="tablist" aria-label="Фильтр событий">
          <button
            className={eventScope === "all" ? "event-scope-tab active" : "event-scope-tab"}
            type="button"
            onClick={() => onScopeChange("all")}
          >
            Все
          </button>
          <button
            className={eventScope === "mine" ? "event-scope-tab active" : "event-scope-tab"}
            type="button"
            onClick={() => onScopeChange("mine")}
          >
            Мои
          </button>
        </div>
      )}

      <label className="event-search">
        <span>⌕</span>
        <input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Найти событие..."
        />
      </label>

      <div className="event-filter-chips" aria-label="Фильтр по статусу">
        {statusFilters.map((filter) => (
          <button
            className={statusFilter === filter.value ? "event-filter-chip active" : "event-filter-chip"}
            key={filter.value}
            type="button"
            onClick={() => onStatusFilterChange(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <label className="event-category-filter">
        <span>Категория</span>
        <select
          value={categoryFilter}
          onChange={(event) => onCategoryFilterChange(event.target.value)}
          aria-label="Фильтр по категории"
        >
          <option value="all">Все категории</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <div className="event-list-summary">
        <span>{eventScope === "mine" ? "Мои события" : "Все события"}</span>
        <strong>{events.length} из {totalEventsCount}</strong>
      </div>

      {eventsState === "loading" && <div className="state-message">Загрузка событий...</div>}

      {eventsState === "error" && (
        <div className="state-message state-message-error">
          API недоступен. Проверь, что Docker Compose запущен.
        </div>
      )}

      {eventsState === "success" && events.length === 0 && (
        <div className="state-message">
          {searchValue.trim() || statusFilter !== "all" || categoryFilter !== "all"
            ? "По текущим фильтрам событий нет."
            : eventScope === "mine"
              ? "У тебя пока нет своих событий."
              : "Пока нет событий."}
        </div>
      )}

      <div className="event-list">
        {events.map((eventItem) => (
          <button
            className={eventItem.id === selectedEventId ? "event-list-item active" : "event-list-item"}
            key={eventItem.id}
            type="button"
            onClick={() => onSelectEvent(eventItem.id)}
          >
            <span className="event-list-title">{eventItem.title}</span>
            <span className="event-list-meta">
              {eventItem.city} · {formatDate(eventItem.startsAtUtc)}
            </span>
            <span className="event-list-category">{eventItem.categoryName}</span>
            <span className={getEventStatusPillClassName(eventItem.status)}>
              {formatEventStatus(eventItem.status)}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
