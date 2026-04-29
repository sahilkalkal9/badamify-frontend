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
      <div className="flex flex-col gap-3 rounded-[16px] bg-white p-4 sm:p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-black">Locations</h2>
          <p className="text-sm font-semibold text-[#9a6b3e] mt-1">
            Manage all Badamify carts/branches
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center gap-2 rounded-[16px] bg-[#2a1608] px-4 py-2.5 sm:px-5 sm:py-3 font-black text-white text-sm sm:text-base w-full sm:w-auto"
        >
          <Plus size={18} />
          Add Location
        </button>
      </div>

      {loading ? (
        <div className="rounded-[16px] bg-white p-6 sm:p-8 text-center font-black text-[#9a6b3e] shadow-sm">
          Loading locations...
        </div>
      ) : locations.length > 0 ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {locations.map((location) => (
            <div
              key={location._id}
              className="rounded-[16px] bg-white p-4 sm:p-5 shadow-sm"
            >
              <div className="mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-[16px] bg-[#fff2d8]">
                <MapPin size={18} />
              </div>

              <h3 className="text-base sm:text-lg font-black">{location.name}</h3>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-[#9a6b3e]">
                {location.address || "No address added"}
              </p>

              <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-xs sm:text-sm font-semibold">
                <p>Manager: {location.managerName || "-"}</p>
                <p>Phone: {location.phone || "-"}</p>
                <p>Status: {location.isActive ? "Active" : "Inactive"}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[16px] bg-white p-6 sm:p-8 text-center font-black text-[#9a6b3e] shadow-sm">
          No locations found
        </div>
      )}

      <Modal open={open} title="Add New Location" onClose={() => setOpen(false)}>
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
            className="w-full rounded-[16px] bg-[#2a1608] py-2.5 sm:py-3 font-black text-white text-sm sm:text-base"
          >
            Save Location
          </button>
        </form>
      </Modal>
    </div>
  );
}