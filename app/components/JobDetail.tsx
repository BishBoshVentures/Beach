"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { Job } from "@/lib/types";

const stageOptions = [
  { key: "enquiry", label: "Enquiry", active: "bg-amber-500 text-white", inactive: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
  { key: "quoted", label: "Quoted", active: "bg-blue-500 text-white", inactive: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
  { key: "production", label: "Production", active: "bg-green-500 text-white", inactive: "bg-green-50 text-green-700 hover:bg-green-100" },
  { key: "on_hold", label: "On Hold", active: "bg-gray-500 text-white", inactive: "bg-gray-100 text-gray-600 hover:bg-gray-200" },
] as const;

const ramsOptions = [
  { value: "not_required", label: "Not Required" },
  { value: "requested", label: "Requested" },
  { value: "received", label: "Received" },
] as const;

type SaveStatus = "idle" | "saving" | "saved";

export default function JobDetail({ job: initialJob }: { job: Job }) {
  const [job, setJob] = useState(initialJob);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [newNote, setNewNote] = useState("");
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const showSaved = useCallback(() => {
    setSaveStatus("saved");
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => setSaveStatus("idle"), 2000);
  }, []);

  const saveField = useCallback(
    async (fields: Partial<Job>) => {
      setSaveStatus("saving");
      const supabase = createClient();
      await supabase
        .from("jobs")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", job.id);
      showSaved();
    },
    [job.id, showSaved]
  );

  const handleStageChange = (stage: Job["stage"]) => {
    setJob((prev) => ({ ...prev, stage }));
    saveField({ stage });
  };

  const handleBlur = (field: keyof Job, value: string) => {
    if (value === (job[field] ?? "")) return;
    setJob((prev) => ({ ...prev, [field]: value || null }));
    saveField({ [field]: value || null });
  };

  const handleToggle = (checked: boolean) => {
    const updates: Partial<Job> = {
      tc_signed: checked,
      tc_signed_date: checked ? new Date().toISOString().split("T")[0] : null,
    };
    setJob((prev) => ({ ...prev, ...updates }));
    saveField(updates);
  };

  const handleTcDateBlur = (value: string) => {
    if (value === (job.tc_signed_date ?? "")) return;
    setJob((prev) => ({ ...prev, tc_signed_date: value || null }));
    saveField({ tc_signed_date: value || null });
  };

  const handleRamsChange = (value: Job["rams_status"]) => {
    setJob((prev) => ({ ...prev, rams_status: value }));
    saveField({ rams_status: value });
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    const now = new Date();
    const timestamp = now.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) + ", " + now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const entry = `[${timestamp}] ${newNote.trim()}`;
    const updatedNotes = job.notes ? `${entry}\n${job.notes}` : entry;

    setJob((prev) => ({ ...prev, notes: updatedNotes }));
    setNewNote("");
    await saveField({ notes: updatedNotes });
  };

  const handleMoveToOnHold = async () => {
    setJob((prev) => ({ ...prev, stage: "on_hold" }));
    const supabase = createClient();
    await supabase
      .from("jobs")
      .update({ stage: "on_hold", updated_at: new Date().toISOString() })
      .eq("id", job.id);
    router.push("/dashboard/projects");
  };

  return (
    <div>
      {/* Save indicator */}
      <div className="flex justify-end mb-4 h-5">
        {saveStatus === "saving" && (
          <span className="text-xs text-gray-400">Saving...</span>
        )}
        {saveStatus === "saved" && (
          <span className="text-xs text-green-600">Saved</span>
        )}
      </div>

      {/* Stage selector */}
      <div className="flex flex-wrap gap-2 mb-8">
        {stageOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => handleStageChange(opt.key as Job["stage"])}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              job.stage === opt.key ? opt.active : opt.inactive
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Job Details */}
        <FieldSection title="Job Details">
          <TextField label="Job Name" defaultValue={job.job_name} onBlur={(v) => handleBlur("job_name", v)} />
          <TextField label="Brand" defaultValue={job.brand ?? ""} onBlur={(v) => handleBlur("brand", v)} />
          <TextField label="Account Owner" defaultValue={job.molson_owner ?? ""} onBlur={(v) => handleBlur("molson_owner", v)} />
          <TextField label="PO Number" defaultValue={job.po_number ?? ""} onBlur={(v) => handleBlur("po_number", v)} />
        </FieldSection>

        {/* Contact */}
        <FieldSection title="Contact">
          <TextField label="Contact Name" defaultValue={job.contact_name ?? ""} onBlur={(v) => handleBlur("contact_name", v)} />
          <TextField label="Contact Phone" defaultValue={job.contact_phone ?? ""} onBlur={(v) => handleBlur("contact_phone", v)} />
          <TextField label="Contact Email" defaultValue={job.contact_email ?? ""} onBlur={(v) => handleBlur("contact_email", v)} />
          <TextAreaField label="Install Address" defaultValue={job.install_address ?? ""} onBlur={(v) => handleBlur("install_address", v)} />
        </FieldSection>

        {/* Dates */}
        <FieldSection title="Dates">
          <DateField label="Build Date" defaultValue={job.build_date ?? ""} onBlur={(v) => handleBlur("build_date", v)} />
          <DateField label="Live Date" defaultValue={job.live_date ?? ""} onBlur={(v) => handleBlur("live_date", v)} />
          <DateField label="De-rig Date" defaultValue={job.derig_date ?? ""} onBlur={(v) => handleBlur("derig_date", v)} />
        </FieldSection>

        {/* Status */}
        <FieldSection title="Status">
          <TextField label="Build Manager" defaultValue={job.build_manager ?? ""} onBlur={(v) => handleBlur("build_manager", v)} />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <label className="block text-sm font-medium text-gray-700">
                T&Cs Signed
              </label>
              <button
                type="button"
                role="switch"
                aria-checked={job.tc_signed}
                onClick={() => handleToggle(!job.tc_signed)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  job.tc_signed ? "bg-brand-teal" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                    job.tc_signed ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            {job.tc_signed && (
              <DateField
                label="Date Signed"
                defaultValue={job.tc_signed_date ?? ""}
                onBlur={handleTcDateBlur}
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RAMs Status
            </label>
            <select
              value={job.rams_status}
              onChange={(e) =>
                handleRamsChange(e.target.value as Job["rams_status"])
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
            >
              {ramsOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </FieldSection>
      </div>

      {/* Notes & Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Notes & Activity
        </h3>

        <div className="flex gap-2 mb-4">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={2}
            placeholder="Add a note..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal resize-none"
          />
          <button
            onClick={handleAddNote}
            disabled={!newNote.trim()}
            className="self-end px-4 py-2 bg-brand-teal text-white text-sm font-medium rounded-lg hover:bg-brand-teal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Note
          </button>
        </div>

        {job.notes ? (
          <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 rounded-lg p-4 font-sans leading-relaxed">
            {job.notes}
          </pre>
        ) : (
          <p className="text-sm text-gray-400">No notes yet.</p>
        )}
      </div>

      {/* Move to On Hold */}
      {job.stage !== "on_hold" && (
        <div className="text-center">
          <button
            onClick={handleMoveToOnHold}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Move to On Hold
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Reusable field components ── */

function FieldSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function TextField({
  label,
  defaultValue,
  onBlur,
}: {
  label: string;
  defaultValue: string;
  onBlur: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        defaultValue={defaultValue}
        onBlur={(e) => onBlur(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
      />
    </div>
  );
}

function TextAreaField({
  label,
  defaultValue,
  onBlur,
}: {
  label: string;
  defaultValue: string;
  onBlur: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <textarea
        defaultValue={defaultValue}
        onBlur={(e) => onBlur(e.target.value)}
        rows={2}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal resize-none"
      />
    </div>
  );
}

function DateField({
  label,
  defaultValue,
  onBlur,
}: {
  label: string;
  defaultValue: string;
  onBlur: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="date"
        defaultValue={defaultValue}
        onBlur={(e) => onBlur(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
      />
    </div>
  );
}
