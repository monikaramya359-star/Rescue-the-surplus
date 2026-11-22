import { AlertCircle, AlertTriangle, Clock } from "lucide-react";
import { getDeadlineState } from "../../context/ReceiverContext.jsx";
import { formatDateTime } from "../../lib/formatters.js";
function DeadlineWarning({ deadline, now }) {
  const { state, minutesLeft } = getDeadlineState(deadline, now);
  if (state === "expired") {
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        role: "status",
        className: "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm bg-red-50 text-red-700 border-red-200"
      },
      /* @__PURE__ */ React.createElement(AlertCircle, { className: "h-4 w-4", "aria-hidden": "true" }),
      /* @__PURE__ */ React.createElement("span", null, "Pickup deadline passed")
    );
  }
  if (state === "closing") {
    const remaining = minutesLeft < 60 ? `${minutesLeft} min left` : `${Math.floor(minutesLeft / 60)} h ${minutesLeft % 60} min left`;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        role: "status",
        className: "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm bg-amber-50 text-amber-800 border-amber-200"
      },
      /* @__PURE__ */ React.createElement(AlertTriangle, { className: "h-4 w-4", "aria-hidden": "true" }),
      /* @__PURE__ */ React.createElement("span", null, "Closing soon: about ", remaining)
    );
  }
  return /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm text-stone-600 border-stone-200 bg-white" }, /* @__PURE__ */ React.createElement(Clock, { className: "h-4 w-4", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("span", null, "Pickup by ", formatDateTime(deadline)));
}
export {
  DeadlineWarning as default
};
