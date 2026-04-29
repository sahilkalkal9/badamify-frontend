"use client";

import Image from "next/image";
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

const LOGO =
  "https://ik.imagekit.io/fkhvlkpi1/WhatsApp_Image_2026-04-29_at_6.18.40_PM-removebg-preview.png";

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
        {/* 🔥 Watermark */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Image
            src={LOGO}
            alt="logo"
            width={200}
            height={200}
            className="opacity-10 object-contain"
          />
        </div>

        {/* Top */}
        <div className="relative mb-8 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Image
              src={LOGO}
              alt="logo"
              width={42}
              height={42}
              className="rounded-xl object-contain"
            />

            <div>
              <h1 className="text-2xl font-black tracking-tight">
                Badamify
              </h1>
              <p className="text-xs font-semibold text-[#9a6b3e]">
                Admin Panel
              </p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-xl bg-[#2a1608] p-2 text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="relative space-y-2">
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
                className={`flex w-full items-center gap-3 rounded-[16px] px-4 py-3 text-left text-sm font-black transition ${
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