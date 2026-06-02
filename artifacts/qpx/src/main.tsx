import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

window.addEventListener(
  "unhandledrejection",
  (event) => {
    const err = event.reason;
    const expectedStatus =
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err.status === 404 || err.status === 401 || err.status === 403);
    if (expectedStatus) {
      event.preventDefault();
    }
  },
  true,
);

createRoot(document.getElementById("root")!).render(<App />);
