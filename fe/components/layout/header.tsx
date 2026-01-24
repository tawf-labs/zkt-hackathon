"use client";

import Link from "next/link";
import { Menu, Search, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useSearch } from "@/components/shared/SearchContext";
import { SearchDropdown } from "@/components/shared/SearchDropdown";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { useLanguage } from "@/components/providers/language-provider";

export function Header() {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const { searchQuery, setSearchQuery, isSearchOpen, setIsSearchOpen } =
    useSearch();
  const { language, setLanguage, t } = useLanguage();

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsSearchOpen(false);
      window.location.href = `/campaigns?search=${encodeURIComponent(
        searchQuery
      )}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        
        {/* LEFT */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center">
            <img src="/logo.png" className="h-8 object-contain" />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[0.79rem] font-medium">
            <Link href="/zakat" className="text-foreground hover:text-primary transition-colors">{t("header.zakat")}</Link>
            <Link href="/campaigns" className="text-foreground hover:text-primary transition-colors">{t("header.campaigns")}</Link>
            {/* <Link href="/faucet" className="text-foreground hover:text-primary transition-colors">{t("header.faucet")}</Link> */}
            <Link href="/explorer" className="text-foreground hover:text-primary transition-colors">{t("header.explorer")}</Link>
            <Link href="/contact" className="text-foreground hover:text-primary transition-colors">{t("header.contact")}</Link>

            {/* Dashboard dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1"
              >
                {t("header.dashboard")}
                <ChevronDown className="w-4 h-4" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-border rounded-lg shadow-lg z-50">
                  <ul className="flex flex-col p-2">
                    <li>
                      <Link href="/dashboard/donor" className="block px-4 py-2.5 rounded-md text-sm hover:bg-accent hover:text-primary transition-colors">
                        {t("dashboard.donor")}
                      </Link>
                    </li>
                    <li>
                      <Link href="/dashboard/organization" className="block px-4 py-2.5 rounded-md text-sm hover:bg-accent hover:text-primary transition-colors">
                        {t("dashboard.organization")}
                      </Link>
                    </li>
                    <li>
                      <Link href="/dashboard/auditor" className="block px-4 py-2.5 rounded-md text-sm hover:bg-accent hover:text-primary transition-colors">
                        {t("dashboard.auditor")}
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <Link href="/governance" className="text-foreground hover:text-primary transition-colors">{t("header.governance")}</Link>
          </nav>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">

          {/* SEARCH BAR */}
          <div className="relative hidden lg:block w-40">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />

            <input
              type="search"
              placeholder={t("header.search")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onKeyDown={handleEnter}
              className="w-full pl-9 py-1.5 h-10 bg-accent/50 border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />

            {/* DROPDOWN */}
            {isSearchOpen && searchQuery && <SearchDropdown />}
          </div>

          {/* Language Toggle */}
          <div className="hidden sm:flex items-center gap-1 border border-border rounded-lg p-1 bg-accent/30">
            <button
              onClick={() => setLanguage("id")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                language === "id"
                  ? "bg-primary text-white shadow-sm"
                  : "text-foreground/60 hover:text-foreground hover:bg-white/50"
              }`}
            >
              ID
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                language === "en"
                  ? "bg-primary text-white shadow-sm"
                  : "text-foreground/60 hover:text-foreground hover:bg-white/50"
              }`}
            >
              EN
            </button>
          </div>

          <Link href="/campaigns/new" className="hidden sm:flex items-center gap-2 border border-border h-10 px-5 rounded-lg hover:bg-accent hover:border-primary/30 transition-all text-sm font-medium">
            {t("header.start_campaign")}
          </Link>

          <ConnectWalletButton />

          <button className="md:hidden size-10 flex items-center justify-center rounded-lg hover:bg-accent transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
