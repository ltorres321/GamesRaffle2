'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { 
  TrophyIcon, 
  UsersIcon, 
  CurrencyDollarIcon, 
  CalendarIcon,
  ChartBarIcon,
  PlayIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface SurvivorGame {
  gameId: string
  gameName: string
  description: string
  creatorName: string
  entryFee: number
  prizePool: number
  maxParticipants: number
  currentParticipants: number
  activeParticipants: number
  startWeek: number
  endWeek: number
  requireTwoPicksFromWeek: number
  season: number
  status: 'open' | 'active' | 'completed' | 'cancelled'
  winnerId?: string
  createdAt: string
}

interface LeaderboardEntry {
  rank: number
  playerId: string
  username: string
  playerName: string
  status: 'active' | 'eliminated'
  weeksSurvived: number
  eliminatedWeek?: number
  eliminatedReason?: string
}

interface PlayerStatus {
  isParticipant: boolean
  status: 'active' | 'eliminated' | null
  eliminatedWeek?: number
  eliminatedReason?: string
  picks: any[]
}

export default function ContestDetails() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const gameId = params?.id as string

  const [game, setGame] = useState<SurvivorGame | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'rules'>('overview')

  useEffect(() => {
    if (gameId) {
      fetchGameDetails()
      fetchLeaderboard()
      if (isAuthenticated) {
        fetchPlayerStatus()
      }
    }
  }, [gameId, isAuthenticated])

  const fetchGameDetails = async () => {
    try {
      // Mock data - replace with actual API call
      const mockGame: SurvivorGame = {
        gameId: gameId,
        gameName: 'NFL Survivor 2024 - Main Pool',
        description: 'Official NFL Survivor pool for the 2024 season. Pick one team each week to win. If your team loses, you\'re eliminated! Starting Week 12, you must pick TWO teams each week.',
        creatorName: 'System Administrator',
        entryFee: 25.00,
        prizePool: 2500.00,
        maxParticipants: 100,
        currentParticipants: 47,
        activeParticipants: 12,
        startWeek: 1,
        endWeek: 18,
        requireTwoPicksFromWeek: 12,
        season: 2024,
        status: 'active',
        createdAt: '2024-08-01T00:00:00Z'
      }

      setGame(mockGame)
    } catch (err) {
      console.error('Failed to fetch game details:', err)
      setError('Failed to load contest details')
    }
  }

  const fetchLeaderboard = async () => {
    try {
      // Mock leaderboard data
      const mockLeaderboard: LeaderboardEntry[] = [
        { rank: 1, playerId: '1', username: 'ProPicker', playerName: 'John Smith', status: 'active', weeksSurvived: 8 },
        { rank: 2, playerId: '2', username: 'SurvivorKing', playerName: 'Mike Johnson', status: 'active', weeksSurvived: 8 },
        { rank: 3, playerId: '3', username: 'NFLExpert', playerName: 'Sarah Davis', status: 'active', weeksSurvived: 8 },
        { rank: 4, playerId: '4', username: 'LuckyPicks', playerName: 'Tom Wilson', status: 'active', weeksSurvived: 8 },
        { rank: 5, playerId: '5', username: 'GridironGuru', playerName: 'Lisa Brown', status: 'active', weeksSurvived: 8 },
        { rank: 6, playerId: '6', username: 'TouchdownTony', playerName: 'Tony Garcia', status: 'eliminated', weeksSurvived: 7, eliminatedWeek: 8, eliminatedReason: 'Incorrect pick' },
        { rank: 7, playerId: '7', username: 'ChampionPicks', playerName: 'Amy White', status: 'eliminated', weeksSurvived: 6, eliminatedWeek: 7, eliminatedReason: 'Incorrect pick' },
        { rank: 8, playerId: '8', username: 'FootballFan', playerName: 'Chris Lee', status: 'eliminated', weeksSurvived: 5, eliminatedWeek: 6, eliminatedReason: 'Incorrect pick' },
      ]

      setLeaderboard(mockLeaderboard)
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
    }
  }

  const fetchPlayerStatus = async () => {
    try {
      // Mock player status
      const mockStatus: PlayerStatus = {
        isParticipant: true,
        status: 'active',
        picks: [
          { week: 1, teamAlias: 'KC', teamName: 'Chiefs', isCorrect: true },
          { week: 2, teamAlias: 'BUF', teamName: 'Bills', isCorrect: true },
          { week: 3, teamAlias: 'SF', teamName: '49ers', isCorrect: true },
          { week: 4, teamAlias: 'DAL', teamName: 'Cowboys', isCorrect: false }
        ]
      }

      setPlayerStatus(mockStatus)
    } catch (err) {
      console.error('Failed to fetch player status:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGame = async () => {
    try {
      // TODO: Implement join game API call
      alert('Join game functionality will be implemented')
      // After successful join, refresh data
      fetchGameDetails()
      fetchPlayerStatus()
    } catch (err) {
      console.error('Failed to join game:', err)
      alert('Failed to join contest')
    }
  }

  const formatCurrency = (amount: number) => {
    return amount === 0 ? 'FREE' : `$${amount.toFixed(0)}`
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      open: 'bg-green-100 text-green-800',
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badges[status as keyof typeof badges] || badges.open}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getCurrentWeek = () => {
    // Mock current week - in real app, calculate based on current date and NFL schedule
    return 8
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4">Loading contest details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">Contest Not Found</h1>
            <p className="text-gray-300 mb-6">{error || 'The contest you\'re looking for doesn\'t exist.'}</p>
            <Link href="/contests" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg">
              Back to Contests
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-8">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <Link href="/contests" className="text-gray-400 hover:text-white mr-2">
                Contests
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-white ml-2">{game.gameName}</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">{game.gameName}</h1>
            <p className="text-gray-300 mb-4">{game.description}</p>
            <div className="flex items-center space-x-4">
              {getStatusBadge(game.status)}
              <span className="text-gray-400">by {game.creatorName}</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-6 lg:mt-0 lg:ml-6 space-y-3 lg:space-y-0 lg:space-x-3 lg:flex">
            {playerStatus?.isParticipant ? (
              <>
                <Link 
                  href={`/contests/${gameId}/picks`}
                  className="block lg:inline-block bg-gold-500 hover:bg-gold-600 text-gray-900 px-6 py-3 rounded-lg font-semibold text-center transition-colors"
                >
                  <PlayIcon className="h-5 w-5 inline mr-2" />
                  Make Picks
                </Link>
                <Link 
                  href={`/contests/${gameId}/my-picks`}
                  className="block lg:inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold text-center transition-colors"
                >
                  <EyeIcon className="h-5 w-5 inline mr-2" />
                  My Picks
                </Link>
              </>
            ) : isAuthenticated && game.status === 'open' ? (
              <button 
                onClick={handleJoinGame}
                className="bg-gold-500 hover:bg-gold-600 text-gray-900 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Join Contest
              </button>
            ) : !isAuthenticated ? (
              <Link 
                href="/auth/register"
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Sign Up to Play
              </Link>
            ) : (
              <span className="text-gray-400 px-6 py-3">Contest Closed</span>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
            <div className="flex items-center justify-center mb-2">
              <CurrencyDollarIcon className="h-6 w-6 text-gold-500 mr-2" />
              <span className="text-2xl font-bold text-gold-500">{formatCurrency(game.entryFee)}</span>
            </div>
            <p className="text-gray-400">Entry Fee</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
            <div className="flex items-center justify-center mb-2">
              <TrophyIcon className="h-6 w-6 text-purple-400 mr-2" />
              <span className="text-2xl font-bold text-purple-400">{formatCurrency(game.prizePool)}</span>
            </div>
            <p className="text-gray-400">Prize Pool</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
            <div className="flex items-center justify-center mb-2">
              <UsersIcon className="h-6 w-6 text-blue-400 mr-2" />
              <span className="text-2xl font-bold text-blue-400">{game.currentParticipants}</span>
            </div>
            <p className="text-gray-400">Total Players</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
            <div className="flex items-center justify-center mb-2">
              <CalendarIcon className="h-6 w-6 text-green-400 mr-2" />
              <span className="text-2xl font-bold text-green-400">{game.activeParticipants}</span>
            </div>
            <p className="text-gray-400">Still Alive</p>
          </div>
        </div>

        {/* Player Status Alert */}
        {playerStatus?.isParticipant && (
          <div className={`p-4 rounded-lg mb-8 border ${
            playerStatus.status === 'active' 
              ? 'bg-green-800 border-green-600' 
              : 'bg-red-800 border-red-600'
          }`}>
            <div className="flex items-center">
              <TrophyIcon className="h-6 w-6 mr-3" />
              <div>
                <h3 className="font-semibold text-white">
                  {playerStatus.status === 'active' ? 'You\'re Still Alive!' : 'You\'ve Been Eliminated'}
                </h3>
                <p className="text-sm text-gray-300">
                  {playerStatus.status === 'active' 
                    ? `You've survived ${playerStatus.picks?.length || 0} weeks. Keep making picks to win!`
                    : `Eliminated in Week ${playerStatus.eliminatedWeek}: ${playerStatus.eliminatedReason}`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-700 mb-8">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: ChartBarIcon },
              { key: 'leaderboard', label: 'Leaderboard', icon: TrophyIcon },
              { key: 'rules', label: 'Rules', icon: UsersIcon }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-gold-500 text-gold-500'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Contest Progress */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Contest Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-300 mb-2">
                    <span>Current Week</span>
                    <span>Week {getCurrentWeek()}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gold-500 h-2 rounded-full" 
                      style={{ width: `${(getCurrentWeek() / game.endWeek) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">{getCurrentWeek()}</p>
                    <p className="text-sm text-gray-400">Current Week</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{game.endWeek - getCurrentWeek()}</p>
                    <p className="text-sm text-gray-400">Weeks Remaining</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{game.requireTwoPicksFromWeek}</p>
                    <p className="text-sm text-gray-400">Two-Pick Week</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Recent Eliminations</h3>
              <div className="space-y-3">
                {leaderboard.filter(p => p.status === 'eliminated').slice(0, 5).map(player => (
                  <div key={player.playerId} className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                        {player.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{player.playerName}</p>
                        <p className="text-sm text-gray-400">@{player.username}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400 font-medium">Week {player.eliminatedWeek}</p>
                      <p className="text-xs text-gray-400">Eliminated</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Leaderboard</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Rank</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Player</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Weeks Survived</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Elimination</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((player, index) => (
                      <tr key={player.playerId} className="border-b border-gray-700 hover:bg-gray-750">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {index < 3 && (
                              <TrophyIcon className={`h-5 w-5 mr-2 ${
                                index === 0 ? 'text-yellow-500' :
                                index === 1 ? 'text-gray-400' :
                                'text-yellow-600'
                              }`} />
                            )}
                            <span className="text-white font-medium">#{player.rank}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 ${
                              player.status === 'active' ? 'bg-green-600' : 'bg-red-600'
                            }`}>
                              {player.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white font-medium">{player.playerName}</p>
                              <p className="text-sm text-gray-400">@{player.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            player.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {player.status === 'active' ? 'Alive' : 'Eliminated'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-white font-medium">{player.weeksSurvived}</span>
                        </td>
                        <td className="py-3 px-4">
                          {player.eliminatedWeek ? (
                            <div>
                              <p className="text-red-400">Week {player.eliminatedWeek}</p>
                              <p className="text-xs text-gray-400">{player.eliminatedReason}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-6">Contest Rules</h3>
            
            <div className="space-y-6 text-gray-300">
              <div>
                <h4 className="font-semibold text-white mb-2">Basic Rules</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Pick one NFL team each week to WIN their game</li>
                  <li>• If your team loses or ties, you are ELIMINATED</li>
                  <li>• You can only use each NFL team ONCE during the season</li>
                  <li>• Starting Week {game.requireTwoPicksFromWeek}, you must pick TWO teams each week</li>
                  <li>• The last player standing wins the entire prize pool</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Picking Deadlines</h4>
                <ul className="space-y-2 text-sm">
                  <li>• All picks must be submitted before the kickoff of the selected game</li>
                  <li>• No late picks will be accepted under any circumstances</li>
                  <li>• If you fail to make a pick, you will be automatically eliminated</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Prize Distribution</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Winner takes the entire prize pool: {formatCurrency(game.prizePool)}</li>
                  <li>• If multiple players survive to the end, the prize is split equally</li>
                  <li>• Entry fees are non-refundable once the contest begins</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Contest Information</h4>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Season:</span>
                      <span className="text-white ml-2">{game.season}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Weeks:</span>
                      <span className="text-white ml-2">{game.startWeek} - {game.endWeek}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Two-Pick Requirement:</span>
                      <span className="text-white ml-2">Week {game.requireTwoPicksFromWeek}+</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Max Players:</span>
                      <span className="text-white ml-2">{game.maxParticipants}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}