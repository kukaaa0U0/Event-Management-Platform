export type EventSummary = {
  id: string;
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
  categoryId: string;
  venueName: string | null;
  updatedAtUtc: string;
  calendarSequence: number;
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

export type CreateTicketRequest = {
  name: string;
  type: string;
  priceAmount: number;
  priceCurrency: string;
  capacity: number;
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers
    },
    ...options
  });
  const responseText = await response.text();
  const responseBody = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    const message =
      responseBody && typeof responseBody === "object" && "message" in responseBody
        ? String(responseBody.message)
        : `API request failed with status ${response.status}`;

    throw new Error(message);
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

export function registerForEvent(
  eventId: string,
  payload: RegisterForEventRequest
): Promise<Registration> {
  return request<Registration>(`/events/${eventId}/registrations`, {
    method: "POST",
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
