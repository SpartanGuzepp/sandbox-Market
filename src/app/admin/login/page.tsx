import type { Metadata } from "next";
import { adminLoginAction } from "@/lib/admin/actions";

export const metadata: Metadata = { title: "Admin login" };

export default async function AdminLogin({ searchParams }: PageProps<"/admin/login">) {
  const { error } = await searchParams;
  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-24">
      <form action={adminLoginAction} className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold">Sandbox Market admin</h1>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Password</span>
          <input name="password" type="password" required autoFocus className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-600" />
        </label>
        {error && <p className="text-sm text-red-600">Wrong password.</p>}
        <button className="w-full rounded-lg bg-blue-700 py-2 font-medium text-white hover:bg-blue-800">Log in</button>
      </form>
    </main>
  );
}
