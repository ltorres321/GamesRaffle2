'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import BannerCarousel from '@/components/home/BannerCarousel'
import LeagueChips from '@/components/home/LeagueChips'
import FilterBar from '@/components/home/FilterBar'
import ContestGrid from '@/components/home/ContestGrid'
import { Contest, ContestFilters } from '@/types'

// Mock data for development - will be replaced with API calls
const mockContests: Contest[] = [
  {
    id: '1',
    title: 'Ultimate Car Giveaway NFL Survivor',
    description: 'Win a brand new BMW M3 Competition in our biggest NFL survivor contest',
    league: 'NFL',
    entryFee: 150,
    prizePool: 250000,
    lockDate: '2024-09-08T17:00:00Z',
    startDate: '2024-09-08T13:00:00Z',
    endDate: '2025-02-15T23:59:59Z',
    status: 'active',
    maxEntrants: 2000,
    currentEntrants: 1247,
    isPublic: true,
    prizes: [
      {
        id: '1',
        contestId: '1',
        rank: 1,
        title: '2024 BMW M3 Competition',
        description: 'Brand new BMW M3 Competition with M Performance Package',
        value: 85000,
        category: 'vehicle',
        imageUrl: '/prizes/bmw-m3.jpg',
        vendorId: 'bmw-dealer-1',
        vendor: {
          id: 'bmw-dealer-1',
          name: 'Premier BMW',
          email: 'contact@premierbmw.com',
          company: 'Premier BMW Dealership',
          description: 'Authorized BMW dealer',
          isApproved: true,
          createdAt: '2024-01-01T00:00:00Z'
        }
      }
    ],
    rules: {
      maxPicks: 1,
      picksPerWeek: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1, 11: 1, 12: 2, 13: 2, 14: 2, 15: 2, 16: 2, 17: 2, 18: 2 },
      eliminationRules: ['One incorrect pick eliminates entry', 'No team can be picked twice']
    },
    createdBy: 'admin',
    createdAt: '2024-08-01T00:00:00Z',
    updatedAt: '2024-08-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'Hawaii Vacation NFL Survivor',
    description: 'Win a luxury 7-day Hawaiian vacation package for two',
    league: 'NFL',
    entryFee: 75,
    prizePool: 50000,
    lockDate: '2024-09-08T17:00:00Z',
    startDate: '2024-09-08T13:00:00Z',
    endDate: '2025-02-15T23:59:59Z',
    status: 'active',
    maxEntrants: 1000,
    currentEntrants: 687,
    isPublic: true,
    prizes: [
      {
        id: '2',
        contestId: '2',
        rank: 1,
        title: 'Hawaii Luxury Vacation',
        description: '7 days in Maui with 5-star resort, flights, and activities for 2 people',
        value: 15000,
        category: 'vacation',
        imageUrl: '/prizes/hawaii-vacation.jpg',
        vendorId: 'travel-co-1',
        vendor: {
          id: 'travel-co-1',
          name: 'Elite Travel Co',
          email: 'contact@elitetravel.com',
          company: 'Elite Travel Company',
          description: 'Luxury travel experiences',
          isApproved: true,
          createdAt: '2024-01-01T00:00:00Z'
        }
      }
    ],
    rules: {
      maxPicks: 1,
      picksPerWeek: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1, 11: 1, 12: 2, 13: 2, 14: 2, 15: 2, 16: 2, 17: 2, 18: 2 },
      eliminationRules: ['One incorrect pick eliminates entry', 'No team can be picked twice']
    },
    createdBy: 'vendor-1',
    createdAt: '2024-08-01T00:00:00Z',
    updatedAt: '2024-08-01T00:00:00Z'
  },
  {
    id: '3',
    title: 'Tesla Model Y Giveaway',
    description: 'Win a brand new Tesla Model Y Performance',
    league: 'NFL',
    entryFee: 100,
    prizePool: 75000,
    lockDate: '2024-09-08T17:00:00Z',
    startDate: '2024-09-08T13:00:00Z',
    endDate: '2025-02-15T23:59:59Z',
    status: 'active',
    maxEntrants: 1500,
    currentEntrants: 423,
    isPublic: true,
    prizes: [
      {
        id: '3',
        contestId: '3',
        rank: 1,
        title: '2024 Tesla Model Y Performance',
        description: 'Brand new Tesla Model Y Performance with Full Self-Driving',
        value: 68000,
        category: 'vehicle',
        imageUrl: '/prizes/tesla-model-y.jpg',
        vendorId: 'tesla-dealer-1',
        vendor: {
          id: 'tesla-dealer-1',
          name: 'Tesla Store',
          email: 'contact@tesla.com',
          company: 'Tesla Inc',
          description: 'Official Tesla dealer',
          isApproved: true,
          createdAt: '2024-01-01T00:00:00Z'
        }
      }
    ],
    rules: {
      maxPicks: 1,
      picksPerWeek: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1, 11: 1, 12: 2, 13: 2, 14: 2, 15: 2, 16: 2, 17: 2, 18: 2 },
      eliminationRules: ['One incorrect pick eliminates entry', 'No team can be picked twice']
    },
    createdBy: 'vendor-2',
    createdAt: '2024-08-01T00:00:00Z',
    updatedAt: '2024-08-01T00:00:00Z'
  }
]

export default function HomePage() {
  const [contests, setContests] = useState<Contest[]>(mockContests)
  const [filters, setFilters] = useState<ContestFilters>({
    league: 'NFL',
    gameType: 'All Game Types',
    payout: 'All Payouts',
    entryFee: { min: 0, max: 1000 }
  })
  const [loading, setLoading] = useState(false)

  // Filter contests based on current filters
  const filteredContests = contests.filter(contest => {
    if (filters.league && contest.league !== filters.league) return false
    if (filters.entryFee) {
      if (filters.entryFee.min && contest.entryFee < filters.entryFee.min) return false
      if (filters.entryFee.max && contest.entryFee > filters.entryFee.max) return false
    }
    if (filters.status && contest.status !== filters.status) return false
    return true
  })

  useEffect(() => {
    // TODO: Replace with actual API call
    // fetchContests()
  }, [])

  const handleFilterChange = (newFilters: Partial<ContestFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Header />
      
      <main className="relative">
        {/* Hero Banner Carousel */}
        <section className="relative">
          <BannerCarousel />
        </section>

        {/* League Selection */}
        <section className="px-4 py-6 max-w-7xl mx-auto">
          <LeagueChips 
            selectedLeague={filters.league || 'NFL'} 
            onLeagueChange={(league) => handleFilterChange({ league })} 
          />
        </section>

        {/* Referral Banner */}
        <section className="px-4 py-4 max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-lg p-4 text-center">
            <h3 className="text-white font-bold text-lg">
              REFER A FRIEND, YOU EACH GET $10!
            </h3>
          </div>
        </section>

        {/* Filter Bar */}
        <section className="px-4 py-6 max-w-7xl mx-auto">
          <FilterBar filters={filters} onFilterChange={handleFilterChange} />
        </section>

        {/* Contest Grid */}
        <section className="px-4 pb-12 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">NFL Survivor Contests</h2>
            <button className="text-primary-400 hover:text-primary-300 font-medium">
              View all
            </button>
          </div>
          
          <ContestGrid 
            contests={filteredContests} 
            loading={loading}
          />
        </section>
      </main>
    </div>
  )
}