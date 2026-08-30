export default function Footer() {
  const columns = [
    {
      heading: "Platform",
      links: ["Marketplace", "Provenance Engine", "Negotiation", "Dashboard"],
    },
    {
      heading: "Company",
      links: ["About", "Careers", "Press", "Contact"],
    },
    {
      heading: "Resources",
      links: ["Documentation", "API Reference", "Compliance Guide", "Blog"],
    },
    {
      heading: "Legal",
      links: ["Privacy Policy", "Terms of Service", "Data Processing", "Cookie Policy"],
    },
  ];

  return (
    <footer className="border-t border-border-subtle bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 md:col-span-4 lg:col-span-1 lg:pr-8">
            <a
              href="/"
              className="flex items-center gap-2 font-sans text-lg font-bold text-text-primary"
            >
              <span className="block size-2 rounded-full bg-accent" />
              BizzNet
            </a>
            <p className="mt-3 max-w-xs text-sm text-text-secondary leading-relaxed">
              Provenance-priced B2B supply chain. Every material flow carries
              its verification.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h4 className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
                {col.heading}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border-subtle pt-8 md:flex-row">
          <p className="font-mono text-xs text-text-tertiary">
            &copy; {new Date().getFullYear()} BizzNet. All rights reserved.
          </p>
          <p className="font-mono text-xs text-text-tertiary">
            Built for transparent supply chains.
          </p>
        </div>
      </div>
    </footer>
  );
}
