import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AuthResponse,
  Category,
  EventDetails,
  EventSummary,
  MyRegistration,
  OrganizerDashboardEvent,
  Registration,
  cancelEvent,
  checkInParticipant,
  createEvent,
  createTicket,
  getCategories,
  getEventDetails,
  getEventRegistrations,
  getEvents,
  getMyRegistrations,
  getMyEvents,
  getOrganizerDashboard,
  login,
  publishEvent,
  registerForEvent,
  registerUser,
  updateEvent,
  updateEventSettings
} from "./api/events";
import { AuthFormState, AuthMode, AuthPanel } from "./components/AuthPanel";
import { CreateEventFormState, CreateEventPanel } from "./components/CreateEventPanel";
import { EventDetailsPanel } from "./components/EventDetailsPanel";
import { EventSettingsFormState } from "./components/EventManagementPanel";
import { RegistrationFormState } from "./components/EventRegistrationPanel";
import { CreateTicketFormState } from "./components/EventTicketsPanel";
import { EventCategoryFilter, EventScope, EventStatusFilter, EventsSidebar } from "./components/EventsSidebar";
import { MyRegistrationsPanel } from "./components/MyRegistrationsPanel";
import { OrganizerDashboardPanel } from "./components/OrganizerDashboardPanel";
import { WorkspacePanel, WorkspaceTab } from "./components/WorkspacePanel";

type LoadState = "idle" | "loading" | "success" | "error";

const emptyRegistrationForm: RegistrationFormState = {
  fullName: "",
  email: "",
  ticketId: ""
};

const emptyAuthForm: AuthFormState = {
  fullName: "",
  email: "",
  password: ""
};

const emptyTicketForm: CreateTicketFormState = {
  name: "",
  type: "Regular",
  priceAmount: "0",
  priceCurrency: "RUB",
  capacity: "50"
};

const defaultEventSettingsForm: EventSettingsFormState = {
  registrationEnabled: true,
  checkInEnabled: false
};

function toDateTimeLocalValue(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function createDefaultEventForm(): CreateEventFormState {
  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() + 7);
  startsAt.setMinutes(0, 0, 0);

  const endsAt = new Date(startsAt);
  endsAt.setHours(endsAt.getHours() + 2);

  return {
    categoryId: "",
    title: "",
    description: "",
    city: "",
    address: "",
    venueName: "",
    startsAtLocal: toDateTimeLocalValue(startsAt),
    endsAtLocal: toDateTimeLocalValue(endsAt)
  };
}

function createEventFormFromDetails(eventDetails: EventDetails): CreateEventFormState {
  return {
    categoryId: eventDetails.categoryId,
    title: eventDetails.title,
    description: eventDetails.description,
    city: eventDetails.city,
    address: eventDetails.address,
    venueName: eventDetails.venueName ?? "",
    startsAtLocal: toDateTimeLocalValue(new Date(eventDetails.startsAtUtc)),
    endsAtLocal: toDateTimeLocalValue(new Date(eventDetails.endsAtUtc))
  };
}

const authStorageKey = "event-management-auth";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency
  }).format(amount);
}

export default function App() {
  const [auth, setAuth] = useState<AuthResponse | null>(() => {
    const rawValue = localStorage.getItem(authStorageKey);

    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as AuthResponse;
    } catch {
      localStorage.removeItem(authStorageKey);
      return null;
    }
  });
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authForm, setAuthForm] = useState<AuthFormState>(emptyAuthForm);
  const [authState, setAuthState] = useState<LoadState>("idle");
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<WorkspaceTab>(() => auth ? "overview" : "account");
  const [eventScope, setEventScope] = useState<EventScope>("all");
  const [eventStatusFilter, setEventStatusFilter] = useState<EventStatusFilter>("all");
  const [eventCategoryFilter, setEventCategoryFilter] = useState<EventCategoryFilter>("all");
  const [eventSearch, setEventSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesState, setCategoriesState] = useState<LoadState>("idle");
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [managedEventIds, setManagedEventIds] = useState<string[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
  const [eventsState, setEventsState] = useState<LoadState>("idle");
  const [detailsState, setDetailsState] = useState<LoadState>("idle");
  const [myRegistrationsState, setMyRegistrationsState] = useState<LoadState>("idle");
  const [myRegistrations, setMyRegistrations] = useState<MyRegistration[]>([]);
  const [myRegistrationsError, setMyRegistrationsError] = useState<string | null>(null);
  const [dashboardState, setDashboardState] = useState<LoadState>("idle");
  const [dashboardEvents, setDashboardEvents] = useState<OrganizerDashboardEvent[]>([]);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [registrationsState, setRegistrationsState] = useState<LoadState>("idle");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [registrationState, setRegistrationState] = useState<LoadState>("idle");
  const [registrationForm, setRegistrationForm] = useState<RegistrationFormState>(emptyRegistrationForm);
  const [registrationResult, setRegistrationResult] = useState<Registration | null>(null);
  const [checkInCode, setCheckInCode] = useState("");
  const [checkInState, setCheckInState] = useState<LoadState>("idle");
  const [checkInResult, setCheckInResult] = useState<Registration | null>(null);
  const [createEventForm, setCreateEventForm] = useState<CreateEventFormState>(() => createDefaultEventForm());
  const [createEventState, setCreateEventState] = useState<LoadState>("idle");
  const [createEventError, setCreateEventError] = useState<string | null>(null);
  const [createdEventMessage, setCreatedEventMessage] = useState<string | null>(null);
  const [editEventForm, setEditEventForm] = useState<CreateEventFormState>(() => createDefaultEventForm());
  const [editEventState, setEditEventState] = useState<LoadState>("idle");
  const [editEventError, setEditEventError] = useState<string | null>(null);
  const [editedEventMessage, setEditedEventMessage] = useState<string | null>(null);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [eventStatusState, setEventStatusState] = useState<LoadState>("idle");
  const [eventStatusError, setEventStatusError] = useState<string | null>(null);
  const [eventStatusMessage, setEventStatusMessage] = useState<string | null>(null);
  const [eventSettingsForm, setEventSettingsForm] = useState<EventSettingsFormState>(defaultEventSettingsForm);
  const [eventSettingsState, setEventSettingsState] = useState<LoadState>("idle");
  const [eventSettingsError, setEventSettingsError] = useState<string | null>(null);
  const [eventSettingsMessage, setEventSettingsMessage] = useState<string | null>(null);
  const [createTicketForm, setCreateTicketForm] = useState<CreateTicketFormState>(emptyTicketForm);
  const [createTicketState, setCreateTicketState] = useState<LoadState>("idle");
  const [createTicketError, setCreateTicketError] = useState<string | null>(null);
  const [createdTicketMessage, setCreatedTicketMessage] = useState<string | null>(null);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationsError, setRegistrationsError] = useState<string | null>(null);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    setEventsState("loading");
    setErrorMessage(null);

    const eventsRequest = eventScope === "mine" && auth
      ? getMyEvents(auth.accessToken)
      : getEvents();

    eventsRequest
      .then((items) => {
        if (!isActive) {
          return;
        }

        setEvents(items);
        setSelectedEventId((current) =>
          current && items.some((eventItem) => eventItem.id === current)
            ? current
            : items[0]?.id ?? null
        );
        setEventsState("success");
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Не удалось загрузить события");
        setEventsState("error");
      });

    return () => {
      isActive = false;
    };
  }, [eventScope, auth]);

  useEffect(() => {
    let isActive = true;

    setCategoriesState("loading");
    getCategories()
      .then((items) => {
        if (!isActive) {
          return;
        }

        setCategories(items);
        setCreateEventForm((current) => ({
          ...current,
          categoryId: current.categoryId || items[0]?.id || ""
        }));
        setCategoriesState("success");
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setCategoriesState("error");
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!auth) {
      setManagedEventIds([]);
      setMyRegistrations([]);
      setMyRegistrationsState("idle");
      setMyRegistrationsError(null);
      setDashboardEvents([]);
      setDashboardState("idle");
      setDashboardError(null);
      return;
    }

    let isActive = true;

    getMyEvents(auth.accessToken)
      .then((items) => {
        if (!isActive) {
          return;
        }

        setManagedEventIds(items.map((eventItem) => eventItem.id));
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setManagedEventIds([]);
      });

    return () => {
      isActive = false;
    };
  }, [auth]);

  useEffect(() => {
    if (!auth) {
      return;
    }

    let isActive = true;

    setMyRegistrationsState("loading");
    setMyRegistrationsError(null);

    getMyRegistrations(auth.accessToken)
      .then((items) => {
        if (!isActive) {
          return;
        }

        setMyRegistrations(items);
        setMyRegistrationsState("success");
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setMyRegistrationsError(error instanceof Error ? error.message : "Не удалось загрузить твои регистрации");
        setMyRegistrationsState("error");
      });

    return () => {
      isActive = false;
    };
  }, [auth]);

  useEffect(() => {
    if (!auth) {
      return;
    }

    let isActive = true;

    setDashboardState("loading");
    setDashboardError(null);

    getOrganizerDashboard(auth.accessToken)
      .then((items) => {
        if (!isActive) {
          return;
        }

        setDashboardEvents(items);
        setDashboardState("success");
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setDashboardError(error instanceof Error ? error.message : "Не удалось загрузить dashboard");
        setDashboardState("error");
      });

    return () => {
      isActive = false;
    };
  }, [auth]);

  useEffect(() => {
    if (!selectedEventId) {
      setSelectedEvent(null);
      return;
    }

    let isActive = true;

    setDetailsState("loading");
    setRegistrationsState("idle");
    setRegistrations([]);
    setRegistrationResult(null);
    setRegistrationError(null);
    setRegistrationsError(null);
    setCheckInCode("");
    setCheckInResult(null);
    setCheckInError(null);
    setCheckInState("idle");
    setCreateTicketForm(emptyTicketForm);
    setCreateTicketError(null);
    setCreatedTicketMessage(null);
    setCreateTicketState("idle");
    setIsCreateTicketOpen(false);
    setEditEventError(null);
    setEditedEventMessage(null);
    setEditEventState("idle");
    setIsEditEventOpen(false);
    setEventStatusError(null);
    setEventStatusMessage(null);
    setEventStatusState("idle");
    setEventSettingsForm(defaultEventSettingsForm);
    setEventSettingsError(null);
    setEventSettingsMessage(null);
    setEventSettingsState("idle");
    getEventDetails(selectedEventId)
      .then((item) => {
        if (!isActive) {
          return;
        }

        setSelectedEvent(item);
        setEditEventForm(createEventFormFromDetails(item));
        setEventSettingsForm({
          registrationEnabled: item.registrationEnabled,
          checkInEnabled: item.checkInEnabled
        });
        setRegistrationForm({
          ...emptyRegistrationForm,
          fullName: auth?.fullName ?? "",
          email: auth?.email ?? "",
          ticketId: item.tickets[0]?.id ?? ""
        });
        setDetailsState("success");
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Не удалось загрузить событие");
        setDetailsState("error");
      });

    return () => {
      isActive = false;
    };
  }, [selectedEventId, auth]);

  const selectedSummary = useMemo(
    () => events.find((eventItem) => eventItem.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const visibleEvents = useMemo(() => {
    const searchValue = eventSearch.trim().toLowerCase();
    const filteredByStatus = eventStatusFilter === "all"
      ? events
      : events.filter((eventItem) => eventItem.status === eventStatusFilter);
    const filteredByCategory = eventCategoryFilter === "all"
      ? filteredByStatus
      : filteredByStatus.filter((eventItem) => eventItem.categoryId === eventCategoryFilter);

    if (!searchValue) {
      return filteredByCategory;
    }

    return filteredByCategory.filter((eventItem) =>
      [eventItem.title, eventItem.description, eventItem.city, eventItem.address, eventItem.status, eventItem.categoryName]
        .some((value) => value.toLowerCase().includes(searchValue))
    );
  }, [events, eventCategoryFilter, eventSearch, eventStatusFilter]);

  useEffect(() => {
    if (eventsState !== "success") {
      return;
    }

    setSelectedEventId((current) =>
      current && visibleEvents.some((eventItem) => eventItem.id === current)
        ? current
        : visibleEvents[0]?.id ?? null
    );
  }, [eventsState, visibleEvents]);

  const isSelectedEventManaged = useMemo(
    () => Boolean(auth && selectedEventId && managedEventIds.includes(selectedEventId)),
    [auth, managedEventIds, selectedEventId]
  );

  const isRegistrationOpen = Boolean(
    selectedEvent?.status === "Published" && selectedEvent.registrationEnabled
  );

  const isCheckInOpen = Boolean(
    selectedEvent &&
      (selectedEvent.status === "Published" || selectedEvent.status === "Ongoing") &&
      selectedEvent.checkInEnabled
  );

  useEffect(() => {
    if (!selectedEventId || !auth || !isSelectedEventManaged) {
      setRegistrations([]);
      setRegistrationsState("idle");
      setRegistrationsError(null);
      return;
    }

    let isActive = true;

    setRegistrationsState("loading");
    setRegistrationsError(null);

    getEventRegistrations(selectedEventId, auth.accessToken)
      .then((items) => {
        if (!isActive) {
          return;
        }

        setRegistrations(items);
        setRegistrationsState("success");
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setRegistrationsError(error instanceof Error ? error.message : "Не удалось загрузить участников");
        setRegistrationsState("error");
      });

    return () => {
      isActive = false;
    };
  }, [selectedEventId, auth, isSelectedEventManaged]);

  async function refreshEvents(preferredSelectedEventId?: string) {
    const managedItems = auth ? await getMyEvents(auth.accessToken) : [];
    const items = eventScope === "mine" && auth
      ? managedItems
      : await getEvents();

    setManagedEventIds(managedItems.map((eventItem) => eventItem.id));
    setEvents(items);
    setSelectedEventId((current) => {
      if (preferredSelectedEventId && items.some((eventItem) => eventItem.id === preferredSelectedEventId)) {
        return preferredSelectedEventId;
      }

      if (current && items.some((eventItem) => eventItem.id === current)) {
        return current;
      }

      return items[0]?.id ?? null;
    });

    return items;
  }

  async function refreshMyRegistrations() {
    if (!auth) {
      setMyRegistrations([]);
      setMyRegistrationsState("idle");
      return;
    }

    setMyRegistrationsState("loading");
    setMyRegistrationsError(null);

    try {
      const items = await getMyRegistrations(auth.accessToken);

      setMyRegistrations(items);
      setMyRegistrationsState("success");
    } catch (error: unknown) {
      setMyRegistrationsError(error instanceof Error ? error.message : "Не удалось загрузить твои регистрации");
      setMyRegistrationsState("error");
    }
  }

  async function refreshOrganizerDashboard() {
    if (!auth) {
      setDashboardEvents([]);
      setDashboardState("idle");
      return;
    }

    setDashboardState("loading");
    setDashboardError(null);

    try {
      const items = await getOrganizerDashboard(auth.accessToken);

      setDashboardEvents(items);
      setDashboardState("success");
    } catch (error: unknown) {
      setDashboardError(error instanceof Error ? error.message : "Не удалось загрузить dashboard");
      setDashboardState("error");
    }
  }

  function updateRegistrationForm(field: keyof RegistrationFormState, value: string) {
    setRegistrationForm((current) => ({
      ...current,
      [field]: value
    }));
    setRegistrationError(null);
  }

  function updateAuthForm(field: keyof AuthFormState, value: string) {
    setAuthForm((current) => ({
      ...current,
      [field]: value
    }));
    setAuthError(null);
  }

  function changeAuthMode(mode: AuthMode) {
    setAuthMode(mode);
    setAuthError(null);
  }

  function updateCreateEventForm(field: keyof CreateEventFormState, value: string) {
    setCreateEventForm((current) => ({
      ...current,
      [field]: value
    }));
    setCreateEventError(null);
    setCreatedEventMessage(null);
  }

  function updateEditEventForm(field: keyof CreateEventFormState, value: string) {
    setEditEventForm((current) => ({
      ...current,
      [field]: value
    }));
    setEditEventError(null);
    setEditedEventMessage(null);
  }

  function updateCreateTicketForm(field: keyof CreateTicketFormState, value: string) {
    setCreateTicketForm((current) => ({
      ...current,
      [field]: value
    }));
    setCreateTicketError(null);
    setCreatedTicketMessage(null);
  }

  function updateEventSettingsForm(field: keyof EventSettingsFormState, value: boolean) {
    setEventSettingsForm((current) => ({
      ...current,
      [field]: value
    }));
    setEventSettingsError(null);
    setEventSettingsMessage(null);
  }

  function updateCheckInCode(value: string) {
    setCheckInCode(value);
    setCheckInError(null);
  }

  function saveAuth(response: AuthResponse) {
    localStorage.setItem(authStorageKey, JSON.stringify(response));
    setAuth(response);
    setAuthForm(emptyAuthForm);
    setAuthState("success");
    setActiveWorkspaceTab("overview");
  }

  function logout() {
    localStorage.removeItem(authStorageKey);
    setAuth(null);
    setActiveWorkspaceTab("account");
    setEventScope("all");
    setEventCategoryFilter("all");
    setManagedEventIds([]);
    setMyRegistrations([]);
    setMyRegistrationsState("idle");
    setMyRegistrationsError(null);
    setDashboardEvents([]);
    setDashboardState("idle");
    setDashboardError(null);
    setRegistrations([]);
    setRegistrationsState("idle");
    setCheckInCode("");
    setCheckInResult(null);
    setCheckInError(null);
  }

  async function handleCreateEventSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!auth) {
      setCreateEventError("Войди как организатор, чтобы создать событие.");
      return;
    }

    if (!createEventForm.categoryId) {
      setCreateEventError("Выбери категорию.");
      return;
    }

    if (!createEventForm.title.trim()) {
      setCreateEventError("Укажи название события.");
      return;
    }

    if (!createEventForm.description.trim()) {
      setCreateEventError("Добавь описание события.");
      return;
    }

    if (!createEventForm.city.trim()) {
      setCreateEventError("Укажи город.");
      return;
    }

    if (!createEventForm.address.trim()) {
      setCreateEventError("Укажи адрес.");
      return;
    }

    const startsAt = new Date(createEventForm.startsAtLocal);
    const endsAt = new Date(createEventForm.endsAtLocal);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      setCreateEventError("Укажи корректные дату и время.");
      return;
    }

    if (endsAt <= startsAt) {
      setCreateEventError("Окончание должно быть позже начала.");
      return;
    }

    setCreateEventState("loading");
    setCreateEventError(null);
    setCreatedEventMessage(null);

    try {
      const createdEvent = await createEvent(
        {
          categoryId: createEventForm.categoryId,
          title: createEventForm.title.trim(),
          description: createEventForm.description.trim(),
          city: createEventForm.city.trim(),
          address: createEventForm.address.trim(),
          venueName: createEventForm.venueName.trim() || null,
          startsAtUtc: startsAt.toISOString(),
          endsAtUtc: endsAt.toISOString()
        },
        auth.accessToken
      );

      await refreshEvents(createdEvent.id);
      await refreshOrganizerDashboard();
      setEventScope("mine");
      setEventStatusFilter("Draft");
      setEventCategoryFilter(createdEvent.categoryId);
      setCreateEventForm({
        ...createDefaultEventForm(),
        categoryId: createEventForm.categoryId
      });
      setCreatedEventMessage("Событие создано как черновик. Следующий шаг: добавь билет в карточке события и опубликуй его.");
      setCreateEventState("success");
    } catch (error: unknown) {
      setCreateEventError(error instanceof Error ? error.message : "Не удалось создать событие");
      setCreateEventState("error");
    }
  }

  async function handleEditEventSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedEvent) {
      return;
    }

    if (!auth || !isSelectedEventManaged) {
      setEditEventError("Управление доступно только организатору этого события.");
      return;
    }

    if (!editEventForm.categoryId) {
      setEditEventError("Выбери категорию.");
      return;
    }

    if (!editEventForm.title.trim()) {
      setEditEventError("Укажи название события.");
      return;
    }

    if (!editEventForm.description.trim()) {
      setEditEventError("Добавь описание события.");
      return;
    }

    if (!editEventForm.city.trim()) {
      setEditEventError("Укажи город.");
      return;
    }

    if (!editEventForm.address.trim()) {
      setEditEventError("Укажи адрес.");
      return;
    }

    const startsAt = new Date(editEventForm.startsAtLocal);
    const endsAt = new Date(editEventForm.endsAtLocal);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      setEditEventError("Укажи корректные дату и время.");
      return;
    }

    if (endsAt <= startsAt) {
      setEditEventError("Окончание должно быть позже начала.");
      return;
    }

    setEditEventState("loading");
    setEditEventError(null);
    setEditedEventMessage(null);

    try {
      const updatedEvent = await updateEvent(
        selectedEvent.id,
        {
          categoryId: editEventForm.categoryId,
          title: editEventForm.title.trim(),
          description: editEventForm.description.trim(),
          city: editEventForm.city.trim(),
          address: editEventForm.address.trim(),
          venueName: editEventForm.venueName.trim() || null,
          startsAtUtc: startsAt.toISOString(),
          endsAtUtc: endsAt.toISOString()
        },
        auth.accessToken
      );

      await refreshEvents(updatedEvent.id);
      await refreshOrganizerDashboard();
      setSelectedEvent(updatedEvent);
      setEditEventForm(createEventFormFromDetails(updatedEvent));
      setEditedEventMessage("Событие обновлено.");
      setEditEventState("success");
    } catch (error: unknown) {
      setEditEventError(error instanceof Error ? error.message : "Не удалось обновить событие");
      setEditEventState("error");
    }
  }

  async function handleEventStatusAction(action: "publish" | "cancel") {
    if (!selectedEvent) {
      return;
    }

    if (!auth || !isSelectedEventManaged) {
      setEventStatusError("Управление статусом доступно только организатору этого события.");
      return;
    }

    setEventStatusState("loading");
    setEventStatusError(null);
    setEventStatusMessage(null);

    try {
      const updatedEvent =
        action === "publish"
          ? await publishEvent(selectedEvent.id, auth.accessToken)
          : await cancelEvent(selectedEvent.id, auth.accessToken);

      await refreshEvents(updatedEvent.id);
      await refreshOrganizerDashboard();
      setSelectedEvent(updatedEvent);
      setEditEventForm(createEventFormFromDetails(updatedEvent));
      setEventSettingsForm({
        registrationEnabled: updatedEvent.registrationEnabled,
        checkInEnabled: updatedEvent.checkInEnabled
      });
      setEventStatusMessage(action === "publish" ? "Событие опубликовано." : "Событие отменено.");
      setEventStatusState("success");
    } catch (error: unknown) {
      setEventStatusError(error instanceof Error ? error.message : "Не удалось изменить статус события");
      setEventStatusState("error");
    }
  }

  async function handleEventSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedEvent) {
      return;
    }

    if (!auth || !isSelectedEventManaged) {
      setEventSettingsError("Режимы события может менять только организатор этого события.");
      return;
    }

    setEventSettingsState("loading");
    setEventSettingsError(null);
    setEventSettingsMessage(null);

    try {
      const updatedEvent = await updateEventSettings(
        selectedEvent.id,
        {
          registrationEnabled: eventSettingsForm.registrationEnabled,
          checkInEnabled: eventSettingsForm.checkInEnabled
        },
        auth.accessToken
      );

      await refreshEvents(updatedEvent.id);
      await refreshOrganizerDashboard();
      setSelectedEvent(updatedEvent);
      setEventSettingsForm({
        registrationEnabled: updatedEvent.registrationEnabled,
        checkInEnabled: updatedEvent.checkInEnabled
      });
      setEventSettingsMessage("Режимы события сохранены.");
      setEventSettingsState("success");
    } catch (error: unknown) {
      setEventSettingsError(error instanceof Error ? error.message : "Не удалось сохранить режимы события");
      setEventSettingsState("error");
    }
  }

  async function handleCreateTicketSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedEvent) {
      return;
    }

    if (!auth || !isSelectedEventManaged) {
      setCreateTicketError("Управление билетами доступно только организатору этого события.");
      return;
    }

    if (!createTicketForm.name.trim()) {
      setCreateTicketError("Укажи название билета.");
      return;
    }

    const priceAmount = Number(createTicketForm.priceAmount);
    const capacity = Number.parseInt(createTicketForm.capacity, 10);

    if (Number.isNaN(priceAmount) || priceAmount < 0) {
      setCreateTicketError("Укажи корректную цену.");
      return;
    }

    if (Number.isNaN(capacity) || capacity <= 0) {
      setCreateTicketError("Количество мест должно быть больше нуля.");
      return;
    }

    if (!createTicketForm.priceCurrency.trim()) {
      setCreateTicketError("Укажи валюту.");
      return;
    }

    setCreateTicketState("loading");
    setCreateTicketError(null);
    setCreatedTicketMessage(null);

    try {
      const updatedEvent = await createTicket(
        selectedEvent.id,
        {
          name: createTicketForm.name.trim(),
          type: createTicketForm.type,
          priceAmount,
          priceCurrency: createTicketForm.priceCurrency.trim().toUpperCase(),
          capacity
        },
        auth.accessToken
      );

      setSelectedEvent(updatedEvent);
      await refreshOrganizerDashboard();
      setRegistrationForm({
        ...emptyRegistrationForm,
        fullName: auth?.fullName ?? "",
        email: auth?.email ?? "",
        ticketId: updatedEvent.tickets[0]?.id ?? ""
      });
      setCreateTicketForm(emptyTicketForm);
      setIsCreateTicketOpen(false);
      setCreatedTicketMessage("Билет добавлен.");
      setCreateTicketState("success");
    } catch (error: unknown) {
      setCreateTicketError(error instanceof Error ? error.message : "Не удалось добавить билет");
      setCreateTicketState("error");
    }
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (authMode === "register" && !authForm.fullName.trim()) {
      setAuthError("Укажи имя.");
      return;
    }

    if (!authForm.email.trim()) {
      setAuthError("Укажи email.");
      return;
    }

    if (!authForm.password.trim()) {
      setAuthError("Укажи пароль.");
      return;
    }

    setAuthState("loading");
    setAuthError(null);

    try {
      const response =
        authMode === "login"
          ? await login({
              email: authForm.email.trim(),
              password: authForm.password
            })
          : await registerUser({
              fullName: authForm.fullName.trim(),
              email: authForm.email.trim(),
              password: authForm.password
            });

      saveAuth(response);
    } catch (error: unknown) {
      setAuthError(error instanceof Error ? error.message : "Не удалось войти");
      setAuthState("error");
    }
  }

  async function refreshRegistrations(eventId: string) {
    if (!auth || !isSelectedEventManaged) {
      setRegistrationsState("idle");
      return;
    }

    setRegistrationsState("loading");
    setRegistrationsError(null);

    try {
      const items = await getEventRegistrations(eventId, auth.accessToken);

      setRegistrations(items);
      setRegistrationsState("success");
    } catch (error: unknown) {
      setRegistrationsError(error instanceof Error ? error.message : "Не удалось загрузить участников");
      setRegistrationsState("error");
    }
  }

  async function handleRegistrationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedEvent) {
      return;
    }

    if (!isRegistrationOpen) {
      setRegistrationError("Регистрация на это событие сейчас закрыта.");
      return;
    }

    if (!registrationForm.ticketId) {
      setRegistrationError("Выбери билет.");
      return;
    }

    const participantName = auth?.fullName ?? registrationForm.fullName.trim();
    const participantEmail = auth?.email ?? registrationForm.email.trim();

    if (!participantName) {
      setRegistrationError("Укажи имя участника.");
      return;
    }

    if (!participantEmail) {
      setRegistrationError("Укажи email участника.");
      return;
    }

    setRegistrationState("loading");
    setRegistrationError(null);
    setRegistrationResult(null);

    try {
      const registration = await registerForEvent(selectedEvent.id, {
        ticketId: registrationForm.ticketId,
        fullName: participantName,
        email: participantEmail
      }, auth?.accessToken);

      setRegistrationResult(registration);
      setRegistrationState("success");
      setRegistrationForm({
        ...emptyRegistrationForm,
        fullName: auth?.fullName ?? "",
        email: auth?.email ?? "",
        ticketId: selectedEvent.tickets[0]?.id ?? ""
      });
      await refreshRegistrations(selectedEvent.id);
      await refreshMyRegistrations();
      await refreshOrganizerDashboard();
    } catch (error: unknown) {
      setRegistrationError(error instanceof Error ? error.message : "Не удалось зарегистрироваться");
      setRegistrationState("error");
    }
  }

  async function submitCheckIn(code: string) {
    if (!selectedEvent) {
      return;
    }

    if (!auth || !isSelectedEventManaged) {
      setCheckInError("Check-in доступен только организатору этого события.");
      return;
    }

    if (!isCheckInOpen) {
      setCheckInError("Check-in для этого события сейчас выключен.");
      return;
    }

    const normalizedCode = code.trim();

    if (!normalizedCode) {
      setCheckInError("Укажи check-in код.");
      return;
    }

    setCheckInState("loading");
    setCheckInError(null);
    setCheckInResult(null);

    try {
      const registration = await checkInParticipant({ checkInCode: normalizedCode }, auth.accessToken);

      setCheckInResult(registration);
      setCheckInCode("");
      setCheckInState("success");
      await refreshRegistrations(selectedEvent.id);
      await refreshOrganizerDashboard();
    } catch (error: unknown) {
      setCheckInError(error instanceof Error ? error.message : "Не удалось отметить участника");
      setCheckInState("error");
    }
  }

  async function handleCheckInSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitCheckIn(checkInCode);
  }

  return (
    <main className="app-shell">
      <EventsSidebar
        auth={auth}
        events={visibleEvents}
        categories={categories}
        totalEventsCount={events.length}
        eventsState={eventsState}
        eventScope={eventScope}
        statusFilter={eventStatusFilter}
        categoryFilter={eventCategoryFilter}
        searchValue={eventSearch}
        selectedEventId={selectedEventId}
        formatDate={formatDate}
        onScopeChange={setEventScope}
        onStatusFilterChange={setEventStatusFilter}
        onCategoryFilterChange={setEventCategoryFilter}
        onSearchChange={setEventSearch}
        onSelectEvent={setSelectedEventId}
      />

      <section className="content" aria-label="Детали события">
        {errorMessage && <div className="top-alert">{errorMessage}</div>}

        <WorkspacePanel
          authExists={Boolean(auth)}
          activeTab={activeWorkspaceTab}
          onTabChange={setActiveWorkspaceTab}
        />

        {activeWorkspaceTab === "account" && (
          <AuthPanel
            auth={auth}
            mode={authMode}
            form={authForm}
            state={authState}
            error={authError}
            onModeChange={changeAuthMode}
            onFieldChange={updateAuthForm}
            onSubmit={handleAuthSubmit}
            onLogout={logout}
          />
        )}

        {auth && activeWorkspaceTab === "overview" && (
          <MyRegistrationsPanel
            registrations={myRegistrations}
            state={myRegistrationsState}
            error={myRegistrationsError}
            formatDate={formatDate}
            onSelectEvent={setSelectedEventId}
          />
        )}

        {auth && activeWorkspaceTab === "overview" && (
          <OrganizerDashboardPanel
            events={dashboardEvents}
            state={dashboardState}
            error={dashboardError}
            formatDate={formatDate}
            onSelectEvent={setSelectedEventId}
          />
        )}

        {auth && activeWorkspaceTab === "create" && (
          <CreateEventPanel
            categories={categories}
            categoriesState={categoriesState}
            form={createEventForm}
            state={createEventState}
            error={createEventError}
            successMessage={createdEventMessage}
            onFieldChange={updateCreateEventForm}
            onSubmit={handleCreateEventSubmit}
          />
        )}

        {!selectedEventId && eventsState !== "loading" && (
          <div className="empty-panel">
            <h2>Выбери событие</h2>
            <p>Когда события появятся в базе, их можно будет открыть здесь.</p>
          </div>
        )}

        {selectedEventId && detailsState === "loading" && (
          <div className="empty-panel">
            <h2>{selectedSummary?.title ?? "Событие"}</h2>
            <p>Загрузка деталей...</p>
          </div>
        )}

        {selectedEvent && detailsState === "success" && (
          <EventDetailsPanel
            event={selectedEvent}
            isManaged={isSelectedEventManaged}
            isAuthenticated={Boolean(auth)}
            isRegistrationOpen={isRegistrationOpen}
            isCheckInOpen={isCheckInOpen}
            authEmail={auth?.email ?? null}
            formatDate={formatDate}
            formatPrice={formatPrice}
            categories={categories}
            categoriesState={categoriesState}
            isEditEventOpen={isEditEventOpen}
            editEventForm={editEventForm}
            editEventState={editEventState}
            editEventError={editEventError}
            editedEventMessage={editedEventMessage}
            eventStatusState={eventStatusState}
            eventStatusError={eventStatusError}
            eventStatusMessage={eventStatusMessage}
            eventSettingsForm={eventSettingsForm}
            eventSettingsState={eventSettingsState}
            eventSettingsError={eventSettingsError}
            eventSettingsMessage={eventSettingsMessage}
            createTicketForm={createTicketForm}
            createTicketState={createTicketState}
            createTicketError={createTicketError}
            createdTicketMessage={createdTicketMessage}
            isCreateTicketOpen={isCreateTicketOpen}
            registrationForm={registrationForm}
            registrationState={registrationState}
            registrationError={registrationError}
            registrationResult={registrationResult}
            registrations={registrations}
            registrationsState={registrationsState}
            registrationsError={registrationsError}
            checkInCode={checkInCode}
            checkInState={checkInState}
            checkInError={checkInError}
            checkInResult={checkInResult}
            onEditEventOpenChange={setIsEditEventOpen}
            onEventStatusAction={handleEventStatusAction}
            onEventSettingsFieldChange={updateEventSettingsForm}
            onEventSettingsSubmit={handleEventSettingsSubmit}
            onEditEventFieldChange={updateEditEventForm}
            onEditEventSubmit={handleEditEventSubmit}
            onCreateTicketOpenChange={setIsCreateTicketOpen}
            onCreateTicketFieldChange={updateCreateTicketForm}
            onCreateTicketSubmit={handleCreateTicketSubmit}
            onRegistrationFieldChange={updateRegistrationForm}
            onRegistrationSubmit={handleRegistrationSubmit}
            onCheckInCodeChange={updateCheckInCode}
            onCheckInSubmit={handleCheckInSubmit}
            onRegistrationCheckIn={submitCheckIn}
          />
        )}
      </section>
    </main>
  );
}
