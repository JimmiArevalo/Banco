import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { registerClient } from "../services/api";

export function RegisterPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const mutation = useMutation({
    mutationFn: () => registerClient(form),
  });

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [evt.target.name]: evt.target.value }));
  };

  const onSubmit = (evt: React.FormEvent) => {
    evt.preventDefault();
    mutation.mutate();
  };

  const successData = mutation.data;

  return (
    <>
      <form onSubmit={onSubmit} className="form">
        <label>
          Nombre completo
          <input
            name="fullName"
            required
            value={form.fullName}
            onChange={handleChange}
            placeholder="Ana Gómez"
          />
        </label>
        <label>
          Correo
          <input
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="ana@correo.com"
          />
        </label>
        <label>
          Contraseña
          <input
            name="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={handleChange}
          />
        </label>
        <button type="submit" disabled={mutation.isLoading}>
          {mutation.isLoading ? "Creando..." : "Crear cliente"}
        </button>
        {mutation.isError && (
          <p className="error">
            {(mutation.error as Error).message || "Error al crear el cliente"}
          </p>
        )}
      </form>

      {successData && (
        <div className="totp-section">
          <h2>Configura tu 2FA</h2>
          <p>
            Escanea el QR con Google Authenticator o agrega manualmente el
            código para activar el segundo factor.
          </p>
          {successData.totp.otpauthUrl && (
            <QRCodeCanvas value={successData.totp.otpauthUrl} size={180} />
          )}
          <p
            style={{
              fontFamily: "monospace",
              letterSpacing: "3px",
              fontSize: "1.1rem",
            }}
          >
            {successData.totp.base32}
          </p>
          <p>
            Ya tienes tu usuario, ahora{" "}
            <Link to="/login">inicia sesión</Link>.
          </p>
        </div>
      )}
    </>
  );
}

