"use client";

import { useEffect, useState } from "react";
import { Plus, ShoppingBag, CalendarDays, Pencil, Trash2 } from "lucide-react";
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

function toDateInput(date) {
  if (!date) return getToday();
  return new Date(date).toISOString().split("T")[0];
}

export default function SalesPage({ selectedLocation = "all" }) {
  const [open, setOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  

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

  const resetForm = () => {
    setEditingSale(null);
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
  };

  const getLocationId = (value) => {
    return typeof value === "object" ? value?._id : value;
  };

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

  const handleOpenAdd = () => {
    setEditingSale(null);
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
    setOpen(true);
  };

  const handleEdit = (sale) => {
    setEditingSale(sale);
    setForm({
      location: getLocationId(sale.location) || "",
      date: toDateInput(sale.date),
      customerName: sale.customerName || "",
      glasses: sale.glasses || 1,
      pricePerGlass: sale.pricePerGlass || 59,
      paidAmount: sale.paidAmount || 0,
      paymentMode: sale.paymentMode || "cash",
      notes: sale.notes || "",
    });
    setOpen(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setOpen(false);
    resetForm();
  };

  const handleSave = async () => {
    if (saving) return;

    try {
      if (!form.location) return alert("Location is required");
      if (!form.date) return alert("Date is required");
      if (!form.customerName.trim()) return alert("Customer name is required");
      if (!form.glasses) return alert("Glasses is required");

      if (Number(form.glasses || 0) <= 0) {
        return alert("Glasses must be greater than 0");
      }

      if (Number(form.pricePerGlass || 0) < 0) {
        return alert("Price per glass cannot be negative");
      }

      if (Number(form.paidAmount || 0) < 0) {
        return alert("Paid amount cannot be negative");
      }

      setSaving(true);

      const payload = {
        location: form.location,
        date: form.date,
        customerName: form.customerName.trim(),
        glasses: Number(form.glasses || 0),
        pricePerGlass: Number(form.pricePerGlass || 59),
        paidAmount: Number(form.paidAmount || 0),
        paymentMode: form.paymentMode,
        notes: form.notes.trim(),
      };

      if (editingSale?._id) {
        await api.put(`/sales/${editingSale._id}`, payload);
      } else {
        await api.post("/sales", payload);
      }

      resetForm();
      setOpen(false);
      fetchSales();
    } catch (error) {
      console.error("Save sale error:", error);
      alert(error?.response?.data?.message || "Failed to save sale");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sale) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete sale of "${sale.customerName}"?`
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(sale._id);
      await api.delete(`/sales/${sale._id}`);
      fetchSales();
    } catch (error) {
      console.error("Delete sale error:", error);
      alert(error?.response?.data?.message || "Failed to delete sale");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="rounded-[16px] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-black leading-tight text-[#2a1608] sm:text-2xl">
              Sales Entries
            </h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-[#9a6b3e] sm:text-sm">
              Date-wise customer sales, paid/unpaid and extra amount
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            <button
              onClick={() => setSelectedDate(getToday())}
              className="rounded-[14px] bg-[#fff2d8] px-3 py-2.5 text-xs font-black text-[#2a1608] sm:px-4 sm:py-3 sm:text-sm"
            >
              Today
            </button>

            <button
              onClick={() => setSelectedDate(getYesterday())}
              className="rounded-[14px] bg-[#fff2d8] px-3 py-2.5 text-xs font-black text-[#2a1608] sm:px-4 sm:py-3 sm:text-sm"
            >
              Yesterday
            </button>

            <div className="col-span-2 flex min-w-0 items-center gap-2 rounded-[14px] border border-[#eadcc5] bg-[#fff8ea] px-3 py-2.5 sm:col-span-1 sm:px-4 sm:py-3">
              <CalendarDays size={16} className="shrink-0" />
              <input
                type="date"
                value={selectedDate}
                max={getToday()}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full min-w-0 bg-transparent text-xs font-black outline-none sm:text-sm"
              />
            </div>

            <button
              onClick={handleOpenAdd}
              className="col-span-2 flex items-center justify-center gap-2 rounded-[14px] bg-[#2a1608] px-4 py-3 text-sm font-black text-white sm:col-span-1 sm:px-5"
            >
              <Plus size={17} />
              Add Sale
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
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

      <div className="overflow-hidden rounded-[16px] bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-[#eadcc5] p-4 sm:p-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] bg-[#fff2d8] sm:h-10 sm:w-10">
            <ShoppingBag size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-black leading-tight sm:text-xl">
              Sales History
            </h3>
            <p className="text-xs font-semibold text-[#9a6b3e] sm:text-sm">
              Showing sales for {selectedDate}
            </p>
          </div>
        </div>

        <div className="block p-3 sm:p-4 md:hidden">
          {loading ? (
            <div className="rounded-[16px] bg-[#fff8ea] px-4 py-8 text-center text-sm font-bold text-[#9a6b3e]">
              Loading sales...
            </div>
          ) : sales.length > 0 ? (
            <div className="space-y-3">
              {sales.map((sale) => (
                <div
                  key={sale._id}
                  className="rounded-[16px] border border-[#eadcc5] bg-[#fffaf2] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-black text-[#2a1608]">
                        {sale.customerName}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#9a6b3e]">
                        {formatDate(sale.date)}
                      </p>
                    </div>
                    <StatusBadge status={capitalize(sale.paymentStatus)} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <MobileInfo label="Glasses" value={sale.glasses} />
                    <MobileInfo label="Price" value={`₹${sale.pricePerGlass}`} />
                    <MobileInfo label="Total" value={`₹${sale.totalAmount}`} />
                    <MobileInfo label="Paid" value={`₹${sale.paidAmount}`} />
                    <MobileInfo label="Extra" value={`₹${sale.extraAmount}`} />
                    <MobileInfo label="Mode" value={sale.paymentMode} capitalize />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleEdit(sale)}
                      disabled={deletingId === sale._id}
                      className="flex items-center justify-center gap-2 rounded-[14px] bg-[#fff2d8] px-4 py-3 text-sm font-black text-[#2a1608] disabled:opacity-60"
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(sale)}
                      disabled={deletingId === sale._id}
                      className="flex items-center justify-center gap-2 rounded-[14px] bg-red-50 px-4 py-3 text-sm font-black text-red-600 disabled:opacity-60"
                    >
                      <Trash2 size={16} />
                      {deletingId === sale._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[16px] bg-[#fff8ea] px-4 py-8 text-center text-sm font-bold text-[#9a6b3e]">
              No sales found for this date
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1050px] text-left text-sm">
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
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
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
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(sale)}
                          disabled={deletingId === sale._id}
                          className="rounded-[12px] bg-[#fff2d8] p-2 text-[#2a1608] disabled:opacity-60"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(sale)}
                          disabled={deletingId === sale._id}
                          className="rounded-[12px] bg-red-50 p-2 text-red-600 disabled:opacity-60"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={10}
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

      <Modal
        open={open}
        title={editingSale ? "Edit Sale Entry" : "Add Sale Entry"}
        onClose={handleCloseModal}
      >
        <form className="max-h-[75vh] space-y-3 overflow-y-auto pr-1 sm:space-y-4">
          <select
            className="input text-sm"
            name="location"
            value={form.location}
            onChange={handleChange}
            disabled={selectedLocation !== "all" || saving}
          >
            <option value="">Select location</option>
            {locations.map((location) => (
              <option key={location._id} value={location._id}>
                {location.name}
              </option>
            ))}
          </select>

          <input
            className="input text-sm"
            name="date"
            type="date"
            value={form.date}
            max={getToday()}
            onChange={handleChange}
            disabled={saving}
          />

          <input
            className="input text-sm"
            name="customerName"
            value={form.customerName}
            onChange={handleChange}
            disabled={saving}
            placeholder="Customer name"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="input text-sm"
              name="glasses"
              type="number"
              placeholder="Glasses"
              value={form.glasses}
              min="1"
              onChange={handleChange}
              disabled={saving}
            />

            <input
              className="input text-sm"
              name="pricePerGlass"
              type="number"
              placeholder="Price per glass"
              value={form.pricePerGlass}
              min="0"
              onChange={handleChange}
              disabled={saving}
            />
          </div>

          <input
            className="input text-sm"
            name="paidAmount"
            type="number"
            placeholder="Paid amount"
            value={form.paidAmount}
            min="0"
            onChange={handleChange}
            disabled={saving}
          />

          <select
            className="input text-sm"
            name="paymentMode"
            value={form.paymentMode}
            onChange={handleChange}
            disabled={saving}
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="other">Other</option>
            <option value="none">None</option>
          </select>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <CalcBox title="Total" value={`₹${totalAmount}`} />
            <CalcBox title="Pending" value={`₹${pendingAmount}`} />
            <CalcBox title="Extra" value={`₹${extraAmount}`} />
          </div>

          <div className="rounded-[16px] bg-[#fff8ea] p-4">
            <p className="text-xs font-black text-[#9a6b3e] sm:text-sm">
              Payment Status
            </p>
            <h3 className="mt-1 text-lg font-black sm:text-xl">
              {paymentStatus}
            </h3>
          </div>

          <textarea
            className="input min-h-[90px] resize-none text-sm sm:min-h-[100px]"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            disabled={saving}
            placeholder="Notes"
          />

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-[16px] bg-[#2a1608] py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
          >
            {saving
              ? editingSale
                ? "Updating..."
                : "Saving..."
              : editingSale
              ? "Update Sale"
              : "Save Sale"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="rounded-[16px] bg-white p-3 shadow-sm sm:p-5">
      <p className="text-[11px] font-black leading-4 text-[#9a6b3e] sm:text-sm">
        {title}
      </p>
      <h3 className="mt-1 break-words text-lg font-black leading-tight text-[#2a1608] sm:mt-2 sm:text-2xl lg:text-3xl">
        {value}
      </h3>
    </div>
  );
}

function CalcBox({ title, value }) {
  return (
    <div className="rounded-[14px] bg-[#2a1608] p-3 text-white sm:rounded-[16px] sm:p-4">
      <p className="text-[10px] font-bold text-[#f2c078] sm:text-xs">
        {title}
      </p>
      <h3 className="mt-1 break-words text-sm font-black sm:text-xl">{value}</h3>
    </div>
  );
}

function MobileInfo({ label, value, capitalize = false }) {
  return (
    <div className="rounded-[12px] bg-white p-3">
      <p className="font-bold text-[#9a6b3e]">{label}</p>
      <p
        className={`mt-1 break-words font-black text-[#2a1608] ${
          capitalize ? "capitalize" : ""
        }`}
      >
        {value}
      </p>
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
      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black sm:px-3 sm:text-xs ${
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