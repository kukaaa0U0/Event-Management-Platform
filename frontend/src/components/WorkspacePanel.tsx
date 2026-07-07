export type WorkspaceTab = "overview" | "create" | "account";

type WorkspacePanelProps = {
  authExists: boolean;
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
};

export function WorkspacePanel({ authExists, activeTab, onTabChange }: WorkspacePanelProps) {
  return (
    <section className="workspace-panel" aria-label="Рабочая область">
      <div>
        <p className="eyebrow">Workspace</p>
        <h2>{authExists ? "Панель управления" : "Вход в систему"}</h2>
      </div>
      <div className="workspace-tabs" role="tablist" aria-label="Разделы рабочей области">
        <button
          className={activeTab === "overview" ? "workspace-tab active" : "workspace-tab"}
          type="button"
          onClick={() => onTabChange("overview")}
          disabled={!authExists}
        >
          Обзор
        </button>
        <button
          className={activeTab === "create" ? "workspace-tab active" : "workspace-tab"}
          type="button"
          onClick={() => onTabChange("create")}
          disabled={!authExists}
        >
          Создать
        </button>
        <button
          className={activeTab === "account" ? "workspace-tab active" : "workspace-tab"}
          type="button"
          onClick={() => onTabChange("account")}
        >
          Аккаунт
        </button>
      </div>
    </section>
  );
}
