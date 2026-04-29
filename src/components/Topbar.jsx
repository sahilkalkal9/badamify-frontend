"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import api from "@/utils/api";

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
    <header className="sticky top-0 z-30 border-b border-[#eadcc5] bg-[#f7f0df]/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 rounded-[16px] bg-white p-4 shadow-sm sm:p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-[16px] bg-[#2a1608] p-3 text-white lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#9a6b3e]">
              Badamify Management
            </p>
            <h2 className="text-2xl font-black sm:text-3xl">
              {pageTitles[activePage]}
            </h2>
          </div>
        </div>

        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="w-full rounded-[16px] border border-[#eadcc5] bg-[#fff8ea] px-4 py-3 text-sm font-black outline-none md:w-[260px]"
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