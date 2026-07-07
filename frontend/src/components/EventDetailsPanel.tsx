import { FormEvent } from "react";
import { Category, EventDetails, Registration, getEventCalendarUrl } from "../api/events";
import { CreateEventFormState } from "./CreateEventPanel";
import { EventManagementPanel, EventSettingsFormState } from "./EventManagementPanel";
import { EventRegistrationPanel, RegistrationFormState } from "./EventRegistrationPanel";
import { CreateTicketFormState, EventTicketsPanel } from "./EventTicketsPanel";
import { OrganizerRegistrationsPanel } from "./OrganizerRegistrationsPanel";

type LoadState = "idle" | "loading" | "success" | "error";
type EventStatusAction = "publish" | "cancel";

type EventDetailsPanelProps = {
  event: EventDetails;
  isManaged: boolean;
  isAuthenticated: boolean;
  isRegistrationOpen: boolean;
  isCheckInOpen: boolean;
  authEmail: string | null;
  formatDate: (value: string) => string;
  formatPrice: (amount: number, currency: string) => string;
  categories: Category[];
  categoriesState: LoadState;
  isEditEventOpen: boolean;
  editEventForm: CreateEventFormState;
  editEventState: LoadState;
  editEventError: string | null;
  editedEventMessage: string | null;
  eventStatusState: LoadState;
  eventStatusError: string | null;
  eventStatusMessage: string | null;
  eventSettingsForm: EventSettingsFormState;
  eventSettingsState: LoadState;
  eventSettingsError: string | null;
  eventSettingsMessage: string | null;
  createTicketForm: CreateTicketFormState;
  createTicketState: LoadState;
  createTicketError: string | null;
  createdTicketMessage: string | null;
  isCreateTicketOpen: boolean;
  registrationForm: RegistrationFormState;
  registrationState: LoadState;
  registrationError: string | null;
  registrationResult: Registration | null;
  registrations: Registration[];
  registrationsState: LoadState;
  registrationsError: string | null;
  checkInCode: string;
  checkInState: LoadState;
  checkInError: string | null;
  checkInResult: Registration | null;
  onEditEventOpenChange: (isOpen: boolean) => void;
  onEventStatusAction: (action: EventStatusAction) => void | Promise<void>;
  onEventSettingsFieldChange: (field: keyof EventSettingsFormState, value: boolean) => void;
  onEventSettingsSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEditEventFieldChange: (field: keyof CreateEventFormState, value: string) => void;
  onEditEventSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCreateTicketOpenChange: (isOpen: boolean) => void;
  onCreateTicketFieldChange: (field: keyof CreateTicketFormState, value: string) => void;
  onCreateTicketSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRegistrationFieldChange: (field: keyof RegistrationFormState, value: string) => void;
  onRegistrationSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCheckInCodeChange: (value: string) => void;
  onCheckInSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRegistrationCheckIn: (checkInCode: string) => void | Promise<void>;
};

export function EventDetailsPanel({
  event,
  isManaged,
  isAuthenticated,
  isRegistrationOpen,
  isCheckInOpen,
  authEmail,
  formatDate,
  formatPrice,
  categories,
  categoriesState,
  isEditEventOpen,
  editEventForm,
  editEventState,
  editEventError,
  editedEventMessage,
  eventStatusState,
  eventStatusError,
  eventStatusMessage,
  eventSettingsForm,
  eventSettingsState,
  eventSettingsError,
  eventSettingsMessage,
  createTicketForm,
  createTicketState,
  createTicketError,
  createdTicketMessage,
  isCreateTicketOpen,
  registrationForm,
  registrationState,
  registrationError,
  registrationResult,
  registrations,
  registrationsState,
  registrationsError,
  checkInCode,
  checkInState,
  checkInError,
  checkInResult,
  onEditEventOpenChange,
  onEventStatusAction,
  onEventSettingsFieldChange,
  onEventSettingsSubmit,
  onEditEventFieldChange,
  onEditEventSubmit,
  onCreateTicketOpenChange,
  onCreateTicketFieldChange,
  onCreateTicketSubmit,
  onRegistrationFieldChange,
  onRegistrationSubmit,
  onCheckInCodeChange,
  onCheckInSubmit,
  onRegistrationCheckIn
}: EventDetailsPanelProps) {
  return (
    <article className="event-details">
      <div className="details-header">
        <div>
          <p className="eyebrow">{event.city}</p>
          <h2>{event.title}</h2>
        </div>
        <div className="details-actions">
          <span className="status-pill large">{event.status}</span>
          <a className="secondary-button calendar-button" href={getEventCalendarUrl(event.id)} download>
            Скачать .ics
          </a>
        </div>
      </div>

      <p className="description">{event.description}</p>

      <div className="details-grid">
        <div className="info-block">
          <span>Начало</span>
          <strong>{formatDate(event.startsAtUtc)}</strong>
        </div>
        <div className="info-block">
          <span>Окончание</span>
          <strong>{formatDate(event.endsAtUtc)}</strong>
        </div>
        <div className="info-block">
          <span>Адрес</span>
          <strong>{event.address}</strong>
        </div>
        <div className="info-block">
          <span>Площадка</span>
          <strong>{event.venueName ?? "Не указана"}</strong>
        </div>
      </div>

      {isManaged && (
        <EventManagementPanel
          status={event.status}
          categories={categories}
          categoriesState={categoriesState}
          isEditOpen={isEditEventOpen}
          editForm={editEventForm}
          editState={editEventState}
          editError={editEventError}
          editSuccessMessage={editedEventMessage}
          statusState={eventStatusState}
          statusError={eventStatusError}
          statusSuccessMessage={eventStatusMessage}
          settingsForm={eventSettingsForm}
          settingsState={eventSettingsState}
          settingsError={eventSettingsError}
          settingsSuccessMessage={eventSettingsMessage}
          onEditOpenChange={onEditEventOpenChange}
          onStatusAction={onEventStatusAction}
          onSettingsFieldChange={onEventSettingsFieldChange}
          onSettingsSubmit={onEventSettingsSubmit}
          onEditFieldChange={onEditEventFieldChange}
          onEditSubmit={onEditEventSubmit}
        />
      )}

      <div className="event-action-grid">
        <EventTicketsPanel
          tickets={event.tickets}
          isManaged={isManaged}
          isCreateOpen={isCreateTicketOpen}
          form={createTicketForm}
          state={createTicketState}
          error={createTicketError}
          successMessage={createdTicketMessage}
          formatPrice={formatPrice}
          onCreateOpenChange={onCreateTicketOpenChange}
          onFieldChange={onCreateTicketFieldChange}
          onSubmit={onCreateTicketSubmit}
        />

        <EventRegistrationPanel
          tickets={event.tickets}
          form={registrationForm}
          state={registrationState}
          error={registrationError}
          result={registrationResult}
          isOpen={isRegistrationOpen}
          authEmail={authEmail}
          formatPrice={formatPrice}
          onFieldChange={onRegistrationFieldChange}
          onSubmit={onRegistrationSubmit}
        />
      </div>

      <OrganizerRegistrationsPanel
        isManaged={isManaged}
        isAuthenticated={isAuthenticated}
        isCheckInOpen={isCheckInOpen}
        registrations={registrations}
        registrationsState={registrationsState}
        registrationsError={registrationsError}
        checkInCode={checkInCode}
        checkInState={checkInState}
        checkInError={checkInError}
        checkInResult={checkInResult}
        onCheckInCodeChange={onCheckInCodeChange}
        onCheckInSubmit={onCheckInSubmit}
        onRegistrationCheckIn={onRegistrationCheckIn}
      />
    </article>
  );
}
