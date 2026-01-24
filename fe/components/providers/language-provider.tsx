"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type Language = "id" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

const translations = {
  id: {
    // Header
    "header.search": "Cari kampanye, organisasi...",
    "header.campaigns": "Kampanye",
    "header.zakat": "Zakat",
    "header.faucet": "Faucet",
    "header.governance": "Tata Kelola",
    "header.dashboard": "Dasbor",
    "header.explorer": "Penjelajah",
    "header.contact": "Kontak",
    "header.start_campaign": "Mulai Kampanye",
    "header.connectWallet": "Hubungkan Dompet",
    "header.disconnect": "Putuskan",
    "header.balance": "Saldo",

    // Hero Section
    "hero.title": "Platform Donasi Transparan Berbasis Blockchain",
    "hero.subtitle":
      "Salurkan donasi Anda dengan aman dan transparan melalui teknologi blockchain. Setiap donasi tercatat dan dapat dilacak secara real-time.",
    "hero.startDonating": "Mulai Berdonasi",
    "hero.exploreCampaigns": "Jelajahi Kampanye",

    // How It Works
    "howItWorks.title": "Bagaimana Cara Kerjanya",
    "howItWorks.subtitle":
      "Donasi Anda disalurkan dengan aman dan transparan",
    "howItWorks.step1.title": "Hubungkan Dompet",
    "howItWorks.step1.desc":
      "Hubungkan dompet crypto Anda untuk memulai berdonasi",
    "howItWorks.step2.title": "Pilih Kampanye",
    "howItWorks.step2.desc":
      "Pilih kampanye yang ingin Anda dukung dari daftar kampanye yang terverifikasi",
    "howItWorks.step3.title": "Berdonasi",
    "howItWorks.step3.desc":
      "Kirim donasi Anda dengan aman melalui blockchain",
    "howItWorks.step4.title": "Lacak Donasi",
    "howItWorks.step4.desc":
      "Pantau penggunaan donasi Anda secara real-time dan transparan",

    // Featured Campaigns
    "campaigns.title": "Kampanye Unggulan",
    "campaigns.subtitle": "Kampanye yang sedang membutuhkan dukungan Anda",
    "campaigns.viewAll": "Lihat Semua Kampanye",
    "campaigns.raised": "Terkumpul",
    "campaigns.of": "dari",
    "campaigns.backers": "Donatur",
    "campaigns.daysLeft": "Hari Lagi",
    "campaigns.donate": "Donasi Sekarang",
    "campaigns.learnMore": "Pelajari Lebih Lanjut",

    // Zakat Calculator
    "zakat.title": "Kalkulator Zakat",
    "zakat.subtitle":
      "Hitung zakat Anda dan salurkan langsung ke kampanye yang tepat",
    "zakat.calculator": "Kalkulator Zakat",
    "zakat.monthlyIncome": "Pendapatan Bulanan",
    "zakat.monthlyIncomePlaceholder": "Masukkan pendapatan bulanan Anda",
    "zakat.nisab": "Nisab",
    "zakat.nisabPlaceholder": "Masukkan nilai nisab (opsional)",
    "zakat.nisabHelper": "Nisab saat ini: 85 gram emas (~Rp 85,000,000)",
    "zakat.calculate": "Hitung Zakat",
    "zakat.reset": "Reset",
    "zakat.results": "Hasil Perhitungan",
    "zakat.yourIncome": "Pendapatan Anda",
    "zakat.nisabValue": "Nilai Nisab",
    "zakat.calculatedZakat": "Zakat yang Harus Dibayar",
    "zakat.walletBalance": "Saldo Dompet",
    "zakat.payZakat": "Bayar Zakat",
    "zakat.connectFirst": "Hubungkan Dompet Terlebih Dahulu",
    "zakat.insufficientBalance": "Saldo Tidak Cukup",
    "zakat.belowNisab": "Di Bawah Nisab",
    "zakat.enterIncome": "Masukkan Pendapatan",
    "zakat.notEligible":
      "Pendapatan Anda di bawah nisab. Zakat tidak wajib, tetapi sedekah tetap dianjurkan.",

    // Campaign Selection Dialog
    "campaignSelect.title": "Pilih Kampanye untuk Donasi",
    "campaignSelect.description":
      "Pilih kampanye yang ingin Anda dukung dengan zakat Anda",
    "campaignSelect.amount": "Jumlah Zakat",
    "campaignSelect.search": "Cari kampanye...",
    "campaignSelect.progress": "Progress",
    "campaignSelect.selectCampaign": "Pilih Kampanye",
    "campaignSelect.cancel": "Batal",

    // Payment Confirmation Dialog
    "confirm.title": "Konfirmasi Pembayaran Zakat",
    "confirm.description": "Periksa detail pembayaran Anda sebelum melanjutkan",
    "confirm.campaign": "Kampanye",
    "confirm.amount": "Jumlah",
    "confirm.currentBalance": "Saldo Saat Ini",
    "confirm.afterPayment": "Setelah Pembayaran",
    "confirm.blockchain": "Blockchain",
    "confirm.blockchainNote":
      "Transaksi Anda akan dicatat di blockchain untuk transparansi penuh",
    "confirm.confirmPayment": "Konfirmasi Pembayaran",
    "confirm.goBack": "Kembali",
    "confirm.processing": "Memproses...",

    // Toast Messages
    "toast.success": "Berhasil!",
    "toast.zakatPaid": "Zakat Anda telah berhasil disalurkan ke",
    "toast.txHash": "Hash Transaksi",
    "toast.error": "Terjadi kesalahan",
    "toast.paymentFailed": "Pembayaran gagal. Silakan coba lagi.",

    // Footer
    "footer.description":
      "Platform donasi transparan berbasis blockchain untuk Indonesia yang lebih baik.",
    "footer.about": "Tentang",
    "footer.aboutUs": "Tentang Kami",
    "footer.howItWorks": "Cara Kerja",
    "footer.transparency": "Transparansi",
    "footer.contact": "Kontak",
    "footer.resources": "Sumber Daya",
    "footer.documentation": "Dokumentasi",
    "footer.faq": "FAQ",
    "footer.blog": "Blog",
    "footer.community": "Komunitas",
    "footer.legal": "Hukum",
    "footer.privacy": "Kebijakan Privasi",
    "footer.terms": "Syarat & Ketentuan",
    "footer.cookies": "Kebijakan Cookie",
    "footer.rights": "Hak Cipta Dilindungi",

    // Dashboard
    "dashboard.donor": "Dasbor Donatur",
    "dashboard.organization": "Dasbor Organisasi",
    "dashboard.auditor": "Dasbor Auditor",

    // Common
    "common.currency": "IDRX",
    "common.loading": "Memuat...",
    "common.error": "Terjadi Kesalahan",
    "common.retry": "Coba Lagi",
    "common.close": "Tutup",
    "common.save": "Simpan",
    "common.edit": "Edit",
    "common.delete": "Hapus",
    "common.viewDetails": "Lihat Detail",
  },
  en: {
    // Header
    "header.search": "Search campaigns, organizations...",
    "header.campaigns": "Campaigns",
    "header.zakat": "Zakat",
    "header.faucet": "Faucet",
    "header.governance": "Governance",
    "header.dashboard": "Dashboard",
    "header.explorer": "Explorer",
    "header.contact": "Contact",
    "header.start_campaign": "Start Campaign",
    "header.connectWallet": "Connect Wallet",
    "header.disconnect": "Disconnect",
    "header.balance": "Balance",

    // Hero Section
    "hero.title": "Transparent Blockchain-Based Donation Platform",
    "hero.subtitle":
      "Donate securely and transparently through blockchain technology. Every donation is recorded and can be tracked in real-time.",
    "hero.startDonating": "Start Donating",
    "hero.exploreCampaigns": "Explore Campaigns",

    // How It Works
    "howItWorks.title": "How It Works",
    "howItWorks.subtitle": "Your donations are delivered safely and transparently",
    "howItWorks.step1.title": "Connect Wallet",
    "howItWorks.step1.desc":
      "Connect your crypto wallet to start donating",
    "howItWorks.step2.title": "Choose Campaign",
    "howItWorks.step2.desc":
      "Select a campaign you want to support from our verified campaigns",
    "howItWorks.step3.title": "Donate",
    "howItWorks.step3.desc":
      "Send your donation securely through blockchain",
    "howItWorks.step4.title": "Track Donation",
    "howItWorks.step4.desc":
      "Monitor your donation usage in real-time and transparently",

    // Featured Campaigns
    "campaigns.title": "Featured Campaigns",
    "campaigns.subtitle": "Campaigns that need your support",
    "campaigns.viewAll": "View All Campaigns",
    "campaigns.raised": "Raised",
    "campaigns.of": "of",
    "campaigns.backers": "Backers",
    "campaigns.daysLeft": "Days Left",
    "campaigns.donate": "Donate Now",
    "campaigns.learnMore": "Learn More",

    // Zakat Calculator
    "zakat.title": "Zakat Calculator",
    "zakat.subtitle":
      "Calculate your zakat and donate directly to the right campaign",
    "zakat.calculator": "Zakat Calculator",
    "zakat.monthlyIncome": "Monthly Income",
    "zakat.monthlyIncomePlaceholder": "Enter your monthly income",
    "zakat.nisab": "Nisab",
    "zakat.nisabPlaceholder": "Enter nisab value (optional)",
    "zakat.nisabHelper": "Current nisab: 85 grams of gold (~Rp 85,000,000)",
    "zakat.calculate": "Calculate Zakat",
    "zakat.reset": "Reset",
    "zakat.results": "Calculation Results",
    "zakat.yourIncome": "Your Income",
    "zakat.nisabValue": "Nisab Value",
    "zakat.calculatedZakat": "Zakat to Pay",
    "zakat.walletBalance": "Wallet Balance",
    "zakat.payZakat": "Pay Zakat",
    "zakat.connectFirst": "Connect Wallet First",
    "zakat.insufficientBalance": "Insufficient Balance",
    "zakat.belowNisab": "Below Nisab",
    "zakat.enterIncome": "Enter Income",
    "zakat.notEligible":
      "Your income is below nisab. Zakat is not obligatory, but charity is still encouraged.",

    // Campaign Selection Dialog
    "campaignSelect.title": "Select Campaign to Donate",
    "campaignSelect.description":
      "Choose a campaign you want to support with your zakat",
    "campaignSelect.amount": "Zakat Amount",
    "campaignSelect.search": "Search campaigns...",
    "campaignSelect.progress": "Progress",
    "campaignSelect.selectCampaign": "Select Campaign",
    "campaignSelect.cancel": "Cancel",

    // Payment Confirmation Dialog
    "confirm.title": "Confirm Zakat Payment",
    "confirm.description": "Review your payment details before proceeding",
    "confirm.campaign": "Campaign",
    "confirm.amount": "Amount",
    "confirm.currentBalance": "Current Balance",
    "confirm.afterPayment": "After Payment",
    "confirm.blockchain": "Blockchain",
    "confirm.blockchainNote":
      "Your transaction will be recorded on blockchain for full transparency",
    "confirm.confirmPayment": "Confirm Payment",
    "confirm.goBack": "Go Back",
    "confirm.processing": "Processing...",

    // Toast Messages
    "toast.success": "Success!",
    "toast.zakatPaid": "Your zakat has been successfully donated to",
    "toast.txHash": "Transaction Hash",
    "toast.error": "An error occurred",
    "toast.paymentFailed": "Payment failed. Please try again.",

    // Footer
    "footer.description":
      "Transparent blockchain-based donation platform for a better Indonesia.",
    "footer.about": "About",
    "footer.aboutUs": "About Us",
    "footer.howItWorks": "How It Works",
    "footer.transparency": "Transparency",
    "footer.contact": "Contact",
    "footer.resources": "Resources",
    "footer.documentation": "Documentation",
    "footer.faq": "FAQ",
    "footer.blog": "Blog",
    "footer.community": "Community",
    "footer.legal": "Legal",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms & Conditions",
    "footer.cookies": "Cookie Policy",
    "footer.rights": "All Rights Reserved",

    // Dashboard
    "dashboard.donor": "Donor Dashboard",
    "dashboard.organization": "Organization Dashboard",
    "dashboard.auditor": "Auditor Dashboard",

    // Common
    "common.currency": "IDRX",
    "common.loading": "Loading...",
    "common.error": "An Error Occurred",
    "common.retry": "Try Again",
    "common.close": "Close",
    "common.save": "Save",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.viewDetails": "View Details",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("id"); // Default to Indonesian

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.id] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
