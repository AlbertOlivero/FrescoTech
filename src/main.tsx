import React from "react";

// NEXTER_TITLE_PATCH
if (window.location.pathname.startsWith("/admin")) {
  document.title = "Administración | Nexter Ingeniería";
} else {
  document.title = "Nexter Ingeniería | Climatización, Mantenimiento y Servicio Técnico";
}
import ReactDOM from "react-dom/client";
import App from "./App";
import AdminApp from "@/components/admin/AdminApp";
import { QuoteCartProvider } from "@/context/QuoteCartContext";
import "./index.css";

const isAdminRoute = window.location.pathname.startsWith("/admin");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isAdminRoute ? (
      <AdminApp />
    ) : (
      <QuoteCartProvider>
        <App />
      </QuoteCartProvider>
    )}
  </React.StrictMode>,
);
