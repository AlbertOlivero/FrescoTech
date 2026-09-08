import React from "react";
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
