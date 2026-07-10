const eventStatusLabels: Record<string, string> = {
  Draft: "Черновик",
  Published: "Опубликовано",
  Ongoing: "Идет",
  Completed: "Завершено",
  Cancelled: "Отменено"
};

const eventStatusClassSuffixes: Record<string, string> = {
  Draft: "draft",
  Published: "published",
  Ongoing: "ongoing",
  Completed: "completed",
  Cancelled: "cancelled"
};

const registrationStatusLabels: Record<string, string> = {
  Confirmed: "Подтверждена",
  CheckedIn: "Отмечен",
  Cancelled: "Отменена"
};

const registrationStatusClassSuffixes: Record<string, string> = {
  Confirmed: "confirmed",
  CheckedIn: "checked-in",
  Cancelled: "cancelled"
};

export function formatEventStatus(status: string) {
  return eventStatusLabels[status] ?? status;
}

export function getEventStatusPillClassName(status: string, extraClassName = "") {
  const suffix = eventStatusClassSuffixes[status] ?? "default";

  return ["status-pill", `status-${suffix}`, extraClassName].filter(Boolean).join(" ");
}

export function formatRegistrationStatus(status: string) {
  return registrationStatusLabels[status] ?? status;
}

export function getRegistrationStatusClassName(status: string, extraClassName = "") {
  const suffix = registrationStatusClassSuffixes[status] ?? "default";

  return ["registration-status-pill", `registration-status-${suffix}`, extraClassName].filter(Boolean).join(" ");
}
