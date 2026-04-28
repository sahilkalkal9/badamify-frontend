"use client";

import { useEffect, useState } from "react";
import { Plus, ShoppingBag, CalendarDays } from "lucide-react";
import Modal from "./Modal";
import api from "@/utils/api";

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getYesterday() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function SalesPage({ selectedLocation = "all" }) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [loading, setLoading] = useState(false);

  const [sales, setSales] = useState([]);
  const [locations, setLocations] = useState([]);

  const [form, setForm] = useState({
    location: "",
    date: getToday(),
    customerName: "",
    glasses: 1,
    pricePerGlass: 59,
    paidAmount: 0,
    paymentMode: "cash",
    notes: "",
  });

  const fetchLocations = async () => {
    try {
      const { data } = await api.get("/locations");
      setLocations(data?.locations || []);
    } catch (error) {
      console.error("Fetch locations error:", error);
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (selectedLocation && selectedLocation !== "all") {
        params.append("locationId", selectedLocation);
      }

      if (selectedDate) {
        params.append("date", selectedDate);
      }

      const { data } = await api.get(`/sales?${params.toString()}`);
      setSales(data?.sales || []);
    } catch (error) {
      console.error("Fetch sales error:", error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchSales();

    if (selectedLocation !== "all") {
      setForm((prev) => ({
        ...prev,
        location: selectedLocation,
      }));
    }
  }, [selectedLocation, selectedDate]);

  const totalSale = sales.reduce(
    (sum, sale) => sum + Number(sale.totalAmount || 0),
    0
  );

  const totalGlasses = sales.reduce(
    (sum, sale) => sum + Number(sale.glasses || 0),
    0
  );

  const totalRecovered = sales.reduce(
    (sum, sale) => sum + Number(sale.paidAmount || 0),
    0
  );

  const totalPending = totalSale - totalRecovered;

  const totalAmount =
    Number(form.glasses || 0) * Number(form.pricePerGlass || 0);

  const extraAmount =
    Number(form.paidAmount || 0) > totalAmount
      ? Number(form.paidAmount || 0) - totalAmount
      : 0;

  const pendingAmount =
    totalAmount > Number(form.paidAmount || 0)
      ? totalAmount - Number(form.paidAmount || 0)
      : 0;

  const paymentStatus =
    Number(form.paidAmount || 0) <= 0
      ? "Unpaid"
      : Number(form.paidAmount || 0) < totalAmount
      ? "Partial"
      : "Paid";

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      if (!form.location) return alert("Location is required");
      if (!form.date) return alert("Date is required");
      if (!form.customerName.trim()) return alert("Customer name is required");
      if (!form.glasses) return alert("Glasses is required");

      await api.post("/sales", {
        location: form.location,
        date: form.date,
        customerName: form.customerName,
        glasses: Number(form.glasses || 0),
        pricePerGlass: Number(form.pricePerGlass || 59),
        paidAmount: Number(form.paidAmount || 0),
        paymentMode: form.paymentMode,
        notes: form.notes,
      });

      setForm({
        location: selectedLocation !== "all" ? selectedLocation : "",
        date: selectedDate,
        customerName: "",
        glasses: 1,
        pricePerGlass: 59,
        paidAmount: 0,
        paymentMode: "cash",
        notes: "",
      });

      setOpen(false);
      fetchSales();
    } catch (error) {
      console.error("Create sale error:", error);
      alert(error?.response?.data?.message || "Failed to save sale");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[28px] bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-black">Sales Entries</h2>
          <p className="text-sm font-semibold text-[#9a6b3e]">
            Date-wise customer sales, paid/unpaid and extra amount
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => setSelectedDate(getToday())}
            className="rounded-2xl bg-[#fff2d8] px-4 py-3 text-sm font-black text-[#2a1608]"
          >
            Today
          </button>

          <button
            onClick={() => setSelectedDate(getYesterday())}
            className="rounded-2xl bg-[#fff2d8] px-4 py-3 text-sm font-black text-[#2a1608]"
          >
            Yesterday
          </button>

          <div className="flex items-center gap-2 rounded-2xl border border-[#eadcc5] bg-[#fff8ea] px-4 py-3">
            <CalendarDays size={18} />
            <input
              type="date"
              value={selectedDate}
              max={getToday()}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-black outline-none"
            />
          </div>

          <button
            onClick={() => {
              setForm((prev) => ({
                ...prev,
                location: selectedLocation !== "all" ? selectedLocation : "",
                date: selectedDate,
              }));
              setOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#2a1608] px-5 py-3 font-black text-white"
          >
            <Plus size={18} />
            Add Sale
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Selected Date Sale"
          value={loading ? "Loading..." : `₹${totalSale.toLocaleString("en-IN")}`}
        />
        <SummaryCard
          title="Glasses Sold"
          value={loading ? "Loading..." : totalGlasses}
        />
        <SummaryCard
          title="Recovered"
          value={
            loading ? "Loading..." : `₹${totalRecovered.toLocaleString("en-IN")}`
          }
        />
        <SummaryCard
          title="Pending"
          value={loading ? "Loading..." : `₹${totalPending.toLocaleString("en-IN")}`}
        />
      </div>

      <div className="overflow-hidden rounded-[28px] bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-[#eadcc5] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff2d8]">
            <ShoppingBag size={18} />
          </div>
          <div>
            <h3 className="text-xl font-black">Sales History</h3>
            <p className="text-sm font-semibold text-[#9a6b3e]">
              Showing sales for {selectedDate}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-[#fff8ea]">
              <tr>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Glasses</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Paid</th>
                <th className="px-5 py-4">Extra</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Mode</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-10 text-center font-bold text-[#9a6b3e]"
                  >
                    Loading sales...
                  </td>
                </tr>
              ) : sales.length > 0 ? (
                sales.map((sale) => (
                  <tr key={sale._id} className="border-t border-[#eadcc5]">
                    <td className="px-5 py-4 font-semibold">
                      {formatDate(sale.date)}
                    </td>
                    <td className="px-5 py-4 font-black">
                      {sale.customerName}
                    </td>
                    <td className="px-5 py-4 font-semibold">{sale.glasses}</td>
                    <td className="px-5 py-4 font-semibold">
                      ₹{sale.pricePerGlass}
                    </td>
                    <td className="px-5 py-4 font-black">
                      ₹{sale.totalAmount}
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      ₹{sale.paidAmount}
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      ₹{sale.extraAmount}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={capitalize(sale.paymentStatus)} />
                    </td>
                    <td className="px-5 py-4 font-semibold capitalize">
                      {sale.paymentMode}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-10 text-center font-bold text-[#9a6b3e]"
                  >
                    No sales found for this date
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} title="Add Sale Entry" onClose={() => setOpen(false)}>
        <form className="space-y-4">
          <select
            className="input"
            name="location"
            value={form.location}
            onChange={handleChange}
            disabled={selectedLocation !== "all"}
          >
            <option value="">Select location</option>
            {locations.map((location) => (
              <option key={location._id} value={location._id}>
                {location.name}
              </option>
            ))}
          </select>

          <input
            className="input"
            name="date"
            type="date"
            value={form.date}
            max={getToday()}
            onChange={handleChange}
          />

          <input
            className="input"
            name="customerName"
            value={form.customerName}
            onChange={handleChange}
            placeholder="Customer name"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="input"
              name="glasses"
              type="number"
              placeholder="Glasses"
              value={form.glasses}
              min="1"
              onChange={handleChange}
            />

            <input
              className="input"
              name="pricePerGlass"
              type="number"
              placeholder="Price per glass"
              value={form.pricePerGlass}
              min="0"
              onChange={handleChange}
            />
          </div>

          <input
            className="input"
            name="paidAmount"
            type="number"
            placeholder="Paid amount"
            value={form.paidAmount}
            min="0"
            onChange={handleChange}
          />

          <select
            className="input"
            name="paymentMode"
            value={form.paymentMode}
            onChange={handleChange}
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="other">Other</option>
            <option value="none">None</option>
          </select>

          <div className="grid gap-3 sm:grid-cols-3">
            <CalcBox title="Total" value={`₹${totalAmount}`} />
            <CalcBox title="Pending" value={`₹${pendingAmount}`} />
            <CalcBox title="Extra" value={`₹${extraAmount}`} />
          </div>

          <div className="rounded-2xl bg-[#fff8ea] p-4">
            <p className="text-sm font-black text-[#9a6b3e]">
              Payment Status
            </p>
            <h3 className="mt-1 text-xl font-black">{paymentStatus}</h3>
          </div>

          <textarea
            className="input min-h-[100px] resize-none"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Notes"
          />

          <button
            type="button"
            onClick={handleSave}
            className="w-full rounded-2xl bg-[#2a1608] py-3 font-black text-white"
          >
            Save Sale
          </button>
        </form>
      </Modal>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-sm">
      <p className="text-sm font-black text-[#9a6b3e]">{title}</p>
      <h3 className="mt-2 text-2xl font-black sm:text-3xl">{value}</h3>
    </div>
  );
}

function CalcBox({ title, value }) {
  return (
    <div className="rounded-2xl bg-[#2a1608] p-4 text-white">
      <p className="text-xs font-bold text-[#f2c078]">{title}</p>
      <h3 className="mt-1 text-xl font-black">{value}</h3>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Paid: "bg-green-100 text-green-700",
    Unpaid: "bg-red-100 text-red-700",
    Partial: "bg-yellow-100 text-yellow-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}

function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}