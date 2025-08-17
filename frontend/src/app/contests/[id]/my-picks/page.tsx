'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { 
  ChevronLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrophyIcon,
  FireIcon
} from '@heroicons/react/24/outline'

interface PlayerPick {
  week: number
  teamId: string
  teamAlias: string
  teamName: string
  teamCity: string
  gameDate: string
  opponent: string
  isHome: boolean
  gameResult: 'win' | 'loss' | 'tie' | 'pending'
  finalScore?: string
  isCorrect?: boolean
  submittedAt: string
}

interface PlayerPickHistory {
  playerId: string
  gameId: string
  playerName: string
  status: 'active' | 'eliminated'
  eliminatedWeek?: number
  eliminatedReason?: string
  totalWeeksSurvived: number
  picks: PlayerPick[]
  availableTeams: string[]
}

export default function MyPicks() {
  const params = useParams()
  const { isAuthenticated, user } = useAuth()
  const gameId = params?.id as string

  const [pickHistory, setPickHistory] = useState<PlayerPickHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)

  useEffect(() => {
    if (gameId && isAuthenticated) {
      fetchPlayerPickHistory()
    }
  }, [gameId, isAuthenticated])

  const fetchPlayerPickHistory = async () => {
    try {
      setLoading(true)
      // Mock data - replace with actual API call
      const mockPickHistory: PlayerPickHistory = {
        playerId: 'player123',
        gameId: gameId,
        playerName: user ? `${user.firstName} ${user.lastName}` : 'Current Player',
        status: 'active',
        totalWeeksSurvived: 7,
        picks: [
          {
            week: 1,
            teamId: '1',
            teamAlias: 'KC',
            teamName: 'Chiefs',
            teamCity: 'Kansas City',
            gameDate: '2024-09-05T20:20:00Z',
            opponent: 'BAL Ravens',
            isHome: true,
            gameResult: 'win',
            finalScore: '27-20',
            isCorrect: true,
            submittedAt: '2024-09-05T18:00:00Z'
          },
          {
            week: 2,
            teamId: '2',
            teamAlias: 'BUF',
            teamName: 'Bills',
            teamCity: 'Buffalo',
            gameDate: '2024-09-12T20:15:00Z',
            opponent: 'MIA Dolphins',
            isHome: true,
            gameResult: 'win',
            finalScore: '31-10',
            isCorrect: true,
            submittedAt: '2024-09-12T17:30:00Z'
          },
          {
            week: 3,
            teamId: '3',
            teamAlias: 'SF',
            teamName: '49ers',
            teamCity: 'San Francisco',
            gameDate: '2024-09-19T16:25:00Z',
            opponent: 'LAR Rams',
            isHome: false,
            gameResult: 'win',
            finalScore: '24-14',
            isCorrect: true,
            submittedAt: '2024-09-19T14:00:00Z'
          },
          {
            week: 4,
            teamId: '4',
            teamAlias: 'DAL',
            teamName: 'Cowboys',
            teamCity: 'Dallas',
            gameDate: '2024-09-26T20:20:00Z',
            opponent: 'NYG Giants',
            isHome: true,
            gameResult: 'loss',
            finalScore: '17-20',
            isCorrect: false,
            submittedAt: '2024-09-26T18:15:00Z'
          },
          {
            week: 5,
            teamId: '5',
            teamAlias: 'MIA',
            teamName: 'Dolphins',
            teamCity: 'Miami',
            gameDate: '2024-10-03T20:15:00Z',
            opponent: 'NE Patriots',
            isHome: true,
            gameResult: 'win',
            finalScore: '28-7',
            isCorrect: true,
            submittedAt: '2024-10-03T17:45:00Z'
          },
          {
            week: 6,
            teamId: '6',
            teamAlias: 'LAR',
            teamName: 'Rams',
            teamCity: 'Los Angeles',
            gameDate: '2024-10-10T16:05:00Z',
            opponent: 'SEA Seahawks',
            isHome: false,
            gameResult: 'win',
            finalScore: '31-17',
            isCorrect: true,
            submittedAt: '2024-10-10T13:30:00Z'
          },
          {
            week: 7,
            teamId: '7',
            teamAlias: 'BAL',
            teamName: 'Ravens',
            teamCity: 'Baltimore',
            gameDate: '2024-10-17T20:15:00Z',
            opponent: 'TB Buccaneers',
            isHome: true,
            gameResult: 'win',
            finalScore: '41-31',
            isCorrect: true,
            submittedAt: '2024-10-17T18:00:00Z'
          }
        ],
        availableTeams: ['GB', 'PHI', 'MIN', 'DET', 'CIN', 'CLE', 'PIT', 'HOU', 'IND', 'JAX', 'TEN', 'DEN', 'LV', 'LAC', 'ARI', 'SEA', 'NYG', 'WAS', 'CAR', 'NO', 'ATL', 'TB', 'CHI', 'NYJ', 'NE']
      }

      setPickHistory(mockPickHistory)
    } catch (err) {
      console.error('Failed to fetch pick history:', err)
      setError('Failed to load pick history')
    } finally {
      setLoading(false)
    }
  }

  const formatGameDate = (dateString: string) => {
    const date = new Date(dateString)
    
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
    
    return `${weekday}, ${month} ${day}, ${year}, ${time}`
  }

  const getResultIcon = (gameResult: string, isCorrect?: boolean) => {
    if (gameResult === 'pending') {
      return <ClockIcon className="h-5 w-5 text-yellow-500" />
    }
    
    if (isCorrect === true) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />
    } else if (isCorrect === false) {
      return <XCircleIcon className="h-5 w-5 text-red-500" />
    }
    
    return <ClockIcon className="h-5 w-5 text-gray-500" />
  }

  const getResultBadge = (gameResult: string, isCorrect?: boolean) => {
    if (gameResult === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Pending
        </span>
      )
    }
    
    if (isCorrect === true) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Correct
        </span>
      )
    } else if (isCorrect === false) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Eliminated
        </span>
      )
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Unknown
      </span>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">You must be logged in to view your picks.</p>
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
            <p className="mt-4">Loading your pick history...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !pickHistory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error Loading Picks</h1>
          <p className="text-gray-300 mb-6">{error || 'Failed to load pick history'}</p>
          <Link href={`/contests/${gameId}`} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg">
            Back to Contest
          </Link>
        </div>
      </div>
    )
  }

  const correctPicks = pickHistory.picks.filter(pick => pick.isCorrect === true).length
  const incorrectPicks = pickHistory.picks.filter(pick => pick.isCorrect === false).length
  const pendingPicks = pickHistory.picks.filter(pick => pick.gameResult === 'pending').length

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
              <h1 className="text-3xl font-bold text-white">My Picks</h1>
              <p className="text-gray-300">Your pick history and performance</p>
            </div>
          </div>
        </div>

        {/* Player Status */}
        <div className={`p-6 rounded-lg mb-8 border ${
          pickHistory.status === 'active' 
            ? 'bg-green-800 border-green-600' 
            : 'bg-red-800 border-red-600'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TrophyIcon className="h-8 w-8 mr-4" />
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {pickHistory.status === 'active' ? 'Still Alive!' : 'Eliminated'}
                </h3>
                <p className="text-gray-300">
                  {pickHistory.status === 'active' 
                    ? `You've survived ${pickHistory.totalWeeksSurvived} weeks`
                    : `Eliminated in Week ${pickHistory.eliminatedWeek}: ${pickHistory.eliminatedReason}`
                  }
                </p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{correctPicks}</div>
                <div className="text-sm text-gray-300">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{incorrectPicks}</div>
                <div className="text-sm text-gray-300">Wrong</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{pendingPicks}</div>
                <div className="text-sm text-gray-300">Pending</div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Teams */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <FireIcon className="h-6 w-6 mr-2" />
            Available Teams ({pickHistory.availableTeams.length})
          </h3>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
            {pickHistory.availableTeams.map(teamAlias => (
              <div
                key={teamAlias}
                className="bg-gray-700 rounded-lg p-2 text-center"
              >
                <span className="text-sm font-medium text-white">{teamAlias}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-sm mt-3">
            These teams are still available for future picks
          </p>
        </div>

        {/* Pick History */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-xl font-semibold text-white">Pick History</h3>
            <p className="text-gray-400 text-sm">Your weekly picks and results</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Week</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Team</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Game</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Date</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Result</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {pickHistory.picks.map((pick, index) => (
                  <tr 
                    key={`${pick.week}-${pick.teamId}`}
                    className={`border-b border-gray-700 hover:bg-gray-750 ${
                      selectedWeek === pick.week ? 'bg-gray-750' : ''
                    }`}
                    onClick={() => setSelectedWeek(selectedWeek === pick.week ? null : pick.week)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <span className="text-white font-medium">Week {pick.week}</span>
                        {pick.isCorrect === false && (
                          <FireIcon className="h-4 w-4 text-red-400 ml-2" />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                          {pick.teamAlias}
                        </div>
                        <div>
                          <p className="text-white font-medium">{pick.teamCity} {pick.teamName}</p>
                          <p className="text-sm text-gray-400">{pick.teamAlias}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-white">
                          {pick.isHome ? 'vs' : '@'} {pick.opponent}
                        </p>
                        {pick.finalScore && (
                          <p className="text-sm text-gray-400">{pick.finalScore}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-300 text-sm">
                        {formatGameDate(pick.gameDate)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        {getResultIcon(pick.gameResult, pick.isCorrect)}
                        <span className="ml-2 text-white capitalize">{pick.gameResult}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getResultBadge(pick.gameResult, pick.isCorrect)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pickHistory.picks.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-gray-400">No picks yet. Start making your weekly selections!</p>
              <Link 
                href={`/contests/${gameId}/picks`}
                className="inline-block mt-4 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg"
              >
                Make Your First Pick
              </Link>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {pickHistory.status === 'active' && (
          <div className="mt-8 flex justify-center space-x-4">
            <Link 
              href={`/contests/${gameId}/picks`}
              className="bg-gold-500 hover:bg-gold-600 text-gray-900 px-6 py-3 rounded-lg font-semibold"
            >
              Make This Week's Pick
            </Link>
            <Link 
              href={`/contests/${gameId}`}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              View Leaderboard
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}