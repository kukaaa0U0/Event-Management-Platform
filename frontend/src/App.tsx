import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AuthResponse,
  Category,
  EventDetails,
  EventSummary,
  Registration,
  checkInParticipant,
  createEvent,
  getCategories,
  getEventDetails,
  getEventRegistrations,
  getEvents,
  login,
  registerForEvent,
  registerUser
} from "./api/events";

type LoadState = "idle" | "loading" | "success" | "error";
type AuthMode = "login" | "register";

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesState, setCategoriesState] = useState<LoadState>("idle");
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
  const [eventsState, setEventsState] = useState<LoadState>("idle");
  const [detailsState, setDetailsState] = useState<LoadState>("idle");
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationsError, setRegistrationsError] = useState<string | null>(null);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    setEventsState("loading");
    getEvents()
      .then((items) => {
        if (!isActive) {
          return;
        }

        setEvents(items);
        setSelectedEventId(items[0]?.id ?? null);
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
  }, []);

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
    if (!selectedEventId) {
      setSelectedEvent(null);
      return;
    }

    let isActive = true;

    setDetailsState("loading");
    setRegistrationsState("loading");
    setRegistrations([]);
    setRegistrationResult(null);
    setRegistrationError(null);
    setRegistrationsError(null);
    setCheckInCode("");
    setCheckInResult(null);
    setCheckInError(null);
    setCheckInState("idle");
    getEventDetails(selectedEventId)
      .then((item) => {
        if (!isActive) {
          return;
        }

        setSelectedEvent(item);
        setRegistrationForm({
          ...emptyRegistrationForm,
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

    if (auth) {
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
    } else {
      setRegistrationsState("idle");
    }

    return () => {
      isActive = false;
    };
  }, [selectedEventId, auth]);

  const selectedSummary = useMemo(
    () => events.find((eventItem) => eventItem.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

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

  function saveAuth(response: AuthResponse) {
    localStorage.setItem(authStorageKey, JSON.stringify(response));
    setAuth(response);
    setAuthForm(emptyAuthForm);
    setAuthState("success");
  }

  function logout() {
    localStorage.removeItem(authStorageKey);
    setAuth(null);
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

      const updatedEvents = await getEvents();

      setEvents(updatedEvents);
      setSelectedEventId(createdEvent.id);
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
    if (!auth) {
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

    if (!registrationForm.ticketId) {
      setRegistrationError("Выбери билет.");
      return;
    }

    if (!registrationForm.fullName.trim()) {
      setRegistrationError("Укажи имя участника.");
      return;
    }

    if (!registrationForm.email.trim()) {
      setRegistrationError("Укажи email участника.");
      return;
    }

    setRegistrationState("loading");
    setRegistrationError(null);
    setRegistrationResult(null);

    try {
      const registration = await registerForEvent(selectedEvent.id, {
        ticketId: registrationForm.ticketId,
        fullName: registrationForm.fullName.trim(),
        email: registrationForm.email.trim()
      });

      setRegistrationResult(registration);
      setRegistrationState("success");
      setRegistrationForm({
        ...emptyRegistrationForm,
        ticketId: selectedEvent.tickets[0]?.id ?? ""
      });
      await refreshRegistrations(selectedEvent.id);
    } catch (error: unknown) {
      setRegistrationError(error instanceof Error ? error.message : "Не удалось зарегистрироваться");
      setRegistrationState("error");
    }
  }

  async function submitCheckIn(code: string) {
    if (!selectedEvent) {
      return;
    }

    if (!auth) {
      setCheckInError("Войди как организатор, чтобы отмечать участников.");
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

        {eventsState === "loading" && <div className="state-message">Загрузка событий...</div>}

        {eventsState === "error" && (
          <div className="state-message state-message-error">
            API недоступен. Проверь, что Docker Compose запущен.
          </div>
        )}

        {eventsState === "success" && events.length === 0 && (
          <div className="state-message">Пока нет событий.</div>
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
              <span className="status-pill large">{selectedEvent.status}</span>
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
              </section>

              <section className="registration-section">
                <div className="section-heading">
                  <h3>Регистрация</h3>
                </div>

                <form className="registration-form" onSubmit={handleRegistrationSubmit}>
                  <label>
                    <span>Билет</span>
                    <select
                      value={registrationForm.ticketId}
                      onChange={(event) => updateRegistrationForm("ticketId", event.target.value)}
                      disabled={selectedEvent.tickets.length === 0 || registrationState === "loading"}
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
                      disabled={registrationState === "loading"}
                    />
                  </label>

                  <label>
                    <span>Email</span>
                    <input
                      type="email"
                      value={registrationForm.email}
                      onChange={(event) => updateRegistrationForm("email", event.target.value)}
                      placeholder="ivan@example.com"
                      disabled={registrationState === "loading"}
                    />
                  </label>

                  {registrationError && <div className="form-alert error">{registrationError}</div>}

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={selectedEvent.tickets.length === 0 || registrationState === "loading"}
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

            {auth ? (
              <section className="registrations-panel">
                <div className="section-heading">
                  <h3>Участники</h3>
                  <span>{registrations.length}</span>
                </div>

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
                      disabled={checkInState === "loading"}
                    />
                  </label>
                  <button className="secondary-button" type="submit" disabled={checkInState === "loading"}>
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
