"use client";

import { useEffect, useState } from "react";
import { Plus, Utensils } from "lucide-react";
import Modal from "./Modal";
import api from "@/utils/api";

export default function RecipeItemsPage({ selectedLocation = "all" }) {
  const [open, setOpen] = useState(false);
  const [recipeItems, setRecipeItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    location: "",
    name: "",
    unit: "",
    pricePerUnit: "",
    currentStock: "",
    minStockAlert: "",
  });

  const resetForm = () => {
    setForm({
      location: selectedLocation !== "all" ? selectedLocation : "",
      name: "",
      unit: "",
      pricePerUnit: "",
      currentStock: "",
      minStockAlert: "",
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

  const fetchRecipeItems = async () => {
    try {
      setLoading(true);

      const url =
        selectedLocation && selectedLocation !== "all"
          ? `/recipe-items?locationId=${selectedLocation}`
          : "/recipe-items";

      const { data } = await api.get(url);
      setRecipeItems(data?.items || []);
    } catch (error) {
      console.error("Fetch recipe items error:", error);
      setRecipeItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchRecipeItems();

    if (selectedLocation !== "all") {
      setForm((prev) => ({
        ...prev,
        location: selectedLocation,
      }));
    }
  }, [selectedLocation]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
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
      location: item.location?._id || item.location,
      name: item.name || "",
      unit: item.unit || "",
      pricePerUnit: item.pricePerUnit ?? "",
      currentStock: item.currentStock ?? "",
      minStockAlert: item.minStockAlert ?? "",
    });

    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    setEditingItem(null);
    resetForm();
  };

  const handleSave = async () => {
    try {
      if (!form.location) return alert("Location is required");
      if (!form.name.trim()) return alert("Item name is required");
      if (!form.unit) return alert("Unit is required");

      const payload = {
        location: form.location,
        name: form.name,
        unit: form.unit,
        pricePerUnit: Number(form.pricePerUnit || 0),
        currentStock: Number(form.currentStock || 0),
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
      alert("Failed to save item");
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
      alert("Failed to delete item");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[28px] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black">Recipe Items</h2>
          <p className="text-sm font-semibold text-[#9a6b3e]">
            Raw materials used to make Badam Ragda
          </p>
        </div>

        <button
          onClick={handleAddOpen}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#2a1608] px-5 py-3 font-black text-white"
        >
          <Plus size={18} />
          Add Item
        </button>
      </div>

      <div className="overflow-hidden rounded-[28px] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-[#fff8ea]">
              <tr>
                <th className="px-5 py-4">Item</th>
                <th className="px-5 py-4">Unit</th>
                <th className="px-5 py-4">Price / Unit</th>
                <th className="px-5 py-4">Current Stock</th>
                <th className="px-5 py-4">Min Alert</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center font-bold text-[#9a6b3e]"
                  >
                    Loading recipe items...
                  </td>
                </tr>
              ) : recipeItems.length > 0 ? (
                recipeItems.map((item) => (
                  <tr key={item._id} className="border-t border-[#eadcc5]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff2d8]">
                          <Utensils size={18} />
                        </div>
                        <span className="font-black">{item.name}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-semibold">{item.unit}</td>

                    <td className="px-5 py-4 font-semibold">
                      ₹{Number(item.pricePerUnit || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-4 font-semibold">
                      {Number(item.currentStock || 0).toLocaleString("en-IN")}{" "}
                      {item.unit}
                    </td>

                    <td className="px-5 py-4 font-semibold">
                      {Number(item.minStockAlert || 0).toLocaleString("en-IN")}{" "}
                      {item.unit}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-sm font-black text-blue-600"
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
                    colSpan={6}
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
            placeholder="Item name e.g. Badam"
          />

          <select
            className="input"
            name="unit"
            value={form.unit}
            onChange={handleChange}
          >
            <option value="">Select unit</option>
            <option value="kg">Kg</option>
            <option value="gm">Gram</option>
            <option value="ltr">Liter</option>
            <option value="ml">ML</option>
            <option value="pcs">Pieces</option>
          </select>

          <input
            className="input"
            name="pricePerUnit"
            value={form.pricePerUnit}
            onChange={handleChange}
            type="number"
            placeholder="Price per unit e.g. 900"
          />

          <input
            className="input"
            name="currentStock"
            value={form.currentStock}
            onChange={handleChange}
            type="number"
            placeholder="Current stock e.g. 5"
          />

          <input
            className="input"
            name="minStockAlert"
            value={form.minStockAlert}
            onChange={handleChange}
            type="number"
            placeholder="Minimum stock alert e.g. 1"
          />

          <button
            type="button"
            onClick={handleSave}
            className="w-full rounded-2xl bg-[#2a1608] py-3 font-black text-white"
          >
            {editingItem ? "Update Item" : "Save Item"}
          </button>
        </form>
      </Modal>
    </div>
  );
}