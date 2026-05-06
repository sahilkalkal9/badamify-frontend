"use client";

import { useEffect, useState } from "react";
import { Plus, Utensils } from "lucide-react";
import Modal from "./Modal";
import api from "@/utils/api";

export default function RecipeItemsPage() {
  const [open, setOpen] = useState(false);
  const [recipeItems, setRecipeItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    unit: "",
    pricePerUnit: "",
    minStockAlert: "",
  });

  const resetForm = () => {
    setForm({
      name: "",
      unit: "",
      pricePerUnit: "",
      minStockAlert: "",
    });
  };

  const fetchRecipeItems = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/recipe-items");

      setRecipeItems(data?.items || []);
    } catch (error) {
      console.error("Fetch recipe items error:", error);
      setRecipeItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipeItems();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddOpen = () => {
    setEditingItem(null);
    resetForm();
    setOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);

    setForm({
      name: item.name || "",
      unit: item.unit || "",
      pricePerUnit: item.pricePerUnit ?? "",
      minStockAlert: item.minStockAlert ?? "",
    });

    setOpen(true);
  };

  const handleCloseModal = () => {
    if (saving) return;

    setOpen(false);
    setEditingItem(null);
    resetForm();
  };

  const handleSave = async () => {
    if (saving) return;

    try {
      if (!form.name.trim()) return alert("Item name is required");
      if (!form.unit) return alert("Unit is required");

      if (Number(form.pricePerUnit || 0) < 0) {
        return alert("Price per unit cannot be negative");
      }

      if (Number(form.minStockAlert || 0) < 0) {
        return alert("Minimum stock alert cannot be negative");
      }

      setSaving(true);

      const payload = {
        name: form.name.trim(),
        unit: form.unit,
        pricePerUnit: Number(form.pricePerUnit || 0),
        minStockAlert: Number(form.minStockAlert || 0),
      };

      if (editingItem) {
        await api.put(`/recipe-items/${editingItem._id}`, payload);
      } else {
        await api.post("/recipe-items", payload);
      }

      setEditingItem(null);
      resetForm();
      setOpen(false);
      fetchRecipeItems();
    } catch (error) {
      console.error("Save recipe item error:", error);
      alert(error?.response?.data?.message || "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    try {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete "${item.name}"?`
      );

      if (!confirmDelete) return;

      setDeletingId(item._id);

      await api.delete(`/recipe-items/${item._id}`);

      fetchRecipeItems();
    } catch (error) {
      console.error("Delete recipe item error:", error);
      alert(error?.response?.data?.message || "Failed to delete item");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="rounded-[16px] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-black leading-tight text-[#2a1608] sm:text-2xl">
              Recipe Items
            </h2>

            <p className="mt-1 text-xs font-semibold leading-relaxed text-[#9a6b3e] sm:text-sm">
              Common raw materials used to make Badam Ragda
            </p>
          </div>

          <button
            onClick={handleAddOpen}
            className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#2a1608] px-4 py-3 text-sm font-black text-white sm:w-auto sm:rounded-[16px] sm:px-5"
          >
            <Plus size={18} />
            Add Item
          </button>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-[16px] bg-white px-4 py-10 text-center text-sm font-bold text-[#9a6b3e] shadow-sm">
            Loading recipe items...
          </div>
        ) : recipeItems.length > 0 ? (
          recipeItems.map((item) => (
            <div
              key={item._id}
              className="rounded-[16px] bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#fff2d8]">
                  <Utensils size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-sm font-black text-[#2a1608]">
                    {item.name}
                  </h3>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-[12px] bg-[#fff8ea] p-3">
                      <p className="font-bold text-[#9a6b3e]">Unit</p>
                      <p className="mt-1 font-black text-[#2a1608]">
                        {item.unit}
                      </p>
                    </div>

                    <div className="rounded-[12px] bg-[#fff8ea] p-3">
                      <p className="font-bold text-[#9a6b3e]">Price / Unit</p>
                      <p className="mt-1 font-black text-[#2a1608]">
                        ₹
                        {Number(item.pricePerUnit || 0).toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>

                    <div className="col-span-2 rounded-[12px] bg-[#fff8ea] p-3">
                      <p className="font-bold text-[#9a6b3e]">Min Alert</p>
                      <p className="mt-1 font-black text-[#2a1608]">
                        {Number(item.minStockAlert || 0).toLocaleString(
                          "en-IN"
                        )}{" "}
                        {item.unit}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      disabled={saving}
                      className="rounded-[12px] border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item._id}
                      className="rounded-[12px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === item._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[16px] bg-white px-4 py-10 text-center text-sm font-bold text-[#9a6b3e] shadow-sm">
            No recipe items found
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-[16px] bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#fff8ea]">
              <tr>
                <th className="px-4 py-4 font-black text-[#2a1608] lg:px-5">
                  Item
                </th>
                <th className="px-4 py-4 font-black text-[#2a1608] lg:px-5">
                  Unit
                </th>
                <th className="px-4 py-4 font-black text-[#2a1608] lg:px-5">
                  Price / Unit
                </th>
                <th className="px-4 py-4 font-black text-[#2a1608] lg:px-5">
                  Min Alert
                </th>
                <th className="px-4 py-4 font-black text-[#2a1608] lg:px-5">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center font-bold text-[#9a6b3e]"
                  >
                    Loading recipe items...
                  </td>
                </tr>
              ) : recipeItems.length > 0 ? (
                recipeItems.map((item) => (
                  <tr key={item._id} className="border-t border-[#eadcc5]">
                    <td className="px-4 py-4 lg:px-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-[#fff2d8]">
                          <Utensils size={18} />
                        </div>

                        <span className="break-words font-black text-[#2a1608]">
                          {item.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 font-semibold lg:px-5">
                      {item.unit}
                    </td>

                    <td className="px-4 py-4 font-semibold lg:px-5">
                      ₹{Number(item.pricePerUnit || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="px-4 py-4 font-semibold lg:px-5">
                      {Number(item.minStockAlert || 0).toLocaleString("en-IN")}{" "}
                      {item.unit}
                    </td>

                    <td className="px-4 py-4 lg:px-5">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEdit(item)}
                          disabled={saving}
                          className="text-sm font-black text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item._id}
                          className="text-sm font-black text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === item._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center font-bold text-[#9a6b3e]"
                  >
                    No recipe items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={open}
        title={editingItem ? "Edit Recipe Item" : "Add Recipe Item"}
        onClose={handleCloseModal}
      >
        <form className="max-h-[75vh] space-y-3 overflow-y-auto pr-1 sm:max-h-none sm:overflow-visible sm:pr-0">
          <input
            className="input text-sm"
            name="name"
            value={form.name}
            onChange={handleChange}
            disabled={saving}
            placeholder="Item name e.g. Badam"
          />

          <select
            className="input text-sm"
            name="unit"
            value={form.unit}
            onChange={handleChange}
            disabled={saving}
          >
            <option value="">Select unit</option>
            <option value="kg">Kg</option>
            <option value="gm">Gram</option>
            <option value="ltr">Liter</option>
            <option value="ml">ML</option>
            <option value="pcs">Pieces</option>
          </select>

          <input
            className="input text-sm"
            name="pricePerUnit"
            value={form.pricePerUnit}
            onChange={handleChange}
            disabled={saving}
            type="number"
            min="0"
            placeholder="Price per unit e.g. 900"
          />

          <input
            className="input text-sm"
            name="minStockAlert"
            value={form.minStockAlert}
            onChange={handleChange}
            disabled={saving}
            type="number"
            min="0"
            placeholder="Minimum stock alert e.g. 1"
          />

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-[14px] bg-[#2a1608] py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-[16px]"
          >
            {saving
              ? editingItem
                ? "Updating..."
                : "Saving..."
              : editingItem
                ? "Update Item"
                : "Save Item"}
          </button>
        </form>
      </Modal>
    </div>
  );
}