'use client'

import { useState, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface BannerSlide {
  id: string
  title: string
  subtitle: string
  prize: string
  prizeValue: string
  backgroundImage: string
  ctaText: string
  ctaLink: string
}

const bannerSlides: BannerSlide[] = [
  {
    id: '1',
    title: 'THE BIG SPLASH',
    subtitle: 'NFL SURVIVOR',
    prize: '$2.5 MILLION',
    prizeValue: 'GRAND PRIZE',
    backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #15803d 100%)',
    ctaText: 'Enter Now',
    ctaLink: '/contests/big-splash'
  },
  {
    id: '2',
    title: 'ULTIMATE CAR GIVEAWAY',
    subtitle: 'NFL SURVIVOR',
    prize: 'BMW M3',
    prizeValue: 'COMPETITION PACKAGE',
    backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #eab308 100%)',
    ctaText: 'Win the Car',
    ctaLink: '/contests/bmw-giveaway'
  },
  {
    id: '3',
    title: 'HAWAII VACATION',
    subtitle: 'NFL SURVIVOR',
    prize: 'LUXURY',
    prizeValue: '7-DAY GETAWAY',
    backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #22c55e 100%)',
    ctaText: 'Book Your Trip',
    ctaLink: '/contests/hawaii-vacation'
  }
]

export default function BannerCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)

  useEffect(() => {
    if (autoPlay) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % bannerSlides.length)
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [autoPlay])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerSlides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const currentBanner = bannerSlides[currentSlide]

  return (
    <div 
      className="relative h-96 md:h-[500px] overflow-hidden rounded-none md:rounded-2xl md:mx-4 md:my-6"
      onMouseEnter={() => setAutoPlay(false)}
      onMouseLeave={() => setAutoPlay(true)}
    >
      {/* Background */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{ background: currentBanner.backgroundImage }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Prize Value */}
          <div className="mb-4">
            <span className="bg-gold-500/20 text-gold-400 px-4 py-2 rounded-full text-sm font-semibold border border-gold-500/30">
              {currentBanner.prizeValue}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-2">
            {currentBanner.title}
          </h1>

          {/* Prize Amount */}
          <div className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600 mb-2">
            {currentBanner.prize}
          </div>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gold-300 font-semibold mb-8">
            {currentBanner.subtitle}
          </p>

          {/* CTA Button */}
          <button className="btn-gold text-lg px-8 py-4 font-bold hover:scale-105 transform transition-all duration-200">
            {currentBanner.ctaText}
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeftIcon className="h-6 w-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
        aria-label="Next slide"
      >
        <ChevronRightIcon className="h-6 w-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex space-x-2">
          {bannerSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide 
                  ? 'bg-gold-400' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 w-16 h-16 bg-gold-400/20 rounded-full blur-sm animate-pulse-green"></div>
      <div className="absolute bottom-20 left-16 w-24 h-24 bg-primary-400/20 rounded-full blur-sm animate-pulse-green delay-1000"></div>
      <div className="absolute top-32 left-32 w-8 h-8 bg-gold-600/30 rounded-full blur-sm animate-pulse-green delay-2000"></div>
    </div>
  )
}