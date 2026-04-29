"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Boxes, ShoppingCart } from "lucide-react";
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

export default function StockPage({ selectedLocation = "all" }) {
  const [open, setOpen] = useState(false);
  const [recipeItems, setRecipeItems] = useState([]);
  const [stockPurchases, setStockPurchases] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    location: "",
    item: "",
    quantity: "",
    pricePerUnit: "",
    vendorName: "",
    paymentStatus: "paid",
    paidAmount: "",
    purchaseDate: "",
    notes: "",
  });

  const getLocationName = (locationValue) => {
    if (locationValue?.name) return locationValue.name;

    const locationId =
      typeof locationValue === "object" ? locationValue?._id : locationValue;

    const found = locations.find((loc) => loc._id === locationId);
    return found?.name || "-";
  };

  const resetForm = () => {
    setForm({
      location: selectedLocation !== "all" ? selectedLocation : "",
      item: "",
      quantity: "",
      pricePerUnit: "",
      vendorName: "",
      paymentStatus: "paid",
      paidAmount: "",
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

  const fetchStockData = async () => {
    try {
      setLoading(true);

      const query =
        selectedLocation && selectedLocation !== "all"
          ? `?locationId=${selectedLocation}`
          : "";

      const [itemsRes, purchasesRes] = await Promise.all([
        api.get(`/recipe-items${query}`),
        api.get(`/stock-purchases${query}`),
      ]);

      setRecipeItems(itemsRes.data?.items || []);
      setStockPurchases(purchasesRes.data?.purchases || []);
    } catch (error) {
      console.error("Fetch stock error:", error);
      setRecipeItems([]);
      setStockPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchStockData();

    if (selectedLocation !== "all") {
      setForm((prev) => ({
        ...prev,
        location: selectedLocation,
        item: "",
      }));
    }
  }, [selectedLocation]);

  const filteredItemsForModal = useMemo(() => {
    if (!form.location) return recipeItems;

    return recipeItems.filter((item) => {
      const itemLocation =
        typeof item.location === "object" ? item.location?._id : item.location;

      return itemLocation === form.location;
    });
  }, [form.location, recipeItems]);

  const selectedItem = recipeItems.find((item) => item._id === form.item);

  const currentStock = recipeItems.map((item) => {
    const stockValue =
      Number(item.currentStock || 0) * Number(item.pricePerUnit || 0);

    return {
      id: item._id,
      item: item.name,
      location: getLocationName(item.location),
      stock: `${Number(item.currentStock || 0).toLocaleString("en-IN")} ${
        item.unit
      }`,
      pricePerUnit: `${formatMoney(item.pricePerUnit)}/${item.unit}`,
      value: formatMoney(stockValue),
      alert:
        Number(item.currentStock || 0) <= Number(item.minStockAlert || 0)
          ? "Low"
          : "Safe",
    };
  });

  const purchaseRows = stockPurchases.map((purchase) => ({
    id: purchase._id,
    item: purchase.itemName,
    location: getLocationName(purchase.location),
    quantity: `${Number(purchase.quantity || 0).toLocaleString("en-IN")} ${
      purchase.unit
    }`,
    pricePerUnit: formatMoney(purchase.pricePerUnit),
    total: formatMoney(purchase.totalPrice),
    paid: formatMoney(purchase.paidAmount),
    vendor: purchase.vendorName || "-",
    date: formatDate(purchase.purchaseDate),
  }));

  const totalStockPurchased = stockPurchases.reduce(
    (sum, item) => sum + Number(item.totalPrice || 0),
    0
  );

  const totalStockPaid = stockPurchases.reduce(
    (sum, item) => sum + Number(item.paidAmount || 0),
    0
  );

  const currentStockValue = recipeItems.reduce((sum, item) => {
    return (
      sum + Number(item.currentStock || 0) * Number(item.pricePerUnit || 0)
    );
  }, 0);

  const lowStockItems = recipeItems.filter(
    (item) => Number(item.currentStock || 0) <= Number(item.minStockAlert || 0)
  ).length;

  const totalAmount =
    Number(form.quantity || 0) * Number(form.pricePerUnit || 0);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "location") {
      setForm((prev) => ({
        ...prev,
        location: value,
        item: "",
      }));
      return;
    }

    if (name === "item") {
      const item = recipeItems.find((recipeItem) => recipeItem._id === value);

      setForm((prev) => ({
        ...prev,
        item: value,
        pricePerUnit: item?.pricePerUnit || "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
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
      if (!form.item) return alert("Item is required");
      if (!form.quantity) return alert("Quantity is required");
      if (Number(form.quantity || 0) <= 0)
        return alert("Quantity must be greater than 0");
      if (!form.pricePerUnit) return alert("Price per unit is required");
      if (Number(form.pricePerUnit || 0) < 0)
        return alert("Price per unit cannot be negative");

      if (
        form.paymentStatus === "partial" &&
        Number(form.paidAmount || 0) >= totalAmount
      ) {
        return alert("Partial paid amount must be less than total amount");
      }

      if (
        form.paymentStatus === "partial" &&
        Number(form.paidAmount || 0) <= 0
      ) {
        return alert("Partial paid amount must be greater than 0");
      }

      setSaving(true);

      await api.post("/stock-purchases", {
        location: form.location,
        item: form.item,
        quantity: Number(form.quantity || 0),
        pricePerUnit: Number(form.pricePerUnit || 0),
        vendorName: form.vendorName.trim(),
        paymentStatus: form.paymentStatus,
        paidAmount:
          form.paymentStatus === "paid"
            ? totalAmount
            : form.paymentStatus === "unpaid"
            ? 0
            : Number(form.paidAmount || 0),
        purchaseDate: form.purchaseDate || new Date().toISOString(),
        notes: form.notes.trim(),
      });

      resetForm();
      setOpen(false);
      fetchStockData();
    } catch (error) {
      console.error("Create stock purchase error:", error);
      alert(error?.response?.data?.message || "Failed to save stock purchase");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Stock Purchased"
          value={loading ? "Loading..." : formatMoney(totalStockPurchased)}
        />
        <SummaryCard
          title="Current Stock Value"
          value={loading ? "Loading..." : formatMoney(currentStockValue)}
        />
        <SummaryCard
          title="Stock Investment Paid"
          value={loading ? "Loading..." : formatMoney(totalStockPaid)}
        />
        <SummaryCard
          title="Low Stock Items"
          value={loading ? "Loading..." : lowStockItems}
        />
      </div>

      <div className="rounded-[16px] bg-[#2a1608] p-5 text-white shadow-sm sm:p-6">
        <p className="text-sm font-semibold text-[#f2c078]">
          Stock Investment Rule
        </p>
        <h2 className="mt-1 text-xl font-black sm:text-2xl">
          New stock purchase = Total Investment
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/70">
          Daily production me jo material use hoga, wo sirf stock consume karega.
          Investment me dobara add nahi hoga.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-[16px] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black sm:text-2xl">Stock Management</h2>
          <p className="text-sm font-semibold text-[#9a6b3e]">
            Add new stock purchases and track current stock
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#2a1608] px-5 py-3 font-black text-white sm:w-auto"
        >
          <Plus size={18} />
          Add Stock
        </button>
      </div>

      <StockTable
        title="Current Stock"
        type="current"
        data={currentStock}
        loading={loading}
      />

      <StockTable
        title="Stock Purchase History"
        type="purchase"
        data={purchaseRows}
        loading={loading}
      />

      <Modal open={open} title="Add New Stock" onClose={handleCloseModal}>
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

          <select
            className="input"
            name="item"
            value={form.item}
            onChange={handleChange}
            disabled={saving}
          >
            <option value="">Select item</option>
            {filteredItemsForModal.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name} - {item.unit}
              </option>
            ))}
          </select>

          <input
            className="input"
            name="quantity"
            value={form.quantity}
            onChange={handleChange}
            disabled={saving}
            type="number"
            placeholder="Quantity purchased"
          />

          <select className="input" value={selectedItem?.unit || ""} disabled>
            <option value="">Unit auto selected</option>
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
            disabled={saving}
            type="number"
            placeholder="Price per unit"
          />

          <input
            className="input"
            name="vendorName"
            value={form.vendorName}
            onChange={handleChange}
            disabled={saving}
            placeholder="Vendor name"
          />

          <select
            className="input"
            name="paymentStatus"
            value={form.paymentStatus}
            onChange={handleChange}
            disabled={saving}
          >
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
          </select>

          <input
            className="input"
            name="paidAmount"
            value={form.paymentStatus === "paid" ? totalAmount : form.paidAmount}
            onChange={handleChange}
            type="number"
            disabled={form.paymentStatus === "paid" || saving}
            placeholder="Paid amount"
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

          <div className="rounded-[16px] bg-[#fff8ea] p-4 text-sm font-bold text-[#9a6b3e]">
            Total amount: {formatMoney(totalAmount)}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-[16px] bg-[#2a1608] py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Stock Purchase"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="rounded-[24px] bg-white p-4 shadow-sm sm:rounded-[16px] sm:p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#fff2d8] sm:h-12 sm:w-12">
        <Boxes size={22} />
      </div>
      <p className="text-xs font-black text-[#9a6b3e] sm:text-sm">{title}</p>
      <h3 className="mt-2 break-words text-xl font-black sm:text-2xl lg:text-3xl">
        {value}
      </h3>
    </div>
  );
}

function StockTable({ title, type, data, loading }) {
  const columns =
    type === "current"
      ? ["Item", "Location", "Current Stock", "Price / Unit", "Stock Value", "Alert"]
      : [
          "Item",
          "Location",
          "Quantity",
          "Price / Unit",
          "Total",
          "Paid",
          "Vendor",
          "Date",
        ];

  return (
    <div className="overflow-hidden rounded-[16px] bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-[#eadcc5] p-4 sm:p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-[#fff2d8]">
          {type === "current" ? <Boxes size={18} /> : <ShoppingCart size={18} />}
        </div>
        <h3 className="text-lg font-black sm:text-xl">{title}</h3>
      </div>

      <div className="grid gap-4 p-4 md:hidden">
        {loading ? (
          <div className="rounded-[16px] bg-[#fff8ea] p-5 text-center font-bold text-[#9a6b3e]">
            Loading stock data...
          </div>
        ) : data.length > 0 ? (
          data.map((row, index) => (
            <div
              key={row.id || index}
              className="rounded-[24px] border border-[#eadcc5] bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-[#fff2d8]">
                  {type === "current" ? (
                    <Boxes size={18} />
                  ) : (
                    <ShoppingCart size={18} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="break-words text-base font-black">
                    {row.item}
                  </h4>
                  <p className="mt-1 text-xs font-black uppercase tracking-wide text-[#9a6b3e]">
                    {row.location}
                  </p>
                </div>
              </div>

              {type === "current" ? (
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <InfoBox title="Current Stock" value={row.stock} />
                  <InfoBox title="Price / Unit" value={row.pricePerUnit} />
                  <InfoBox title="Stock Value" value={row.value} />
                  <div className="rounded-[16px] bg-[#fff8ea] p-3">
                    <p className="text-xs font-black text-[#9a6b3e]">Alert</p>
                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${
                        row.alert === "Low"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {row.alert}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <InfoBox title="Quantity" value={row.quantity} />
                  <InfoBox title="Price / Unit" value={row.pricePerUnit} />
                  <InfoBox title="Total" value={row.total} />
                  <InfoBox title="Paid" value={row.paid} />
                  <InfoBox title="Vendor" value={row.vendor} />
                  <InfoBox title="Date" value={row.date} />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-[16px] bg-[#fff8ea] p-5 text-center font-bold text-[#9a6b3e]">
            No stock data found
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-[#fff8ea]">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-5 py-4">
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-10 text-center font-bold text-[#9a6b3e]"
                >
                  Loading stock data...
                </td>
              </tr>
            ) : data.length > 0 ? (
              data.map((row, index) => (
                <tr key={row.id || index} className="border-t border-[#eadcc5]">
                  {type === "current" ? (
                    <>
                      <td className="px-5 py-4 font-black">{row.item}</td>
                      <td className="px-5 py-4 font-semibold">{row.location}</td>
                      <td className="px-5 py-4 font-semibold">{row.stock}</td>
                      <td className="px-5 py-4 font-semibold">
                        {row.pricePerUnit}
                      </td>
                      <td className="px-5 py-4 font-black">{row.value}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            row.alert === "Low"
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {row.alert}
                        </span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-4 font-black">{row.item}</td>
                      <td className="px-5 py-4 font-semibold">{row.location}</td>
                      <td className="px-5 py-4 font-semibold">{row.quantity}</td>
                      <td className="px-5 py-4 font-semibold">
                        {row.pricePerUnit}
                      </td>
                      <td className="px-5 py-4 font-black">{row.total}</td>
                      <td className="px-5 py-4 font-semibold">{row.paid}</td>
                      <td className="px-5 py-4 font-semibold">{row.vendor}</td>
                      <td className="px-5 py-4 font-semibold">{row.date}</td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-10 text-center font-bold text-[#9a6b3e]"
                >
                  No stock data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InfoBox({ title, value }) {
  return (
    <div className="rounded-[16px] bg-[#fff8ea] p-3">
      <p className="text-xs font-black text-[#9a6b3e]">{title}</p>
      <p className="mt-1 break-words font-black">{value}</p>
    </div>
  );
}