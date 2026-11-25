export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.dataset.embed="true";` }} />
      {children}
    </>
  );
}
