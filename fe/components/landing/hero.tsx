'use client';

import React from 'react';
import { Shield, TrendingUp, Heart, Building2, Scale } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';
import { CardBody, CardContainer, CardItem } from '../ui/3d-card';
import { Button } from '@/components/ui/button';

export function Hero() {
  const { t } = useLanguage();
  
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-secondary/30 to-accent pt-15 pb-20 lg:pt-32 lg:pb-28">
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <Image
            src="/zkt-hero-background.png"
            alt="hero background"
            fill
            className="object-cover object-left-top"
            priority
          />
        </div>
<div className="container relative z-10 px-4 mx-auto auto-center gap-12 lg-gap-20">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          {/* Left Content */}
          <div className="flex-[0.9] space-y-8 text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
              ✓ Blockchain Traced
            </div>

            {/* Heading */}
            <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-foreground">
              {t("hero.title")}
            </h1>

            {/* Description */}
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0 text-balance leading-relaxed">
              {t("hero.subtitle")}
            </p>

            {/* CTA Buttons - Role Based */}
            <div className="flex flex-wrap gap-3">
              <Link href="/campaigns">
                <Button size="lg" className="gap-2">
                  <Heart className="h-5 w-5" />
                  Saya Donatur
                </Button>
              </Link>
              <Link href="/dashboard/organization">
                <Button size="lg" variant="outline" className="gap-2">
                  <Building2 className="h-5 w-5" />
                  Saya Organisasi
                </Button>
              </Link>
              <Link href="/governance">
                <Button size="lg" variant="secondary" className="gap-2">
                  <Scale className="h-5 w-5" />
                  Governance
                </Button>
              </Link>
            </div>

            {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-primary">$10+</div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  DONATED
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-primary">100%</div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  TRACEABLE
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-primary">50+</div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  DONORS
                </div>
              </div>
            </div>
           </div>

          {/* Right Mockup Section */}
         <CardContainer className="flex-1 w-full max-w-2xl relative">
          {/* Main Browser/Device Mockup */}
          <CardBody className="relative rounded-3xl overflow-hidden border-2 border-border bg-gradient-to-br from-secondary to-white aspect-[4/3] shadow-2xl shadow-primary/50">

            {/* IMAGE REPLACEMENT */}


<Image
              src="https://www.globalgiving.org/pfil/50448/pict_large.jpg"   
              alt="Preview"
              fill
              className="object-cover w-full h-auto"
            />

 

           

            {/* Floating Card - Top Left */}
            <CardItem translateZ={50} className="absolute top-6 left-6 bg-white p-3 rounded-xl border border-primary/20 shadow-lg max-w-[160px]">
              <div className="text-xs font-semibold text-primary">Zakat Verified</div>
            </CardItem>

            {/* Floating Card - Bottom Right */}
            <CardItem translateZ={20} className="absolute bottom-6 right-6 bg-white p-3 rounded-xl border border-primary/20 shadow-lg max-w-[200px]">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Impact Tracking</div>
                <div className="text-sm font-bold text-primary">Real-time Audit</div>
              </div>
            </CardItem>
          </CardBody>
        </CardContainer>

        </div>
      </div>
    </section>
  );
}