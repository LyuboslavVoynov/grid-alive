import Link from "next/link";
export function ProductNav({ active }: { active: "britain" | "area" | "home" }) {
  return <nav className="product-nav" aria-label="Main navigation">{([
    ["britain", "/", "Britain"], ["area", "/area", "Your area"], ["home", "/home", "Your home"]
  ] as const).map(([id, href, label]) => <Link key={id} href={href} aria-current={active === id ? "page" : undefined}>{label}</Link>)}</nav>;
}
export function Workspace({ active, title, intro, children }: { active: "area" | "home"; title: string; intro: string; children: React.ReactNode }) {
  return <main className="workspace"><header className="workspace-header"><Link className="brand" href="/">GRID <i>/</i> ALIVE</Link><ProductNav active={active}/><Link className="source-link" href="/methodology">Sources & methodology ↗</Link></header><div className="workspace-body"><div className="workspace-heading"><p className="eyebrow">{active === "home" ? "MAKE IT PERSONAL" : "CLOSER TO HOME"}</p><h1>{title}</h1><p>{intro}</p></div>{children}</div><div className="workspace-footer">Great Britain · electricity, explained <Link href="/">Back to the live map ↗</Link></div></main>;
}
