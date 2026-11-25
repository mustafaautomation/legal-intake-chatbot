import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ashford Community Board — sample host" };

export default function EmbedDemoPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] text-[#1d2a22]">
      <header className="border-b border-[#d5e0d6] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <p className="text-lg font-semibold">Ashford Community Board</p>
          <p className="text-sm text-[#4d6254]">A sample host site</p>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.16em] text-[#6d5a3a]">Neighborhood note</p>
        <h1 className="mt-2 text-4xl font-serif leading-tight">Harbor Street is getting new crosswalk paint</h1>
        <p className="mt-4 text-lg leading-8">
          This page is not the law firm. It is a fake community site used to show the intake widget. The button in the
          corner loads Harlow & Pierce in an iframe. Nothing here is a real city announcement.
        </p>
        <pre className="mt-8 overflow-x-auto border border-[#d5e0d6] bg-white p-4 text-sm leading-6">{`<script src="https://legal-chat.quvantic.com/widget.js" data-firm="Harlow & Pierce LLP" defer></script>`}</pre>
      </article>
      <script src="/widget.js" defer />
    </main>
  );
}
