import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl flex-1 px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link href="/" className="mt-4 inline-block text-blue-700 hover:underline">Back to Sandbox Market</Link>
    </main>
  );
}
