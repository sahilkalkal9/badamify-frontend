"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AdminLayout({
  children,
  activePage,
  setActivePage,
  selectedLocation,
  setSelectedLocation,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f0df] text-[#2a1608]">
      <div className="flex">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <main className="min-h-screen flex-1 lg:ml-[280px]">
          <Topbar
            activePage={activePage}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
          />

          <div className="px-4 py-5 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}