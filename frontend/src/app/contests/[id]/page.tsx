'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/Header'
import { Contest } from '@/types'
import Link from 'next/link'
import { 
  ClockIcon, 
  UserGroupIcon, 
  TrophyIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

// Mock data - replace with API call
const mockContest: Contest = {
  id: '1',
  title: 'The Big Splash $2.5M NFL Survivor',
  description: 'Win a brand new BMW M3 Competition in our biggest NFL survivor contest',
  league: 'NFL',
  entryFee: 150,
  prizePool: 2500000,
  lockDate: '2024-09-08T20:00:00Z',
  startDate: '2024-09-08T08:00:00Z',
  endDate: '2025-02-15T23:59:59Z',
  status: 'active',
  maxEntrants: 1500,
  currentEntrants: 582,
  isPublic: true,
  prizes: [
    {
      id: '1',
      contestId: '1',
      rank: 1,
      title: '2024 BMW M3 Competition',
      description: 'Brand new BMW M3 Competition with M Performance Package',
      value: 2500000,
      category: 'vehicle',
      imageUrl: '/prizes/bmw-m3.jpg',
      vendorId: 'bmw-dealer-1',
      vendor: {
        id: 'bmw-dealer-1',
        name: 'Splash',
        email: 'contact@splash.com',
        company: 'Splash Sports',
        description: 'Official Splash contest',
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
}

// Mock entrants data
const mockEntrants = [
  { id: 1, username: 'debol808', avatar: '', following: false },
  { id: 2, username: 'Doctoraselin', avatar: '', following: false },
  { id: 3, username: 'bigwin31', avatar: '', following: true },
  { id: 4, username: 'marlinjli', avatar: '', following: false },
  { id: 5, username: 'cosey72', avatar: '', following: false },
  { id: 6, username: 'mckenny22', avatar: '', following: false },
  { id: 7, username: 'derell', avatar: '', following: false },
  { id: 8, username: 'ellenelff', avatar: '', following: false },
  { id: 9, username: 'dpepeete', avatar: '', following: false },
  { id: 10, username: 'tommykittens', avatar: '', following: false }
]

export default function ContestDetailPage() {
  const params = useParams()
  const { user, isAuthenticated } = useAuth()
  const [contest, setContest] = useState<Contest>(mockContest)
  const [entrants, setEntrants] = useState(mockEntrants)
  const [isEntering, setIsEntering] = useState(false)

  // Check verification status
  const isFullyVerified = user?.emailVerified && user?.phoneVerified
  const canEnter = isAuthenticated && isFullyVerified

  const handleAddEntry = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to join contests')
      return
    }
    
    if (!isFullyVerified) {
      toast.error('Please verify your email and phone number to join contests')
      return
    }

    setIsEntering(true)
    // Simulate API call
    setTimeout(() => {
      setIsEntering(false)
      // Redirect to picks page
      window.location.href = `/contests/${contest.id}/picks`
    }, 1000)
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-gray-400 mb-6">
          <Link href="/" className="hover:text-primary-400">Home</Link>
          <ChevronRightIcon className="h-4 w-4" />
          <Link href="/contests" className="hover:text-primary-400">Contest Lobby</Link>
          <ChevronRightIcon className="h-4 w-4" />
          <span className="text-white">{contest.title}</span>
        </div>

        {/* Contest Header */}
        <div className="bg-dark-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{contest.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                  <span className="text-primary-400">{contest.prizes[0]?.vendor?.name}</span>
                  <span>${contest.prizePool.toLocaleString()} Prizes</span>
                  <span className="text-gold-400">$150 Entry</span>
                  <span>{contest.currentEntrants} / {contest.maxEntrants} Entries</span>
                  <span>Entry deadline</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleAddEntry}
                disabled={isEntering || !canEnter}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  canEnter
                    ? 'btn-secondary'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isEntering ? 'Adding...' : 'Add entries'}
              </button>
              <button className="btn-secondary px-6 py-2">
                Copy link
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Authentication Status Messages */}
            {!isAuthenticated && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <LockClosedIcon className="h-6 w-6 text-red-400" />
                  <h3 className="text-lg font-bold text-red-400">Sign In Required</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  You need to sign in to join contests and make picks. Create a free account to get started.
                </p>
                <div className="space-x-4">
                  <Link
                    href="/auth/login"
                    className="btn-primary px-6 py-2 inline-block"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="btn-secondary px-6 py-2 inline-block"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            )}

            {isAuthenticated && !isFullyVerified && (
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                  <h3 className="text-lg font-bold text-yellow-400">Account Verification Required</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  Complete your account verification to join contests and make picks.
                </p>
                <div className="text-sm text-yellow-200 mb-4">
                  {!user?.emailVerified && !user?.phoneVerified && (
                    <span>Please verify your email and phone number.</span>
                  )}
                  {!user?.emailVerified && user?.phoneVerified && (
                    <span>Please verify your email address.</span>
                  )}
                  {user?.emailVerified && !user?.phoneVerified && (
                    <span>Please verify your phone number.</span>
                  )}
                </div>
                <Link
                  href="/auth/verify"
                  className="btn-primary px-6 py-2 inline-block"
                >
                  Complete Verification
                </Link>
              </div>
            )}

            {/* My Entries */}
            <div className="bg-dark-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">My entries (0/150)</h2>
              <div className="bg-dark-700 rounded-lg p-8 text-center">
                <p className="text-gray-400 mb-4">You don't have any entries.</p>
                <button
                  onClick={handleAddEntry}
                  disabled={isEntering || !canEnter}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    canEnter
                      ? 'btn-primary'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isEntering ? 'Adding...' : 'Add entries'}
                </button>
                {!canEnter && isAuthenticated && (
                  <p className="text-sm text-gray-500 mt-2">
                    Complete account verification to join contests
                  </p>
                )}
              </div>
            </div>

            {/* Prize Payouts */}
            <div className="bg-dark-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Prize payouts</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-b border-dark-700">
                  <span className="text-white">1st</span>
                  <span className="text-gold-400 font-bold">$2,500,065.00</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-primary-400">✓ Guaranteed</span>
                  <span className="text-gray-400">
                    This is a guaranteed contest. The payout amounts will not change if the contest does not fill.
                  </span>
                </div>
                <Link href="#" className="text-primary-400 text-sm hover:underline">
                  View payout details
                </Link>
              </div>
            </div>

            {/* About Contest */}
            <div className="bg-dark-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">About this contest</h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  Entrants that select only winners will advance to the next slate. The entrant that makes 
                  it the furthest takes home the whole prize. If all remaining entrants are eliminated in the 
                  same slate, they will all be considered winners and will all split the prize. From Week 11, 
                  Week 12, Week 13, Week 14, Week 15, Week 16, Week 17 and Week 18 you will be required to 
                  select 2 teams. This contest was created by a Splash Employee. Check the individual week 
                  tabs in your picksheet to view the pick deadline for each week. The deadline appears at the 
                  top as "Picks lock" with the date and time.
                </p>
                <p>
                  Entrants will be prevented from selecting a team more than one time throughout the duration 
                  of the contest. If an entrant runs out of teams to pick, they will be unable to make a pick 
                  for the current slate, and will be unable to advance.
                </p>
              </div>
            </div>

            {/* Rules */}
            <div className="bg-dark-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Rules</h2>
              <ul className="space-y-2 text-gray-300">
                <li>• Select only winners to advance to the next week</li>
                <li>• Losses, Ties, and Missed Picks result in elimination from the contest</li>
                <li>• If all remaining entrants are eliminated in the same slate, the contest will conclude and the remaining entrants will split the prize</li>
                <li>• There are no tiebreakers</li>
                <li>• If you run out of teams, you will be unable to make a pick for the current slate, and will be unable to advance</li>
                <li>• If one or more remaining entries is able to make a correct selection for that slate, you will be eliminated</li>
                <li>• If all other remaining entries are unable to make a correct selection for that slate, the contest will conclude and the remaining entrants will split the prize</li>
                <li>• If all remaining entries run out of teams, the contest will conclude at the end of the slate and the remaining entrants will split the prize</li>
              </ul>
            </div>

            {/* Contest Settings */}
            <div className="bg-dark-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Contest settings</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">Pick objective</span>
                    <span className="text-white">Pick Winners</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">Picks per slate</span>
                    <span className="text-white">1</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">Team use limit</span>
                    <span className="text-white">Once</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">Double pick weeks</span>
                    <span className="text-white">Week 11, Week 12, Week 13, Week 14, Week 15, Week 16, Week 17, Week 18</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-dark-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Entrants</h3>
              <div className="space-y-3">
                {entrants.map((entrant) => (
                  <div key={entrant.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {entrant.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-white text-sm">{entrant.username}</span>
                    </div>
                    <button className={`px-3 py-1 rounded text-xs font-medium ${
                      entrant.following 
                        ? 'bg-primary-500 text-white' 
                        : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
                    }`}>
                      {entrant.following ? 'Follow' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-dark-700">
                <button className="w-full text-center text-primary-400 text-sm hover:text-primary-300">
                  Entrants
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}