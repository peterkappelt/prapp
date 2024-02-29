import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { Notifications } from "@mantine/notifications";
import "@mantine/notifications/styles.css";
import "@mantine/tiptap/styles.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { ApiContext } from "./Api.tsx";
import App from "./App.tsx";
import { AuthContext } from "./firebase/auth.tsx";
import { theme } from "./theme.ts";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <ApiContext>
        <AuthContext>
          <Notifications />
          <App />
        </AuthContext>
      </ApiContext>
    </MantineProvider>
  </React.StrictMode>
);
