import { FormEvent } from "react";
import { Category } from "../api/events";
import { CreateEventFormState } from "./CreateEventPanel";

type LoadState = "idle" | "loading" | "success" | "error";
type EventStatusAction = "publish" | "cancel";

export type EventSettingsFormState = {
  registrationEnabled: boolean;
  checkInEnabled: boolean;
};

type EventManagementPanelProps = {
  status: string;
  categories: Category[];
  categoriesState: LoadState;
  isEditOpen: boolean;
  editForm: CreateEventFormState;
  editState: LoadState;
  editError: string | null;
  editSuccessMessage: string | null;
  statusState: LoadState;
  statusError: string | null;
  statusSuccessMessage: string | null;
  settingsForm: EventSettingsFormState;
  settingsState: LoadState;
  settingsError: string | null;
  settingsSuccessMessage: string | null;
  onEditOpenChange: (isOpen: boolean) => void;
  onStatusAction: (action: EventStatusAction) => void | Promise<void>;
  onSettingsFieldChange: (field: keyof EventSettingsFormState, value: boolean) => void;
  onSettingsSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEditFieldChange: (field: keyof CreateEventFormState, value: string) => void;
  onEditSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function EventManagementPanel({
  status,
  categories,
  categoriesState,
  isEditOpen,
  editForm,
  editState,
  editError,
  editSuccessMessage,
  statusState,
  statusError,
  statusSuccessMessage,
  settingsForm,
  settingsState,
  settingsError,
  settingsSuccessMessage,
  onEditOpenChange,
  onStatusAction,
  onSettingsFieldChange,
  onSettingsSubmit,
  onEditFieldChange,
  onEditSubmit
}: EventManagementPanelProps) {
  return (
    <>
      <section className="event-management-panel" aria-label="Управление статусом события">
        <div className="section-heading compact">
          <h3>Управление событием</h3>
          <span>{status}</span>
        </div>

        <div className="event-management-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => onEditOpenChange(!isEditOpen)}
          >
            {isEditOpen ? "Скрыть редактор" : "Редактировать"}
          </button>
          <button
            className="secondary-button"
            type="button"
            disabled={status !== "Draft" || statusState === "loading"}
            onClick={() => onStatusAction("publish")}
          >
            {statusState === "loading" ? "Обновляем..." : "Опубликовать"}
          </button>
          <button
            className="danger-button"
            type="button"
            disabled={status === "Cancelled" || status === "Completed" || statusState === "loading"}
            onClick={() => onStatusAction("cancel")}
          >
            Отменить
          </button>
        </div>

        <form className="event-settings-form" onSubmit={onSettingsSubmit}>
          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={settingsForm.registrationEnabled}
              onChange={(event) => onSettingsFieldChange("registrationEnabled", event.target.checked)}
              disabled={settingsState === "loading" || status === "Cancelled"}
            />
            <span>Регистрация включена</span>
          </label>

          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={settingsForm.checkInEnabled}
              onChange={(event) => onSettingsFieldChange("checkInEnabled", event.target.checked)}
              disabled={settingsState === "loading" || status === "Cancelled"}
            />
            <span>Check-in включен</span>
          </label>

          <button
            className="secondary-button"
            type="submit"
            disabled={settingsState === "loading" || status === "Cancelled"}
          >
            {settingsState === "loading" ? "Сохраняем..." : "Сохранить режимы"}
          </button>
        </form>

        {statusError && <div className="form-alert error">{statusError}</div>}
        {statusSuccessMessage && <div className="form-alert success">{statusSuccessMessage}</div>}
        {settingsError && <div className="form-alert error">{settingsError}</div>}
        {settingsSuccessMessage && <div className="form-alert success">{settingsSuccessMessage}</div>}
      </section>

      {isEditOpen && (
        <section className="edit-event-panel" aria-label="Редактирование события">
          <div className="section-heading compact">
            <h3>Редактировать событие</h3>
            <button className="small-button" type="button" onClick={() => onEditOpenChange(false)}>
              Закрыть
            </button>
          </div>

          <form className="edit-event-form" onSubmit={onEditSubmit}>
            <label>
              <span>Категория</span>
              <select
                value={editForm.categoryId}
                onChange={(event) => onEditFieldChange("categoryId", event.target.value)}
                disabled={categoriesState === "loading" || editState === "loading"}
              >
                {categories.length === 0 && <option value="">Категории не загружены</option>}
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="wide-field">
              <span>Название</span>
              <input
                value={editForm.title}
                onChange={(event) => onEditFieldChange("title", event.target.value)}
                disabled={editState === "loading"}
              />
            </label>

            <label className="wide-field">
              <span>Описание</span>
              <textarea
                value={editForm.description}
                onChange={(event) => onEditFieldChange("description", event.target.value)}
                disabled={editState === "loading"}
              />
            </label>

            <label>
              <span>Город</span>
              <input
                value={editForm.city}
                onChange={(event) => onEditFieldChange("city", event.target.value)}
                disabled={editState === "loading"}
              />
            </label>

            <label>
              <span>Адрес</span>
              <input
                value={editForm.address}
                onChange={(event) => onEditFieldChange("address", event.target.value)}
                disabled={editState === "loading"}
              />
            </label>

            <label>
              <span>Площадка</span>
              <input
                value={editForm.venueName}
                onChange={(event) => onEditFieldChange("venueName", event.target.value)}
                disabled={editState === "loading"}
              />
            </label>

            <label>
              <span>Начало</span>
              <input
                type="datetime-local"
                value={editForm.startsAtLocal}
                onChange={(event) => onEditFieldChange("startsAtLocal", event.target.value)}
                disabled={editState === "loading"}
              />
            </label>

            <label>
              <span>Окончание</span>
              <input
                type="datetime-local"
                value={editForm.endsAtLocal}
                onChange={(event) => onEditFieldChange("endsAtLocal", event.target.value)}
                disabled={editState === "loading"}
              />
            </label>

            <button
              className="secondary-button"
              type="submit"
              disabled={editState === "loading" || categoriesState === "loading"}
            >
              {editState === "loading" ? "Сохраняем..." : "Сохранить изменения"}
            </button>
          </form>

          {editError && <div className="form-alert error">{editError}</div>}
          {editSuccessMessage && <div className="form-alert success">{editSuccessMessage}</div>}
        </section>
      )}
    </>
  );
}
