'use client'

import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { ContestFilters } from '@/types'

interface FilterBarProps {
  filters: ContestFilters
  onFilterChange: (filters: Partial<ContestFilters>) => void
}

const filterOptions = {
  gameType: ['All Game Types', 'Survivor', 'Pick Em', 'Bracket'],
  payout: ['All Payouts', 'Guaranteed', 'Winner Take All', 'Top 3'],
  entryFee: ['All Entry Fees', '$0-$25', '$25-$100', '$100-$500', '$500+']
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const handleGameTypeChange = (gameType: string) => {
    onFilterChange({ gameType })
  }

  const handlePayoutChange = (payout: string) => {
    onFilterChange({ payout })
  }

  const handleEntryFeeChange = (entryFeeRange: string) => {
    let entryFee = { min: 0, max: 10000 }
    
    switch (entryFeeRange) {
      case '$0-$25':
        entryFee = { min: 0, max: 25 }
        break
      case '$25-$100':
        entryFee = { min: 25, max: 100 }
        break
      case '$100-$500':
        entryFee = { min: 100, max: 500 }
        break
      case '$500+':
        entryFee = { min: 500, max: 10000 }
        break
    }
    
    onFilterChange({ entryFee })
  }

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {/* Game Type Filter */}
      <div className="relative">
        <select 
          className="appearance-none bg-surface-light border border-dark-700 text-white px-4 py-2 pr-8 rounded-lg focus:outline-none focus:border-primary-500 cursor-pointer"
          value={filters.gameType || 'All Game Types'}
          onChange={(e) => handleGameTypeChange(e.target.value)}
        >
          {filterOptions.gameType.map((option) => (
            <option key={option} value={option} className="bg-surface-light">
              {option}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Payout Filter */}
      <div className="relative">
        <select 
          className="appearance-none bg-surface-light border border-dark-700 text-white px-4 py-2 pr-8 rounded-lg focus:outline-none focus:border-primary-500 cursor-pointer"
          value={filters.payout || 'All Payouts'}
          onChange={(e) => handlePayoutChange(e.target.value)}
        >
          {filterOptions.payout.map((option) => (
            <option key={option} value={option} className="bg-surface-light">
              {option}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Entry Fee Filter */}
      <div className="relative">
        <select 
          className="appearance-none bg-surface-light border border-dark-700 text-white px-4 py-2 pr-8 rounded-lg focus:outline-none focus:border-primary-500 cursor-pointer"
          defaultValue="All Entry Fees"
          onChange={(e) => handleEntryFeeChange(e.target.value)}
        >
          {filterOptions.entryFee.map((option) => (
            <option key={option} value={option} className="bg-surface-light">
              {option}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      {/* View Toggle */}
      <div className="ml-auto flex items-center space-x-2">
        <button className="p-2 bg-surface-light border border-dark-700 rounded-lg text-primary-400">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        <button className="p-2 bg-surface-light border border-dark-700 rounded-lg text-gray-400 hover:text-primary-400">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}