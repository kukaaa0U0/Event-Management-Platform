import { FormEvent } from "react";
import { AuthResponse } from "../api/events";

type LoadState = "idle" | "loading" | "success" | "error";
export type AuthMode = "login" | "register";

export type AuthFormState = {
  fullName: string;
  email: string;
  password: string;
};

type AuthPanelProps = {
  auth: AuthResponse | null;
  mode: AuthMode;
  form: AuthFormState;
  state: LoadState;
  error: string | null;
  onModeChange: (mode: AuthMode) => void;
  onFieldChange: (field: keyof AuthFormState, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onLogout: () => void;
};

export function AuthPanel({
  auth,
  mode,
  form,
  state,
  error,
  onModeChange,
  onFieldChange,
  onSubmit,
  onLogout
}: AuthPanelProps) {
  return (
    <section className="auth-panel" aria-label="Вход организатора">
      {auth ? (
        <div className="auth-summary">
          <div>
            <span>Организатор</span>
            <strong>{auth.fullName}</strong>
            <p>{auth.email}</p>
          </div>
          <button className="secondary-button" type="button" onClick={onLogout}>
            Выйти
          </button>
        </div>
      ) : (
        <form className="auth-form" onSubmit={onSubmit}>
          <div className="auth-tabs" role="tablist" aria-label="Режим входа">
            <button
              className={mode === "login" ? "auth-tab active" : "auth-tab"}
              type="button"
              onClick={() => onModeChange("login")}
            >
              Вход
            </button>
            <button
              className={mode === "register" ? "auth-tab active" : "auth-tab"}
              type="button"
              onClick={() => onModeChange("register")}
            >
              Регистрация
            </button>
          </div>

          <div className="auth-fields">
            {mode === "register" && (
              <label>
                <span>Имя</span>
                <input
                  value={form.fullName}
                  onChange={(event) => onFieldChange("fullName", event.target.value)}
                  placeholder="Имя организатора"
                  disabled={state === "loading"}
                />
              </label>
            )}

            <label>
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => onFieldChange("email", event.target.value)}
                placeholder="organizer@example.com"
                disabled={state === "loading"}
              />
            </label>

            <label>
              <span>Пароль</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => onFieldChange("password", event.target.value)}
                placeholder="Минимум 8 символов"
                disabled={state === "loading"}
              />
            </label>

            <button className="secondary-button" type="submit" disabled={state === "loading"}>
              {state === "loading"
                ? "Проверяем..."
                : mode === "login"
                  ? "Войти"
                  : "Создать аккаунт"}
            </button>
          </div>

          {error && <div className="form-alert error">{error}</div>}
        </form>
      )}
    </section>
  );
}
