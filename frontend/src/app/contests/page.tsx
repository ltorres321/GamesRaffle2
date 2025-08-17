'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { PlusIcon, TrophyIcon, UsersIcon, CurrencyDollarIcon, CalendarIcon } from '@heroicons/react/24/outline'

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
  season: number
  status: 'open' | 'active' | 'completed' | 'cancelled'
  createdAt: string
}

export default function ContestLobby() {
  const { isAuthenticated } = useAuth()
  const [games, setGames] = useState<SurvivorGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSurvivorGames()
  }, [])

  const fetchSurvivorGames = async () => {
    try {
      // For now, show sample games until we implement the backend list endpoint
      const sampleGames: SurvivorGame[] = [
        {
          gameId: 'game-1',
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
          season: 2024,
          status: 'active',
          createdAt: '2024-08-01T00:00:00Z'
        },
        {
          gameId: 'game-2',
          gameName: 'High Stakes Survivor',
          description: 'Premium survivor pool with higher entry fee and bigger prizes. Only serious players need apply!',
          creatorName: 'Pro Bettor',
          entryFee: 100.00,
          prizePool: 5000.00,
          maxParticipants: 50,
          currentParticipants: 23,
          activeParticipants: 8,
          startWeek: 1,
          endWeek: 18,
          season: 2024,
          status: 'active',
          createdAt: '2024-08-01T00:00:00Z'
        },
        {
          gameId: 'game-3',
          gameName: 'Free Play Survivor',
          description: 'Practice your survivor skills with no entry fee. Perfect for beginners to learn the game!',
          creatorName: 'Community',
          entryFee: 0,
          prizePool: 0,
          maxParticipants: 200,
          currentParticipants: 156,
          activeParticipants: 34,
          startWeek: 1,
          endWeek: 18,
          season: 2024,
          status: 'active',
          createdAt: '2024-08-01T00:00:00Z'
        }
      ]

      setGames(sampleGames)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch survivor games:', err)
      setError('Failed to load contests')
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      open: 'bg-green-100 text-green-800',
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status as keyof typeof badges] || badges.open}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatCurrency = (amount: number) => {
    return amount === 0 ? 'FREE' : `$${amount.toFixed(0)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4">Loading contests...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Contest Lobby</h1>
            <p className="text-gray-300">Choose your NFL Survivor challenge</p>
          </div>
          
          {isAuthenticated && (
            <Link 
              href="/contests/create"
              className="bg-gold-500 hover:bg-gold-600 text-gray-900 px-6 py-3 rounded-lg font-semibold flex items-center transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Contest
            </Link>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Game Explanation */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <TrophyIcon className="h-6 w-6 mr-2 text-gold-500" />
            How NFL Survivor Works
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h3 className="font-semibold text-white mb-2">Basic Rules:</h3>
              <ul className="space-y-1 text-sm">
                <li>• Pick one NFL team each week to WIN their game</li>
                <li>• If your team loses or ties, you're ELIMINATED</li>
                <li>• You can only use each team ONCE per season</li>
                <li>• Starting Week 12: Pick TWO teams each week</li>
                <li>• Last player standing wins the prize pool!</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Strategy Tips:</h3>
              <ul className="space-y-1 text-sm">
                <li>• Save strong teams for later weeks</li>
                <li>• Avoid divisional rivalry games</li>
                <li>• Weather can impact outdoor games</li>
                <li>• Consider point spreads and public picks</li>
                <li>• Plan ahead for bye weeks</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contest Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <div key={game.gameId} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-gold-500 transition-colors">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-1">{game.gameName}</h3>
                    <p className="text-sm text-gray-400">by {game.creatorName}</p>
                  </div>
                  {getStatusBadge(game.status)}
                </div>

                {/* Description */}
                <p className="text-gray-300 text-sm mb-4 line-clamp-3">{game.description}</p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <CurrencyDollarIcon className="h-5 w-5 text-gold-500 mr-1" />
                      <span className="text-gold-500 font-bold">
                        {formatCurrency(game.entryFee)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">Entry Fee</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <TrophyIcon className="h-5 w-5 text-purple-400 mr-1" />
                      <span className="text-purple-400 font-bold">
                        {formatCurrency(game.prizePool)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">Prize Pool</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <UsersIcon className="h-5 w-5 text-blue-400 mr-1" />
                      <span className="text-blue-400 font-bold">
                        {game.currentParticipants}/{game.maxParticipants}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">Players</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <CalendarIcon className="h-5 w-5 text-green-400 mr-1" />
                      <span className="text-green-400 font-bold">
                        {game.activeParticipants}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">Still Alive</p>
                  </div>
                </div>

                {/* Season Info */}
                <div className="text-xs text-gray-400 mb-4 text-center">
                  {game.season} Season • Weeks {game.startWeek}-{game.endWeek}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Link 
                    href={`/contests/${game.gameId}`}
                    className="block w-full bg-primary-600 hover:bg-primary-700 text-white text-center py-2 px-4 rounded-lg transition-colors font-medium"
                  >
                    View Details
                  </Link>
                  
                  {isAuthenticated && game.status === 'open' && (
                    <Link 
                      href={`/contests/${game.gameId}/join`}
                      className="block w-full bg-gold-500 hover:bg-gold-600 text-gray-900 text-center py-2 px-4 rounded-lg transition-colors font-medium"
                    >
                      Join Contest
                    </Link>
                  )}

                  {!isAuthenticated && (
                    <Link 
                      href="/auth/register"
                      className="block w-full bg-gray-600 hover:bg-gray-700 text-white text-center py-2 px-4 rounded-lg transition-colors font-medium"
                    >
                      Sign Up to Play
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Games Message */}
        {games.length === 0 && !loading && (
          <div className="text-center py-12">
            <TrophyIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Active Contests</h3>
            <p className="text-gray-400 mb-6">Be the first to create a survivor contest!</p>
            {isAuthenticated && (
              <Link 
                href="/contests/create"
                className="bg-gold-500 hover:bg-gold-600 text-gray-900 px-6 py-3 rounded-lg font-semibold inline-flex items-center transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Contest
              </Link>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Need Help?</h2>
          <div className="grid md:grid-cols-3 gap-6 text-gray-300 text-sm">
            <div>
              <h3 className="font-semibold text-white mb-2">New to Survivor?</h3>
              <p>Start with a free contest to learn the game mechanics without risk.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Strategy Questions?</h3>
              <p>Check out our strategy guides and community tips in the help section.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Technical Issues?</h3>
              <p>Contact support if you experience any problems with picks or payments.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}