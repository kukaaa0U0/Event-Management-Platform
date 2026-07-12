export type EventSummary = {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  description: string;
  city: string;
  address: string;
  startsAtUtc: string;
  endsAtUtc: string;
  status: string;
};

export type Category = {
  id: string;
  name: string;
};

export type Ticket = {
  id: string;
  name: string;
  type: string;
  priceAmount: number;
  priceCurrency: string;
  capacity: number;
};

export type EventDetails = EventSummary & {
  venueName: string | null;
  updatedAtUtc: string;
  calendarSequence: number;
  registrationEnabled: boolean;
  checkInEnabled: boolean;
  tickets: Ticket[];
};

export type Registration = {
  id: string;
  eventId: string;
  ticketId: string;
  userId: string;
  participantName: string;
  participantEmail: string;
  status: string;
  checkInCode: string;
  createdAtUtc: string;
  checkedInAtUtc: string | null;
};

export type MyRegistration = {
  id: string;
  eventId: string;
  ticketId: string;
  eventTitle: string;
  city: string;
  startsAtUtc: string;
  endsAtUtc: string;
  eventStatus: string;
  registrationStatus: string;
  checkInCode: string;
  createdAtUtc: string;
  checkedInAtUtc: string | null;
};

export type OrganizerDashboardEvent = {
  eventId: string;
  title: string;
  status: string;
  startsAtUtc: string;
  registrationEnabled: boolean;
  checkInEnabled: boolean;
  ticketCapacity: number;
  registrationsCount: number;
  checkedInCount: number;
};

export type RegisterForEventRequest = {
  ticketId: string;
  fullName: string;
  email: string;
};

export type CheckInRequest = {
  checkInCode: string;
};

export type AuthResponse = {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  accessToken: string;
  expiresAtUtc: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterUserRequest = {
  fullName: string;
  email: string;
  password: string;
  role: string;
};

export type CreateEventRequest = {
  categoryId: string;
  title: string;
  description: string;
  city: string;
  address: string;
  venueName: string | null;
  startsAtUtc: string;
  endsAtUtc: string;
};

export type UpdateEventRequest = CreateEventRequest;

export type UpdateEventSettingsRequest = {
  registrationEnabled: boolean;
  checkInEnabled: boolean;
};

export type CreateTicketRequest = {
  name: string;
  type: string;
  priceAmount: number;
  priceCurrency: string;
  capacity: number;
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

const apiErrorMessages: Record<string, string> = {
  "Email and password are required.": "Укажи email и пароль.",
  "FullName is required.": "Укажи имя.",
  "Email is required.": "Укажи email.",
  "Password is required.": "Укажи пароль.",
  "Password must be at least 8 characters long.": "Пароль должен быть не короче 8 символов.",
  "User with this email is already registered.": "Пользователь с таким email уже зарегистрирован.",
  "Role is required.": "Выбери роль аккаунта.",
  "Role must be Participant or Organizer.": "Можно выбрать только роль участника или организатора.",
  "Only organizers and admins can create events.": "Создавать события могут только организаторы и администраторы.",
  "CategoryId is required.": "Выбери категорию.",
  "Category was not found.": "Категория не найдена.",
  "Title is required.": "Укажи название события.",
  "Description is required.": "Добавь описание события.",
  "City is required.": "Укажи город.",
  "Address is required.": "Укажи адрес.",
  "EndsAtUtc must be later than StartsAtUtc.": "Окончание должно быть позже начала.",
  "Name is required.": "Укажи название.",
  "Type is required.": "Выбери тип.",
  "PriceAmount cannot be negative.": "Цена не может быть отрицательной.",
  "PriceCurrency is required.": "Укажи валюту.",
  "Capacity must be greater than zero.": "Количество мест должно быть больше нуля.",
  "Ticket type is invalid.": "Некорректный тип билета.",
  "TicketId is required.": "Выбери билет.",
  "Event or ticket was not found.": "Событие или билет не найден.",
  "Participant is already registered for this event.": "Участник уже записан на это событие.",
  "Ticket capacity has been reached.": "Места по выбранному билету закончились.",
  "Registration is available only for published events.": "Запись доступна только для опубликованных событий.",
  "Registration is disabled for this event.": "Запись на это событие выключена.",
  "CheckInCode is required.": "Укажи check-in код.",
  "Check-in code was not found.": "Check-in код не найден.",
  "Participant is already checked in.": "Участник уже отмечен.",
  "Check-in is available only for published or ongoing events.": "Check-in доступен только для опубликованных или идущих событий.",
  "Check-in is disabled for this event.": "Check-in для этого события выключен.",
  "Only draft events can be published.": "Опубликовать можно только черновик.",
  "Completed events cannot be cancelled.": "Завершенное событие нельзя отменить."
};

function localizeApiErrorMessage(message: string) {
  return apiErrorMessages[message] ?? message;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { headers, ...requestOptions } = options ?? {};

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });
  const responseText = await response.text();
  const responseBody = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    const message =
      responseBody && typeof responseBody === "object" && "message" in responseBody
        ? String(responseBody.message)
        : response.status === 403
          ? "Недостаточно прав для этого действия."
        : `API request failed with status ${response.status}`;

    throw new Error(localizeApiErrorMessage(message));
  }

  return responseBody as T;
}

export function getEvents(): Promise<EventSummary[]> {
  return request<EventSummary[]>("/events");
}

export function getMyEvents(accessToken: string): Promise<EventSummary[]> {
  return request<EventSummary[]>("/events/my", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function getOrganizerDashboard(accessToken: string): Promise<OrganizerDashboardEvent[]> {
  return request<OrganizerDashboardEvent[]>("/events/dashboard", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function getCategories(): Promise<Category[]> {
  return request<Category[]>("/categories");
}

export function getEventDetails(eventId: string): Promise<EventDetails> {
  return request<EventDetails>(`/events/${eventId}`);
}

export function getEventCalendarUrl(eventId: string): string {
  return `${apiBaseUrl}/events/${eventId}/calendar.ics`;
}

export function createEvent(payload: CreateEventRequest, accessToken: string): Promise<EventDetails> {
  return request<EventDetails>("/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(payload)
  });
}

export function updateEvent(
  eventId: string,
  payload: UpdateEventRequest,
  accessToken: string
): Promise<EventDetails> {
  return request<EventDetails>(`/events/${eventId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(payload)
  });
}

export function publishEvent(eventId: string, accessToken: string): Promise<EventDetails> {
  return request<EventDetails>(`/events/${eventId}/publish`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function cancelEvent(eventId: string, accessToken: string): Promise<EventDetails> {
  return request<EventDetails>(`/events/${eventId}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function updateEventSettings(
  eventId: string,
  payload: UpdateEventSettingsRequest,
  accessToken: string
): Promise<EventDetails> {
  return request<EventDetails>(`/events/${eventId}/settings`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(payload)
  });
}

export function createTicket(
  eventId: string,
  payload: CreateTicketRequest,
  accessToken: string
): Promise<EventDetails> {
  return request<EventDetails>(`/events/${eventId}/tickets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(payload)
  });
}

export function getEventRegistrations(eventId: string, accessToken: string): Promise<Registration[]> {
  return request<Registration[]>(`/events/${eventId}/registrations`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function getMyRegistrations(accessToken: string): Promise<MyRegistration[]> {
  return request<MyRegistration[]>("/registrations/my", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function registerForEvent(
  eventId: string,
  payload: RegisterForEventRequest,
  accessToken?: string
): Promise<Registration> {
  return request<Registration>(`/events/${eventId}/registrations`, {
    method: "POST",
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`
        }
      : undefined,
    body: JSON.stringify(payload)
  });
}

export function checkInParticipant(payload: CheckInRequest, accessToken: string): Promise<Registration> {
  return request<Registration>("/check-in", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(payload)
  });
}

export function login(payload: LoginRequest): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function registerUser(payload: RegisterUserRequest): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
