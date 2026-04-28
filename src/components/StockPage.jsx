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

  const handleSave = async () => {
    try {
      if (!form.location) return alert("Location is required");
      if (!form.item) return alert("Item is required");
      if (!form.quantity) return alert("Quantity is required");
      if (!form.pricePerUnit) return alert("Price per unit is required");

      await api.post("/stock-purchases", {
        location: form.location,
        item: form.item,
        quantity: Number(form.quantity || 0),
        pricePerUnit: Number(form.pricePerUnit || 0),
        vendorName: form.vendorName,
        paymentStatus: form.paymentStatus,
        paidAmount:
          form.paymentStatus === "paid"
            ? totalAmount
            : Number(form.paidAmount || 0),
        purchaseDate: form.purchaseDate || new Date().toISOString(),
        notes: form.notes,
      });

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

      setOpen(false);
      fetchStockData();
    } catch (error) {
      console.error("Create stock purchase error:", error);
      alert(error?.response?.data?.message || "Failed to save stock purchase");
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

      <div className="rounded-[28px] bg-[#2a1608] p-5 text-white shadow-sm">
        <p className="text-sm font-semibold text-[#f2c078]">
          Stock Investment Rule
        </p>
        <h2 className="mt-1 text-2xl font-black">
          New stock purchase = Total Investment
        </h2>
        <p className="mt-2 text-sm text-white/70">
          Daily production me jo material use hoga, wo sirf stock consume karega.
          Investment me dobara add nahi hoga.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-[28px] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black">Stock Management</h2>
          <p className="text-sm font-semibold text-[#9a6b3e]">
            Add new stock purchases and track current stock
          </p>
        </div>

        <button
          onClick={() => {
            setForm((prev) => ({
              ...prev,
              location: selectedLocation !== "all" ? selectedLocation : "",
            }));
            setOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#2a1608] px-5 py-3 font-black text-white"
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

      <Modal open={open} title="Add New Stock" onClose={() => setOpen(false)}>
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

          <select
            className="input"
            name="item"
            value={form.item}
            onChange={handleChange}
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
            type="number"
            placeholder="Price per unit"
          />

          <input
            className="input"
            name="vendorName"
            value={form.vendorName}
            onChange={handleChange}
            placeholder="Vendor name"
          />

          <select
            className="input"
            name="paymentStatus"
            value={form.paymentStatus}
            onChange={handleChange}
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
            disabled={form.paymentStatus === "paid"}
            placeholder="Paid amount"
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

          <div className="rounded-2xl bg-[#fff8ea] p-4 text-sm font-bold text-[#9a6b3e]">
            Total amount: {formatMoney(totalAmount)}
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full rounded-2xl bg-[#2a1608] py-3 font-black text-white"
          >
            Save Stock Purchase
          </button>
        </form>
      </Modal>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff2d8]">
        <Boxes size={22} />
      </div>
      <p className="text-sm font-black text-[#9a6b3e]">{title}</p>
      <h3 className="mt-2 text-2xl font-black sm:text-3xl">{value}</h3>
    </div>
  );
}

function StockTable({ title, type, data, loading }) {
  const columns =
    type === "current"
      ? ["Item", "Current Stock", "Price / Unit", "Stock Value", "Alert"]
      : ["Item", "Quantity", "Price / Unit", "Total", "Paid", "Vendor", "Date"];

  return (
    <div className="overflow-hidden rounded-[28px] bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-[#eadcc5] p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff2d8]">
          {type === "current" ? <Boxes size={18} /> : <ShoppingCart size={18} />}
        </div>
        <h3 className="text-xl font-black">{title}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-sm">
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