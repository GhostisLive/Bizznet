"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/lib/AuthProvider";
import { useCurrentOrg } from "@/lib/useCurrentOrg";
import { api } from "@/lib/api";
import {
  CheckCheck,
  ChevronRight,
  ClipboardCheck,
  Loader2,
  MessageSquare,
  Building2,
  X,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
  Smile,
} from "lucide-react";

interface Message {
  id: string;
  negotiation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface Negotiation {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  status: string;
  provenance_reviewed: boolean;
  created_at: string;
  listing?: { title: string; category: string } | null;
  buyer?: { name: string } | null;
  seller?: { name: string } | null;
  lastMessage?: Message;
}

interface RegisteredCompany {
  id: string;
  name: string;
  role: string;
  status: string;
}

export default function MessagesPage() {
  const currentOrg = useCurrentOrg();
  const { user, org, loading: authLoading } = useAuth();
  const [threads, setThreads] = useState<Negotiation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<RegisteredCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<RegisteredCompany | null>(null);
  const [showAuditForm, setShowAuditForm] = useState(false);
  const [auditType, setAuditType] = useState("Company");
  const [auditNote, setAuditNote] = useState("");
  const [auditNotice, setAuditNotice] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !org || !user) return;
    async function loadThreads() {
      try {
        const negotiations = await api.getNegotiations();
        const enriched = await Promise.all(negotiations.map(async (thread) => {
          try {
            const threadMessages = await api.request<Message[]>(`/negotiation/${thread.id}/messages`);
            return { ...thread, lastMessage: threadMessages.at(-1) };
          } catch {
            return thread;
          }
        }));
        setThreads(enriched);
        setSelectedId((current) => current ?? enriched[0]?.id ?? null);
        if (currentOrg.role === "auditor") {
          setCompanies(await api.getAuditorCompanies());
        }
      } catch (loadError) {
        console.error("Failed to load messages:", loadError);
        setError(loadError instanceof Error ? loadError.message : "We could not load your conversations.");
      } finally {
        setLoading(false);
      }
    }
    loadThreads();
  }, [authLoading, currentOrg.role, org, user]);

  const registeredCompanies = useMemo(() => {
    if (companies.length > 0) return companies;
    const threadCompanies = threads.map((thread) => {
      const isBuyer = thread.buyer_id === org?.id;
      return {
        id: isBuyer ? thread.seller_id : thread.buyer_id,
        name: isBuyer ? thread.seller?.name ?? "Registered company" : thread.buyer?.name ?? "Registered company",
        role: isBuyer ? "supplier" : "buyer",
        status: "registered",
      };
    });
    const uniqueThreadCompanies = threadCompanies.filter((company, index, list) => list.findIndex((item) => item.id === company.id) === index);
    return uniqueThreadCompanies;
  }, [companies, org?.id, threads]);

  useEffect(() => {
    if (!selectedId) return;
    async function loadMessages() {
      try {
        const result = selectedCompany
          ? (await api.getAuditorMessages(selectedCompany.id)).map((message) => ({ ...message, negotiation_id: "" }))
          : await api.request<Message[]>(`/negotiation/${selectedId}/messages`);
        setMessages(result);
      } catch (loadError) {
        console.error("Failed to load conversation:", loadError);
        setError("This conversation could not be loaded.");
      }
    }
    loadMessages();
  }, [selectedCompany, selectedId]);

  const visibleThreads = useMemo(() => {
    const term = search.toLowerCase().trim();
    return threads.filter((thread) => {
      const name = thread.buyer_id === org?.id ? thread.seller?.name : thread.buyer?.name;
      return !term || `${name ?? ""} ${thread.listing?.title ?? ""}`.toLowerCase().includes(term);
    });
  }, [org?.id, search, threads]);

  const selectedThread = threads.find((thread) => thread.id === selectedId);
  const counterpartName = selectedThread
    ? selectedThread.buyer_id === org?.id
      ? selectedThread.seller?.name ?? "Supplier"
      : selectedThread.buyer?.name ?? "Buyer"
    : "Conversation";

  function selectCompany(company: RegisteredCompany) {
    setSelectedCompany(company);
    setMessages([]);
    const companyThread = threads.find((thread) => thread.buyer_id === company.id || thread.seller_id === company.id);
    setSelectedId(companyThread?.id ?? null);
    setAuditNotice(null);
  }

  function submitAuditRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCompany) return;
    api.createAuditRequest({
      company_id: selectedCompany.id,
      audit_type: auditType.toLowerCase() as "company" | "labour" | "carbon",
      scope_note: auditNote || undefined,
    }).then(() => {
      setAuditNotice(`${auditType} audit request sent to ${selectedCompany.name}.`);
      setShowAuditForm(false);
      setAuditNote("");
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "The audit request could not be sent."));
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || (!selectedId && !selectedCompany)) return;
    setSending(true);
    setError(null);
    try {
      const sent = selectedCompany
        ? { ...(await api.sendAuditorMessage(selectedCompany.id, content)), negotiation_id: "" }
        : await api.request<Message>(`/negotiation/${selectedId}/messages`, { method: "POST", body: JSON.stringify({ content }) });
      setMessages((current) => [...current, sent]);
      if (selectedId) {
        setThreads((current) => current.map((thread) => thread.id === selectedId ? { ...thread, lastMessage: sent } : thread));
      }
      setDraft("");
    } catch (sendError) {
      console.error("Failed to send message:", sendError);
      setError("Your message could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (authLoading || loading || currentOrg.loading) {
    return <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center"><div className="flex items-center gap-3 text-sm font-semibold text-[#8A7E6E]"><Loader2 className="animate-spin" size={20} /> Loading messages...</div></div>;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row">
      <Sidebar currentRole={currentOrg.roleLabel} orgName={currentOrg.orgName} nodeId={currentOrg.nodeId} />
      <main className="flex-1 min-w-0 p-5 md:p-8">
        <header className="mb-6 flex flex-col gap-2 border-b border-[#E8E0D4] pb-5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-[0.18em] text-[#8A7E6E]"><MessageSquare size={15} className="text-[#6B5B3E]" /> Secure workspace chat</div>
          <h1 className="text-3xl font-extrabold tracking-tight">Messages</h1>
          <p className="text-sm font-medium text-[#6B6257]">Chat directly with buyers, suppliers, and audit counterparts without leaving your conversation.</p>
        </header>

        {error && <div className="mb-4 rounded-xl border border-[#E8C4B8] bg-[#FFF4F0] px-4 py-3 text-sm font-semibold text-[#A04E3A]">{error}</div>}

        <section className="grid h-[calc(100vh-205px)] min-h-[580px] grid-cols-1 overflow-hidden rounded-2xl border border-[#E8E0D4] bg-white shadow-[0_4px_18px_rgba(75,59,37,0.06)] lg:grid-cols-[350px_minmax(0,1fr)]">
          <aside className={`border-b border-[#E8E0D4] lg:border-b-0 lg:border-r ${selectedId ? "hidden lg:block" : "block"}`}>
            <div className="border-b border-[#E8E0D4] p-4"><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89B8A]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations and companies" className="h-10 w-full rounded-xl border border-[#E8E0D4] bg-[#FCFAF7] pl-9 pr-3 text-sm outline-none focus:border-[#6B5B3E]" /></div></div>
            <div className="max-h-full overflow-y-auto">
              {visibleThreads.map((thread) => {
                const name = thread.buyer_id === org?.id ? thread.seller?.name ?? "Supplier" : thread.buyer?.name ?? "Buyer";
                const active = thread.id === selectedId;
                return <button key={thread.id} onClick={() => setSelectedId(thread.id)} className={`flex w-full items-start gap-3 border-b border-[#F0EBE3] p-4 text-left transition ${active ? "bg-[#F5F0E8]" : "hover:bg-[#FCFAF7]"}`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6EEF8] text-xs font-extrabold text-[#315A87]">{name.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-sm">{name}</strong>{thread.lastMessage && <time className="shrink-0 text-[10px] font-mono text-[#A89B8A]">{new Date(thread.lastMessage.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</time>}</span><span className="mt-1 block truncate text-xs text-[#8A7E6E]">{thread.lastMessage?.content ?? "Start a conversation"} </span><span className="mt-1 flex items-center gap-1 text-[10px] font-mono text-[#6B5B3E]"><span className="truncate">{thread.listing?.title ?? "Negotiation"}</span><span>·</span><span className="capitalize">{thread.status.replace("_", " ")}</span></span></span></button>;
              })}
              {visibleThreads.length === 0 && <p className="p-6 text-center text-sm text-[#8A7E6E]">No conversations found.</p>}
              {currentOrg.role === "auditor" && registeredCompanies.length > 0 && <div className="border-t border-[#E8E0D4]"><div className="flex items-center gap-2 bg-[#FCFAF7] px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-[#8A7E6E]"><Building2 size={14} /> Registered companies</div>{registeredCompanies.filter((company) => company.name.toLowerCase().includes(search.toLowerCase().trim())).map((company) => <button key={company.id} onClick={() => selectCompany(company)} className={`flex w-full items-center gap-3 border-b border-[#F0EBE3] p-4 text-left transition ${selectedCompany?.id === company.id ? "bg-[#E7F3EC]" : "hover:bg-[#FCFAF7]"}`}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F3EC] text-xs font-extrabold text-[#2E7D5B]">{company.name.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{company.name}</strong><span className="mt-1 block text-xs capitalize text-[#8A7E6E]">{company.role.replace("_", " ")} · {company.status}</span></span><ChevronRight size={16} className="text-[#A89B8A]" /></button>)}</div>}
            </div>
          </aside>

          <div className={`flex min-h-0 flex-col ${selectedId || selectedCompany ? "flex" : "hidden lg:flex"}`}>
            {selectedThread || selectedCompany ? (
              <>
                <div className="flex items-center gap-3 border-b border-[#E8E0D4] px-5 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F3EC] text-sm font-extrabold text-[#2E7D5B]">
                    {(selectedCompany?.name ?? counterpartName).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-extrabold">{selectedCompany?.name ?? counterpartName}</h2>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-[#8A7E6E]">
                      <ShieldCheck size={12} className="text-[#2E7D5B]" />
                      {selectedThread?.listing?.title ?? "Registered company"}
                    </p>
                  </div>
                  {currentOrg.role === "auditor" && selectedCompany && (
                    <button onClick={() => setShowAuditForm(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#6B5B3E] px-3 py-2 text-xs font-bold text-white hover:bg-[#564A32]">
                      <ClipboardCheck size={15} /> Start audit
                    </button>
                  )}
                  <span className="rounded-full bg-[#EEF7F2] px-2.5 py-1 text-[10px] font-mono font-bold text-[#2E7D5B]">Secure chat</span>
                </div>
                {auditNotice && <div className="mx-5 mt-4 rounded-xl border border-[#B9DDC8] bg-[#EEF7F2] px-4 py-3 text-xs font-bold text-[#2E7D5B]">{auditNotice}</div>}
                <div className="flex-1 space-y-4 overflow-y-auto bg-[#FCFAF7] p-5">
                  {messages.length === 0 && (
                    <div className="flex h-full flex-col items-center justify-center text-center text-[#8A7E6E]">
                      <MessageSquare size={36} className="mb-3 text-[#D4C9B8]" />
                      <p className="font-bold">No messages yet</p>
                      <p className="mt-1 text-xs">Send the first message to start this conversation.</p>
                    </div>
                  )}
                  {messages.map((message) => {
                    const mine = message.sender_id === org?.id;
                    return (
                      <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[78%] rounded-2xl px-4 py-3 ${mine ? "rounded-br-md bg-[#3D3425] text-white" : "rounded-bl-md border border-[#E8E0D4] bg-white"}`}>
                          <p className="text-sm leading-6">{message.content}</p>
                          <div className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] font-mono ${mine ? "text-[#D7CDBE]" : "text-[#A89B8A]"}`}>
                            {new Date(message.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            {mine && <CheckCheck size={13} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={sendMessage} className="flex items-end gap-2 border-t border-[#E8E0D4] bg-white p-4">
                  <button type="button" aria-label="Attach file" className="rounded-xl p-2.5 text-[#8A7E6E] hover:bg-[#F5F0E8]"><Paperclip size={18} /></button>
                  <button type="button" aria-label="Add emoji" className="rounded-xl p-2.5 text-[#8A7E6E] hover:bg-[#F5F0E8]"><Smile size={18} /></button>
                  <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={1} placeholder="Write a message..." className="min-h-11 flex-1 resize-none rounded-xl border border-[#E8E0D4] bg-[#FCFAF7] px-3 py-3 text-sm outline-none focus:border-[#6B5B3E]" />
                  <button disabled={sending || !draft.trim()} type="submit" className="flex h-11 items-center gap-2 rounded-xl bg-[#2E7D5B] px-4 text-xs font-bold text-white disabled:opacity-50"><Send size={16} /> Send</button>
                </form>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-[#8A7E6E]">
                <MessageSquare size={42} className="mb-3 text-[#D4C9B8]" />
                <p className="font-bold">Select a conversation</p>
                <p className="mt-1 text-xs">Your messages will appear here.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      {showAuditForm && selectedCompany && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C2418]/45 p-5"><div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-2xl border border-[#E8E0D4] bg-[#FFFDF9] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-xl font-extrabold">Start audit</h2><p className="mt-1 text-xs text-[#8A7E6E]">Request an audit from {selectedCompany.name} and keep the conversation in Messages.</p></div><button onClick={() => setShowAuditForm(false)} aria-label="Close audit form" className="rounded-lg p-2 text-[#8A7E6E] hover:bg-[#F5F0E8]"><X size={18} /></button></div><form onSubmit={submitAuditRequest} className="mt-5 space-y-4"><label className="block text-xs font-mono font-bold uppercase tracking-wide text-[#6B5B3E]">Audit parameter<select value={auditType} onChange={(event) => setAuditType(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#E8E0D4] bg-white px-3 text-sm"><option>Company</option><option>Labour</option><option>Carbon</option></select></label><label className="block text-xs font-mono font-bold uppercase tracking-wide text-[#6B5B3E]">Message to company<textarea value={auditNote} onChange={(event) => setAuditNote(event.target.value)} rows={4} placeholder="Describe the scope and evidence needed..." className="mt-2 w-full rounded-xl border border-[#E8E0D4] bg-white p-3 text-sm outline-none focus:border-[#6B5B3E]" /></label><div className="flex justify-end gap-3"><button type="button" onClick={() => setShowAuditForm(false)} className="rounded-xl border border-[#E8E0D4] px-4 py-2.5 text-xs font-bold text-[#5C5040] hover:bg-[#F5F0E8]">Cancel</button><button type="submit" className="rounded-xl bg-[#6B5B3E] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#564A32]">Prepare audit request</button></div></form></div></div>}
    </div>
  );
}
