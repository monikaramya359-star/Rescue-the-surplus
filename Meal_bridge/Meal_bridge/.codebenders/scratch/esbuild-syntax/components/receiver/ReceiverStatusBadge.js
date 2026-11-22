const statusStyles = {
  Available: "bg-primary-50 text-primary-700 ring-1 ring-primary-200",
  Claimed: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  Collected: "bg-sky-50 text-sky-800 ring-1 ring-sky-200",
  Delivered: "bg-primary-600 text-white",
  Expired: "bg-red-50 text-red-700 ring-1 ring-red-200"
};
function ReceiverStatusBadge({ status }) {
  const style = statusStyles[status] ?? statusStyles.Available;
  return /* @__PURE__ */ React.createElement(
    "span",
    {
      className: `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${style}`
    },
    /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true", className: "h-1.5 w-1.5 rounded-full bg-current" }),
    status
  );
}
export {
  ReceiverStatusBadge as default
};
