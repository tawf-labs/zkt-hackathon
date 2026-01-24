import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Building2, Scale } from "lucide-react"

import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { FeaturedCampaigns } from "@/components/landing/featured-campaigns"
import { Trusted } from "@/components/landing/badge"


export default function HomePage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <Hero />
      {/* <Trusted /> */}

      {/* Role-based entry section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Pilih Peran Anda
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Donor Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Heart className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Donatur</CardTitle>
                <CardDescription>
                  Dukung donasi, terima NFT bukti, dan partisipasi dalam tata kelola
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/campaigns">
                  <Button className="w-full">Mulai Berdonasi</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Organization Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Building2 className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Organisasi</CardTitle>
                <CardDescription>
                  Buat kampanye Zakat, kumpulkan dana, dan verifikasi oleh Dewan Syariah
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/organization">
                  <Button className="w-full" variant="outline">
                    Mulai Organisasi
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Governance Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Scale className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Governance</CardTitle>
                <CardDescription>
                  Partisipasi dalam Community DAO dan Dewan Syariah untuk verifikasi proposal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/governance">
                  <Button className="w-full" variant="secondary">
                    Governance
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <FeaturedCampaigns />
      <HowItWorks />
      <section id="campaigns" className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {/* <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-pretty">Featured Campaigns</h2>
            <Button asChild variant="default" className="bg-primary text-primary-foreground hover:opacity-90">
              <Link href="#campaigns">{"Explore more"}</Link>
            </Button>
          </div>
        */}
        </div>
      </section>
    </main>
  )
}
