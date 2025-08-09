'use client'

import Link from 'next/link'
import { Contest } from '@/types'
import { ClockIcon, UserGroupIcon, TrophyIcon } from '@heroicons/react/24/outline'

interface ContestGridProps {
  contests: Contest[]
  loading?: boolean
}

export default function ContestGrid({ contests, loading }: ContestGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-32 bg-surface-dark rounded-lg mb-4"></div>
            <div className="h-4 bg-surface-dark rounded mb-2"></div>
            <div className="h-4 bg-surface-dark rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-surface-dark rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (contests.length === 0) {
    return (
      <div className="text-center py-12">
        <TrophyIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-400 mb-2">No contests found</h3>
        <p className="text-gray-500">Try adjusting your filters to see more contests.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {contests.map((contest) => (
        <ContestCard key={contest.id} contest={contest} />
      ))}
    </div>
  )
}

interface ContestCardProps {
  contest: Contest
}

function ContestCard({ contest }: ContestCardProps) {
  const progressPercentage = (contest.currentEntrants / contest.maxEntrants) * 100
  const mainPrize = contest.prizes[0]

  const formatPrizeValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return `$${value.toLocaleString()}`
  }

  const getStatusBadge = () => {
    switch (contest.status) {
      case 'active':
        return <span className="badge-green">Active</span>
      case 'upcoming':
        return <span className="badge-gold">Upcoming</span>
      case 'completed':
        return <span className="badge-red">Completed</span>
      default:
        return null
    }
  }

  const getPrizeIcon = (category: string) => {
    switch (category) {
      case 'vehicle':
        return '🚗'
      case 'vacation':
        return '🏝️'
      case 'electronics':
        return '📱'
      case 'cash':
        return '💰'
      default:
        return '🏆'
    }
  }

  return (
    <Link href={`/contests/${contest.id}`}>
      <div className="contest-card group">
        {/* Header with Prize Category Icon */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <span className="text-sm">{getPrizeIcon(mainPrize?.category || 'other')}</span>
            </div>
            <span className="text-sm text-gray-400">
              {mainPrize?.vendor?.name || 'Official Contest'}
            </span>
          </div>
          {getStatusBadge()}
        </div>

        {/* Contest Title */}
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">
          {contest.title}
        </h3>

        {/* Prize Display */}
        <div className="mb-4">
          {mainPrize && (
            <div className="bg-gradient-to-r from-gold-500/10 to-gold-600/10 border border-gold-500/20 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gold-400 font-semibold text-sm">1st Place Prize</p>
                  <p className="text-white font-bold">{mainPrize.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-gold-400 font-bold text-lg">
                    🏆
                  </p>
                  <p className="text-xs text-gray-400">Prize</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contest Details */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {contest.currentEntrants}/{contest.maxEntrants}
            </p>
            <p className="text-xs text-gray-400">Entries</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-400">
              ${contest.entryFee}
            </p>
            <p className="text-xs text-gray-400">Entry</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gold-400">
              {formatPrizeValue(contest.prizePool)}
            </p>
            <p className="text-xs text-gray-400">Prizes</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{contest.currentEntrants} entries</span>
            <span>{progressPercentage.toFixed(0)}% filled</span>
          </div>
        </div>

        {/* Footer with Time and League */}
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-4 w-4" />
            <span>
              {contest.status === 'upcoming' ? 'Starts' : 'Locks'} {new Date(contest.lockDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="bg-primary-500/20 text-primary-400 px-2 py-1 rounded text-xs font-medium">
              {contest.league}
            </span>
          </div>
        </div>

        {/* Entry Button on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex items-end justify-center pb-6">
          <button className="btn-primary">
            Enter Contest
          </button>
        </div>
      </div>
    </Link>
  )
}