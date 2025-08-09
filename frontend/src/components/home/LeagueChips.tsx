'use client'

interface LeagueChipsProps {
  selectedLeague: string
  onLeagueChange: (league: string) => void
}

const leagues = [
  { 
    id: 'NFL', 
    name: 'NFL', 
    icon: '🏈',
    color: 'bg-primary-500 text-white'
  },
  { 
    id: 'PGA', 
    name: 'PGA', 
    icon: '⛳',
    color: 'bg-surface-light text-gray-300'
  },
  { 
    id: 'MLB', 
    name: 'MLB', 
    icon: '⚾',
    color: 'bg-surface-light text-gray-300'
  },
  { 
    id: 'NCAAF', 
    name: 'NCAAF', 
    icon: '🏆',
    color: 'bg-surface-light text-gray-300'
  }
]

export default function LeagueChips({ selectedLeague, onLeagueChange }: LeagueChipsProps) {
  return (
    <div className="flex items-center space-x-4 mb-6">
      <h3 className="text-white font-semibold text-lg">League Lobbies</h3>
      <div className="flex space-x-2">
        {leagues.map((league) => (
          <button
            key={league.id}
            onClick={() => onLeagueChange(league.id)}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all duration-200
              ${selectedLeague === league.id 
                ? 'bg-primary-500 text-white shadow-lg' 
                : 'bg-surface-light text-gray-300 hover:bg-surface hover:text-white'
              }
            `}
          >
            <span className="text-sm">{league.icon}</span>
            <span>{league.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}