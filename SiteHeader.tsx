"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return <header className="site-header">
    <div className="container header-inner">
      <Link href="/" className="brand" onClick={close} aria-label="GraphicsGraphy home">
        <span className="brand-mark">G</span><span>GraphicsGraphy</span>
      </Link>
      <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
        {open ? <X size={19}/> : <Menu size={19}/>}
      </button>
      <nav className={`nav-links ${open ? "open" : ""}`} aria-label="Main navigation">
        <Link href="/" onClick={close}>Home</Link>
        <Link href="/posts" onClick={close}>All Posts</Link>
        <Link href="/about" onClick={close}>About</Link>
        <Link href="/contact" onClick={close}>Contact</Link>
      </nav>
    </div>
  </header>;
}
