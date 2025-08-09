'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Matchup, Pick, Team } from '@/types'
import { ClockIcon, PlayIcon, ExclamationTriangleIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

interface PickBoardProps {
  matchups: Matchup[]
  selectedTeams: string[]
  onTeamSelect: (teamId: string, weekNumber: number) => void
  currentWeek: number
  lockedWeeks: number[]
  existingPicks: Pick[]
}

export default function PickBoard({
  matchups,
  selectedTeams,
  onTeamSelect,
  currentWeek,
  lockedWeeks,
  existingPicks
}: PickBoardProps) {
  const { user, isAuthenticated } = useAuth()
  const [selectedWeekTab, setSelectedWeekTab] = useState(currentWeek)

  // Check verification status
  const isFullyVerified = user?.emailVerified && user?.phoneVerified
  const canMakePicks = isAuthenticated && isFullyVerified

  // Generate week tabs (1-18 for NFL season)
  const weekTabs = Array.from({ length: 18 }, (_, i) => i + 1)

  const isTeamSelected = (teamId: string) => {
    return selectedTeams.includes(teamId)
  }

  const isTeamDisabled = (teamId: string) => {
    // Team is disabled if it's been picked in a previous week OR user can't make picks
    return !canMakePicks || existingPicks.some(pick => pick.teamId === teamId)
  }

  const handleTeamSelect = (teamId: string, weekNumber: number) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to make picks')
      return
    }
    
    if (!isFullyVerified) {
      toast.error('Please verify your email and phone number to make picks')
      return
    }
    
    onTeamSelect(teamId, weekNumber)
  }

  const getTeamHelmetImage = (alias: string) => {
    return `/darklogo/${alias}.gif`
  }

  const getTeamLogo = (team: Team) => {
    // In a real app, this would return actual team logos
    // For now, using team abbreviation with team colors
    return team.alias
  }

  const formatGameTime = (startTime: string) => {
    const date = new Date(startTime)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="w-full">
      {/* Week Tabs */}
      <div className="border-b border-dark-700 mb-8">
        <div className="flex overflow-x-auto scrollbar-hide space-x-1">
          {weekTabs.map((week) => {
            const isLocked = lockedWeeks.includes(week)
            const isCurrent = week === currentWeek
            const isSelected = week === selectedWeekTab
            
            return (
              <button
                key={week}
                onClick={() => setSelectedWeekTab(week)}
                disabled={isLocked}
                className={`
                  flex-shrink-0 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-colors
                  ${isSelected
                    ? 'border-primary-500 text-primary-400 bg-primary-500/10'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }
                  ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                  ${isCurrent ? 'ring-2 ring-gold-500/20' : ''}
                `}
              >
                <div className="text-center">
                  <div className="font-bold">Week {week}</div>
                  <div className="text-xs text-gray-500">
                    {week <= 11 ? '1 Pick' : '2 Picks'}
                  </div>
                  {week < currentWeek && (
                    <div className="text-xs text-green-400">✓ Complete</div>
                  )}
                  {week === currentWeek && (
                    <div className="text-xs text-gold-400">● Active</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Instructions & Authentication Status */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          SELECT A TEAM TO WIN
        </h2>
        <p className="text-gray-400 mb-4">
          Pick the team you think will win. Mon 8:20 PM
        </p>

        {/* Authentication Status Messages */}
        {!isAuthenticated && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center space-x-2 text-red-400">
              <LockClosedIcon className="h-5 w-5" />
              <span className="font-medium">Sign in required to make picks</span>
            </div>
            <div className="mt-2 space-x-4">
              <Link
                href="/auth/login"
                className="text-sm text-red-400 hover:text-red-300 underline"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="text-sm text-red-400 hover:text-red-300 underline"
              >
                Create Account
              </Link>
            </div>
          </div>
        )}

        {isAuthenticated && !isFullyVerified && (
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center space-x-2 text-yellow-400">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span className="font-medium">Account verification required</span>
            </div>
            <div className="mt-2 text-sm text-yellow-300">
              {!user?.emailVerified && !user?.phoneVerified && (
                <span>Please verify your email and phone number to make picks.</span>
              )}
              {!user?.emailVerified && user?.phoneVerified && (
                <span>Please verify your email address to make picks.</span>
              )}
              {user?.emailVerified && !user?.phoneVerified && (
                <span>Please verify your phone number to make picks.</span>
              )}
              <div className="mt-2">
                <Link
                  href="/auth/verify"
                  className="text-yellow-400 hover:text-yellow-300 underline font-medium"
                >
                  Complete Verification
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Matchups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matchups.map((matchup) => (
          <MatchupCard
            key={matchup.id}
            matchup={matchup}
            onTeamSelect={(teamId) => handleTeamSelect(teamId, selectedWeekTab)}
            selectedTeams={selectedTeams}
            isLocked={lockedWeeks.includes(selectedWeekTab)}
            existingPicks={existingPicks}
          />
        ))}
      </div>

      {/* No matchups message */}
      {matchups.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400">
            <ClockIcon className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No games this week</h3>
            <p>Check back later for updated schedules.</p>
          </div>
        </div>
      )}
    </div>
  )
}

interface MatchupCardProps {
  matchup: Matchup
  onTeamSelect: (teamId: string) => void
  selectedTeams: string[]
  isLocked: boolean
  existingPicks: Pick[]
}

function MatchupCard({ matchup, onTeamSelect, selectedTeams, isLocked, existingPicks }: MatchupCardProps) {
  const { isAuthenticated, user } = useAuth()
  const isFullyVerified = user?.emailVerified && user?.phoneVerified
  const canMakePicks = isAuthenticated && isFullyVerified
  
  const isTeamASelected = selectedTeams.includes(matchup.teamAId)
  const isTeamBSelected = selectedTeams.includes(matchup.teamBId)
  const isTeamADisabled = !canMakePicks || existingPicks.some(pick => pick.teamId === matchup.teamAId)
  const isTeamBDisabled = !canMakePicks || existingPicks.some(pick => pick.teamId === matchup.teamBId)

  const formatTime = (startTime: string) => {
    const date = new Date(startTime)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="bg-gray-100 border border-gray-300 rounded-xl p-6">
      {/* Game Time Header */}
      <div className="text-center mb-6">
        <p className="text-black text-base font-medium mb-1">
          {formatTime(matchup.startTime)}
        </p>
        <div className="flex items-center justify-center space-x-2">
          <PlayIcon className="h-4 w-4 text-primary-400" />
          <span className="text-primary-400 text-sm font-medium">Preview</span>
        </div>
      </div>

      {/* Teams */}
      <div className="space-y-4">
        {/* Team A */}
        <TeamCard
          team={matchup.teamA}
          isSelected={isTeamASelected}
          isDisabled={isTeamADisabled || isLocked}
          onClick={() => canMakePicks && !isTeamADisabled && !isLocked && onTeamSelect(matchup.teamAId)}
          showDisabledReason={isTeamADisabled}
        />

        {/* VS Divider */}
        <div className="text-center">
          <span className="text-gray-500 font-semibold">VS</span>
        </div>

        {/* Team B */}
        <TeamCard
          team={matchup.teamB}
          isSelected={isTeamBSelected}
          isDisabled={isTeamBDisabled || isLocked}
          onClick={() => canMakePicks && !isTeamBDisabled && !isLocked && onTeamSelect(matchup.teamBId)}
          showDisabledReason={isTeamBDisabled}
        />
      </div>
    </div>
  )
}

interface TeamCardProps {
  team: Team
  isSelected: boolean
  isDisabled: boolean
  onClick: () => void
  showDisabledReason?: boolean
}

function TeamCard({ team, isSelected, isDisabled, onClick, showDisabledReason }: TeamCardProps) {
  const getTeamHelmetImage = (alias: string) => {
    return `/darklogo/${alias}.gif`
  }
  const getTeamCardClass = () => {
    if (isDisabled) {
      return 'bg-gray-200 border border-gray-400 rounded-lg p-4 cursor-not-allowed opacity-60'
    }
    if (isSelected) {
      return 'bg-green-100 border border-green-600 rounded-lg p-4 cursor-pointer'
    }
    return 'bg-white border border-gray-300 rounded-lg p-4 cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors'
  }

  return (
    <div
      className={`${getTeamCardClass()} relative`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        {/* Radio Button */}
        <div className={`
          w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
          ${isSelected
            ? 'border-green-600 bg-green-600'
            : isDisabled
              ? 'border-gray-500'
              : 'border-gray-500 hover:border-green-600'
          }
        `}>
          {isSelected && (
            <div className="w-2 h-2 bg-white rounded-full" />
          )}
        </div>

        {/* Team Helmet */}
        <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden">
          <img
            src={getTeamHelmetImage(team.alias)}
            alt={`${team.fullName} helmet`}
            className="w-10 h-10 object-contain"
            onError={(e) => {
              // Fallback to team colors if helmet image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.style.backgroundColor = team.primaryColor;
                parent.style.border = `2px solid ${team.secondaryColor}`;
                parent.innerHTML = `<span class="text-white font-bold text-sm">${team.alias}</span>`;
              }
            }}
          />
        </div>

        {/* Team Info */}
        <div className="flex-1">
          <h3 className="font-semibold text-black">{team.name}</h3>
          <p className="text-sm text-gray-600">{team.market}</p>
        </div>
      </div>

      {/* Disabled Overlay */}
      {isDisabled && showDisabledReason && (
        <div className="absolute inset-0 bg-red-500/20 border border-red-500 rounded-lg flex items-center justify-center">
          <span className="text-red-400 text-sm font-semibold">Already Picked</span>
        </div>
      )}
    </div>
  )
}