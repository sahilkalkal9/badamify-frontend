"use client";

import {
  LayoutDashboard,
  MapPin,
  Utensils,
  Package,
  Boxes,
  Factory,
  ShoppingBag,
  X,
} from "lucide-react";

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "locations", label: "Locations", icon: MapPin },
  { key: "recipe", label: "Recipe Items", icon: Utensils },
  { key: "setup", label: "Setup Stuff", icon: Package },
  { key: "stock", label: "Stock", icon: Boxes },
  { key: "production", label: "Production", icon: Factory },
  { key: "sales", label: "Sales", icon: ShoppingBag },
];

export default function Sidebar({
  activePage,
  setActivePage,
  sidebarOpen,
  setSidebarOpen,
}) {
  return (
    <>
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-[280px] bg-[#fff8ea] p-5 shadow-xl transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Badamify</h1>
            <p className="text-sm font-semibold text-[#9a6b3e]">
              Admin Panel
            </p>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-xl bg-[#2a1608] p-2 text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.key;

            return (
              <button
                key={item.key}
                onClick={() => {
                  setActivePage(item.key);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${
                  active
                    ? "bg-[#2a1608] text-white"
                    : "text-[#4b2a14] hover:bg-[#f1dfc4]"
                }`}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}