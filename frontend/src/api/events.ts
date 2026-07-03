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

export function getEventDetails(eventId: string): Promise<EventDetails> {
  return request<EventDetails>(`/events/${eventId}`);
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
