import { Package } from "lucide-react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import FoodImage from "../ui/FoodImage.jsx";
import DeadlineWarning from "./DeadlineWarning.jsx";
import ReceiverStatusBadge from "./ReceiverStatusBadge.jsx";
import { formatDateTime, formatQuantity } from "../../lib/formatters.js";
import { useReceiver } from "../../context/ReceiverContext.jsx";
function allergenText(value) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "None listed";
  return value || "None listed";
}
function DonationDetailsModal({ listing, open, onClose, onClaim }) {
  const { now } = useReceiver();
  const canClaim = listing?.status === "Available";
  return /* @__PURE__ */ React.createElement(Modal, { open, title: listing?.foodName || "", onClose }, listing && /* @__PURE__ */ React.createElement("div", { className: "space-y-5" }, /* @__PURE__ */ React.createElement(
    FoodImage,
    {
      src: listing.image,
      alt: listing.foodName,
      className: "aspect-video w-full rounded-2xl"
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "font-semibold text-stone-900" }, listing.donorName), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-stone-500" }, listing.donorType)), /* @__PURE__ */ React.createElement(ReceiverStatusBadge, { status: listing.status })), /* @__PURE__ */ React.createElement("dl", { className: "grid grid-cols-2 gap-3 text-sm" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("dt", { className: "font-semibold text-stone-800" }, "Category"), /* @__PURE__ */ React.createElement("dd", { className: "text-stone-600" }, listing.category)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("dt", { className: "font-semibold text-stone-800" }, "Available"), /* @__PURE__ */ React.createElement("dd", { className: "text-stone-600" }, `${listing.availableQuantity} of ${formatQuantity(listing.quantity, listing.unit)}`)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("dt", { className: "font-semibold text-stone-800" }, "Distance"), /* @__PURE__ */ React.createElement("dd", { className: "text-stone-600" }, `${listing.distanceKm.toFixed(1)} km away`)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("dt", { className: "font-semibold text-stone-800" }, "Prepared"), /* @__PURE__ */ React.createElement("dd", { className: "text-stone-600" }, formatDateTime(listing.preparedAt))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("dt", { className: "font-semibold text-stone-800" }, "Storage"), /* @__PURE__ */ React.createElement("dd", { className: "text-stone-600" }, listing.storage)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("dt", { className: "font-semibold text-stone-800" }, "Allergens"), /* @__PURE__ */ React.createElement("dd", { className: "text-stone-600" }, allergenText(listing.allergens))), /* @__PURE__ */ React.createElement("div", { className: "col-span-2" }, /* @__PURE__ */ React.createElement("dt", { className: "font-semibold text-stone-800" }, "Pickup location"), /* @__PURE__ */ React.createElement("dd", { className: "text-stone-600" }, listing.pickupLocation))), /* @__PURE__ */ React.createElement(DeadlineWarning, { deadline: listing.pickupDeadline, now })), /* @__PURE__ */ React.createElement("div", { className: "mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end" }, /* @__PURE__ */ React.createElement(Button, { variant: "outline", onClick: onClose, className: "w-full sm:w-auto" }, "Close"), /* @__PURE__ */ React.createElement(
    Button,
    {
      variant: "primary",
      icon: Package,
      onClick: () => onClaim(listing),
      disabled: !canClaim,
      className: "w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    },
    "Claim Food"
  )));
}
export {
  DonationDetailsModal as default
};
