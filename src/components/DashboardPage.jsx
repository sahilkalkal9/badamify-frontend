"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Boxes,
  CircleDollarSign,
  AlertCircle,
} from "lucide-react";
import api from "@/utils/api";

const formatMoney = (value) => {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
};

export default function DashboardPage({ selectedLocation }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const url =
        selectedLocation && selectedLocation !== "all"
          ? `/dashboard?locationId=${selectedLocation}`
          : "/dashboard";

      const { data } = await api.get(url);
      setDashboard(data?.dashboard || {});
    } catch (error) {
      console.error(error);
      setDashboard({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedLocation]);

  const pnlCards = [
    {
      title: "Total Investment",
      value: formatMoney(dashboard?.totalInvestedTillNow),
      subtitle: "Setup + stock purchased",
      icon: Wallet,
      type: "dark",
    },
    {
      title: "Total Recovered",
      value: formatMoney(dashboard?.totalRecovered),
      subtitle: "Customer paid amount",
      icon: CircleDollarSign,
    },
    {
      title: "Net Cash P&L",
      value: formatMoney(dashboard?.cashProfitLoss),
      subtitle: "Recovered - investment",
      icon: TrendingDown,
      danger: Number(dashboard?.cashProfitLoss || 0) < 0,
    },
    {
      title: "Operational Profit",
      value: formatMoney(dashboard?.operationalProfit),
      subtitle: "Sales - making cost",
      icon: TrendingUp,
      success: Number(dashboard?.operationalProfit || 0) >= 0,
    },
  ];

  const businessCards = [
    ["Setup Investment", formatMoney(dashboard?.totalSetupInvestment)],
    ["Stock Purchased", formatMoney(dashboard?.totalStockPurchased)],
    ["Current Stock Value", formatMoney(dashboard?.currentStockValue)],
    ["Making Cost", formatMoney(dashboard?.totalMakingCost)],
    ["Total Sales Value", formatMoney(dashboard?.totalSales)],
    ["Pending From Customers", formatMoney(dashboard?.totalPendingFromCustomers)],
    ["Extra Received", formatMoney(dashboard?.totalExtraReceived)],
    ["Glasses Sold", Number(dashboard?.totalGlassesSold || 0)],
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-[8px] bg-[#2a1608] p-5 text-white shadow-sm sm:p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-[#f2c078]">
              Badamify P&L Overview
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl lg:text-5xl">
              {selectedLocation === "all" ? "All Locations" : selectedLocation}
            </h1>

            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/70">
              Total investment me setup cost + new stock purchase add hoga.
              Daily production stock consume karega, isliye current stock value
              me making cost deduct hogi.
            </p>
          </div>

          <div className="rounded-[16px] bg-white/10 p-4">
            <p className="text-sm font-semibold text-[#f2c078]">
              Recovery Rate
            </p>
            <h2 className="mt-1 text-4xl font-black">
              {loading ? "..." : `${dashboard?.recoveryPercentage || 0}%`}
            </h2>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {pnlCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className={`rounded-[16px] p-5 shadow-sm ${
                card.type === "dark"
                  ? "bg-[#2a1608] text-white"
                  : "bg-white text-[#2a1608]"
              }`}
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-[16px] ${
                  card.type === "dark" ? "bg-white/10" : "bg-[#fff2d8]"
                }`}
              >
                <Icon size={22} />
              </div>

              <p
                className={`text-sm font-black ${
                  card.type === "dark" ? "text-[#f2c078]" : "text-[#9a6b3e]"
                }`}
              >
                {card.title}
              </p>

              <h3
                className={`mt-2 text-2xl font-black sm:text-3xl ${
                  card.danger ? "text-red-600" : ""
                } ${card.success ? "text-green-700" : ""}`}
              >
                {loading ? "Loading..." : card.value}
              </h3>

              <p
                className={`mt-2 text-xs font-semibold ${
                  card.type === "dark" ? "text-white/60" : "text-[#9a6b3e]"
                }`}
              >
                {card.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="rounded-[16px] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Business Breakdown</h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {businessCards.map(([title, value]) => (
              <div key={title} className="rounded-[16px] bg-[#fff8ea] p-4">
                <p className="text-xs font-black text-[#9a6b3e]">{title}</p>
                <h3 className="mt-1 text-xl font-black">
                  {loading ? "..." : value}
                </h3>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[16px] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#fff2d8]">
              <AlertCircle size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black">Important Logic</h2>
              <p className="text-sm font-semibold text-[#9a6b3e]">
                Accounting rules
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm font-semibold text-[#5b371f]">
            <p>✅ Stock purchase = investment</p>
            <p>✅ Setup stuff = investment</p>
            <p>✅ Daily production = stock consumed</p>
            <p>✅ Sales paid amount = recovered</p>
            <p>✅ Pending customer amount = receivable</p>
          </div>
        </div>
      </div>
    </div>
  );
}
