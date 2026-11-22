import { useCallback, useEffect, useState } from "react";
import { Leaf, Menu, X } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import ReceiverSidebar from "./ReceiverSidebar.jsx";
function ReceiverLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    if (!drawerOpen) return void 0;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);
  const handleLogout = () => {
    navigate("/login", { replace: true });
  };
  return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-cream lg:flex" }, /* @__PURE__ */ React.createElement("aside", { className: "hidden border-r border-stone-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col" }, /* @__PURE__ */ React.createElement(ReceiverSidebar, { onLogout: handleLogout })), /* @__PURE__ */ React.createElement("div", { className: "flex min-w-0 flex-1 flex-col" }, /* @__PURE__ */ React.createElement("header", { className: "sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 lg:hidden" }, /* @__PURE__ */ React.createElement(
    Link,
    {
      to: "/",
      className: "flex items-center gap-2 rounded-xl font-display text-base font-semibold text-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    },
    /* @__PURE__ */ React.createElement("span", { className: "flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white" }, /* @__PURE__ */ React.createElement(Leaf, { className: "h-4 w-4", "aria-hidden": "true" })),
    "Rescue the Surplus"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setDrawerOpen((open) => !open),
      "aria-expanded": drawerOpen,
      "aria-controls": "receiver-mobile-drawer",
      "aria-label": drawerOpen ? "Close navigation menu" : "Open navigation menu",
      className: "flex h-10 w-10 items-center justify-center rounded-xl text-stone-700 hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    },
    drawerOpen ? /* @__PURE__ */ React.createElement(X, { className: "h-6 w-6", "aria-hidden": "true" }) : /* @__PURE__ */ React.createElement(Menu, { className: "h-6 w-6", "aria-hidden": "true" })
  )), /* @__PURE__ */ React.createElement("main", { className: "min-h-screen flex-1 p-6 lg:p-10" }, /* @__PURE__ */ React.createElement(Outlet, null))), drawerOpen && /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "fixed inset-0 z-40 bg-stone-900/50 lg:hidden",
      onClick: closeDrawer,
      "aria-hidden": "true"
    }
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      id: "receiver-mobile-drawer",
      className: `fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform bg-white shadow-xl transition-all duration-300 ease-in-out lg:hidden ${drawerOpen ? "translate-x-0 visible" : "-translate-x-full invisible"}`,
      "aria-hidden": !drawerOpen
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex justify-end border-b border-stone-200 p-3" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: closeDrawer,
        "aria-label": "Close navigation menu",
        tabIndex: drawerOpen ? 0 : -1,
        className: "flex h-10 w-10 items-center justify-center rounded-xl text-stone-700 hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      },
      /* @__PURE__ */ React.createElement(X, { className: "h-5 w-5", "aria-hidden": "true" })
    )),
    /* @__PURE__ */ React.createElement("div", { className: "h-[calc(100%-4.5rem)]" }, /* @__PURE__ */ React.createElement(ReceiverSidebar, { onNavigate: closeDrawer, onLogout: handleLogout }))
  ));
}
export {
  ReceiverLayout as default
};
