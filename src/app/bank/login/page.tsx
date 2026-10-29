import type { Metadata } from "next";
import { bankLoginAction } from "@/lib/bank-actions";
import { BankFrame } from "@/components/BankFrame";

export const metadata: Metadata = { title: "Banking app" };

export default async function BankLogin({ searchParams }: PageProps<"/bank/login">) {
  const { error } = await searchParams;
  return (
    <BankFrame>
      <form action={bankLoginAction} className="space-y-4 pt-8">
        <p className="text-center text-slate-600">Enter your PIN to see payments waiting for your approval.</p>
        <input name="pin" type="password" inputMode="numeric" autoFocus required placeholder="PIN"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-blue-600" />
        {error && <p className="text-center text-sm text-red-600">Wrong PIN.</p>}
        <button className="w-full rounded-xl bg-blue-700 py-3 font-medium text-white hover:bg-blue-800">Unlock</button>
      </form>
    </BankFrame>
  );
}
