"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Factory, Trash2, CalendarDays } from "lucide-react";
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

export default function ProductionPage({ selectedLocation = "all" }) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [loading, setLoading] = useState(false);

  const [productions, setProductions] = useState([]);
  const [locations, setLocations] = useState([]);
  const [recipeItems, setRecipeItems] = useState([]);

  const [form, setForm] = useState({
    location: "",
    date: getToday(),
    totalPreparedLiters: "",
    estimatedGlasses: "",
    notes: "",
  });

  const [usedItems, setUsedItems] = useState([
    { item: "", quantityUsed: "", unit: "", pricePerUnit: 0 },
  ]);

  const fetchLocations = async () => {
    try {
      const { data } = await api.get("/locations");
      setLocations(data?.locations || []);
    } catch (error) {
      console.error("Fetch locations error:", error);
    }
  };

  const fetchRecipeItems = async () => {
    try {
      const query =
        selectedLocation && selectedLocation !== "all"
          ? `?locationId=${selectedLocation}`
          : "";

      const { data } = await api.get(`/recipe-items${query}`);
      setRecipeItems(data?.items || []);
    } catch (error) {
      console.error("Fetch recipe items error:", error);
      setRecipeItems([]);
    }
  };

  const fetchProductions = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (selectedLocation && selectedLocation !== "all") {
        params.append("locationId", selectedLocation);
      }

      if (selectedDate) {
        params.append("date", selectedDate);
      }

      const { data } = await api.get(`/daily-production?${params.toString()}`);
      setProductions(data?.productions || []);
    } catch (error) {
      console.error("Fetch production error:", error);
      setProductions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchRecipeItems();
    fetchProductions();

    if (selectedLocation !== "all") {
      setForm((prev) => ({
        ...prev,
        location: selectedLocation,
      }));
    }
  }, [selectedLocation, selectedDate]);

  const filteredItemsForModal = useMemo(() => {
    if (!form.location) return recipeItems;

    return recipeItems.filter((item) => {
      const itemLocation =
        typeof item.location === "object" ? item.location?._id : item.location;

      return itemLocation === form.location;
    });
  }, [form.location, recipeItems]);

  const selectedPrepared = productions.reduce(
    (sum, item) => sum + Number(item.totalPreparedLiters || 0),
    0
  );

  const selectedGlasses = productions.reduce(
    (sum, item) => sum + Number(item.estimatedGlasses || 0),
    0
  );

  const selectedMakingCost = productions.reduce(
    (sum, item) => sum + Number(item.totalMakingCost || 0),
    0
  );

  const selectedStockConsumed = productions.reduce(
    (sum, item) => sum + Number(item.itemsUsed?.length || 0),
    0
  );

  const addUsedItem = () => {
    setUsedItems([
      ...usedItems,
      { item: "", quantityUsed: "", unit: "", pricePerUnit: 0 },
    ]);
  };

  const removeUsedItem = (index) => {
    setUsedItems(usedItems.filter((_, i) => i !== index));
  };

  const updateUsedItem = (index, field, value) => {
    const updated = [...usedItems];

    if (field === "item") {
      const selected = recipeItems.find((item) => item._id === value);

      updated[index] = {
        ...updated[index],
        item: value,
        unit: selected?.unit || "",
        pricePerUnit: selected?.pricePerUnit || 0,
      };
    } else {
      updated[index][field] = value;
    }

    setUsedItems(updated);
  };

  const totalMakingCost = usedItems.reduce((sum, item) => {
    return sum + Number(item.quantityUsed || 0) * Number(item.pricePerUnit || 0);
  }, 0);

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    if (name === "location") {
      setForm((prev) => ({
        ...prev,
        location: value,
      }));

      setUsedItems([{ item: "", quantityUsed: "", unit: "", pricePerUnit: 0 }]);
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      if (!form.location) return alert("Location is required");
      if (!form.date) return alert("Date is required");
      if (!form.totalPreparedLiters) return alert("Prepared liters is required");

      const validItems = usedItems.filter(
        (item) => item.item && Number(item.quantityUsed || 0) > 0
      );

      if (!validItems.length) return alert("At least one used item is required");

      await api.post("/daily-production", {
        location: form.location,
        date: form.date,
        totalPreparedLiters: Number(form.totalPreparedLiters || 0),
        estimatedGlasses: Number(form.estimatedGlasses || 0),
        itemsUsed: validItems.map((item) => ({
          item: item.item,
          quantityUsed: Number(item.quantityUsed || 0),
        })),
        notes: form.notes,
      });

      setForm({
        location: selectedLocation !== "all" ? selectedLocation : "",
        date: selectedDate,
        totalPreparedLiters: "",
        estimatedGlasses: "",
        notes: "",
      });

      setUsedItems([{ item: "", quantityUsed: "", unit: "", pricePerUnit: 0 }]);
      setOpen(false);
      fetchProductions();
      fetchRecipeItems();
    } catch (error) {
      console.error("Create production error:", error);
      alert(error?.response?.data?.message || "Failed to save production");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[28px] bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-black">Daily Production</h2>
          <p className="text-sm font-semibold text-[#9a6b3e]">
            Date-wise Badam Ragda batch and consumed items
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
            Add Production
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Selected Production"
          value={loading ? "Loading..." : `${selectedPrepared} Ltr`}
        />
        <SummaryCard
          title="Estimated Glasses"
          value={loading ? "Loading..." : selectedGlasses}
        />
        <SummaryCard
          title="Making Cost"
          value={
            loading
              ? "Loading..."
              : `₹${selectedMakingCost.toLocaleString("en-IN")}`
          }
        />
        <SummaryCard
          title="Stock Consumed"
          value={loading ? "Loading..." : `${selectedStockConsumed} Items`}
        />
      </div>

      <div className="rounded-[28px] bg-[#2a1608] p-5 text-white shadow-sm">
        <p className="text-sm font-semibold text-[#f2c078]">
          Production Rule
        </p>
        <h2 className="mt-1 text-2xl font-black">
          Production = Stock consume, not new investment
        </h2>
        <p className="mt-2 text-sm text-white/70">
          Jo raw material production me use hoga, backend me stock reduce hoga
          and making cost calculate hogi.
        </p>
      </div>

      <div className="overflow-hidden rounded-[28px] bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-[#eadcc5] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff2d8]">
            <Factory size={18} />
          </div>
          <div>
            <h3 className="text-xl font-black">Production History</h3>
            <p className="text-sm font-semibold text-[#9a6b3e]">
              Showing production for {selectedDate}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-[#fff8ea]">
              <tr>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Prepared</th>
                <th className="px-5 py-4">Estimated Glasses</th>
                <th className="px-5 py-4">Making Cost</th>
                <th className="px-5 py-4">Notes</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center font-bold text-[#9a6b3e]"
                  >
                    Loading production...
                  </td>
                </tr>
              ) : productions.length > 0 ? (
                productions.map((item) => (
                  <tr key={item._id} className="border-t border-[#eadcc5]">
                    <td className="px-5 py-4 font-semibold">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-5 py-4 font-black">
                      {item.totalPreparedLiters} ltr
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      {item.estimatedGlasses}
                    </td>
                    <td className="px-5 py-4 font-black">
                      ₹
                      {Number(item.totalMakingCost || 0).toLocaleString(
                        "en-IN"
                      )}
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      {item.notes || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center font-bold text-[#9a6b3e]"
                  >
                    No production found for this date
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={open}
        title="Add Daily Production"
        onClose={() => setOpen(false)}
      >
        <form className="space-y-4">
          <select
            className="input"
            name="location"
            value={form.location}
            onChange={handleFormChange}
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
            onChange={handleFormChange}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="input"
              name="totalPreparedLiters"
              value={form.totalPreparedLiters}
              onChange={handleFormChange}
              type="number"
              placeholder="Total prepared liters"
            />

            <input
              className="input"
              name="estimatedGlasses"
              value={form.estimatedGlasses}
              onChange={handleFormChange}
              type="number"
              placeholder="Estimated glasses"
            />
          </div>

          <div className="rounded-2xl bg-[#fff8ea] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-black">Items Used</h3>

              <button
                type="button"
                onClick={addUsedItem}
                className="rounded-xl bg-[#2a1608] px-3 py-2 text-xs font-black text-white"
              >
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {usedItems.map((used, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-2xl bg-white p-3 sm:grid-cols-[1fr_120px_40px]"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      className="input"
                      value={used.item}
                      onChange={(e) =>
                        updateUsedItem(index, "item", e.target.value)
                      }
                    >
                      <option value="">Select item</option>
                      {filteredItemsForModal.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name} - ₹{item.pricePerUnit}/{item.unit}
                        </option>
                      ))}
                    </select>

                    <input
                      className="input"
                      type="number"
                      placeholder={`Qty ${used.unit ? `(${used.unit})` : ""}`}
                      value={used.quantityUsed}
                      onChange={(e) =>
                        updateUsedItem(index, "quantityUsed", e.target.value)
                      }
                    />
                  </div>

                  <div className="rounded-2xl bg-[#fff8ea] px-3 py-3 text-sm font-black">
                    ₹
                    {Number(used.quantityUsed || 0) *
                      Number(used.pricePerUnit || 0)}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeUsedItem(index)}
                    className="flex h-12 items-center justify-center rounded-2xl bg-red-100 text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#2a1608] p-4 text-white">
            <p className="text-sm font-semibold text-[#f2c078]">
              Total Making Cost
            </p>
            <h3 className="text-2xl font-black">
              ₹{totalMakingCost.toLocaleString("en-IN")}
            </h3>
          </div>

          <textarea
            className="input min-h-[100px] resize-none"
            name="notes"
            value={form.notes}
            onChange={handleFormChange}
            placeholder="Notes"
          />

          <button
            type="button"
            onClick={handleSave}
            className="w-full rounded-2xl bg-[#2a1608] py-3 font-black text-white"
          >
            Save Production
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