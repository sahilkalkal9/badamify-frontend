"use client";

import { useEffect, useState } from "react";
import { Plus, Package } from "lucide-react";
import Modal from "./Modal";
import api from "@/utils/api";

const formatMoney = (value) => {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function SetupStuffPage({ selectedLocation = "all" }) {
  const [open, setOpen] = useState(false);
  const [setupItems, setSetupItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    location: "",
    name: "",
    category: "",
    quantity: "",
    pricePerItem: "",
    purchaseDate: "",
    notes: "",
  });

  const resetForm = () => {
    setForm({
      location: selectedLocation !== "all" ? selectedLocation : "",
      name: "",
      category: "",
      quantity: "",
      pricePerItem: "",
      purchaseDate: "",
      notes: "",
    });
  };

  const fetchLocations = async () => {
    try {
      const { data } = await api.get("/locations");
      setLocations(data?.locations || []);
    } catch (error) {
      console.error("Fetch locations error:", error);
    }
  };

  const fetchSetupStuff = async () => {
    try {
      setLoading(true);

      const url =
        selectedLocation && selectedLocation !== "all"
          ? `/setup-stuff?locationId=${selectedLocation}`
          : "/setup-stuff";

      const { data } = await api.get(url);
      setSetupItems(data?.stuff || []);
    } catch (error) {
      console.error("Fetch setup stuff error:", error);
      setSetupItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchSetupStuff();

    if (selectedLocation !== "all") {
      setForm((prev) => ({
        ...prev,
        location: selectedLocation,
      }));
    }
  }, [selectedLocation]);

  const totalSetupInvestment = setupItems.reduce((sum, item) => {
    return sum + Number(item.totalPrice || 0);
  }, 0);

  const getLocationName = (item) => {
    if (item.location?.name) return item.location.name;

    const location = locations.find((loc) => loc._id === item.location);
    return location?.name || "-";
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleOpenModal = () => {
    resetForm();
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
      if (!form.name.trim()) return alert("Item name is required");
      if (!form.category) return alert("Category is required");

      if (Number(form.quantity || 1) <= 0) {
        return alert("Quantity must be greater than 0");
      }

      if (Number(form.pricePerItem || 0) < 0) {
        return alert("Price per item cannot be negative");
      }

      setSaving(true);

      await api.post("/setup-stuff", {
        location: form.location,
        name: form.name.trim(),
        category: form.category,
        quantity: Number(form.quantity || 1),
        pricePerItem: Number(form.pricePerItem || 0),
        purchaseDate: form.purchaseDate || new Date().toISOString(),
        notes: form.notes.trim(),
      });

      resetForm();
      setOpen(false);
      fetchSetupStuff();
    } catch (error) {
      console.error("Create setup stuff error:", error);
      alert("Failed to save setup item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[16px] bg-[#2a1608] p-5 text-white shadow-sm sm:p-6">
        <p className="text-sm font-semibold text-[#f2c078]">
          Total Setup Investment
        </p>
        <h2 className="mt-1 text-2xl font-black sm:text-3xl">
          {loading ? "Loading..." : formatMoney(totalSetupInvestment)}
        </h2>
        <p className="mt-2 text-sm text-white/70">
          Cart, equipment, utensils, branding and other one-time setup items.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-[16px] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black sm:text-2xl">Setup Stuff</h2>
          <p className="text-sm font-semibold text-[#9a6b3e]">
            Add all one-time investment items
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#2a1608] px-5 py-3 font-black text-white sm:w-auto"
        >
          <Plus size={18} />
          Add Setup Item
        </button>
      </div>

      <div className="grid gap-4 md:hidden">
        {loading ? (
          <div className="rounded-[24px] bg-white p-5 text-center font-bold text-[#9a6b3e] shadow-sm">
            Loading setup items...
          </div>
        ) : setupItems.length > 0 ? (
          setupItems.map((item) => (
            <div
              key={item._id}
              className="rounded-[24px] bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#fff2d8]">
                  <Package size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-base font-black">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-xs font-black uppercase tracking-wide text-[#9a6b3e]">
                    {getLocationName(item)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-[16px] bg-[#fff8ea] p-3">
                  <p className="text-xs font-black text-[#9a6b3e]">Category</p>
                  <p className="mt-1 font-black capitalize">{item.category}</p>
                </div>

                <div className="rounded-[16px] bg-[#fff8ea] p-3">
                  <p className="text-xs font-black text-[#9a6b3e]">Qty</p>
                  <p className="mt-1 font-black">
                    {Number(item.quantity || 0).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="rounded-[16px] bg-[#fff8ea] p-3">
                  <p className="text-xs font-black text-[#9a6b3e]">
                    Price / Item
                  </p>
                  <p className="mt-1 font-black">
                    {formatMoney(item.pricePerItem)}
                  </p>
                </div>

                <div className="rounded-[16px] bg-[#fff8ea] p-3">
                  <p className="text-xs font-black text-[#9a6b3e]">Total</p>
                  <p className="mt-1 font-black">
                    {formatMoney(item.totalPrice)}
                  </p>
                </div>

                <div className="col-span-2 rounded-[16px] bg-[#fff8ea] p-3">
                  <p className="text-xs font-black text-[#9a6b3e]">Date</p>
                  <p className="mt-1 font-black">
                    {formatDate(item.purchaseDate)}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[24px] bg-white p-5 text-center font-bold text-[#9a6b3e] shadow-sm">
            No setup items found
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-[16px] bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[#fff8ea]">
              <tr>
                <th className="px-5 py-4">Item</th>
                <th className="px-5 py-4">Location</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Qty</th>
                <th className="px-5 py-4">Price / Item</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Date</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center font-bold text-[#9a6b3e]"
                  >
                    Loading setup items...
                  </td>
                </tr>
              ) : setupItems.length > 0 ? (
                setupItems.map((item) => (
                  <tr key={item._id} className="border-t border-[#eadcc5]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-[#fff2d8]">
                          <Package size={18} />
                        </div>
                        <span className="font-black">{item.name}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-semibold">
                      {getLocationName(item)}
                    </td>

                    <td className="px-5 py-4 font-semibold capitalize">
                      {item.category}
                    </td>

                    <td className="px-5 py-4 font-semibold">
                      {Number(item.quantity || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-4 font-semibold">
                      {formatMoney(item.pricePerItem)}
                    </td>

                    <td className="px-5 py-4 font-black">
                      {formatMoney(item.totalPrice)}
                    </td>

                    <td className="px-5 py-4 font-semibold">
                      {formatDate(item.purchaseDate)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center font-bold text-[#9a6b3e]"
                  >
                    No setup items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} title="Add Setup Item" onClose={handleCloseModal}>
        <form className="space-y-3">
          <select
            className="input"
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
            className="input"
            name="name"
            value={form.name}
            onChange={handleChange}
            disabled={saving}
            placeholder="Item name e.g. Cart"
          />

          <select
            className="input"
            name="category"
            value={form.category}
            onChange={handleChange}
            disabled={saving}
          >
            <option value="">Select category</option>
            <option value="cart">Cart</option>
            <option value="equipment">Equipment</option>
            <option value="utensil">Utensil</option>
            <option value="branding">Branding</option>
            <option value="license">License</option>
            <option value="misc">Misc</option>
          </select>

          <input
            className="input"
            name="quantity"
            value={form.quantity}
            onChange={handleChange}
            disabled={saving}
            type="number"
            placeholder="Quantity"
          />

          <input
            className="input"
            name="pricePerItem"
            value={form.pricePerItem}
            onChange={handleChange}
            disabled={saving}
            type="number"
            placeholder="Price per item"
          />

          <input
            className="input"
            name="purchaseDate"
            value={form.purchaseDate}
            onChange={handleChange}
            disabled={saving}
            type="date"
          />

          <textarea
            className="input min-h-[100px] resize-none"
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
            className="w-full rounded-[16px] bg-[#2a1608] py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Setup Item"}
          </button>
        </form>
      </Modal>
    </div>
  );
}