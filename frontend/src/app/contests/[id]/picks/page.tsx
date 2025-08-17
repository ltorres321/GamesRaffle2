'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import API_CONFIG from '@/config/api'
import {
  ChevronLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'

interface NFLTeam {
  teamId: string
  alias: string
  name: string
  city: string
  conference: 'AFC' | 'NFC'
  division: string
  logo?: string
}

interface NFLGame {
  gameId: string
  week: number
  homeTeam: NFLTeam
  awayTeam: NFLTeam
  scheduledTime: string
  status: 'scheduled' | 'in_progress' | 'final'
  homeScore?: number
  awayScore?: number
}

interface PlayerPick {
  week: number
  teamId: string
  teamAlias: string
  teamName: string
  isLocked: boolean
  isCorrect?: boolean
}

interface WeeklyPickData {
  week: number
  games: NFLGame[]
  currentPicks: PlayerPick[]
  usedTeams: string[]
  pickDeadline: string
  requireTwoPicks: boolean
}

export default function WeeklyPicks() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const gameId = params?.id as string

  const [weekData, setWeekData] = useState<WeeklyPickData | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<number>(8) // Current week
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (gameId) {
      fetchWeekData(selectedWeek)
    }
  }, [gameId, selectedWeek])

  const fetchWeekData = async (week: number) => {
    try {
      setLoading(true)
      console.log(`Fetching NFL games for week ${week}...`)
      
      // Call the real backend API for NFL games
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/survivor/nfl/week/${week}?season=2024`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch week ${week} games: ${response.statusText}`)
      }
      
      const apiData = await response.json()
      console.log('API Response:', apiData)
      
      if (!apiData.success) {
        throw new Error(apiData.message || 'Failed to load NFL games')
      }
      
      // Transform the API data to match frontend interface
      const transformedGames: NFLGame[] = apiData.data.games.map((game: any) => ({
        gameId: game.gameId.toString(),
        week: game.week,
        homeTeam: {
          teamId: game.homeTeam.id.toString(),
          alias: game.homeTeam.alias,
          name: game.homeTeam.name,
          city: game.homeTeam.market,
          conference: game.homeTeam.conference || 'AFC', // Default fallback
          division: game.homeTeam.division || 'North'
        },
        awayTeam: {
          teamId: game.awayTeam.id.toString(),
          alias: game.awayTeam.alias,
          name: game.awayTeam.name,
          city: game.awayTeam.market,
          conference: game.awayTeam.conference || 'NFC', // Default fallback
          division: game.awayTeam.division || 'South'
        },
        scheduledTime: game.gameDate, // This should now have the correct 2024 dates!
        status: game.isComplete ? 'final' : 'scheduled',
        homeScore: game.homeTeam.score,
        awayScore: game.awayTeam.score
      }))
      
      console.log('Transformed games:', transformedGames)
      
      const weekData: WeeklyPickData = {
        week,
        games: transformedGames,
        currentPicks: [],
        usedTeams: ['TB', 'NE', 'PIT'], // TODO: Get real used teams from API
        pickDeadline: transformedGames.length > 0 ? transformedGames[0].scheduledTime : new Date().toISOString(),
        requireTwoPicks: week >= 12
      }

      setWeekData(weekData)
      setSelectedTeams([])
    } catch (err) {
      console.error('Failed to fetch week data:', err)
      setError('Failed to load week data: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleTeamSelection = (teamId: string, teamAlias: string) => {
    if (weekData?.usedTeams.includes(teamAlias)) {
      alert(`You've already used ${teamAlias} this season!`)
      return
    }

    const maxPicks = weekData?.requireTwoPicks ? 2 : 1
    
    if (selectedTeams.includes(teamId)) {
      // Deselect team
      setSelectedTeams(prev => prev.filter(id => id !== teamId))
    } else if (selectedTeams.length < maxPicks) {
      // Select team
      setSelectedTeams(prev => [...prev, teamId])
    } else {
      // Replace selection if at max
      if (maxPicks === 1) {
        setSelectedTeams([teamId])
      } else {
        alert(`You can only select ${maxPicks} teams for this week`)
      }
    }
  }

  const handleSubmitPicks = async () => {
    if (!weekData || selectedTeams.length === 0) return

    const requiredPicks = weekData.requireTwoPicks ? 2 : 1
    if (selectedTeams.length !== requiredPicks) {
      alert(`You must select exactly ${requiredPicks} team${requiredPicks > 1 ? 's' : ''} for this week`)
      return
    }

    try {
      setSubmitting(true)
      // TODO: Implement API call to submit picks
      console.log('Submitting picks:', selectedTeams)
      
      // Mock successful submission
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      alert('Picks submitted successfully!')
      router.push(`/contests/${gameId}`)
    } catch (err) {
      console.error('Failed to submit picks:', err)
      alert('Failed to submit picks. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatGameTime = (scheduledTime: string) => {
    console.log('formatGameTime called with:', scheduledTime)
    const date = new Date(scheduledTime)
    console.log('Parsed date:', date)
    
    // Use explicit formatting to ensure year displays
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const day = date.getDate()
    const year = date.getFullYear()
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    
    const result = `${weekday}, ${month} ${day}, ${year}, ${time}`
    console.log('formatGameTime result:', result)
    return result
  }

  const isPickDeadlinePassed = () => {
    if (!weekData) return false
    return new Date() > new Date(weekData.pickDeadline)
  }

  const getTeamFromGame = (game: NFLGame, teamId: string): NFLTeam | null => {
    if (game.homeTeam.teamId === teamId) return game.homeTeam
    if (game.awayTeam.teamId === teamId) return game.awayTeam
    return null
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">You must be logged in to make picks.</p>
          <Link href="/auth/login" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg">
            Log In
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4">Loading week data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !weekData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error Loading Data</h1>
          <p className="text-gray-300 mb-6">{error || 'Failed to load week data'}</p>
          <Link href={`/contests/${gameId}`} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg">
            Back to Contest
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link 
              href={`/contests/${gameId}`}
              className="flex items-center text-gray-400 hover:text-white mr-4"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Back to Contest
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Week {weekData.week} Picks</h1>
              <p className="text-gray-300">
                Select {weekData.requireTwoPicks ? 'TWO' : 'ONE'} team{weekData.requireTwoPicks ? 's' : ''} to win this week
              </p>
            </div>
          </div>
          
          {/* Week Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedWeek(prev => Math.max(1, prev - 1))}
              disabled={selectedWeek <= 1}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 hover:bg-gray-600"
            >
              ←
            </button>
            <span className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium">
              Week {selectedWeek}
            </span>
            <button
              onClick={() => setSelectedWeek(prev => Math.min(18, prev + 1))}
              disabled={selectedWeek >= 18}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 hover:bg-gray-600"
            >
              →
            </button>
          </div>
        </div>

        {/* Pick Deadline Alert */}
        <div className={`p-4 rounded-lg mb-6 border ${
          isPickDeadlinePassed() 
            ? 'bg-red-800 border-red-600' 
            : 'bg-blue-800 border-blue-600'
        }`}>
          <div className="flex items-center">
            <ClockIcon className="h-6 w-6 mr-3" />
            <div>
              <h3 className="font-semibold text-white">
                {isPickDeadlinePassed() ? 'Pick Deadline Passed' : 'Pick Deadline'}
              </h3>
              <p className="text-sm text-gray-300">
                {formatGameTime(weekData.pickDeadline)} - 
                {isPickDeadlinePassed() ? ' No more picks accepted' : ' Submit your picks before this time'}
              </p>
            </div>
          </div>
        </div>

        {/* Used Teams Alert */}
        {weekData.usedTeams.length > 0 && (
          <div className="bg-yellow-800 border border-yellow-600 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 mr-3" />
              <div>
                <h3 className="font-semibold text-white">Teams Already Used</h3>
                <p className="text-sm text-gray-300">
                  You cannot pick these teams again: {weekData.usedTeams.join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Games Grid */}
        <div className="grid gap-4 mb-8">
          {weekData.games.map(game => (
            <div key={game.gameId} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-gray-400">
                    <CalendarDaysIcon className="h-5 w-5 mr-2" />
                    <span className="text-sm">{formatGameTime(game.scheduledTime)}</span>
                  </div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    {game.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Away Team */}
                  <button
                    onClick={() => handleTeamSelection(game.awayTeam.teamId, game.awayTeam.alias)}
                    disabled={isPickDeadlinePassed() || weekData.usedTeams.includes(game.awayTeam.alias)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTeams.includes(game.awayTeam.teamId)
                        ? 'border-gold-500 bg-gold-500/20'
                        : weekData.usedTeams.includes(game.awayTeam.alias)
                        ? 'border-red-500 bg-red-500/20 opacity-50 cursor-not-allowed'
                        : 'border-gray-600 hover:border-gray-500 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <div className="flex items-center mb-2">
                          <span className="text-lg font-bold text-white mr-2">
                            {game.awayTeam.alias}
                          </span>
                          {weekData.usedTeams.includes(game.awayTeam.alias) && (
                            <XCircleIcon className="h-5 w-5 text-red-400" />
                          )}
                          {selectedTeams.includes(game.awayTeam.teamId) && (
                            <CheckCircleIcon className="h-5 w-5 text-gold-500" />
                          )}
                        </div>
                        <p className="text-gray-300 text-sm">{game.awayTeam.city} {game.awayTeam.name}</p>
                        <p className="text-gray-400 text-xs">{game.awayTeam.conference} {game.awayTeam.division}</p>
                      </div>
                      <span className="text-gray-400 text-sm">@</span>
                    </div>
                  </button>

                  {/* Home Team */}
                  <button
                    onClick={() => handleTeamSelection(game.homeTeam.teamId, game.homeTeam.alias)}
                    disabled={isPickDeadlinePassed() || weekData.usedTeams.includes(game.homeTeam.alias)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTeams.includes(game.homeTeam.teamId)
                        ? 'border-gold-500 bg-gold-500/20'
                        : weekData.usedTeams.includes(game.homeTeam.alias)
                        ? 'border-red-500 bg-red-500/20 opacity-50 cursor-not-allowed'
                        : 'border-gray-600 hover:border-gray-500 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">vs</span>
                      <div className="text-right">
                        <div className="flex items-center justify-end mb-2">
                          {selectedTeams.includes(game.homeTeam.teamId) && (
                            <CheckCircleIcon className="h-5 w-5 text-gold-500 mr-2" />
                          )}
                          {weekData.usedTeams.includes(game.homeTeam.alias) && (
                            <XCircleIcon className="h-5 w-5 text-red-400 mr-2" />
                          )}
                          <span className="text-lg font-bold text-white">
                            {game.homeTeam.alias}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{game.homeTeam.city} {game.homeTeam.name}</p>
                        <p className="text-gray-400 text-xs">{game.homeTeam.conference} {game.homeTeam.division}</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Picks Summary */}
        {selectedTeams.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">Your Picks</h3>
            <div className="space-y-2">
              {selectedTeams.map((teamId, index) => {
                const game = weekData.games.find(g => 
                  g.homeTeam.teamId === teamId || g.awayTeam.teamId === teamId
                )
                const team = game ? getTeamFromGame(game, teamId) : null
                
                return team ? (
                  <div key={teamId} className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <span className="text-gold-500 font-bold mr-3">
                        Pick {index + 1}:
                      </span>
                      <span className="text-white font-medium">
                        {team.city} {team.name} ({team.alias})
                      </span>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {game ? formatGameTime(game.scheduledTime) : 'N/A'}
                    </span>
                  </div>
                ) : null
              })}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSubmitPicks}
            disabled={
              submitting || 
              isPickDeadlinePassed() || 
              selectedTeams.length !== (weekData.requireTwoPicks ? 2 : 1)
            }
            className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
              submitting || 
              isPickDeadlinePassed() || 
              selectedTeams.length !== (weekData.requireTwoPicks ? 2 : 1)
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gold-500 hover:bg-gold-600 text-gray-900'
            }`}
          >
            {submitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
                Submitting Picks...
              </div>
            ) : (
              `Submit ${weekData.requireTwoPicks ? 'Two' : 'One'} Pick${weekData.requireTwoPicks ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}