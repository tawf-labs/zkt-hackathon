export function HowItWorks() {
  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">

          {/* Left Content */}
          <div className="lg:w-1/2 space-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold">How ZKT.app Works</h2>
            <p className="text-lg text-muted-foreground">
              Experience the future of giving with our seamless, transparent 4-step process.
            </p>

            <div className="space-y-6 pt-4">

              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-none h-8 w-8 rounded-full bg-white/10 text-primary flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-lg">Connect & Verify</h3>
                  <p className="text-muted-foreground">
                    Login easily and get your identity verified automatically.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-none h-8 w-8 rounded-full bg-white/10 text-primary flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-lg">Choose Your Cause</h3>
                  <p className="text-muted-foreground">
                    Browse verified campaigns for Zakat, Infaq, or Sodaqah.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-none h-8 w-8 rounded-full bg-white/10 text-primary flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-lg">Donate Securely</h3>
                  <p className="text-muted-foreground">
                    Pay via Xellar embedded wallet with one click.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-none h-8 w-8 rounded-full bg-white/10 text-primary flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div>
                  <h3 className="font-bold text-lg">Track Impact</h3>
                  <p className="text-muted-foreground">
                    Receive an NFT receipt and track your funds on-chain.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Right Box */}
          <div className="lg:w-1/2 bg-white/50 rounded-2xl p-8 lg:p-12">
            <div className="space-y-4">

              <div className="bg-background p-4 rounded-lg shadow-sm border border-black flex items-center justify-between">
                <span className="font-medium">Donation Sent</span>
                <span className="text-primary font-mono font-bold">Confirmed ✓</span>
              </div>

              <div className="flex justify-center">
                <div className="h-8 w-0.5 bg-black border-l border-dashed" />
              </div>

              <div className="bg-background p-4 rounded-lg shadow-sm border border-black flex items-center justify-between">
                <span className="font-medium">Smart Contract</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Processing
                </span>
              </div>

              <div className="flex justify-center">
                <div className="h-8 w-0.5 bg-black border-l border-dashed" />
              </div>

              <div className="bg-background p-4 rounded-lg shadow-sm border border-black flex items-center justify-between">
                <span className="font-medium">NFT Receipt Minted</span>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                  0x83...29a
                </span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
