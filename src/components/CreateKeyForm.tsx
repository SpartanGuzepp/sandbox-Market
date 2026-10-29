"use client";
import { useActionState } from "react";
import { createAgentKeyAction, type CreateKeyState } from "@/lib/admin/actions";

// Shows the new key exactly once. Only its hash is stored, so it can't be shown again later.
export function CreateKeyForm() {
  const [state, action, pending] = useActionState<CreateKeyState, FormData>(createAgentKeyAction, {});
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <form action={action} className="flex flex-wrap gap-2">
        <input name="name" placeholder="Name, e.g. Leashed agent v1" className="min-w-64 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
        <button disabled={pending} className="rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-800">Create key</button>
      </form>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
      {state.key && (
        <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm">
          <p className="font-medium">New key for &quot;{state.name}&quot;. Copy it now, it won&apos;t be shown again:</p>
          <code className="mt-1 block break-all rounded bg-white px-2 py-1 font-mono">{state.key}</code>
        </div>
      )}
    </div>
  );
}
