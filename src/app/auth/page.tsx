"use client";

import {
  Suspense,
  type FormEvent,
  useState,
} from "react";

import {
  AtSign,
  Eye,
  EyeOff,
  Film,
  Gamepad2,
  Library,
  UserRound,
} from "lucide-react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "register";

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-frost-bg" />
      }
    >
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [supabase] = useState(() => createClient());

  const mode: AuthMode =
    searchParams.get("mode") === "register"
      ? "register"
      : "login";

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function changeMode(newMode: AuthMode) {
    setErrorMessage("");
    setSuccessMessage("");
    setPassword("");
    setConfirmPassword("");

    router.replace(`/auth?mode=${newMode}`, {
      scroll: false,
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const cleanEmail = email.trim();
    const cleanDisplayName = displayName.trim();
    const cleanUsername = username.trim();

    setErrorMessage("");
    setSuccessMessage("");

    /*
     * REGISTER VALIDATION
     */

    if (mode === "register") {
      if (cleanDisplayName.length < 2) {
        setErrorMessage(
          "El nick debe tener al menos 2 caracteres.",
        );
        return;
      }

      if (cleanDisplayName.length > 40) {
        setErrorMessage(
          "El nick no puede superar los 40 caracteres.",
        );
        return;
      }

      if (!/^[A-Za-z0-9_]{3,20}$/.test(cleanUsername)) {
        setErrorMessage(
          "El @ debe tener entre 3 y 20 caracteres y usar solo letras, números o guion bajo.",
        );
        return;
      }
    }

    /*
     * COMMON VALIDATION
     */

    if (!cleanEmail) {
      setErrorMessage(
        "Introduce tu correo electrónico.",
      );
      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        "La contraseña debe tener al menos 6 caracteres.",
      );
      return;
    }

    if (
      mode === "register" &&
      password !== confirmPassword
    ) {
      setErrorMessage(
        "Las contraseñas no coinciden.",
      );
      return;
    }

    setLoading(true);

    /*
     * LOGIN
     */

    if (mode === "login") {
      const { error } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      router.replace("/");
      router.refresh();
      return;
    }

    /*
     * USERNAME AVAILABILITY
     */

    const {
      data: usernameAvailable,
      error: usernameCheckError,
    } = await supabase.rpc(
      "is_username_available",
      {
        candidate: cleanUsername,
      },
    );

    if (usernameCheckError) {
      setErrorMessage(
        "No se pudo comprobar la disponibilidad del @.",
      );
      setLoading(false);
      return;
    }

    if (!usernameAvailable) {
      setErrorMessage(
        `@${cleanUsername} ya está en uso.`,
      );
      setLoading(false);
      return;
    }

    /*
     * REGISTER
     */

    const { data, error } =
      await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: cleanDisplayName,
            username: cleanUsername,
          },
        },
      });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    /*
     * EMAIL CONFIRMATION DISABLED
     */

    if (data.session) {
      router.replace("/");
      router.refresh();
      return;
    }

    /*
     * EMAIL CONFIRMATION ENABLED
     */

    setSuccessMessage(
      "Cuenta creada. Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.",
    );

    setPassword("");
    setConfirmPassword("");
    setLoading(false);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* BRAND */}

      <section className="relative hidden overflow-hidden border-r border-frost-border bg-frost-bg lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-frost-accent/10 blur-3xl" />

        <div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-frost-accent/10 blur-3xl" />

        <div className="relative">
          <h1 className="text-2xl font-bold text-frost-accent">
            FROSTIQ
          </h1>
        </div>

        <div className="relative max-w-lg">
          <h2 className="text-5xl font-bold leading-tight tracking-tight text-frost-text">
            Todo lo que ves, lees y juegas.
            <span className="text-frost-accent">
              {" "}En un solo lugar.
            </span>
          </h2>

          <p className="mt-6 max-w-md text-lg leading-8 text-frost-muted">
            Lleva el control de tus películas, series,
            libros y videojuegos, comparte tu actividad
            y descubre qué están disfrutando tus amigos.
          </p>

          <div className="mt-10 flex gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-frost-border bg-frost-surface text-frost-accent">
              <Film size={22} />
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-frost-border bg-frost-surface text-frost-accent">
              <Library size={22} />
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-frost-border bg-frost-surface text-frost-accent">
              <Gamepad2 size={22} />
            </div>
          </div>
        </div>

        <p className="relative text-sm text-frost-muted">
          FROSTIQ
        </p>
      </section>

      {/* AUTH */}

      <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          {/* MOBILE BRAND */}

          <div className="mb-10 lg:hidden">
            <h1 className="text-xl font-bold text-frost-accent">
              FROSTIQ
            </h1>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight text-frost-text">
              {mode === "login"
                ? "Bienvenido de nuevo"
                : "Crea tu cuenta"}
            </h2>

            <p className="mt-2 text-frost-muted">
              {mode === "login"
                ? "Inicia sesión para continuar con tu biblioteca."
                : "Elige cómo quieres aparecer en FROSTIQ."}
            </p>
          </div>

          {/* MODE */}

          <div className="mt-8 grid grid-cols-2 rounded-xl border border-frost-border bg-frost-surface/50 p-1">
            <button
              type="button"
              onClick={() => changeMode("login")}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                mode === "login"
                  ? "bg-frost-raised text-frost-text"
                  : "text-frost-muted hover:text-frost-text"
              }`}
            >
              Iniciar sesión
            </button>

            <button
              type="button"
              onClick={() => changeMode("register")}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                mode === "register"
                  ? "bg-frost-raised text-frost-text"
                  : "text-frost-muted hover:text-frost-text"
              }`}
            >
              Registrarse
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            {/* REGISTER PROFILE */}

            {mode === "register" && (
              <>
                {/* NICK */}

                <div>
                  <label
                    htmlFor="display-name"
                    className="mb-2 block text-sm font-medium text-frost-text"
                  >
                    Nick
                  </label>

                  <div className="relative">
                    <UserRound
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-frost-muted"
                    />

                    <input
                      id="display-name"
                      type="text"
                      value={displayName}
                      onChange={(event) =>
                        setDisplayName(event.target.value)
                      }
                      minLength={2}
                      maxLength={40}
                      required
                      placeholder="Heather"
                      className="w-full rounded-xl border border-frost-border bg-frost-surface py-3 pl-11 pr-4 text-frost-text outline-none transition-colors placeholder:text-frost-muted focus:border-frost-accent"
                    />
                  </div>

                  <p className="mt-2 text-xs text-frost-muted">
                    Este será el nombre que verán los demás.
                  </p>
                </div>

                {/* USERNAME */}

                <div>
                  <label
                    htmlFor="username"
                    className="mb-2 block text-sm font-medium text-frost-text"
                  >
                    @ de usuario
                  </label>

                  <div className="relative">
                    <AtSign
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-frost-muted"
                    />

                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(event) =>
                        setUsername(event.target.value)
                      }
                      minLength={3}
                      maxLength={20}
                      pattern="[A-Za-z0-9_]{3,20}"
                      required
                      placeholder="Heather04"
                      className="w-full rounded-xl border border-frost-border bg-frost-surface py-3 pl-11 pr-4 text-frost-text outline-none transition-colors placeholder:text-frost-muted focus:border-frost-accent"
                    />
                  </div>

                  <p className="mt-2 text-xs text-frost-muted">
                    Único. De 3 a 20 caracteres, usando letras, números o _.
                  </p>
                </div>
              </>
            )}

            {/* EMAIL */}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-frost-text"
              >
                Correo electrónico
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
                placeholder="tu@correo.com"
                className="w-full rounded-xl border border-frost-border bg-frost-surface px-4 py-3 text-frost-text outline-none transition-colors placeholder:text-frost-muted focus:border-frost-accent"
              />
            </div>

            {/* PASSWORD */}

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-frost-text"
              >
                Contraseña
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete={
                    mode === "login"
                      ? "current-password"
                      : "new-password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  minLength={6}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-frost-border bg-frost-surface px-4 py-3 pr-12 text-frost-text outline-none transition-colors placeholder:text-frost-muted focus:border-frost-accent"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current,
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-frost-muted transition-colors hover:text-frost-text"
                  aria-label={
                    showPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* CONFIRM */}

            {mode === "register" && (
              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-sm font-medium text-frost-text"
                >
                  Confirmar contraseña
                </label>

                <input
                  id="confirm-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value,
                    )
                  }
                  minLength={6}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-frost-border bg-frost-surface px-4 py-3 text-frost-text outline-none transition-colors placeholder:text-frost-muted focus:border-frost-accent"
                />
              </div>
            )}

            {/* ERROR */}

            {errorMessage && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {errorMessage}
              </div>
            )}

            {/* SUCCESS */}

            {successMessage && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-300">
                {successMessage}
              </div>
            )}

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-frost-accent px-4 py-3 font-semibold text-frost-bg transition-colors hover:bg-frost-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Procesando..."
                : mode === "login"
                  ? "Iniciar sesión"
                  : "Crear cuenta"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-frost-muted">
            {mode === "login"
              ? "¿Todavía no tienes una cuenta?"
              : "¿Ya tienes una cuenta?"}

            {" "}

            <button
              type="button"
              onClick={() =>
                changeMode(
                  mode === "login"
                    ? "register"
                    : "login",
                )
              }
              className="font-medium text-frost-accent transition-colors hover:text-frost-text"
            >
              {mode === "login"
                ? "Regístrate"
                : "Inicia sesión"}
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}