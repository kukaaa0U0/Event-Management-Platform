import { FormEvent } from "react";
import { Category } from "../api/events";

type LoadState = "idle" | "loading" | "success" | "error";

export type CreateEventFormState = {
  categoryId: string;
  title: string;
  description: string;
  city: string;
  address: string;
  venueName: string;
  startsAtLocal: string;
  endsAtLocal: string;
};

type CreateEventPanelProps = {
  categories: Category[];
  categoriesState: LoadState;
  form: CreateEventFormState;
  state: LoadState;
  error: string | null;
  successMessage: string | null;
  onFieldChange: (field: keyof CreateEventFormState, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function CreateEventPanel({
  categories,
  categoriesState,
  form,
  state,
  error,
  successMessage,
  onFieldChange,
  onSubmit
}: CreateEventPanelProps) {
  return (
    <section className="create-event-panel" aria-label="Создание события">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Organizer</p>
          <h3>Создать событие</h3>
        </div>
      </div>

      <form className="create-event-form" onSubmit={onSubmit}>
        <div className="create-event-group create-event-group-main">
          <h4>Основное</h4>
          <label>
            <span>Категория</span>
            <select
              value={form.categoryId}
              onChange={(event) => onFieldChange("categoryId", event.target.value)}
              disabled={categoriesState === "loading" || state === "loading"}
            >
              {categories.length === 0 && <option value="">Категории не загружены</option>}
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Название</span>
            <input
              value={form.title}
              onChange={(event) => onFieldChange("title", event.target.value)}
              placeholder="Например, День карьеры"
              disabled={state === "loading"}
            />
          </label>

          <label className="wide-field">
            <span>Описание</span>
            <textarea
              value={form.description}
              onChange={(event) => onFieldChange("description", event.target.value)}
              placeholder="Кратко опиши, для кого событие и что там будет"
              disabled={state === "loading"}
            />
          </label>
        </div>

        <div className="create-event-group">
          <h4>Место</h4>
          <label>
            <span>Город</span>
            <input
              value={form.city}
              onChange={(event) => onFieldChange("city", event.target.value)}
              placeholder="Москва"
              disabled={state === "loading"}
            />
          </label>

          <label>
            <span>Адрес</span>
            <input
              value={form.address}
              onChange={(event) => onFieldChange("address", event.target.value)}
              placeholder="ул. Примерная, 1"
              disabled={state === "loading"}
            />
          </label>

          <label>
            <span>Площадка</span>
            <input
              value={form.venueName}
              onChange={(event) => onFieldChange("venueName", event.target.value)}
              placeholder="Корпус А, аудитория 101"
              disabled={state === "loading"}
            />
          </label>
        </div>

        <div className="create-event-group">
          <h4>Время</h4>
          <label>
            <span>Начало</span>
            <input
              type="datetime-local"
              value={form.startsAtLocal}
              onChange={(event) => onFieldChange("startsAtLocal", event.target.value)}
              disabled={state === "loading"}
            />
          </label>

          <label>
            <span>Окончание</span>
            <input
              type="datetime-local"
              value={form.endsAtLocal}
              onChange={(event) => onFieldChange("endsAtLocal", event.target.value)}
              disabled={state === "loading"}
            />
          </label>
        </div>

        <div className="create-event-actions">
          <button
            className="primary-button"
            type="submit"
            disabled={state === "loading" || categoriesState === "loading" || categories.length === 0}
          >
            {state === "loading" ? "Создаем..." : "Создать событие"}
          </button>
        </div>
      </form>

      {categoriesState === "error" && (
        <div className="form-alert error">Не удалось загрузить категории для формы.</div>
      )}
      {error && <div className="form-alert error">{error}</div>}
      {successMessage && <div className="form-alert success">{successMessage}</div>}
    </section>
  );
}
