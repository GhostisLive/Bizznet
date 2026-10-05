"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import {
  Package,
  Truck,
  Clock,
  CheckCircle2,
  X,
  Loader2,
  PackageCheck,
  AlertCircle,
  ShoppingBag,
  ShieldCheck,
  FileText,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import { useCurrentOrg } from "@/lib/useCurrentOrg";
import { supabase } from "@/utils/supabaseClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

interface DbOrder {
  id: string;
  rfq_id: string;
  buyer_id: string;
  seller_id: string;
  title: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  total_price: number;
  currency: string;
  delivery_deadline: string | null;
  delivery_location: any | null;
  status: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  rfq_title: string;
  buyer_org: { name: string; role: string } | null;
  seller_org: { name: string; role: string } | null;
}

const STORAGE_KEY_ORDERS_FILTERS = "bizznet:orders-filters";

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans">
      <SidebarContent />
    </div>
  );
}

function SidebarContent() {
  const { org: authOrg } = useAuth();
  const currentOrg = useCurrentOrg();
  const userRole = authOrg?.role || currentOrg.role || "manufacturer";

  if (!authOrg?.id) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans">
        <Sidebar currentRole={currentOrg.roleLabel} orgName={currentOrg.orgName} nodeId={currentOrg.nodeId} />
        <main className="flex-1 p-6 md:p-10 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={32} className="mx-auto animate-spin text-[#6B5B3E]" />
            <p className="mt-4 text-sm text-[#5C5040]">Loading orders...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <Sidebar currentRole={currentOrg.roleLabel} orgName={currentOrg.orgName} nodeId={currentOrg.nodeId} />
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-x-hidden max-w-[1600px] mx-auto w-full">
        <OrdersContent />
      </main>
    </>
  );
}

function OrdersContent() {
  const { user, org: authOrg } = useAuth();
  const currentOrg = useCurrentOrg();
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeOrder, setActiveOrder] = useState<DbOrder | null>(null);

  const userRole = authOrg?.role || currentOrg.role || "manufacturer";

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ORDERS_FILTERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.searchQuery !== undefined) setSearchQuery(parsed.searchQuery);
        if (parsed.status !== undefined) setStatusFilter(parsed.status);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const v = { searchQuery, status };
    localStorage.setItem(STORAGE_KEY_ORDERS_FILTERS, JSON.stringify(v));
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    if (authOrg?.id) {
      fetchOrders();
    }
  }, [authOrg?.id, userRole]);

  async function fetchOrders() {
    if (!authOrg?.id) return;
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        searchQuery === "" ||
        order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.rfq_title !== null && order.rfq_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        order.id.slice(0, 8).toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || order.status === statusFilter;

      // Role-based filtering
      let matchesRole = true;
      if (userRole === "distributor" || userRole === "retailer") {
        // Buyers see only their orders
        matchesRole = order.buyer_id === authOrg?.id;
      } else if (userRole === "raw_material_supplier" || userRole === "manufacturer") {
        // Sellers see only orders where they are the seller
        matchesRole = order.seller_id === authOrg?.id;
      } else if (userRole === "transporter") {
        // Transporters see orders that are being delivered
        matchesRole = ["shipped", "delivered", "in_transit"].includes(order.status);
      }

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [orders, searchQuery, statusFilter, userRole, authOrg?.id]);

  const orderStats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "pending").length;
    const shipped = orders.filter((o) => o.status === "shipped").length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;

    return { total, pending, shipped, delivered, cancelled };
  }, [orders]);

  function getStatusBadge(status: string) {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-[#F0EBE3] text-[#8A7E6E]", label: "Pending" },
      confirmed: { color: "bg-[#EEF7F2] text-[#2E7D5B]", label: "Confirmed" },
      shipped: { color: "bg-[#FDF5E6] text-[#C68A17]", label: "Shipped" },
      delivered: { color: "bg-[#EEF7F2] text-[#2E7D5B]", label: "Delivered" },
      cancelled: { color: "bg-[#F0EBE3] text-[#8A7E6E]", label: "Cancelled" },
      in_transit: { color: "bg-[#E3F2FD] text-[#1976D2]", label: "In Transit" },
      in_production: { color: "bg-[#FFF3E0] text-[#E65100]", label: "In Production" },
      ready_to_ship: { color: "bg-[#E3F2FD] text-[#1976D2]", label: "Ready to Ship" },
      completed: { color: "bg-[#E8F5E9] text-[#2E7D5B]", label: "Completed" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${config.color}`}
      >
        {config.label}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans">
        <Sidebar currentRole={currentOrg.roleLabel} orgName={currentOrg.orgName} nodeId={currentOrg.nodeId} />
        <main className="flex-1 p-6 md:p-10 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={32} className="mx-auto animate-spin text-[#6B5B3E]" />
            <p className="mt-4 text-sm text-[#5C5040]">Loading orders...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8E0D4]">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#2C2418] tracking-tight">
            <ShoppingBag size={24} /> Order Management
          </h1>
          <p className="text-base font-semibold text-[#5C5040] mt-1">
            Track and manage your orders from RFQs to delivery
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Total Orders</span>
            <div className="p-2.5 bg-[#F5F0E8] rounded-xl text-[#6B5B3E]">
              <Package size={20} />
            </div>
          </div>
          <h2 className="text-4xl font-extrabold text-[#2C2418] mt-3">{orderStats.total}</h2>
          <p className="text-xs text-[#8A7E6E] font-semibold mt-2">All orders</p>
        </div>
        <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Pending</span>
            <div className="p-2.5 bg-[#F0EBE3] rounded-xl text-[#8A7E6E]">
              <Clock size={20} />
            </div>
          </div>
          <h2 className="text-4xl font-extrabold text-[#8A7E6E] mt-3">{orderStats.pending}</h2>
          <p className="text-xs text-[#8A7E6E] font-semibold mt-2">Awaiting confirmation</p>
        </div>
        <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Shipped</span>
            <div className="p-2.5 bg-[#FDF5E6] rounded-xl text-[#C68A17]">
              <Truck size={20} />
            </div>
          </div>
          <h2 className="text-4xl font-extrabold text-[#C68A17] mt-3">{orderStats.shipped}</h2>
          <p className="text-xs text-[#8A7E6E] font-semibold mt-2">In transit</p>
        </div>
        <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Delivered</span>
            <div className="p-2.5 bg-[#EEF7F2] rounded-xl text-[#2E7D5B]">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <h2 className="text-4xl font-extrabold text-[#2E7D5B] mt-3">{orderStats.delivered}</h2>
          <p className="text-xs text-[#8A7E6E] font-semibold mt-2">Completed</p>
        </div>
        <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Cancelled</span>
            <div className="p-2.5 bg-[#F0EBE3] rounded-xl text-[#8A7E6E]">
              <AlertCircle size={20} />
            </div>
          </div>
          <h2 className="text-4xl font-extrabold text-[#8A7E6E] mt-3">{orderStats.cancelled}</h2>
          <p className="text-xs text-[#8A7E6E] font-semibold mt-2">Cancelled orders</p>
        </div>
      </div>

      <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A89B8A]" />
          <input
            type="text"
            placeholder="Search orders by title, RFQ, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-xs font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="in_production">In Production</option>
          <option value="ready_to_ship">Ready to Ship</option>
          <option value="shipped">Shipped</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E8E0D4] rounded-2xl py-16 px-6 text-center">
          <Package size={48} className="mx-auto text-[#A89B8A] mb-4" />
          <h3 className="text-lg font-extrabold text-[#2C2418]">
            {orders.length === 0 ? "No orders yet" : "No orders match the current filters"}
          </h3>
          <p className="text-sm text-[#8A7E6E] mt-1 max-w-md mx-auto">
            {orders.length === 0
              ? "Orders will appear here when RFQs are awarded and confirmed"
              : "Try clearing the search or filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-[#E8E0D4] rounded-xl p-4 shadow-sm hover:shadow-lg transition-all cursor-pointer"
              onClick={() => setActiveOrder(order)}
            >
              <div className="flex items-start justify-between pb-3">
                <div className="flex space-x-3">
                  <div className="p-2 bg-[#EEF7F2] rounded-lg text-[#2E7D5B]">
                    <ShoppingBag size={14} />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-[#2C2418]">{order.title}</h3>
                    <p className="text-sm text-[#8A7E6E]">Order ID: {order.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#2C2418]">
                      Total: {order.currency} {order.total_price.toLocaleString()}
                    </p>
                    <p className="text-xs text-[#8A7E6E]">
                      {order.quantity} {order.unit} × {order.price_per_unit.toLocaleString()}
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm font-mono">
                <div>
                  <span className="font-bold text-[#2C2418]">From RFQ:</span>
                  <p className="text-[#8A7E6E]">{order.rfq_title}</p>
                </div>
                <div>
                  <span className="font-bold text-[#2C2418]">Buyer:</span>
                  <p className="text-[#8A7E6E]">{order.buyer_org?.name || "Unknown"}</p>
                </div>
                <div>
                  <span className="font-bold text-[#2C2418]">Seller:</span>
                  <p className="text-[#8A7E6E]">{order.seller_org?.name || "Unknown"}</p>
                </div>
                <div>
                  <span className="font-bold text-[#2C2418]">Created:</span>
                  <p className="text-[#8A7E6E]">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveOrder(order);
                  }}
                  className="text-xs font-semibold text-[#6B5B3E] hover:text-[#2C2418]"
                >
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E0D4] rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#E8E0D4] pb-4">
              <div className="flex gap-4 items-center">
                <div className="p-2 bg-[#EEF7F2] rounded-lg text-[#2E7D5B]">
                  <PackageCheck size={18} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[#2C2418]">Order Details</h3>
                  <p className="text-sm text-[#8A7E6E]">Order ID: {activeOrder.id.slice(0, 8)}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveOrder(null)}
                className="p-1.5 rounded-lg text-[#A89B8A] hover:text-[#2C2418]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-mono font-bold text-[#8A7E6E] uppercase mb-2">Order Information</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-bold">Title:</span> {activeOrder.title}
                    </p>
                    <p>
                      <span className="font-bold">From RFQ:</span> {activeOrder.rfq_title}
                    </p>
                    <p>
                      <span className="font-bold">Quantity:</span> {activeOrder.quantity} {activeOrder.unit}
                    </p>
                    <p>
                      <span className="font-bold">Unit Price:</span> {activeOrder.currency} {activeOrder.price_per_unit.toLocaleString()}
                    </p>
                    <p>
                      <span className="font-bold">Total Price:</span> {activeOrder.currency} {activeOrder.total_price.toLocaleString()}
                    </p>
                    <p>
                      <span className="font-bold">Currency:</span> {activeOrder.currency}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-mono font-bold text-[#8A7E6E] uppercase mb-2">Parties & Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-bold">Buyer:</span> {activeOrder.buyer_org?.name || "Unknown"}
                    </p>
                    <p>
                      <span className="font-bold">Seller:</span> {activeOrder.seller_org?.name || "Unknown"}
                    </p>
                    <p>
                      <span className="font-bold">Created:</span>{" "}
                      {new Date(activeOrder.created_at).toLocaleString()}
                    </p>
                    <p>
                      <span className="font-bold">Status:</span>{" "}
                      {getStatusBadge(activeOrder.status)}
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href={`/negotiations?order=${activeOrder.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#2C2418] hover:bg-[#4E4433] text-white rounded-xl text-sm font-bold transition-colors"
              >
                <FileText size={16} />
                View Negotiation Thread
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}