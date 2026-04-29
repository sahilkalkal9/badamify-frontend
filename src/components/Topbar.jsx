"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import api from "@/utils/api";

const LOGO =
  "https://ik.imagekit.io/fkhvlkpi1/WhatsApp_Image_2026-04-29_at_6.18.40_PM-removebg-preview.png";

const pageTitles = {
  dashboard: "Dashboard",
  locations: "Locations",
  recipe: "Recipe Items",
  setup: "Setup Stuff",
  stock: "Stock Management",
  production: "Daily Production",
  sales: "Sales Entries",
};

export default function Topbar({
  activePage,
  setSidebarOpen,
  selectedLocation,
  setSelectedLocation,
}) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/locations");
      setLocations(data?.locations || []);
    } catch (error) {
      console.error("Fetch topbar locations error:", error);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-[#eadcc5] bg-[#f7f0df]/90 px-3 py-3 backdrop-blur sm:px-6 sm:py-4 lg:px-8">
      <div className="flex flex-col gap-4 rounded-[16px] bg-white p-3 shadow-sm sm:p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-3 md:justify-start">
          <div className="flex min-w-0 items-center gap-3">
            {/* Mobile Logo */}
            <Image
              src={LOGO}
              alt="Badamify Logo"
              width={46}
              height={46}
              className="shrink-0 object-contain lg:hidden"
            />

            <div className="min-w-0">
              <p className="truncate text-[11px] font-black uppercase tracking-wide text-[#9a6b3e] sm:text-xs">
                Badamify Management
              </p>
              <h2 className="truncate text-xl font-black text-[#2a1608] sm:text-3xl">
                {pageTitles[activePage]}
              </h2>
            </div>
          </div>

          {/* Mobile Menu Right */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="shrink-0 rounded-[16px] bg-[#2a1608] p-3 text-white lg:hidden"
            aria-label="Open Menu"
          >
            <Menu size={20} />
          </button>
        </div>

        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="w-full rounded-[16px] border border-[#eadcc5] bg-[#fff8ea] px-4 py-3 text-sm font-black text-[#2a1608] outline-none md:w-[260px]"
        >
          <option value="all">
            {loading ? "Loading locations..." : "All Locations"}
          </option>

          {locations.map((location) => (
            <option key={location._id} value={location._id}>
              {location.name}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}