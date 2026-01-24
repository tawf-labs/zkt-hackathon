'use client';

import React from 'react';
import { Shield, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';
import { CardBody, CardContainer, CardItem } from '../ui/3d-card';

export function Hero() {
  const { t } = useLanguage();
  
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-secondary/30 to-accent pt-15 pb-20 lg:pt-32 lg:pb-28">
     
        <div className="absolute flex h-full w-full opacity-50">
          <Image fill alt="hero background" src="zkt-hero-background.png" className='object-cover'/>
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

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link href="/campaigns" className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
                {t("hero.startDonating")}
              </Link>
              <Link href="/zakat" className="inline-flex items-center justify-center h-12 px-8 rounded-lg border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-all">
                {t("hero.exploreCampaigns")}
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