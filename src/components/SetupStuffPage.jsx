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

  const [form, setForm] = useState({
    location: "",
    name: "",
    category: "",
    quantity: "",
    pricePerItem: "",
    purchaseDate: "",
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

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    try {
      if (!form.location) return alert("Location is required");
      if (!form.name.trim()) return alert("Item name is required");
      if (!form.category) return alert("Category is required");

      await api.post("/setup-stuff", {
        location: form.location,
        name: form.name,
        category: form.category,
        quantity: Number(form.quantity || 1),
        pricePerItem: Number(form.pricePerItem || 0),
        purchaseDate: form.purchaseDate || new Date().toISOString(),
        notes: form.notes,
      });

      setForm({
        location: selectedLocation !== "all" ? selectedLocation : "",
        name: "",
        category: "",
        quantity: "",
        pricePerItem: "",
        purchaseDate: "",
        notes: "",
      });

      setOpen(false);
      fetchSetupStuff();
    } catch (error) {
      console.error("Create setup stuff error:", error);
      alert("Failed to save setup item");
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] bg-[#2a1608] p-5 text-white shadow-sm">
        <p className="text-sm font-semibold text-[#f2c078]">
          Total Setup Investment
        </p>
        <h2 className="mt-1 text-3xl font-black">
          {loading ? "Loading..." : formatMoney(totalSetupInvestment)}
        </h2>
        <p className="mt-2 text-sm text-white/70">
          Cart, equipment, utensils, branding and other one-time setup items.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-[28px] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black">Setup Stuff</h2>
          <p className="text-sm font-semibold text-[#9a6b3e]">
            Add all one-time investment items
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#2a1608] px-5 py-3 font-black text-white"
        >
          <Plus size={18} />
          Add Setup Item
        </button>
      </div>

      <div className="overflow-hidden rounded-[28px] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-[#fff8ea]">
              <tr>
                <th className="px-5 py-4">Item</th>
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
                    colSpan={6}
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
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff2d8]">
                          <Package size={18} />
                        </div>
                        <span className="font-black">{item.name}</span>
                      </div>
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
                    colSpan={6}
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

      <Modal open={open} title="Add Setup Item" onClose={() => setOpen(false)}>
        <form className="space-y-3">
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
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Item name e.g. Cart"
          />

          <select
            className="input"
            name="category"
            value={form.category}
            onChange={handleChange}
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
            type="number"
            placeholder="Quantity"
          />

          <input
            className="input"
            name="pricePerItem"
            value={form.pricePerItem}
            onChange={handleChange}
            type="number"
            placeholder="Price per item"
          />

          <input
            className="input"
            name="purchaseDate"
            value={form.purchaseDate}
            onChange={handleChange}
            type="date"
          />

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
            Save Setup Item
          </button>
        </form>
      </Modal>
    </div>
  );
}