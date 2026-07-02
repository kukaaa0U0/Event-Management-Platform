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

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getEvents(): Promise<EventSummary[]> {
  return request<EventSummary[]>("/events");
}

export function getEventDetails(eventId: string): Promise<EventDetails> {
  return request<EventDetails>(`/events/${eventId}`);
}
