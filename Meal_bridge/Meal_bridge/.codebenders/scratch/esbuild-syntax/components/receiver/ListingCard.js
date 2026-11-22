import { Package } from "lucide-react";
import Button from "../ui/Button";
import FoodImage from "../ui/FoodImage";
import { formatDateTime, formatQuantity } from "../../lib/formatters";
import ReceiverStatusBadge from "./ReceiverStatusBadge";
import DeadlineWarning from "./DeadlineWarning";
function ListingCard({ listing, now, onView, onClaim }) {
  const isClaimable = listing.status === "Available";
  return /* @__PURE__ */ React.createElement("article", { className: "flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md" }, /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(
    FoodImage,
    {
      src: listing.image,
      alt: listing.foodName,
      className: "aspect-[4/3] w-full object-cover"
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "absolute top-3 left-3" }, /* @__PURE__ */ React.createElement(ReceiverStatusBadge, { status: listing.status }))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 p-5" }, /* @__PURE__ */ React.createElement("h3", { className: "font-display text-lg text-stone-900" }, listing.foodName), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-sm text-stone-500" }, listing.donorName, " \xB7 ", listing.donorType), /* @__PURE__ */ React.createElement("dl", { className: "mt-4 divide-y divide-stone-100 text-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-4 py-2" }, /* @__PURE__ */ React.createElement("dt", { className: "text-stone-500" }, "Available"), /* @__PURE__ */ React.createElement("dd", { className: "text-right text-stone-900" }, formatQuantity(listing.availableQuantity, listing.unit), " of", " ", formatQuantity(listing.quantity, listing.unit))), /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-4 py-2" }, /* @__PURE__ */ React.createElement("dt", { className: "text-stone-500" }, "Distance"), /* @__PURE__ */ React.createElement("dd", { className: "text-right text-stone-900" }, listing.distanceKm.toFixed(1), " km away")), /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-4 py-2" }, /* @__PURE__ */ React.createElement("dt", { className: "text-stone-500" }, "Prepared"), /* @__PURE__ */ React.createElement("dd", { className: "text-right text-stone-900" }, formatDateTime(listing.preparedAt))), /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-4 py-2" }, /* @__PURE__ */ React.createElement("dt", { className: "text-stone-500" }, "Storage"), /* @__PURE__ */ React.createElement("dd", { className: "text-right text-stone-900" }, listing.storage)), /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-4 py-2" }, /* @__PURE__ */ React.createElement("dt", { className: "text-stone-500" }, "Allergens"), /* @__PURE__ */ React.createElement("dd", { className: "text-right text-stone-900" }, listing.allergens))), /* @__PURE__ */ React.createElement("div", { className: "mt-4" }, /* @__PURE__ */ React.createElement(DeadlineWarning, { deadline: listing.pickupDeadline, now }))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-3 p-5 pt-0 sm:flex-row" }, /* @__PURE__ */ React.createElement(
    Button,
    {
      variant: "outline",
      type: "button",
      className: "w-full sm:w-auto",
      onClick: () => onView(listing)
    },
    "View Details"
  ), /* @__PURE__ */ React.createElement(
    Button,
    {
      variant: "primary",
      type: "button",
      icon: Package,
      className: `w-full sm:w-auto ${isClaimable ? "" : "opacity-50 cursor-not-allowed"}`,
      disabled: !isClaimable,
      onClick: () => onClaim(listing)
    },
    "Claim Food"
  )));
}
export {
  ListingCard as default
};
