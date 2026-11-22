import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  receiverProfile,
  seedClaims,
  seedListings,
  seedNotifications
} from "../data/receiverData.js";
const ReceiverContext = createContext(null);
const CLOSING_WINDOW_MINUTES = 120;
function getDeadlineState(deadline, now) {
  const deadlineMs = new Date(deadline).getTime();
  const minutesLeft = Math.floor((deadlineMs - now) / 6e4);
  if (deadlineMs <= now) {
    return { state: "expired", minutesLeft: 0 };
  }
  if (minutesLeft < CLOSING_WINDOW_MINUTES) {
    return { state: "closing", minutesLeft };
  }
  return { state: "open", minutesLeft };
}
function getListingStatus(listing, now) {
  if (new Date(listing.pickupDeadline).getTime() <= now) {
    return "Expired";
  }
  if (listing.quantity - listing.claimedQuantity <= 0) {
    return "Claimed";
  }
  return "Available";
}
function ReceiverProvider({ children }) {
  const [listingsState, setListingsState] = useState(seedListings);
  const [claims, setClaims] = useState(seedClaims);
  const [notifications, setNotifications] = useState(seedNotifications);
  const [profile, setProfile] = useState(receiverProfile);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 6e4);
    return () => clearInterval(timer);
  }, []);
  const listings = useMemo(
    () => listingsState.map((listing) => ({
      ...listing,
      availableQuantity: listing.quantity - listing.claimedQuantity,
      status: getListingStatus(listing, now)
    })),
    [listingsState, now]
  );
  const claimFood = useCallback(
    (donationId, quantity) => {
      if (!Number.isInteger(quantity) || quantity < 1) {
        return { ok: false, error: "Enter a whole number of at least 1" };
      }
      const listing = listings.find((item) => item.id === donationId);
      if (!listing || listing.status !== "Available") {
        return { ok: false, error: "This listing is no longer available" };
      }
      if (quantity > listing.availableQuantity) {
        return { ok: false, error: `Only ${listing.availableQuantity} ${listing.unit} left available` };
      }
      const claim = {
        id: "c-" + Date.now(),
        donationId,
        foodName: listing.foodName,
        donorName: listing.donorName,
        image: listing.image,
        quantityClaimed: quantity,
        unit: listing.unit,
        pickupLocation: listing.pickupLocation,
        storage: listing.storage,
        allergens: listing.allergens,
        pickupDeadline: listing.pickupDeadline,
        claimedAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "Claimed"
      };
      setListingsState(
        (prev) => prev.map(
          (item) => item.id === donationId ? { ...item, claimedQuantity: item.claimedQuantity + quantity } : item
        )
      );
      setClaims((prev) => [claim, ...prev]);
      return { ok: true, claim };
    },
    [listings]
  );
  const markCollected = useCallback((claimId) => {
    setClaims(
      (prev) => prev.map(
        (claim) => claim.id === claimId && claim.status === "Claimed" ? { ...claim, status: "Collected", collectedAt: (/* @__PURE__ */ new Date()).toISOString() } : claim
      )
    );
  }, []);
  const markDelivered = useCallback((claimId) => {
    setClaims(
      (prev) => prev.map(
        (claim) => claim.id === claimId && claim.status === "Collected" ? { ...claim, status: "Delivered", deliveredAt: (/* @__PURE__ */ new Date()).toISOString() } : claim
      )
    );
  }, []);
  const markNotificationRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);
  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);
  const updateProfile = useCallback((changes) => {
    setProfile((prev) => ({ ...prev, ...changes }));
  }, []);
  const stats = useMemo(() => {
    const availableDonations = listings.filter((l) => l.status === "Available").length;
    const donationsClaimed = claims.length;
    const foodReceived = { Meals: 0, Kg: 0, Packets: 0 };
    claims.filter((c) => c.status === "Delivered").forEach((c) => {
      foodReceived[c.unit] = (foodReceived[c.unit] || 0) + Number(c.quantityClaimed || 0);
    });
    const mealsDistributed = foodReceived.Meals;
    return { availableDonations, donationsClaimed, foodReceived, mealsDistributed };
  }, [listings, claims]);
  const value = useMemo(
    () => ({
      listings,
      claims,
      notifications,
      profile,
      now,
      stats,
      claimFood,
      markCollected,
      markDelivered,
      markNotificationRead,
      markAllNotificationsRead,
      updateProfile
    }),
    [
      listings,
      claims,
      notifications,
      profile,
      now,
      stats,
      claimFood,
      markCollected,
      markDelivered,
      markNotificationRead,
      markAllNotificationsRead,
      updateProfile
    ]
  );
  return /* @__PURE__ */ React.createElement(ReceiverContext.Provider, { value }, children);
}
function useReceiver() {
  const context = useContext(ReceiverContext);
  if (!context) {
    throw new Error("useReceiver must be used inside ReceiverProvider");
  }
  return context;
}
export {
  ReceiverProvider,
  getDeadlineState,
  getListingStatus,
  useReceiver
};
