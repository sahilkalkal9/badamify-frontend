"use client";

import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import DashboardPage from "@/components/DashboardPage";
import LocationsPage from "@/components/LocationsPage";
import RecipeItemsPage from "@/components/RecipeItemsPage";
import SetupStuffPage from "@/components/SetupStuffPage";
import StockPage from "@/components/StockPage";
import ProductionPage from "@/components/ProductionPage";
import SalesPage from "@/components/SalesPage";

export default function HomePage() {
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedLocation, setSelectedLocation] = useState("all");

  return (
    <AdminLayout
      activePage={activePage}
      setActivePage={setActivePage}
      selectedLocation={selectedLocation}
      setSelectedLocation={setSelectedLocation}
    >
      {activePage === "dashboard" && (
        <DashboardPage selectedLocation={selectedLocation} />
      )}

      {/* {activePage !== "dashboard" && (
        <div className="rounded-[28px] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">Coming next: {activePage}</h2>
        </div>
      )} */}
      {activePage === "locations" && <LocationsPage />}
      {activePage === "recipe" && <RecipeItemsPage />}
      {activePage === "stock" && <StockPage />}
      {activePage === "setup" && <SetupStuffPage />}
      {activePage === "production" && <ProductionPage />}
      {activePage === "sales" && <SalesPage />}
    </AdminLayout>
  );
}