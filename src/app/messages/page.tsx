"use client";

import { useEffect, useState, useRef, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Paperclip,
  Users,
  User,
  Building2,
  FileText,
  Download,
  Loader2,
  X,
  Plus,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import AppShell from "@/components/layout/app-shell";

interface AttachmentItem {
  id?: string;
  fileName: string;
  fileUrl?: string;
  fileKey?: string;
  storageKey?: string;
  mimeType: string;
  fileSize: number;
}

interface MessageItem {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
    email?: string;
  };
  attachments?: AttachmentItem[];
}

interface ConversationItem {
  id: string;
  type: "DIRECT" | "DEPARTMENT";
  title?: string;
  departmentId?: string;
  department?: { id: string; name: string };
  participants: Array<{
    employee: { id: string; fullName: string; position?: string };
  }>;
  messages?: MessageItem[];
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);

  const [currentEmployeeId, setCurrentEmployeeId] = useState<string>("");

  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachmentItem[]>([]);

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [employeesList, setEmployeesList] = useState<Array<{ id: string; fullName: string; position?: string }>>([]);
  const [departmentsList, setDepartmentsList] = useState<Array<{ id: string; name: string }>>([]);
  const [chatType, setChatType] = useState<"DIRECT" | "DEPARTMENT">("DEPARTMENT");
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [creatingChat, setCreatingChat] = useState(false);
  const [chatError, setChatError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadConversations = async (targetSelectId?: string) => {
    try {
      const convRes = await fetch("/api/conversations");
      const convData = await convRes.json();
      if (convData.success && convData.data) {
        setConversations(convData.data);
        if (targetSelectId) {
          setSelectedConvId(targetSelectId);
        } else if (convData.data.length > 0 && !selectedConvId) {
          setSelectedConvId(convData.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) {
          router.push("/login");
          return;
        }
        const authData = await authRes.json();
        const empId = authData.user?.employee?.id || authData.user?.employeeId;
        setCurrentEmployeeId(empId || "");

        await loadConversations();
      } catch (err) {
        console.error("Init messaging error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  useEffect(() => {
    if (!selectedConvId) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      setMsgLoading(true);
      try {
        const res = await fetch(`/api/conversations/${selectedConvId}/messages`);
        const data = await res.json();
        if (data.success && data.data) {
          setMessages(data.data);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
        setMessages([]);
      } finally {
        setMsgLoading(false);
      }
    }
    loadMessages();
  }, [selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (result.success) {
        setAttachedFiles((prev) => [...prev, result.data]);
      } else {
        alert(result.message || "File upload failed");
      }
    } catch {
      alert("Error uploading file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && attachedFiles.length === 0) || !selectedConvId) return;

    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${selectedConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          attachments: attachedFiles,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.data]);
        setContent("");
        setAttachedFiles([]);
        loadConversations(selectedConvId);
      } else {
        alert(data.message || "Failed to send message");
      }
    } catch (err) {
      console.error("Send message error:", err);
      alert("Network error sending message");
    } finally {
      setSending(false);
    }
  };

  const openNewChatModal = async () => {
    setShowNewChatModal(true);
    setChatError("");
    try {
      const [empRes, deptRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/departments"),
      ]);
      const empData = await empRes.json();
      const deptData = await deptRes.json();

      if (empData.employees) {
        setEmployeesList(
          empData.employees.filter((e: { id: string }) => e.id !== currentEmployeeId)
        );
      }
      if (deptData.departments) {
        setDepartmentsList(deptData.departments);
      }
    } catch (err) {
      console.error("Failed to load modal targets:", err);
    }
  };

  const handleCreateConversation = async (e: FormEvent) => {
    e.preventDefault();
    setCreatingChat(true);
    setChatError("");

    try {
      const payload =
        chatType === "DIRECT"
          ? { type: "DIRECT", recipientEmployeeId: selectedRecipientId }
          : { type: "DEPARTMENT", departmentId: selectedDeptId };

      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setShowNewChatModal(false);
        setSelectedRecipientId("");
        setSelectedDeptId("");
        await loadConversations(data.data.id);
      } else {
        setChatError(data.message || "Could not open channel. Access denied.");
      }
    } catch (err) {
      console.error("Create conversation failed:", err);
      setChatError("Unexpected error occurred.");
    } finally {
      setCreatingChat(false);
    }
  };

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  return (
    <AppShell>
      <div className="h-[calc(100vh-5rem)] p-4 md:p-6">
        <div className="mx-auto flex h-full max-w-7xl overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="flex w-80 flex-col border-r border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 p-4">
              <div>
                <h1 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Messages</h1>
                <p className="text-xs text-slate-400 dark:text-zinc-500">Internal Communications</p>
              </div>
              <button
                type="button"
                onClick={openNewChatModal}
                className="rounded-lg bg-emerald-600 p-2 text-white transition hover:bg-emerald-700"
                title="Start New Conversation or Channel"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto p-2">
              {loading ? (
                <div className="p-4 text-center text-xs text-slate-400">Loading channels...</div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No active channels or conversations. Click &quot;+&quot; above to start one.
                </div>
              ) : (
                conversations.map((conv) => {
                  const isSelected = conv.id === selectedConvId;
                  const isDept = conv.type === "DEPARTMENT";
                  const otherParticipant = conv.participants?.find(
                    (p) => p.employee?.id !== currentEmployeeId
                  );
                  const title = isDept
                    ? conv.department?.name || conv.title || "Department Channel"
                    : otherParticipant?.employee?.fullName || "Direct Message";

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConvId(conv.id)}
                      className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                        isSelected
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-300 font-medium"
                          : "hover:bg-slate-100 dark:hover:bg-zinc-800/60 text-slate-700 dark:text-zinc-300"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          isDept
                            ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400"
                            : "bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400"
                        }`}
                      >
                        {isDept ? <Building2 size={18} /> : <User size={18} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-zinc-100">
                          {title}
                        </p>
                        <p className="truncate text-xs text-slate-400 dark:text-zinc-500">
                          {isDept ? "Department Group" : "Private Chat"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col bg-white dark:bg-zinc-900">
            {selectedConv ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                      {selectedConv.type === "DEPARTMENT" ? <Users size={20} /> : <User size={20} />}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                        {selectedConv.type === "DEPARTMENT"
                          ? selectedConv.department?.name || selectedConv.title
                          : selectedConv.participants?.find((p) => p.employee?.id !== currentEmployeeId)?.employee?.fullName || "Direct Message"}
                      </h2>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                        {selectedConv.type === "DEPARTMENT"
                          ? "Hierarchical Department Channel"
                          : "Confidential Direct Chat"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-6">
                  {msgLoading ? (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-slate-400">
                      <FileText size={32} className="mb-2 text-slate-300 dark:text-zinc-700" />
                      <p className="text-xs">No messages yet in this conversation.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender?.id === currentEmployeeId;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <span className="mb-1 text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                            {isMe ? "You" : msg.sender?.fullName || "Unknown"} &bull;{" "}
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <div
                            className={`max-w-md rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                              isMe
                                ? "bg-emerald-600 text-white rounded-br-none"
                                : "bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 rounded-bl-none"
                            }`}
                          >
                            {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 space-y-1.5">
                                {msg.attachments.map((att, index) => (
                                  <a
                                    key={index}
                                    href={att.fileUrl || `/api/attachments/${att.id || att.fileKey}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`flex items-center gap-2 rounded-lg p-2 text-xs transition ${
                                      isMe
                                        ? "bg-emerald-700/60 hover:bg-emerald-700 text-white"
                                        : "bg-white dark:bg-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-600 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-600"
                                    }`}
                                  >
                                    {att.mimeType?.startsWith("image/") ? (
                                      <ImageIcon size={14} />
                                    ) : (
                                      <FileText size={14} />
                                    )}
                                    <span className="max-w-[150px] truncate font-medium">
                                      {att.fileName}
                                    </span>
                                    <Download size={13} className="ml-auto" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/40 p-2.5">
                    {attachedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1 text-xs text-slate-700 dark:text-zinc-200"
                      >
                        <FileText size={12} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="max-w-[120px] truncate">{file.fileName}</span>
                        <button
                          type="button"
                          onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="border-t border-slate-100 dark:border-zinc-800 p-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                    />
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                    >
                      {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
                    </button>

                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-800"
                    />

                    <button
                      type="submit"
                      disabled={sending || (!content.trim() && attachedFiles.length === 0)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-400 dark:text-zinc-500">
                Select a channel from the sidebar or click &quot;+&quot; to start communication
              </div>
            )}
          </div>
        </div>
      </div>

      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-xl border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Start New Conversation</h2>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>

            {chatError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 p-3 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle size={15} />
                <span>{chatError}</span>
              </div>
            )}

            <div className="mt-4 flex rounded-lg bg-slate-100 dark:bg-zinc-800 p-1">
              <button
                type="button"
                onClick={() => setChatType("DEPARTMENT")}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                  chatType === "DEPARTMENT" ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"
                }`}
              >
                Department Channel
              </button>
              <button
                type="button"
                onClick={() => setChatType("DIRECT")}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                  chatType === "DIRECT" ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"
                }`}
              >
                Direct Message
              </button>
            </div>

            <form onSubmit={handleCreateConversation} className="mt-5 space-y-4">
              {chatType === "DIRECT" ? (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-500 dark:text-zinc-400">
                    Select Colleague
                  </label>
                  <select
                    required
                    value={selectedRecipientId}
                    onChange={(e) => setSelectedRecipientId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  >
                    <option value="">Choose an employee...</option>
                    {employeesList.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} {emp.position ? `(${emp.position})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-500 dark:text-zinc-400">
                    Select Department
                  </label>
                  <select
                    required
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  >
                    <option value="">Choose a department...</option>
                    {departmentsList.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="rounded-lg border border-slate-200 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    creatingChat || (chatType === "DIRECT" ? !selectedRecipientId : !selectedDeptId)
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {creatingChat ? "Starting..." : "Start Channel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}