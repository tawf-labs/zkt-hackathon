"use client";

import { useState } from "react";
import { Calculator, Wallet, Heart, Users, Home, Loader2, Info, ChevronDown, Check } from "lucide-react";
import { useWallet } from "@/components/providers/web3-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { campaigns, formatCurrency } from "@/data/campaigns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function ZakatPage() {
  const { isConnected, idrxBalance, address, donate } = useWallet();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [selectedTab, setSelectedTab] = useState("maal");
  const [zakatType, setZakatType] = useState("income");
  const [incomeType, setIncomeType] = useState("monthly");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [peopleCount, setPeopleCount] = useState("");
  const [hasDeductions, setHasDeductions] = useState(false);
  const [expenses, setExpenses] = useState("");
  
  // Dialog states
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<typeof campaigns[0] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentType, setPaymentType] = useState<"maal" | "fitrah">("maal");

  const goldPrice = 2650.00;
  const nisabThreshold = 7296.88;
  const zakatRate = 2.5;
  const fitrahPerPerson = 50000;

  const calculateZakat = () => {
    if (!monthlyIncome || monthlyIncome.trim() === "") return 0;
    
    const income = parseFloat(monthlyIncome);
    if (isNaN(income) || income <= 0) return 0;
    
    const yearlyIncome = incomeType === "monthly" ? income * 12 : income;
    const deductedIncome = hasDeductions && expenses ? yearlyIncome - parseFloat(expenses || "0") : yearlyIncome;
    
    if (deductedIncome < nisabThreshold) return 0;
    return deductedIncome * (zakatRate / 100);
  };

  const calculatedZakat = calculateZakat();
  const totalFitrah = peopleCount ? parseFloat(peopleCount) * fitrahPerPerson : 0;

  const handlePayZakatClick = () => {
    setPaymentType("maal");
    setShowCampaignDialog(true);
  };

  const handlePayFitrahClick = () => {
    setPaymentType("fitrah");
    setShowCampaignDialog(true);
  };

  const handleCampaignSelect = (campaign: typeof campaigns[0]) => {
    setSelectedCampaign(campaign);
    setShowCampaignDialog(false);
    setShowConfirmDialog(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedCampaign) return;
    
    try {
      setIsProcessing(true);

      const amount = paymentType === "maal" ? calculatedZakat : totalFitrah;
      
      const { txHash } = await donate({
        poolId: BigInt(selectedCampaign.id),
        campaignTitle: selectedCampaign.title,
        amountIDRX: BigInt(Math.floor(amount * 1e18)), // Convert to wei
      });
      
      setIsProcessing(false);
      setShowConfirmDialog(false);
      
      toast({
        title: t("toast.success"),
        description: `${t("toast.zakatPaid")} ${selectedCampaign.title}. ${t("toast.txHash")}: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`,
      });
      
      // Reset form
      if (paymentType === "maal") {
        setMonthlyIncome("");
      } else {
        setPeopleCount("");
      }
      setSelectedCampaign(null);
    } catch (error: any) {
      setIsProcessing(false);
      toast({
        variant: "destructive",
        title: t("toast.error"),
        description: error?.message || t("toast.paymentFailed"),
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-secondary/20 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-3">{t("zakat.title")}</h1>
          <p className="text-muted-foreground text-lg">{t("zakat.subtitle")}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Wallet Balance Card */}
            {isConnected && (
              <div className="bg-gradient-to-r from-primary to-primary/90 rounded-2xl shadow-lg shadow-primary/20 p-6 mb-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">{t("zakat.walletBalance")}</h3>
                  </div>
                  <code className="text-sm font-mono bg-white/20 px-3 py-1 rounded">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                  </code>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{idrxBalance ? Number(idrxBalance / BigInt(1e18)).toLocaleString('id-ID', { maximumFractionDigits: 0 }) : '0'}</span>
                  <span className="text-white/90 font-medium">IDRX</span>
                </div>
                <p className="text-sm text-white/90 mt-1">Available for Zakat payment</p>
              </div>
            )}

            {/* Nisab Information Card */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Live Nisab Threshold</h3>
                </div>
                <button className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                  <Loader2 className="h-4 w-4" />
                  Refresh
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-secondary rounded-lg border border-border">
                  <div className="text-xs text-muted-foreground mb-1">Gold Price</div>
                  <div className="text-lg font-bold">${goldPrice.toFixed(2)}/oz</div>
                  <span className="inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary mt-1">
                    Live
                  </span>
                </div>

                <div className="text-center p-4 bg-secondary rounded-lg border border-border">
                  <div className="text-xs text-muted-foreground mb-1">Nisab (85g Gold)</div>
                  <div className="text-lg font-bold">${nisabThreshold.toFixed(2)}</div>
                </div>

                <div className="text-center p-4 bg-secondary rounded-lg border border-border">
                  <div className="text-xs text-muted-foreground mb-1">Zakat Rate</div>
                  <div className="text-lg font-bold">{zakatRate}%</div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4 text-center">
                Nisab threshold based on live gold prices (85 grams). Updates every 5 minutes.
              </p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              {/* Tab Headers */}
              <div className="grid grid-cols-2 border-b border-border">
                <button
                  onClick={() => setSelectedTab("maal")}
                  className={`px-6 py-4 text-sm font-medium transition-colors ${
                    selectedTab === "maal"
                      ? "bg-primary/5 text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  Wealth Zakat
                </button>
                <button
                  onClick={() => setSelectedTab("fitrah")}
                  className={`px-6 py-4 text-sm font-medium transition-colors ${
                    selectedTab === "fitrah"
                      ? "bg-primary/5 text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  Fitrah Zakat
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {selectedTab === "maal" ? (
                  <div className="space-y-6">
                    {/* Zakat Type Selector */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Zakat Type</label>
                      <select
                        value={zakatType}
                        onChange={(e) => setZakatType(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="income">Income Zakat - For salary & wages</option>
                        <option value="trade">Trade Zakat - For business assets</option>
                        <option value="savings">Savings Zakat - For liquid assets</option>
                        <option value="gold">Gold & Silver Zakat</option>
                      </select>
                    </div>

                    {zakatType === "income" && (
                      <>
                        {/* Income Period */}
                        <div>
                          <label className="block text-sm font-medium mb-3">Income Calculation Period</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                value="monthly"
                                checked={incomeType === "monthly"}
                                onChange={(e) => setIncomeType(e.target.value)}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">Monthly</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                value="yearly"
                                checked={incomeType === "yearly"}
                                onChange={(e) => setIncomeType(e.target.value)}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">Yearly</span>
                            </label>
                          </div>
                        </div>

                        {/* Income Input */}
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            {incomeType === "monthly" ? "Monthly Income*" : "Yearly Income*"}
                          </label>
                          <input
                            type="number"
                            value={monthlyIncome}
                            onChange={(e) => setMonthlyIncome(e.target.value)}
                            placeholder={`Enter your ${incomeType} income in USD`}
                            className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        {/* Advanced Options Toggle */}
                        <button
                          onClick={() => setShowAdvanced(!showAdvanced)}
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          {showAdvanced ? "Hide" : "Show"} advanced options
                          <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                        </button>

                        {showAdvanced && (
                          <div className="space-y-4 pt-2">
                            {/* Deduction Toggle */}
                            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                              <span className="text-sm font-medium text-orange-900">
                                Apply work-related deductions
                              </span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={hasDeductions}
                                  onChange={(e) => setHasDeductions(e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                              </label>
                            </div>

                            {/* Expenses Input */}
                            {hasDeductions && (
                              <div>
                                <label className="block text-sm font-medium mb-2">Expenses (USD)</label>
                                <input
                                  type="number"
                                  value={expenses}
                                  onChange={(e) => setExpenses(e.target.value)}
                                  placeholder="Enter your expenses in USD"
                                  className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Optional: Enter your work-related or other deductible expenses
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Payment Obligation */}
                        <div className="p-4 bg-secondary rounded-lg border border-border">
                          <div className="text-sm font-medium mb-1">Payment Obligation</div>
                          <div className={`text-sm ${calculatedZakat > 0 ? "text-primary font-medium" : "text-muted-foreground"}`}>
                            {calculatedZakat > 0
                              ? "Required to Pay Zakat"
                              : "Not Required to Pay Zakat, but Can Give Charity"}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Calculated Amount */}
                    {calculatedZakat > 0 && (
                      <div className="p-6 rounded-lg border border-primary/30 bg-primary/5 shadow-sm">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-2">Your Zakat Amount:</p>
                          <p className="text-4xl font-bold text-primary mb-1">
                            ${calculatedZakat.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {zakatRate}% of taxable income above nisab
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Pay Button */}
                    <button
                      onClick={handlePayZakatClick}
                      disabled={!isConnected || calculatedZakat === 0}
                      className="w-full py-3.5 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Wallet className="h-4 w-4" />
                      {!isConnected ? "Connect Wallet to Pay" : "Pay Zakat"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Fitrah Amount Display */}
                    <div className="p-6 bg-secondary rounded-lg border border-border">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Fitrah Zakat per person:</p>
                        <p className="text-3xl font-bold mb-1">
                          Rp {fitrahPerPerson.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Equivalent to 2.5kg rice</p>
                      </div>
                    </div>

                    {/* People Count Input */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Number of People</label>
                      <input
                        type="number"
                        value={peopleCount}
                        onChange={(e) => setPeopleCount(e.target.value)}
                        placeholder="Enter number of people"
                        min="1"
                        className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {/* Calculation Breakdown */}
                    <div className="space-y-3 py-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Per person:</span>
                        <span className="font-medium">Rp {fitrahPerPerson.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Number of people:</span>
                        <span className="font-medium">{peopleCount || 0}</span>
                      </div>
                      <div className="h-px bg-border" />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-primary">Rp {totalFitrah.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Pay Button */}
                    <button
                      onClick={handlePayFitrahClick}
                      disabled={!isConnected || !peopleCount || totalFitrah === 0}
                      className="w-full py-3.5 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Wallet className="h-4 w-4" />
                      {!isConnected ? "Connect Wallet to Pay" : "Pay Zakat Fitrah"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Impact Areas */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-sm">Impact Areas</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg hover:bg-primary/5 transition-colors">
                  <Heart className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium">Orphans</div>
                    <div className="text-xs text-muted-foreground">Supporting orphaned children</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-accent rounded-lg hover:bg-primary/5 transition-colors">
                  <Users className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium">Refugees</div>
                    <div className="text-xs text-muted-foreground">Helping displaced families</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg hover:bg-primary/5 transition-colors">
                  <Home className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium">Local Aid</div>
                    <div className="text-xs text-muted-foreground">Community support programs</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transparency Guarantee */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-sm">Transparency Guarantee</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                    ✓
                  </span>
                  <span className="text-xs text-muted-foreground">Blockchain verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                    ✓
                  </span>
                  <span className="text-xs text-muted-foreground">Real-time tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                    ✓
                  </span>
                  <span className="text-xs text-muted-foreground">Impact reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                    ✓
                  </span>
                  <span className="text-xs text-muted-foreground">NFT certificates</span>
                </div>
              </div>
            </div>

            {/* Global Impact */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-sm">Global Impact</h3>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Donated:</span>
                  <span className="font-semibold">2.4B IDR</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Families Helped:</span>
                  <span className="font-semibold">3,247</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Active Donors:</span>
                  <span className="font-semibold">1,856</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Selection Dialog */}
        <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>{t("campaignSelect.title")}</DialogTitle>
              <DialogDescription>
                {t("campaignSelect.description")} Rp {(paymentType === "maal" ? calculatedZakat : totalFitrah).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {campaigns.map((campaign) => (
                <button
                  key={campaign.id}
                  onClick={() => handleCampaignSelect(campaign)}
                  className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-accent hover:border-primary/30 transition-colors text-left"
                >
                  <img
                    src={campaign.image}
                    alt={campaign.title}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1 line-clamp-2">{campaign.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{campaign.organization}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-primary font-medium">{formatCurrency(campaign.raised)} raised</span>
                      <span className="text-muted-foreground">of {formatCurrency(campaign.goal)}</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all"
                        style={{ width: `${Math.min((campaign.raised / campaign.goal) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-semibold bg-primary/10 text-primary">
                    {campaign.category}
                  </span>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>{t("confirm.title")}</DialogTitle>
              <DialogDescription>
                {t("confirm.description")}
              </DialogDescription>
            </DialogHeader>
            
            {selectedCampaign && (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-secondary rounded-lg border border-border">
                  <div className="text-sm font-medium mb-2">{t("confirm.campaign")}</div>
                  <div className="text-sm text-muted-foreground">{selectedCampaign.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{selectedCampaign.organization}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary rounded-lg border border-border">
                    <div className="text-xs text-muted-foreground mb-1">{t("confirm.amount")}</div>
                    <div className="text-xl font-bold text-primary">Rp {(paymentType === "maal" ? calculatedZakat : totalFitrah).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
                  </div>
                  
                  <div className="p-4 bg-secondary rounded-lg border border-border">
                    <div className="text-xs text-muted-foreground mb-1">{t("confirm.currentBalance")}</div>
                    <div className="text-xl font-bold">{idrxBalance ? Number(idrxBalance / BigInt(1e18)).toLocaleString('id-ID', { maximumFractionDigits: 0 }) : '0'} IDRX</div>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-primary">{t("confirm.blockchain")}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t("confirm.blockchainNote")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={isProcessing}
              >
                {t("confirm.goBack")}
              </Button>
              <Button
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("confirm.processing")}
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    {t("confirm.confirmPayment")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}