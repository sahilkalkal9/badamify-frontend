"use client";

import { useEffect, useState } from "react";
import { Plus, MapPin } from "lucide-react";
import Modal from "./Modal";
import api from "@/utils/api";

export default function LocationsPage() {
  const [open, setOpen] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    address: "",
    managerName: "",
    phone: "",
  });

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
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    try {
      if (!form.name.trim()) return alert("Location name is required");

      await api.post("/locations", form);

      setForm({
        name: "",
        address: "",
        managerName: "",
        phone: "",
      });

      setOpen(false);
      fetchLocations();
    } catch (error) {
      console.error("Create location error:", error);
      alert("Failed to save location");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[28px] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black">Locations</h2>
          <p className="text-sm font-semibold text-[#9a6b3e]">
            Manage all Badamify carts/branches
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#2a1608] px-5 py-3 font-black text-white"
        >
          <Plus size={18} />
          Add Location
        </button>
      </div>

      {loading ? (
        <div className="rounded-[28px] bg-white p-8 text-center font-black text-[#9a6b3e] shadow-sm">
          Loading locations...
        </div>
      ) : locations.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {locations.map((location) => (
            <div
              key={location._id}
              className="rounded-[28px] bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff2d8]">
                <MapPin size={22} />
              </div>

              <h3 className="text-lg font-black">{location.name}</h3>
              <p className="mt-1 text-sm font-semibold text-[#9a6b3e]">
                {location.address || "No address added"}
              </p>

              <div className="mt-4 space-y-2 text-sm font-semibold">
                <p>Manager: {location.managerName || "-"}</p>
                <p>Phone: {location.phone || "-"}</p>
                <p>Status: {location.isActive ? "Active" : "Inactive"}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] bg-white p-8 text-center font-black text-[#9a6b3e] shadow-sm">
          No locations found
        </div>
      )}

      <Modal open={open} title="Add New Location" onClose={() => setOpen(false)}>
        <form className="space-y-3">
          <input
            className="input"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Location name"
          />

          <input
            className="input"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Address"
          />

          <input
            className="input"
            name="managerName"
            value={form.managerName}
            onChange={handleChange}
            placeholder="Manager name"
          />

          <input
            className="input"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone number"
          />

          <button
            type="button"
            onClick={handleSave}
            className="w-full rounded-2xl bg-[#2a1608] py-3 font-black text-white"
          >
            Save Location
          </button>
        </form>
      </Modal>
    </div>
  );
}