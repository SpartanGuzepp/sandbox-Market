// A phone-shaped frame so the banking app looks like a separate device in demos.
export function BankFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-sm overflow-hidden rounded-[2rem] border-8 border-slate-900 bg-white shadow-xl">
        <div className="bg-blue-900 px-5 pb-4 pt-6 text-white">
          <p className="text-xs uppercase tracking-widest text-blue-200">Simulated banking app</p>
          <p className="text-xl font-semibold">Customer Bank</p>
        </div>
        <div className="min-h-[28rem] p-5">{children}</div>
      </div>
    </main>
  );
}
