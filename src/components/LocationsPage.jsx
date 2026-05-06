"use client";

import { useEffect, useState } from "react";
import { Plus, MapPin, Pencil, Trash2, X } from "lucide-react";
import Modal from "./Modal";
import api from "@/utils/api";

export default function LocationsPage() {
  const [open, setOpen] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    address: "",
    managerName: "",
    phone: "",
  });

  const isEditMode = Boolean(editId);

  const resetForm = () => {
    setForm({
      name: "",
      address: "",
      managerName: "",
      phone: "",
    });
    setEditId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setOpen(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setOpen(false);
    resetForm();
  };

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/locations");
      setLocations(data?.locations || []);
    } catch (error) {
      console.error("Fetch locations error:", error);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = (location) => {
    setEditId(location._id);

    setForm({
      name: location.name || "",
      address: location.address || "",
      managerName: location.managerName || "",
      phone: location.phone || "",
    });

    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!form.name.trim()) {
        alert("Location name is required");
        return;
      }

      setSaving(true);

      if (isEditMode) {
        await api.put(`/locations/${editId}`, form);
      } else {
        await api.post("/locations", form);
      }

      resetForm();
      setOpen(false);
      fetchLocations();
    } catch (error) {
      console.error("Save location error:", error);
      alert(isEditMode ? "Failed to update location" : "Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (location) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${location.name}"?`
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(location._id);

      await api.delete(`/locations/${location._id}`);

      setLocations((prev) =>
        prev.filter((item) => item._id !== location._id)
      );
    } catch (error) {
      console.error("Delete location error:", error);
      alert("Failed to delete location");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[16px] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-black sm:text-2xl">Locations</h2>
          <p className="mt-1 text-sm font-semibold text-[#9a6b3e]">
            Manage all Badamify carts/branches
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#2a1608] px-4 py-2.5 text-sm font-black text-white transition active:scale-[0.98] sm:w-auto sm:px-5 sm:py-3 sm:text-base"
        >
          <Plus size={18} />
          Add Location
        </button>
      </div>

      {loading ? (
        <div className="rounded-[16px] bg-white p-6 text-center font-black text-[#9a6b3e] shadow-sm sm:p-8">
          Loading locations...
        </div>
      ) : locations.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {locations.map((location) => (
            <div
              key={location._id}
              className="rounded-[16px] bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-[#fff2d8] sm:h-12 sm:w-12">
                  <MapPin size={18} />
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(location)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff7ea] text-[#2a1608] transition hover:bg-[#fff2d8] active:scale-95"
                    title="Edit location"
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(location)}
                    disabled={deletingId === location._id}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    title="Delete location"
                  >
                    {deletingId === location._id ? (
                      <X size={15} />
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="break-words text-base font-black sm:text-lg">
                  {location.name}
                </h3>

                <p className="mt-1 break-words text-xs font-semibold text-[#9a6b3e] sm:text-sm">
                  {location.address || "No address added"}
                </p>
              </div>

              <div className="mt-3 space-y-1.5 text-xs font-semibold sm:mt-4 sm:space-y-2 sm:text-sm">
                <p className="break-words">
                  Manager: {location.managerName || "-"}
                </p>
                <p className="break-words">Phone: {location.phone || "-"}</p>
                <p>
                  Status:{" "}
                  <span
                    className={
                      location.isActive ? "text-green-700" : "text-red-600"
                    }
                  >
                    {location.isActive ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[16px] bg-white p-6 text-center font-black text-[#9a6b3e] shadow-sm sm:p-8">
          No locations found
        </div>
      )}

      <Modal
        open={open}
        title={isEditMode ? "Edit Location" : "Add New Location"}
        onClose={handleCloseModal}
      >
        <form className="space-y-3">
          <input
            className="input w-full"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Location name"
          />

          <input
            className="input w-full"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Address"
          />

          <input
            className="input w-full"
            name="managerName"
            value={form.managerName}
            onChange={handleChange}
            placeholder="Manager name"
          />

          <input
            className="input w-full"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone number"
          />

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-[16px] bg-[#2a1608] py-2.5 text-sm font-black text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 sm:py-3 sm:text-base"
          >
            {saving
              ? isEditMode
                ? "Updating..."
                : "Saving..."
              : isEditMode
                ? "Update Location"
                : "Save Location"}
          </button>
        </form>
      </Modal>
    </div>
  );
}