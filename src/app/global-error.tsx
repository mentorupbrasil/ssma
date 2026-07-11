"use client";

import { useEffect } from "react";

/** Único lugar que pode (e deve) renderizar html/body — substitui o root layout. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
          padding: "1rem",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "28rem",
            borderRadius: "1rem",
            border: "1px solid #e2e8f0",
            background: "#fff",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "1.25rem", color: "#0e142b" }}>
            Algo deu errado
          </h1>
          <p style={{ margin: "0.75rem 0 0", fontSize: "0.875rem", color: "#64748b", lineHeight: 1.5 }}>
            Ocorreu um erro inesperado no sistema. Tente novamente.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: "1.5rem",
              border: 0,
              borderRadius: "0.5rem",
              background: "#0e142b",
              color: "#fff",
              padding: "0.6rem 1.1rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
