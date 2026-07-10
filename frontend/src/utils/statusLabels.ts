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

export function formatEventStatus(status: string) {
  return eventStatusLabels[status] ?? status;
}

export function getEventStatusPillClassName(status: string, extraClassName = "") {
  const suffix = eventStatusClassSuffixes[status] ?? "default";

  return ["status-pill", `status-${suffix}`, extraClassName].filter(Boolean).join(" ");
}
