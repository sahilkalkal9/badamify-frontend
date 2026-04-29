"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Factory, Trash2, CalendarDays, Pencil } from "lucide-react";
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

export default function ProductionPage({ selectedLocation = "all" }) {
  const [open, setOpen] = useState(false);
  const [editingProduction, setEditingProduction] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

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

  const resetForm = () => {
    setEditingProduction(null);
    setForm({
      location: selectedLocation !== "all" ? selectedLocation : "",
      date: selectedDate,
      totalPreparedLiters: "",
      estimatedGlasses: "",
      notes: "",
    });
    setUsedItems([{ item: "", quantityUsed: "", unit: "", pricePerUnit: 0 }]);
  };

  const getLocationId = (value) => {
    return typeof value === "object" ? value?._id : value;
  };

  const getItemId = (value) => {
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
    if (usedItems.length === 1) return;
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

  const handleOpenAdd = () => {
    setEditingProduction(null);
    setForm({
      location: selectedLocation !== "all" ? selectedLocation : "",
      date: selectedDate,
      totalPreparedLiters: "",
      estimatedGlasses: "",
      notes: "",
    });
    setUsedItems([{ item: "", quantityUsed: "", unit: "", pricePerUnit: 0 }]);
    setOpen(true);
  };

  const handleEdit = (production) => {
    setEditingProduction(production);

    setForm({
      location: getLocationId(production.location) || "",
      date: toDateInput(production.date),
      totalPreparedLiters: production.totalPreparedLiters || "",
      estimatedGlasses: production.estimatedGlasses || "",
      notes: production.notes || "",
    });

    const mappedItems =
      production.itemsUsed?.length > 0
        ? production.itemsUsed.map((used) => {
            const itemId = getItemId(used.item);
            const selected = recipeItems.find((item) => item._id === itemId);

            return {
              item: itemId || "",
              quantityUsed: used.quantityUsed || "",
              unit: used.unit || selected?.unit || "",
              pricePerUnit: used.pricePerUnit || selected?.pricePerUnit || 0,
            };
          })
        : [{ item: "", quantityUsed: "", unit: "", pricePerUnit: 0 }];

    setUsedItems(mappedItems);
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
      if (!form.totalPreparedLiters) return alert("Prepared liters is required");

      const validItems = usedItems.filter(
        (item) => item.item && Number(item.quantityUsed || 0) > 0
      );

      if (!validItems.length) return alert("At least one used item is required");

      setSaving(true);

      const payload = {
        location: form.location,
        date: form.date,
        totalPreparedLiters: Number(form.totalPreparedLiters || 0),
        estimatedGlasses: Number(form.estimatedGlasses || 0),
        itemsUsed: validItems.map((item) => ({
          item: item.item,
          quantityUsed: Number(item.quantityUsed || 0),
        })),
        notes: form.notes,
      };

      if (editingProduction?._id) {
        await api.put(`/daily-production/${editingProduction._id}`, payload);
      } else {
        await api.post("/daily-production", payload);
      }

      resetForm();
      setOpen(false);
      fetchProductions();
      fetchRecipeItems();
    } catch (error) {
      console.error("Save production error:", error);
      alert(error?.response?.data?.message || "Failed to save production");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (production) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete production of ${formatDate(
        production.date
      )}?`
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(production._id);
      await api.delete(`/daily-production/${production._id}`);
      fetchProductions();
      fetchRecipeItems();
    } catch (error) {
      console.error("Delete production error:", error);
      alert(error?.response?.data?.message || "Failed to delete production");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-4 rounded-[16px] bg-white p-4 shadow-sm sm:p-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-black leading-tight sm:text-2xl">
            Daily Production
          </h2>
          <p className="mt-1 text-xs font-semibold text-[#9a6b3e] sm:text-sm">
            Date-wise Badam Ragda batch and consumed items
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3 xl:justify-end">
          <button
            onClick={() => setSelectedDate(getToday())}
            className="rounded-[14px] bg-[#fff2d8] px-3 py-3 text-xs font-black text-[#2a1608] sm:px-4 sm:text-sm"
          >
            Today
          </button>

          <button
            onClick={() => setSelectedDate(getYesterday())}
            className="rounded-[14px] bg-[#fff2d8] px-3 py-3 text-xs font-black text-[#2a1608] sm:px-4 sm:text-sm"
          >
            Yesterday
          </button>

          <div className="col-span-2 flex min-w-0 items-center gap-2 rounded-[14px] border border-[#eadcc5] bg-[#fff8ea] px-3 py-3 sm:col-span-1 sm:px-4">
            <CalendarDays size={17} className="shrink-0" />
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
            <Plus size={18} />
            Add Production
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
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

      <div className="rounded-[16px] bg-[#2a1608] p-4 text-white shadow-sm sm:p-5">
        <p className="text-xs font-semibold text-[#f2c078] sm:text-sm">
          Production Rule
        </p>
        <h2 className="mt-1 text-lg font-black leading-tight sm:text-2xl">
          Production = Stock consume, not new investment
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-white/70 sm:text-sm">
          Jo raw material production me use hoga, backend me stock reduce hoga
          and making cost calculate hogi.
        </p>
      </div>

      <div className="overflow-hidden rounded-[16px] bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-[#eadcc5] p-4 sm:items-center sm:p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#fff2d8]">
            <Factory size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-black leading-tight sm:text-xl">
              Production History
            </h3>
            <p className="mt-1 text-xs font-semibold text-[#9a6b3e] sm:text-sm">
              Showing production for {selectedDate}
            </p>
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#fff8ea]">
              <tr>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Prepared</th>
                <th className="px-5 py-4">Estimated Glasses</th>
                <th className="px-5 py-4">Making Cost</th>
                <th className="px-5 py-4">Notes</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
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
                    <td className="max-w-[260px] px-5 py-4 font-semibold">
                      <span className="line-clamp-2">{item.notes || "-"}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          disabled={deletingId === item._id}
                          className="rounded-[12px] bg-[#fff2d8] p-2 text-[#2a1608] disabled:opacity-60"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item._id}
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
                    colSpan={6}
                    className="px-5 py-10 text-center font-bold text-[#9a6b3e]"
                  >
                    No production found for this date
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {loading ? (
            <div className="rounded-[16px] bg-[#fff8ea] p-5 text-center text-sm font-bold text-[#9a6b3e]">
              Loading production...
            </div>
          ) : productions.length > 0 ? (
            productions.map((item) => (
              <div
                key={item._id}
                className="rounded-[16px] border border-[#eadcc5] bg-[#fffaf2] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[#9a6b3e]">Date</p>
                    <h4 className="text-sm font-black">
                      {formatDate(item.date)}
                    </h4>
                  </div>

                  <div className="rounded-full bg-[#2a1608] px-3 py-1 text-xs font-black text-white">
                    {item.totalPreparedLiters} ltr
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-[14px] bg-white p-3">
                    <p className="text-[11px] font-bold text-[#9a6b3e]">
                      Glasses
                    </p>
                    <p className="mt-1 text-sm font-black">
                      {item.estimatedGlasses}
                    </p>
                  </div>

                  <div className="rounded-[14px] bg-white p-3">
                    <p className="text-[11px] font-bold text-[#9a6b3e]">
                      Making Cost
                    </p>
                    <p className="mt-1 text-sm font-black">
                      ₹
                      {Number(item.totalMakingCost || 0).toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-[14px] bg-white p-3">
                  <p className="text-[11px] font-bold text-[#9a6b3e]">Notes</p>
                  <p className="mt-1 break-words text-sm font-semibold">
                    {item.notes || "-"}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleEdit(item)}
                    disabled={deletingId === item._id}
                    className="flex items-center justify-center gap-2 rounded-[14px] bg-[#fff2d8] px-4 py-3 text-sm font-black text-[#2a1608] disabled:opacity-60"
                  >
                    <Pencil size={16} />
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item._id}
                    className="flex items-center justify-center gap-2 rounded-[14px] bg-red-50 px-4 py-3 text-sm font-black text-red-600 disabled:opacity-60"
                  >
                    <Trash2 size={16} />
                    {deletingId === item._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[16px] bg-[#fff8ea] p-5 text-center text-sm font-bold text-[#9a6b3e]">
              No production found for this date
            </div>
          )}
        </div>
      </div>

      <Modal
        open={open}
        title={editingProduction ? "Edit Daily Production" : "Add Daily Production"}
        onClose={handleCloseModal}
      >
        <form className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-black text-[#9a6b3e]">
              Location *
            </label>
            <select
              className="input text-sm"
              name="location"
              value={form.location}
              onChange={handleFormChange}
              disabled={selectedLocation !== "all" || saving}
            >
              <option value="">Select location</option>
              {locations.map((location) => (
                <option key={location._id} value={location._id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-black text-[#9a6b3e]">
              Date *
            </label>
            <input
              className="input text-sm"
              name="date"
              type="date"
              value={form.date}
              max={getToday()}
              onChange={handleFormChange}
              disabled={saving}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-black text-[#9a6b3e]">
                Total Prepared Liters *
              </label>
              <input
                className="input text-sm"
                name="totalPreparedLiters"
                value={form.totalPreparedLiters}
                onChange={handleFormChange}
                disabled={saving}
                type="number"
                placeholder="Total prepared liters"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-black text-[#9a6b3e]">
                Estimated Glasses
              </label>
              <input
                className="input text-sm"
                name="estimatedGlasses"
                value={form.estimatedGlasses}
                onChange={handleFormChange}
                disabled={saving}
                type="number"
                placeholder="Estimated glasses"
              />
            </div>
          </div>

          <div className="rounded-[16px] bg-[#fff8ea] p-3 sm:p-4">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-black">Items Used *</h3>

              <button
                type="button"
                onClick={addUsedItem}
                disabled={saving}
                className="w-full rounded-xl bg-[#2a1608] px-3 py-2 text-xs font-black text-white disabled:opacity-60 sm:w-auto"
              >
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {usedItems.map((used, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-[16px] bg-white p-3 lg:grid-cols-[1fr_120px_48px]"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      className="input min-w-0 text-sm"
                      value={used.item}
                      disabled={saving}
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
                      className="input text-sm"
                      type="number"
                      disabled={saving}
                      placeholder={`Qty ${used.unit ? `(${used.unit})` : ""}`}
                      value={used.quantityUsed}
                      onChange={(e) =>
                        updateUsedItem(index, "quantityUsed", e.target.value)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-[16px] bg-[#fff8ea] px-3 py-3 text-sm font-black lg:block">
                    <span className="text-xs text-[#9a6b3e] lg:hidden">
                      Cost
                    </span>
                    <span>
                      ₹
                      {Number(used.quantityUsed || 0) *
                        Number(used.pricePerUnit || 0)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeUsedItem(index)}
                    disabled={usedItems.length === 1 || saving}
                    className="flex h-11 w-full items-center justify-center rounded-[16px] bg-red-100 text-red-700 disabled:cursor-not-allowed disabled:opacity-50 lg:h-12"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[16px] bg-[#2a1608] p-4 text-white">
            <p className="text-xs font-semibold text-[#f2c078] sm:text-sm">
              Total Making Cost
            </p>
            <h3 className="text-xl font-black sm:text-2xl">
              ₹{totalMakingCost.toLocaleString("en-IN")}
            </h3>
          </div>

          <div>
            <label className="mb-1 block text-xs font-black text-[#9a6b3e]">
              Notes
            </label>
            <textarea
              className="input min-h-[100px] resize-none text-sm"
              name="notes"
              value={form.notes}
              onChange={handleFormChange}
              disabled={saving}
              placeholder="Notes"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-[16px] bg-[#2a1608] py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
          >
            {saving
              ? editingProduction
                ? "Updating..."
                : "Saving..."
              : editingProduction
              ? "Update Production"
              : "Save Production"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="rounded-[16px] bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs font-black text-[#9a6b3e] sm:text-sm">{title}</p>
      <h3 className="mt-2 break-words text-xl font-black sm:text-2xl xl:text-3xl">
        {value}
      </h3>
    </div>
  );
}