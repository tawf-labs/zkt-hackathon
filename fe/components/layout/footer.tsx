import { Twitter, Linkedin, Github, Instagram } from "lucide-react";
import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-white to-secondary/50 border-t border-border pt-16 pb-8">
      <div className="container px-4 mx-auto">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          
          {/* Logo + description */}
          <div className="lg:col-span-2 space-y-6">
             <Link href="/" className="flex items-center space-x-2">
            <img
              src="/logo.png"
              alt="ZKT.app Logo"
              className="h-6 sm:h-8 md:h-10 object-contain translate-y-[-3px]"
            />
          </Link>

            <p className="text-muted-foreground max-w-sm">
              The world's first fully traceable Zakat and donation platform. Empowering transparent giving through blockchain technology.
            </p>

            {/* Social Icons */}
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>

              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>

              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
              </a>

              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Column 1 */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Platform</h3>
            <ul className="space-y-2">
              <li><a href="/campaigns" className="text-muted-foreground hover:text-primary transition-colors">Explore Campaigns</a></li>
              <li><a href="/calculate-zakat" className="text-muted-foreground hover:text-primary transition-colors">Calculate Zakat</a></li>
              <li><a href="/governance" className="text-muted-foreground hover:text-primary transition-colors">DAO Governance</a></li>
              <li><a href="/impact" className="text-muted-foreground hover:text-primary transition-colors">Impact Reports</a></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">For Organizations</h3>
            <ul className="space-y-2">
              <li><a href="/partners" className="text-muted-foreground hover:text-primary transition-colors">Become a Partner</a></li>
              <li><a href="/verification" className="text-muted-foreground hover:text-primary transition-colors">Verification Process</a></li>
              <li><a href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">NGO Dashboard</a></li>
              <li><a href="/resources" className="text-muted-foreground hover:text-primary transition-colors">Resources</a></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Legal</h3>
            <ul className="space-y-2">
              <li><a href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="/compliance" className="text-muted-foreground hover:text-primary transition-colors">Sharia Compliance</a></li>
              <li><a href="/audit" className="text-muted-foreground hover:text-primary transition-colors">Audit Logs</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">© 2025 ZKT.app. All rights reserved.</p>

          <div className="flex gap-6 text-sm text-muted-foreground">
            <span>Powered by Xellar</span>
            <span>Audited by Baznas</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
