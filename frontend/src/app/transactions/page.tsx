"use client";

import { useState, Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import { useCurrentOrg } from "@/lib/useCurrentOrg";
import {
  Receipt,
  FileText,
  CheckCircle2,
  Download,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Printer,
  X,
  Clock,
  CreditCard,
  Tag,
  ChevronRight,
  ExternalLink,
  Sparkles
} from "lucide-react";
import Logo from "@/components/Logo";

export interface Transaction {
  id: string;
  invoiceNo: string;
  timestamp: string;
  type: "Purchase" | "Sale";
  counterpart: string;
  counterpartTaxId: string;
  myOrg: string;
  myOrgTaxId: string;
  productName: string;
  category: string;
  batchNo: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
  freightFee: number;
  esgOffsetFee: number;
  gstAmount: number;
  totalAmount: number;
  status: "Delivered" | "In Transit" | "Customs Cleared" | "Payment Settled";
  paymentStatus: "Escrow Released" | "Settled" | "Processing";
  paymentMethod: string;
  hash: string;
  labourAudit: string;
  companyTrust: string;
  carbonAudit: string;
  carbonIntensity: string;
}

const initialTransactions: Transaction[] = [
  {
    id: "TX-4091",
    invoiceNo: "INV-2026-4091",
    timestamp: "2026-03-22 14:30",
    type: "Purchase",
    counterpart: "Tata Steel Ltd.",
    counterpartTaxId: "27AAACT2727Q1ZW",
    myOrg: "Manufacturer Alpha",
    myOrgTaxId: "27AAACM9981K1Z2",
    productName: "Cold-Rolled Steel CR4",
    category: "Metals & Alloys",
    batchNo: "BATCH-CR4-902",
    quantity: 50,
    unit: "MT",
    unitPrice: 48200,
    subtotal: 2410000,
    freightFee: 60250,
    esgOffsetFee: 24100,
    gstAmount: 448983,
    totalAmount: 2943333,
    status: "Delivered",
    paymentStatus: "Escrow Released",
    paymentMethod: "BizzNet Escrow Node (Smart Contract #0x8f9a)",
    hash: "0x8f9a2b7c4d1e3f89a7b6c5d4e3f2a1b0c9d8e7f6",
    labourAudit: "3rd-Party Inspected (SA8000)",
    companyTrust: "3rd-Party Audited (ISO-9001)",
    carbonAudit: "3rd-Party Verified (ISO-14064)",
    carbonIntensity: "2.1 kg CO₂e/kg"
  },
  {
    id: "TX-4088",
    invoiceNo: "INV-2026-4088",
    timestamp: "2026-03-21 11:15",
    type: "Sale",
    counterpart: "Metro Distribution",
    counterpartTaxId: "07AAACM4432L1Z9",
    myOrg: "Manufacturer Alpha",
    myOrgTaxId: "27AAACM9981K1Z2",
    productName: "Precision Gear Assemblies Assembly A2",
    category: "Industrial Machinery",
    batchNo: "BATCH-GB-440",
    quantity: 100,
    unit: "Units",
    unitPrice: 43500,
    subtotal: 4350000,
    freightFee: 108750,
    esgOffsetFee: 43500,
    gstAmount: 810405,
    totalAmount: 5312655,
    status: "In Transit",
    paymentStatus: "Settled",
    paymentMethod: "Direct Bank Transfer (NEFT/RTGS)",
    hash: "0x4e2d7f1c9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d",
    labourAudit: "Worker Voluntary",
    companyTrust: "Voluntary Self-Report",
    carbonAudit: "3rd-Party Verified (ISO-14064)",
    carbonIntensity: "1.4 kg CO₂e/unit"
  },
  {
    id: "TX-4082",
    invoiceNo: "INV-2026-4082",
    timestamp: "2026-03-20 09:45",
    type: "Purchase",
    counterpart: "Greenfield Polymers Ltd.",
    counterpartTaxId: "24AAACG1123P1Z5",
    myOrg: "Manufacturer Alpha",
    myOrgTaxId: "27AAACM9981K1Z2",
    productName: "Recycled HDPE Pellets Grade A",
    category: "Polymers & Plastics",
    batchNo: "BATCH-HDPE-771",
    quantity: 25,
    unit: "MT",
    unitPrice: 72500,
    subtotal: 1812500,
    freightFee: 45312,
    esgOffsetFee: 18125,
    gstAmount: 337669,
    totalAmount: 2213606,
    status: "Customs Cleared",
    paymentStatus: "Escrow Released",
    paymentMethod: "BizzNet Escrow Node (Smart Contract #0x4e2d)",
    hash: "0x1b3c5d7e9f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c",
    labourAudit: "3rd-Party Inspected (FairLabour)",
    companyTrust: "3rd-Party Audited (D&B Verified)",
    carbonAudit: "3rd-Party Verified (GHG Protocol)",
    carbonIntensity: "1.8 kg CO₂e/kg"
  },
  {
    id: "TX-4075",
    invoiceNo: "INV-2026-4075",
    timestamp: "2026-03-18 16:20",
    type: "Sale",
    counterpart: "Nordic Lifestyle Ltd.",
    counterpartTaxId: "19AAACN8821R1Z1",
    myOrg: "Manufacturer Alpha",
    myOrgTaxId: "27AAACM9981K1Z2",
    productName: "High-Tensile Fastener Bolts M12",
    category: "Hardware & Components",
    batchNo: "BATCH-FB-109",
    quantity: 10,
    unit: "Thousand Units",
    unitPrice: 124000,
    subtotal: 1240000,
    freightFee: 31000,
    esgOffsetFee: 12400,
    gstAmount: 230972,
    totalAmount: 1514372,
    status: "Delivered",
    paymentStatus: "Settled",
    paymentMethod: "Letter of Credit (LC #88201)",
    hash: "0x9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b",
    labourAudit: "3rd-Party Inspected",
    companyTrust: "3rd-Party Audited",
    carbonAudit: "Voluntary Self-Report",
    carbonIntensity: "0.9 kg CO₂e/unit"
  },
  {
    id: "TX-4069",
    invoiceNo: "INV-2026-4069",
    timestamp: "2026-03-15 10:10",
    type: "Purchase",
    counterpart: "Vardhman Textiles",
    counterpartTaxId: "03AAACV9012M1Z4",
    myOrg: "Manufacturer Alpha",
    myOrgTaxId: "27AAACM9981K1Z2",
    productName: "Organic Cotton Yarn 30Ne",
    category: "Textiles & Yarns",
    batchNo: "BATCH-TEX-302",
    quantity: 500,
    unit: "kg",
    unitPrice: 890,
    subtotal: 445000,
    freightFee: 11125,
    esgOffsetFee: 4450,
    gstAmount: 82904,
    totalAmount: 543479,
    status: "Payment Settled",
    paymentStatus: "Settled",
    paymentMethod: "BizzNet Escrow Node (Smart Contract #0x3a5b)",
    hash: "0x3a5b7c9d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b",
    labourAudit: "3rd-Party Inspected (GOTS)",
    companyTrust: "3rd-Party Audited",
    carbonAudit: "3rd-Party Verified (OEKO-TEX)",
    carbonIntensity: "5.4 kg CO₂e/kg"
  },
  {
    id: "TX-4062",
    invoiceNo: "INV-2026-4062",
    timestamp: "2026-03-12 15:45",
    type: "Purchase",
    counterpart: "Hindalco Industries",
    counterpartTaxId: "27AAACH5541N1Z7",
    myOrg: "Manufacturer Alpha",
    myOrgTaxId: "27AAACM9981K1Z2",
    productName: "Virgin Aluminum Ingots AL-99",
    category: "Metals & Alloys",
    batchNo: "BATCH-AL-501",
    quantity: 15,
    unit: "MT",
    unitPrice: 210000,
    subtotal: 3150000,
    freightFee: 78750,
    esgOffsetFee: 31500,
    gstAmount: 586845,
    totalAmount: 3847095,
    status: "Delivered",
    paymentStatus: "Escrow Released",
    paymentMethod: "BizzNet Escrow Node (Smart Contract #0x7d6c)",
    hash: "0x7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c",
    labourAudit: "Worker Voluntary",
    companyTrust: "3rd-Party Audited",
    carbonAudit: "Voluntary Self-Report",
    carbonIntensity: "8.2 kg CO₂e/kg"
  }
];

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-base font-mono text-[#5C5040]">Loading BizzNet Transaction History...</div>}>
      <TransactionsContent />
    </Suspense>
  );
}

function TransactionsContent() {
  const org = useCurrentOrg();
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | "Debit" | "Credit">("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter to show only user's transactions
  const userTransactions = transactions.filter((tx) => tx.myOrg === org.orgName);

  // Filtered transactions
  const filtered = userTransactions.filter((tx) => {
    const matchesQuery =
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.counterpart.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      typeFilter === "All" ||
      (typeFilter === "Debit" && tx.type === "Purchase") ||
      (typeFilter === "Credit" && tx.type === "Sale");
    const matchesStatus = statusFilter === "All" || tx.status === statusFilter;
    return matchesQuery && matchesType && matchesStatus;
  });

  const debitCount = userTransactions.filter((tx) => tx.type === "Purchase").length;
  const creditCount = userTransactions.filter((tx) => tx.type === "Sale").length;
  const totalDebitAmount = userTransactions.filter((tx) => tx.type === "Purchase").reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalCreditAmount = userTransactions.filter((tx) => tx.type === "Sale").reduce((acc, curr) => acc + curr.totalAmount, 0);

  const handlePrintInvoice = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans">
      <Sidebar currentRole={org.roleLabel} orgName={org.orgName} nodeId={org.nodeId} />

      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-x-hidden max-w-[1600px] mx-auto w-full">
        {/* Prominent Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8E0D4]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-[#6B5B3E] uppercase tracking-wider bg-[#F5F0E8] px-2.5 py-1 rounded-md border border-[#E8E0D4]">
                Enterprise Ledger
              </span>
              <span className="font-mono text-xs text-[#2E7D5B] font-bold flex items-center gap-1">
                <ShieldCheck size={14} /> ISO-14064 Audit Compliant
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#2C2418] tracking-tight">
              Transaction History Log
            </h1>
            <p className="text-base font-semibold text-[#5C5040] mt-1">
              Immutable ledger of settled orders, itemized pricing structures, and system-generated tax bills.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E8E0D4] shadow-sm text-xs font-mono font-bold text-[#2C2418]">
              <span className="size-2.5 rounded-full bg-[#2E7D5B] animate-pulse" />
              Notary Node Active
            </span>
          </div>
        </div>

        {/* 1. Metric Overview Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8A7E6E]">Total Debit Value</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDF5E6] text-[#C68A17]">
                <ArrowUpRight size={22} />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-[#2C2418] tracking-tight mt-3">
              ₹{(totalDebitAmount / 100000).toFixed(2)} Lakh
            </h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">{debitCount} purchase transactions</p>
          </div>

          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8A7E6E]">Total Credit Value</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF7F2] text-[#2E7D5B]">
                <ArrowUpRight size={22} />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-[#2C2418] tracking-tight mt-3">
              ₹{(totalCreditAmount / 100000).toFixed(2)} Lakh
            </h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">{creditCount} sale transactions</p>
          </div>

          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8A7E6E]">Generated Bills</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F0E8] text-[#6B5B3E]">
                <Receipt size={22} />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-[#2C2418] tracking-tight mt-3">
              {transactions.length} Invoices
            </h2>
            <p className="text-xs text-[#2E7D5B] font-bold mt-2">100% Tax & GST Compliant</p>
          </div>

          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8A7E6E]">Avg Order Size</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDF5E6] text-[#C68A17]">
                <Building2 size={22} />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-[#2C2418] tracking-tight mt-3">
              ₹26.8 Lakh
            </h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">Across 5 primary counterparties</p>
          </div>

          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8A7E6E]">Escrow Status</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF7F2] text-[#2E7D5B]">
                <CheckCircle2 size={22} />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-[#2E7D5B] tracking-tight mt-3">
              Zero Dispute
            </h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">Cryptographic proof verified</p>
          </div>
        </div>

        {/* 2. Main Transaction History Log Table */}
        <div className="bg-white border border-[#E8E0D4] rounded-2xl shadow-sm overflow-hidden">
          {/* Table Control Header */}
          <div className="p-6 border-b border-[#E8E0D4] bg-[#FAF8F5] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-[#2C2418]">Completed Transactions Log</h2>
              <p className="text-sm text-[#5C5040] font-semibold mt-0.5">
                Click any row to inspect transaction details, pricing breakdown, and generated system bill.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7E6E]" />
                <input
                  type="text"
                  placeholder="Search TX ID, invoice, item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-[#E8E0D4] bg-white rounded-xl text-xs text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E] w-56"
                />
              </div>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-3 py-2 border border-[#E8E0D4] bg-white rounded-xl text-xs font-semibold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
              >
                <option value="All">All Types</option>
                <option value="Debit">Debits</option>
                <option value="Credit">Credits</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-[#E8E0D4] bg-white rounded-xl text-xs font-semibold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
              >
                <option value="All">All Statuses</option>
                <option value="Delivered">Delivered</option>
                <option value="In Transit">In Transit</option>
                <option value="Customs Cleared">Customs Cleared</option>
                <option value="Payment Settled">Payment Settled</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-[#FAF8F5] border-b border-[#E8E0D4] font-mono text-xs text-[#8A7E6E] uppercase">
                <tr>
                  <th className="py-4 px-6 font-extrabold">Transaction & Invoice</th>
                  <th className="py-4 px-6 font-extrabold">Timestamp</th>
                  <th className="py-4 px-6 font-extrabold">Product & Volume</th>
                  <th className="py-4 px-6 font-extrabold">Counterparty</th>
                  <th className="py-4 px-6 font-extrabold">Type</th>
                  <th className="py-4 px-6 font-extrabold">Total Bill Amount</th>
                  <th className="py-4 px-6 font-extrabold">Delivery Status</th>
                  <th className="py-4 px-6 font-extrabold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D4]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-sm font-mono text-[#8A7E6E]">
                      No transactions match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((tx) => (
                    <tr
                      key={tx.id}
                      onClick={() => {
                        setSelectedTx(tx);
                        setIsModalOpen(true);
                      }}
                      className="hover:bg-[#F5F0E8]/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-[#6B5B3E] block group-hover:text-[#2C2418]">
                          {tx.id}
                        </span>
                        <span className="font-mono text-xs text-[#8A7E6E]">{tx.invoiceNo}</span>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs font-bold text-[#8A7E6E]">
                        {tx.timestamp}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-extrabold text-[#2C2418] block">{tx.productName}</span>
                        <span className="text-xs font-mono text-[#8A7E6E]">
                          {tx.quantity} {tx.unit} @ ₹{tx.unitPrice.toLocaleString("en-IN")}/{tx.unit}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-[#2C2418]">
                        {tx.counterpart}
                      </td>
                      <td className="py-4 px-6">
                        <span
                           className={`px-3 py-1 rounded-full font-mono text-xs font-bold ${
                             tx.type === "Purchase" ? "bg-[#F5F0E8] text-[#6B5B3E]" : "bg-[#EEF7F2] text-[#2E7D5B]"
                           }`}
                         >
                           {tx.type === "Purchase" ? "Debit" : "Credit"}
                         </span>
                      </td>
                      <td className="py-4 px-6 font-mono font-extrabold text-[#2C2418]">
                        ₹{tx.totalAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold border ${
                            tx.status === "Delivered"
                              ? "bg-[#EEF7F2] text-[#2E7D5B] border-[#2E7D5B]/30"
                              : tx.status === "In Transit"
                              ? "bg-[#F5F0E8] text-[#6B5B3E] border-[#6B5B3E]/30"
                              : "bg-[#FDF5E6] text-[#C68A17] border-[#C68A17]/30"
                          }`}
                        >
                          <CheckCircle2 size={13} /> {tx.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTx(tx);
                            setIsModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2C2418] hover:bg-[#4E4433] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                        >
                          <FileText size={14} />
                          View Bill
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Explanatory Footer */}
          <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E0D4] text-xs text-[#8A7E6E] font-medium leading-relaxed flex flex-col sm:flex-row justify-between items-center gap-2">
            <div>
              <strong>Audit Guarantee:</strong> All system transactions are signed with 256-bit cryptographic notary hashes and stored in the enterprise ledger.
            </div>
            <div className="font-mono text-xs font-bold text-[#6B5B3E]">
              Showing {filtered.length} of {transactions.length} records ({debitCount} Debit, {creditCount} Credit)
            </div>
          </div>
        </div>
      </main>

      {/* 3. Comprehensive Transaction Details & System Bill Modal */}
      {isModalOpen && selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E8E0D4] rounded-2xl max-w-4xl w-full p-6 md:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#E8E0D4] pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#6B5B3E] bg-[#F5F0E8] px-2.5 py-0.5 rounded border border-[#E8E0D4]">
                    {selectedTx.id}
                  </span>
                  <span className="font-mono text-xs text-[#2E7D5B] font-bold bg-[#EEF7F2] px-2.5 py-0.5 rounded border border-[#2E7D5B]/30">
                    Official System Invoice
                  </span>
                  <span className="font-mono text-xs text-[#8A7E6E] font-semibold">
                    {selectedTx.timestamp}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-[#2C2418] mt-2">
                  {selectedTx.productName}
                </h2>
                <p className="text-xs font-semibold text-[#5C5040]">
                  Counterparty: <strong className="text-[#2C2418]">{selectedTx.counterpart}</strong> ({selectedTx.type === "Purchase" ? "Debit" : "Credit"})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintInvoice}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F5F0E8] hover:bg-[#EDE7DC] text-[#2C2418] text-xs font-bold rounded-xl transition-colors border border-[#E8E0D4]"
                >
                  <Printer size={15} />
                  Print Bill
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-[#A89B8A] hover:text-[#2C2418] hover:bg-[#FAF8F5] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body: Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Column 1: Transaction & Product Specs */}
              <div className="space-y-4">
                <div className="p-4 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl space-y-3">
                  <h3 className="text-sm font-extrabold text-[#2C2418] uppercase tracking-wider font-mono border-b border-[#E8E0D4] pb-2 flex items-center gap-2">
                    <Tag size={16} className="text-[#6B5B3E]" />
                    Product & Order Specifications
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#8A7E6E] font-semibold block">Category</span>
                      <strong className="text-[#2C2418] font-bold">{selectedTx.category}</strong>
                    </div>
                    <div>
                      <span className="text-[#8A7E6E] font-semibold block">Batch / Lot Number</span>
                      <strong className="text-[#6B5B3E] font-mono font-bold">{selectedTx.batchNo}</strong>
                    </div>
                    <div>
                      <span className="text-[#8A7E6E] font-semibold block">Order Quantity</span>
                      <strong className="text-[#2C2418] font-bold">{selectedTx.quantity} {selectedTx.unit}</strong>
                    </div>
                    <div>
                      <span className="text-[#8A7E6E] font-semibold block">Unit Price</span>
                      <strong className="text-[#2C2418] font-mono font-bold">₹{selectedTx.unitPrice.toLocaleString("en-IN")}/{selectedTx.unit}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl space-y-3">
                  <h3 className="text-sm font-extrabold text-[#2C2418] uppercase tracking-wider font-mono border-b border-[#E8E0D4] pb-2 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#2E7D5B]" />
                    Audit & Provenance Grades
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[#8A7E6E] font-semibold">Labour Compliance</span>
                      <span className="font-mono font-bold text-[#2E7D5B] bg-[#EEF7F2] px-2 py-0.5 rounded border border-[#2E7D5B]/20">
                        {selectedTx.labourAudit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#8A7E6E] font-semibold">Company Trust</span>
                      <span className="font-mono font-bold text-[#2E7D5B] bg-[#EEF7F2] px-2 py-0.5 rounded border border-[#2E7D5B]/20">
                        {selectedTx.companyTrust}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#8A7E6E] font-semibold">Carbon Audit</span>
                      <span className="font-mono font-bold text-[#2E7D5B] bg-[#EEF7F2] px-2 py-0.5 rounded border border-[#2E7D5B]/20">
                        {selectedTx.carbonAudit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-[#E8E0D4]">
                      <span className="text-[#8A7E6E] font-semibold">Carbon Intensity</span>
                      <span className="font-mono font-bold text-[#6B5B3E]">{selectedTx.carbonIntensity}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-[#8A7E6E]">Payment Method</span>
                    <strong className="text-[#2C2418]">{selectedTx.paymentMethod}</strong>
                  </div>
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-[#8A7E6E]">Escrow Status</span>
                    <span className="text-[#2E7D5B] font-bold">{selectedTx.paymentStatus}</span>
                  </div>
                  <div className="pt-2 border-t border-[#E8E0D4] font-mono break-all text-[11px] text-[#8A7E6E]">
                    <span className="block font-bold text-[#6B5B3E] mb-0.5">Notary Hash:</span>
                    {selectedTx.hash}
                  </div>
                </div>
              </div>

              {/* Column 2: System Generated Tax Bill / Invoice */}
              <div className="bg-[#2C2418] text-white p-6 rounded-2xl space-y-5 border border-[#4E4433] shadow-lg flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Bill Header */}
                  <div className="flex justify-between items-start border-b border-[#4E4433] pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EFE9DF] shadow-xs">
                          <Logo size={16} />
                        </div>
                        <span className="font-bold text-lg text-white">Bizz<span className="text-[#7D6B4D]">Net</span> Bill</span>
                      </div>
                      <p className="text-[11px] font-mono text-[#A89B8A] mt-1 uppercase">Automated Tax Invoice</p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-[#7D6B4D] block">{selectedTx.invoiceNo}</span>
                      <span className="text-[11px] font-mono text-[#A89B8A]">{selectedTx.timestamp.split(" ")[0]}</span>
                    </div>
                  </div>

                  {/* Billed Parties */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-sans pb-3 border-b border-[#4E4433]">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#A89B8A] block font-bold">Issued By (Seller)</span>
                      <strong className="text-white text-sm block mt-0.5">
                        {selectedTx.type === "Purchase" ? selectedTx.counterpart : selectedTx.myOrg}
                      </strong>
                      <span className="text-[11px] font-mono text-[#A89B8A]">
                        GSTIN: {selectedTx.type === "Purchase" ? selectedTx.counterpartTaxId : selectedTx.myOrgTaxId}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#A89B8A] block font-bold">Billed To (Buyer)</span>
                      <strong className="text-white text-sm block mt-0.5">
                        {selectedTx.type === "Purchase" ? selectedTx.myOrg : selectedTx.counterpart}
                      </strong>
                      <span className="text-[11px] font-mono text-[#A89B8A]">
                        GSTIN: {selectedTx.type === "Purchase" ? selectedTx.myOrgTaxId : selectedTx.counterpartTaxId}
                      </span>
                    </div>
                  </div>

                  {/* Itemized Pricing Breakdown Table */}
                  <div className="space-y-2 text-xs font-mono">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#A89B8A] block">Itemized Pricing Breakdown</span>
                    
                    <div className="flex justify-between py-1 border-b border-[#4E4433]/60">
                      <span className="text-[#A89B8A]">{selectedTx.productName} ({selectedTx.quantity} {selectedTx.unit})</span>
                      <span className="font-bold text-white">₹{selectedTx.subtotal.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-[#4E4433]/60">
                      <span className="text-[#A89B8A]">Logistics & Freight Handling (2.5%)</span>
                      <span className="font-bold text-[#A89B8A]">₹{selectedTx.freightFee.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-[#4E4433]/60">
                      <span className="text-[#A89B8A]">Scope 3 Carbon Offset Surcharge (1%)</span>
                      <span className="font-bold text-[#2E7D5B]">₹{selectedTx.esgOffsetFee.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-[#4E4433]">
                      <span className="text-[#A89B8A]">Integrated GST / IGST (18%)</span>
                      <span className="font-bold text-[#A89B8A]">₹{selectedTx.gstAmount.toLocaleString("en-IN")}</span>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center pt-3 border-t border-[#7D6B4D]">
                      <div>
                        <span className="text-xs font-bold text-white uppercase block">Total System Bill</span>
                        <span className="text-[10px] text-[#A89B8A] font-normal">All Taxes & Fees Included</span>
                      </div>
                      <span className="text-2xl font-extrabold text-[#2E7D5B] font-mono">
                        ₹{selectedTx.totalAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bill Verification Footer */}
                <div className="pt-4 border-t border-[#4E4433] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#A89B8A]">BizzNet Notary Engine</span>
                    <span className="text-[#2E7D5B] font-bold">VERIFIED & NOTARIZED</span>
                  </div>
                  <button
                    onClick={() => alert(`Downloading system tax bill PDF for ${selectedTx.invoiceNo}...`)}
                    className="w-full py-2.5 bg-[#6B5B3E] hover:bg-[#7D6B4D] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={14} />
                    Download System Bill (PDF)
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="pt-4 border-t border-[#E8E0D4] flex justify-between items-center">
              <span className="text-xs font-mono text-[#8A7E6E]">
                Ledger ID: <strong>{selectedTx.id}</strong> &bull; Status: <strong className="text-[#2E7D5B]">{selectedTx.status}</strong>
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-[#2C2418] hover:bg-[#4E4433] text-white font-bold text-xs rounded-xl transition-colors"
              >
                Close Transaction Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
