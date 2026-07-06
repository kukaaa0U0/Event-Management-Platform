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
  getEventCalendarUrl,
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
import { MyRegistrationsPanel } from "./components/MyRegistrationsPanel";
import { OrganizerDashboardPanel } from "./components/OrganizerDashboardPanel";

type LoadState = "idle" | "loading" | "success" | "error";
type AuthMode = "login" | "register";
type EventScope = "all" | "mine";

type RegistrationFormState = {
  fullName: string;
  email: string;
  ticketId: string;
};

type AuthFormState = {
  fullName: string;
  email: string;
  password: string;
};

type CreateEventFormState = {
  categoryId: string;
  title: string;
  description: string;
  city: string;
  address: string;
  venueName: string;
  startsAtLocal: string;
  endsAtLocal: string;
};

type CreateTicketFormState = {
  name: string;
  type: string;
  priceAmount: string;
  priceCurrency: string;
  capacity: string;
};

type EventSettingsFormState = {
  registrationEnabled: boolean;
  checkInEnabled: boolean;
};

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
  const [eventScope, setEventScope] = useState<EventScope>("all");
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
    setEditEventError(null);
    setEditedEventMessage(null);
    setEditEventState("idle");
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

  function saveAuth(response: AuthResponse) {
    localStorage.setItem(authStorageKey, JSON.stringify(response));
    setAuth(response);
    setAuthForm(emptyAuthForm);
    setAuthState("success");
  }

  function logout() {
    localStorage.removeItem(authStorageKey);
    setAuth(null);
    setEventScope("all");
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
      setCreateEventForm({
        ...createDefaultEventForm(),
        categoryId: createEventForm.categoryId
      });
      setCreatedEventMessage("Событие создано в статусе Draft.");
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
              onClick={() => setEventScope("all")}
            >
              Все
            </button>
            <button
              className={eventScope === "mine" ? "event-scope-tab active" : "event-scope-tab"}
              type="button"
              onClick={() => setEventScope("mine")}
            >
              Мои
            </button>
          </div>
        )}

        {eventsState === "loading" && <div className="state-message">Загрузка событий...</div>}

        {eventsState === "error" && (
          <div className="state-message state-message-error">
            API недоступен. Проверь, что Docker Compose запущен.
          </div>
        )}

        {eventsState === "success" && events.length === 0 && (
          <div className="state-message">
            {eventScope === "mine" ? "У тебя пока нет своих событий." : "Пока нет событий."}
          </div>
        )}

        <div className="event-list">
          {events.map((eventItem) => (
            <button
              className={eventItem.id === selectedEventId ? "event-list-item active" : "event-list-item"}
              key={eventItem.id}
              type="button"
              onClick={() => setSelectedEventId(eventItem.id)}
            >
              <span className="event-list-title">{eventItem.title}</span>
              <span className="event-list-meta">
                {eventItem.city} · {formatDate(eventItem.startsAtUtc)}
              </span>
              <span className="status-pill">{eventItem.status}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="content" aria-label="Детали события">
        {errorMessage && <div className="top-alert">{errorMessage}</div>}

        <section className="auth-panel" aria-label="Вход организатора">
          {auth ? (
            <div className="auth-summary">
              <div>
                <span>Организатор</span>
                <strong>{auth.fullName}</strong>
                <p>{auth.email}</p>
              </div>
              <button className="secondary-button" type="button" onClick={logout}>
                Выйти
              </button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleAuthSubmit}>
              <div className="auth-tabs" role="tablist" aria-label="Режим входа">
                <button
                  className={authMode === "login" ? "auth-tab active" : "auth-tab"}
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError(null);
                  }}
                >
                  Вход
                </button>
                <button
                  className={authMode === "register" ? "auth-tab active" : "auth-tab"}
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setAuthError(null);
                  }}
                >
                  Регистрация
                </button>
              </div>

              <div className="auth-fields">
                {authMode === "register" && (
                  <label>
                    <span>Имя</span>
                    <input
                      value={authForm.fullName}
                      onChange={(event) => updateAuthForm("fullName", event.target.value)}
                      placeholder="Имя организатора"
                      disabled={authState === "loading"}
                    />
                  </label>
                )}

                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(event) => updateAuthForm("email", event.target.value)}
                    placeholder="organizer@example.com"
                    disabled={authState === "loading"}
                  />
                </label>

                <label>
                  <span>Пароль</span>
                  <input
                    type="password"
                    value={authForm.password}
                    onChange={(event) => updateAuthForm("password", event.target.value)}
                    placeholder="Минимум 8 символов"
                    disabled={authState === "loading"}
                  />
                </label>

                <button className="secondary-button" type="submit" disabled={authState === "loading"}>
                  {authState === "loading"
                    ? "Проверяем..."
                    : authMode === "login"
                      ? "Войти"
                      : "Создать аккаунт"}
                </button>
              </div>

              {authError && <div className="form-alert error">{authError}</div>}
            </form>
          )}
        </section>

        {auth && (
          <MyRegistrationsPanel
            registrations={myRegistrations}
            state={myRegistrationsState}
            error={myRegistrationsError}
            formatDate={formatDate}
            onSelectEvent={setSelectedEventId}
          />
        )}

        {auth && (
          <OrganizerDashboardPanel
            events={dashboardEvents}
            state={dashboardState}
            error={dashboardError}
            formatDate={formatDate}
            onSelectEvent={setSelectedEventId}
          />
        )}

        {auth && (
          <section className="create-event-panel" aria-label="Создание события">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Organizer</p>
                <h3>Создать событие</h3>
              </div>
            </div>

            <form className="create-event-form" onSubmit={handleCreateEventSubmit}>
              <label>
                <span>Категория</span>
                <select
                  value={createEventForm.categoryId}
                  onChange={(event) => updateCreateEventForm("categoryId", event.target.value)}
                  disabled={categoriesState === "loading" || createEventState === "loading"}
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
                  value={createEventForm.title}
                  onChange={(event) => updateCreateEventForm("title", event.target.value)}
                  placeholder="Например, День карьеры"
                  disabled={createEventState === "loading"}
                />
              </label>

              <label className="wide-field">
                <span>Описание</span>
                <textarea
                  value={createEventForm.description}
                  onChange={(event) => updateCreateEventForm("description", event.target.value)}
                  placeholder="Кратко опиши, для кого событие и что там будет"
                  disabled={createEventState === "loading"}
                />
              </label>

              <label>
                <span>Город</span>
                <input
                  value={createEventForm.city}
                  onChange={(event) => updateCreateEventForm("city", event.target.value)}
                  placeholder="Москва"
                  disabled={createEventState === "loading"}
                />
              </label>

              <label>
                <span>Адрес</span>
                <input
                  value={createEventForm.address}
                  onChange={(event) => updateCreateEventForm("address", event.target.value)}
                  placeholder="ул. Примерная, 1"
                  disabled={createEventState === "loading"}
                />
              </label>

              <label>
                <span>Площадка</span>
                <input
                  value={createEventForm.venueName}
                  onChange={(event) => updateCreateEventForm("venueName", event.target.value)}
                  placeholder="Корпус А, аудитория 101"
                  disabled={createEventState === "loading"}
                />
              </label>

              <label>
                <span>Начало</span>
                <input
                  type="datetime-local"
                  value={createEventForm.startsAtLocal}
                  onChange={(event) => updateCreateEventForm("startsAtLocal", event.target.value)}
                  disabled={createEventState === "loading"}
                />
              </label>

              <label>
                <span>Окончание</span>
                <input
                  type="datetime-local"
                  value={createEventForm.endsAtLocal}
                  onChange={(event) => updateCreateEventForm("endsAtLocal", event.target.value)}
                  disabled={createEventState === "loading"}
                />
              </label>

              <div className="create-event-actions">
                <button
                  className="primary-button"
                  type="submit"
                  disabled={
                    createEventState === "loading" ||
                    categoriesState === "loading" ||
                    categories.length === 0
                  }
                >
                  {createEventState === "loading" ? "Создаем..." : "Создать событие"}
                </button>
              </div>
            </form>

            {categoriesState === "error" && (
              <div className="form-alert error">Не удалось загрузить категории для формы.</div>
            )}
            {createEventError && <div className="form-alert error">{createEventError}</div>}
            {createdEventMessage && <div className="form-alert success">{createdEventMessage}</div>}
          </section>
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
          <article className="event-details">
            <div className="details-header">
              <div>
                <p className="eyebrow">{selectedEvent.city}</p>
                <h2>{selectedEvent.title}</h2>
              </div>
              <div className="details-actions">
                <span className="status-pill large">{selectedEvent.status}</span>
                <a className="secondary-button calendar-button" href={getEventCalendarUrl(selectedEvent.id)} download>
                  Скачать .ics
                </a>
              </div>
            </div>

            <p className="description">{selectedEvent.description}</p>

            <div className="details-grid">
              <div className="info-block">
                <span>Начало</span>
                <strong>{formatDate(selectedEvent.startsAtUtc)}</strong>
              </div>
              <div className="info-block">
                <span>Окончание</span>
                <strong>{formatDate(selectedEvent.endsAtUtc)}</strong>
              </div>
              <div className="info-block">
                <span>Адрес</span>
                <strong>{selectedEvent.address}</strong>
              </div>
              <div className="info-block">
                <span>Площадка</span>
                <strong>{selectedEvent.venueName ?? "Не указана"}</strong>
              </div>
            </div>

            {isSelectedEventManaged && (
              <section className="event-management-panel" aria-label="Управление статусом события">
                <div className="section-heading compact">
                  <h3>Управление событием</h3>
                  <span>{selectedEvent.status}</span>
                </div>

                <div className="event-management-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={selectedEvent.status !== "Draft" || eventStatusState === "loading"}
                    onClick={() => handleEventStatusAction("publish")}
                  >
                    {eventStatusState === "loading" ? "Обновляем..." : "Опубликовать"}
                  </button>
                  <button
                    className="danger-button"
                    type="button"
                    disabled={
                      selectedEvent.status === "Cancelled" ||
                      selectedEvent.status === "Completed" ||
                      eventStatusState === "loading"
                    }
                    onClick={() => handleEventStatusAction("cancel")}
                  >
                    Отменить
                  </button>
                </div>

                <form className="event-settings-form" onSubmit={handleEventSettingsSubmit}>
                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={eventSettingsForm.registrationEnabled}
                      onChange={(event) => updateEventSettingsForm("registrationEnabled", event.target.checked)}
                      disabled={eventSettingsState === "loading" || selectedEvent.status === "Cancelled"}
                    />
                    <span>Регистрация включена</span>
                  </label>

                  <label className="setting-toggle">
                    <input
                      type="checkbox"
                      checked={eventSettingsForm.checkInEnabled}
                      onChange={(event) => updateEventSettingsForm("checkInEnabled", event.target.checked)}
                      disabled={eventSettingsState === "loading" || selectedEvent.status === "Cancelled"}
                    />
                    <span>Check-in включен</span>
                  </label>

                  <button
                    className="secondary-button"
                    type="submit"
                    disabled={eventSettingsState === "loading" || selectedEvent.status === "Cancelled"}
                  >
                    {eventSettingsState === "loading" ? "Сохраняем..." : "Сохранить режимы"}
                  </button>
                </form>

                {eventStatusError && <div className="form-alert error">{eventStatusError}</div>}
                {eventStatusMessage && <div className="form-alert success">{eventStatusMessage}</div>}
                {eventSettingsError && <div className="form-alert error">{eventSettingsError}</div>}
                {eventSettingsMessage && <div className="form-alert success">{eventSettingsMessage}</div>}
              </section>
            )}

            {isSelectedEventManaged && (
              <section className="edit-event-panel" aria-label="Редактирование события">
                <div className="section-heading compact">
                  <h3>Редактировать событие</h3>
                  <span>{selectedEvent.calendarSequence}</span>
                </div>

                <form className="edit-event-form" onSubmit={handleEditEventSubmit}>
                  <label>
                    <span>Категория</span>
                    <select
                      value={editEventForm.categoryId}
                      onChange={(event) => updateEditEventForm("categoryId", event.target.value)}
                      disabled={categoriesState === "loading" || editEventState === "loading"}
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
                      value={editEventForm.title}
                      onChange={(event) => updateEditEventForm("title", event.target.value)}
                      disabled={editEventState === "loading"}
                    />
                  </label>

                  <label className="wide-field">
                    <span>Описание</span>
                    <textarea
                      value={editEventForm.description}
                      onChange={(event) => updateEditEventForm("description", event.target.value)}
                      disabled={editEventState === "loading"}
                    />
                  </label>

                  <label>
                    <span>Город</span>
                    <input
                      value={editEventForm.city}
                      onChange={(event) => updateEditEventForm("city", event.target.value)}
                      disabled={editEventState === "loading"}
                    />
                  </label>

                  <label>
                    <span>Адрес</span>
                    <input
                      value={editEventForm.address}
                      onChange={(event) => updateEditEventForm("address", event.target.value)}
                      disabled={editEventState === "loading"}
                    />
                  </label>

                  <label>
                    <span>Площадка</span>
                    <input
                      value={editEventForm.venueName}
                      onChange={(event) => updateEditEventForm("venueName", event.target.value)}
                      disabled={editEventState === "loading"}
                    />
                  </label>

                  <label>
                    <span>Начало</span>
                    <input
                      type="datetime-local"
                      value={editEventForm.startsAtLocal}
                      onChange={(event) => updateEditEventForm("startsAtLocal", event.target.value)}
                      disabled={editEventState === "loading"}
                    />
                  </label>

                  <label>
                    <span>Окончание</span>
                    <input
                      type="datetime-local"
                      value={editEventForm.endsAtLocal}
                      onChange={(event) => updateEditEventForm("endsAtLocal", event.target.value)}
                      disabled={editEventState === "loading"}
                    />
                  </label>

                  <button
                    className="secondary-button"
                    type="submit"
                    disabled={editEventState === "loading" || categoriesState === "loading"}
                  >
                    {editEventState === "loading" ? "Сохраняем..." : "Сохранить изменения"}
                  </button>
                </form>

                {editEventError && <div className="form-alert error">{editEventError}</div>}
                {editedEventMessage && <div className="form-alert success">{editedEventMessage}</div>}
              </section>
            )}

            <div className="event-action-grid">
              <section className="tickets-section">
                <div className="section-heading">
                  <h3>Билеты</h3>
                  <span>{selectedEvent.tickets.length}</span>
                </div>

                <div className="ticket-list">
                  {selectedEvent.tickets.map((ticket) => (
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
                  {selectedEvent.tickets.length === 0 && (
                    <div className="panel-message inside-list">Билеты для этого события пока не созданы.</div>
                  )}
                </div>

                {isSelectedEventManaged && (
                  <form className="ticket-form" onSubmit={handleCreateTicketSubmit}>
                    <div className="section-heading compact">
                      <h3>Добавить билет</h3>
                    </div>

                    <label className="wide-field">
                      <span>Название</span>
                      <input
                        value={createTicketForm.name}
                        onChange={(event) => updateCreateTicketForm("name", event.target.value)}
                        placeholder="Regular"
                        disabled={createTicketState === "loading"}
                      />
                    </label>

                    <label>
                      <span>Тип</span>
                      <select
                        value={createTicketForm.type}
                        onChange={(event) => updateCreateTicketForm("type", event.target.value)}
                        disabled={createTicketState === "loading"}
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
                        value={createTicketForm.priceAmount}
                        onChange={(event) => updateCreateTicketForm("priceAmount", event.target.value)}
                        disabled={createTicketState === "loading"}
                      />
                    </label>

                    <label>
                      <span>Валюта</span>
                      <input
                        value={createTicketForm.priceCurrency}
                        onChange={(event) => updateCreateTicketForm("priceCurrency", event.target.value)}
                        maxLength={3}
                        disabled={createTicketState === "loading"}
                      />
                    </label>

                    <label>
                      <span>Мест</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={createTicketForm.capacity}
                        onChange={(event) => updateCreateTicketForm("capacity", event.target.value)}
                        disabled={createTicketState === "loading"}
                      />
                    </label>

                    <button className="secondary-button" type="submit" disabled={createTicketState === "loading"}>
                      {createTicketState === "loading" ? "Добавляем..." : "Добавить билет"}
                    </button>

                    {createTicketError && <div className="form-alert error wide-field">{createTicketError}</div>}
                    {createdTicketMessage && <div className="form-alert success wide-field">{createdTicketMessage}</div>}
                  </form>
                )}
              </section>

              <section className="registration-section">
                <div className="section-heading">
                  <h3>Регистрация</h3>
                </div>

                {!isRegistrationOpen && (
                  <div className="panel-message">Регистрация на это событие сейчас закрыта.</div>
                )}

                {auth && isRegistrationOpen && (
                  <div className="panel-message">Регистрация будет привязана к аккаунту {auth.email}.</div>
                )}

                <form className="registration-form" onSubmit={handleRegistrationSubmit}>
                  <label>
                    <span>Билет</span>
                    <select
                      value={registrationForm.ticketId}
                      onChange={(event) => updateRegistrationForm("ticketId", event.target.value)}
                      disabled={!isRegistrationOpen || selectedEvent.tickets.length === 0 || registrationState === "loading"}
                    >
                      {selectedEvent.tickets.map((ticket) => (
                        <option key={ticket.id} value={ticket.id}>
                          {ticket.name} · {formatPrice(ticket.priceAmount, ticket.priceCurrency)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Имя участника</span>
                    <input
                      value={registrationForm.fullName}
                      onChange={(event) => updateRegistrationForm("fullName", event.target.value)}
                      placeholder="Например, Иван Петров"
                      disabled={Boolean(auth) || !isRegistrationOpen || registrationState === "loading"}
                    />
                  </label>

                  <label>
                    <span>Email</span>
                    <input
                      type="email"
                      value={registrationForm.email}
                      onChange={(event) => updateRegistrationForm("email", event.target.value)}
                      placeholder="ivan@example.com"
                      disabled={Boolean(auth) || !isRegistrationOpen || registrationState === "loading"}
                    />
                  </label>

                  {registrationError && <div className="form-alert error">{registrationError}</div>}

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={!isRegistrationOpen || selectedEvent.tickets.length === 0 || registrationState === "loading"}
                  >
                    {registrationState === "loading" ? "Регистрируем..." : "Зарегистрироваться"}
                  </button>
                </form>

                {registrationResult && (
                  <div className="registration-result">
                    <span>Код для входа</span>
                    <strong>{registrationResult.checkInCode}</strong>
                    <p>{registrationResult.participantName} зарегистрирован на событие.</p>
                  </div>
                )}
              </section>
            </div>

            {isSelectedEventManaged ? (
              <section className="registrations-panel">
                <div className="section-heading">
                  <h3>Участники</h3>
                  <span>{registrations.length}</span>
                </div>

                {!isCheckInOpen && (
                  <div className="panel-message">Check-in для этого события сейчас выключен.</div>
                )}

                <form className="check-in-form" onSubmit={handleCheckInSubmit}>
                  <label>
                    <span>Check-in код</span>
                    <input
                      value={checkInCode}
                      onChange={(event) => {
                        setCheckInCode(event.target.value);
                        setCheckInError(null);
                      }}
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
                          <span>{registration.status}</span>
                        </div>
                        <button
                          className="small-button"
                          type="button"
                          disabled={registration.status === "CheckedIn" || checkInState === "loading"}
                          onClick={() => submitCheckIn(registration.checkInCode)}
                        >
                          {registration.status === "CheckedIn" ? "Отмечен" : "Check-in"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ) : auth ? (
              <section className="registrations-panel">
                <div className="section-heading">
                  <h3>Управление событием</h3>
                </div>
                <div className="panel-message">
                  Это событие принадлежит другому организатору. Переключись на вкладку "Мои", чтобы управлять своими событиями.
                </div>
              </section>
            ) : (
              <section className="registrations-panel">
                <div className="section-heading">
                  <h3>Участники</h3>
                </div>
                <div className="panel-message">
                  Войди как организатор события, чтобы видеть участников и выполнять check-in.
                </div>
              </section>
            )}
          </article>
        )}
      </section>
    </main>
  );
}
