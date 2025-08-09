'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import PickBoard from '@/components/picks/PickBoard'
import { Team, Matchup, Week, Pick } from '@/types'

// Mock NFL teams data (2024-2025 season)
const mockTeams: Team[] = [
  // AFC East
  { id: '1', name: 'Bills', alias: 'BUF', market: 'Buffalo', fullName: 'Buffalo Bills', primaryColor: '#00338D', secondaryColor: '#C60C30', conference: 'AFC', division: 'East', sportRadarId: 'sr:team:4376' },
  { id: '2', name: 'Dolphins', alias: 'MIA', market: 'Miami', fullName: 'Miami Dolphins', primaryColor: '#008E97', secondaryColor: '#FC4C02', conference: 'AFC', division: 'East', sportRadarId: 'sr:team:4287' },
  { id: '3', name: 'Patriots', alias: 'NE', market: 'New England', fullName: 'New England Patriots', primaryColor: '#002244', secondaryColor: '#C60C30', conference: 'AFC', division: 'East', sportRadarId: 'sr:team:4424' },
  { id: '4', name: 'Jets', alias: 'NYJ', market: 'New York', fullName: 'New York Jets', primaryColor: '#125740', secondaryColor: '#000000', conference: 'AFC', division: 'East', sportRadarId: 'sr:team:4430' },
  
  // AFC North
  { id: '5', name: 'Ravens', alias: 'BAL', market: 'Baltimore', fullName: 'Baltimore Ravens', primaryColor: '#241773', secondaryColor: '#000000', conference: 'AFC', division: 'North', sportRadarId: 'sr:team:4372' },
  { id: '6', name: 'Bengals', alias: 'CIN', market: 'Cincinnati', fullName: 'Cincinnati Bengals', primaryColor: '#FB4F14', secondaryColor: '#000000', conference: 'AFC', division: 'North', sportRadarId: 'sr:team:4377' },
  { id: '7', name: 'Browns', alias: 'CLE', market: 'Cleveland', fullName: 'Cleveland Browns', primaryColor: '#311D00', secondaryColor: '#FF3C00', conference: 'AFC', division: 'North', sportRadarId: 'sr:team:4378' },
  { id: '8', name: 'Steelers', alias: 'PIT', market: 'Pittsburgh', fullName: 'Pittsburgh Steelers', primaryColor: '#FFB612', secondaryColor: '#101820', conference: 'AFC', division: 'North', sportRadarId: 'sr:team:4345' },
  
  // AFC South
  { id: '9', name: 'Texans', alias: 'HOU', market: 'Houston', fullName: 'Houston Texans', primaryColor: '#03202F', secondaryColor: '#A71930', conference: 'AFC', division: 'South', sportRadarId: 'sr:team:4324' },
  { id: '10', name: 'Colts', alias: 'IND', market: 'Indianapolis', fullName: 'Indianapolis Colts', primaryColor: '#002C5F', secondaryColor: '#A2AAAD', conference: 'AFC', division: 'South', sportRadarId: 'sr:team:4421' },
  { id: '11', name: 'Jaguars', alias: 'JAX', market: 'Jacksonville', fullName: 'Jacksonville Jaguars', primaryColor: '#101820', secondaryColor: '#D7A22A', conference: 'AFC', division: 'South', sportRadarId: 'sr:team:4386' },
  { id: '12', name: 'Titans', alias: 'TEN', market: 'Tennessee', fullName: 'Tennessee Titans', primaryColor: '#0C2340', secondaryColor: '#4B92DB', conference: 'AFC', division: 'South', sportRadarId: 'sr:team:4425' },
  
  // AFC West
  { id: '13', name: 'Broncos', alias: 'DEN', market: 'Denver', fullName: 'Denver Broncos', primaryColor: '#FB4F14', secondaryColor: '#002244', conference: 'AFC', division: 'West', sportRadarId: 'sr:team:4380' },
  { id: '14', name: 'Chiefs', alias: 'KC', market: 'Kansas City', fullName: 'Kansas City Chiefs', primaryColor: '#E31837', secondaryColor: '#FFB81C', conference: 'AFC', division: 'West', sportRadarId: 'sr:team:4381' },
  { id: '15', name: 'Raiders', alias: 'LV', market: 'Las Vegas', fullName: 'Las Vegas Raiders', primaryColor: '#000000', secondaryColor: '#A5ACAF', conference: 'AFC', division: 'West', sportRadarId: 'sr:team:4285' },
  { id: '16', name: 'Chargers', alias: 'LAC', market: 'Los Angeles', fullName: 'Los Angeles Chargers', primaryColor: '#0080C6', secondaryColor: '#FFC20E', conference: 'AFC', division: 'West', sportRadarId: 'sr:team:4429' },
  
  // NFC East
  { id: '17', name: 'Cowboys', alias: 'DAL', market: 'Dallas', fullName: 'Dallas Cowboys', primaryColor: '#041E42', secondaryColor: '#869397', conference: 'NFC', division: 'East', sportRadarId: 'sr:team:4391' },
  { id: '18', name: 'Giants', alias: 'NYG', market: 'New York', fullName: 'New York Giants', primaryColor: '#0B2265', secondaryColor: '#A71930', conference: 'NFC', division: 'East', sportRadarId: 'sr:team:4426' },
  { id: '19', name: 'Eagles', alias: 'PHI', market: 'Philadelphia', fullName: 'Philadelphia Eagles', primaryColor: '#004C54', secondaryColor: '#A5ACAF', conference: 'NFC', division: 'East', sportRadarId: 'sr:team:4428' },
  { id: '20', name: 'Commanders', alias: 'WAS', market: 'Washington', fullName: 'Washington Commanders', primaryColor: '#5A1414', secondaryColor: '#FFB612', conference: 'NFC', division: 'East', sportRadarId: 'sr:team:4432' },
  
  // NFC North
  { id: '21', name: 'Bears', alias: 'CHI', market: 'Chicago', fullName: 'Chicago Bears', primaryColor: '#0B162A', secondaryColor: '#C83803', conference: 'NFC', division: 'North', sportRadarId: 'sr:team:4388' },
  { id: '22', name: 'Lions', alias: 'DET', market: 'Detroit', fullName: 'Detroit Lions', primaryColor: '#0076B6', secondaryColor: '#B0B7BC', conference: 'NFC', division: 'North', sportRadarId: 'sr:team:4391' },
  { id: '23', name: 'Packers', alias: 'GB', market: 'Green Bay', fullName: 'Green Bay Packers', primaryColor: '#203731', secondaryColor: '#FFB612', conference: 'NFC', division: 'North', sportRadarId: 'sr:team:4419' },
  { id: '24', name: 'Vikings', alias: 'MIN', market: 'Minnesota', fullName: 'Minnesota Vikings', primaryColor: '#4F2683', secondaryColor: '#FFC62F', conference: 'NFC', division: 'North', sportRadarId: 'sr:team:4423' },
  
  // NFC South
  { id: '25', name: 'Falcons', alias: 'ATL', market: 'Atlanta', fullName: 'Atlanta Falcons', primaryColor: '#A71930', secondaryColor: '#000000', conference: 'NFC', division: 'South', sportRadarId: 'sr:team:4361' },
  { id: '26', name: 'Panthers', alias: 'CAR', market: 'Carolina', fullName: 'Carolina Panthers', primaryColor: '#0085CA', secondaryColor: '#101820', conference: 'NFC', division: 'South', sportRadarId: 'sr:team:4385' },
  { id: '27', name: 'Saints', alias: 'NO', market: 'New Orleans', fullName: 'New Orleans Saints', primaryColor: '#101820', secondaryColor: '#D3BC8D', conference: 'NFC', division: 'South', sportRadarId: 'sr:team:4425' },
  { id: '28', name: 'Buccaneers', alias: 'TB', market: 'Tampa Bay', fullName: 'Tampa Bay Buccaneers', primaryColor: '#D50A0A', secondaryColor: '#FF7900', conference: 'NFC', division: 'South', sportRadarId: 'sr:team:4418' },
  
  // NFC West
  { id: '29', name: 'Cardinals', alias: 'ARI', market: 'Arizona', fullName: 'Arizona Cardinals', primaryColor: '#97233F', secondaryColor: '#000000', conference: 'NFC', division: 'West', sportRadarId: 'sr:team:4387' },
  { id: '30', name: 'Rams', alias: 'LAR', market: 'Los Angeles', fullName: 'Los Angeles Rams', primaryColor: '#003594', secondaryColor: '#FFA300', conference: 'NFC', division: 'West', sportRadarId: 'sr:team:4387' },
  { id: '31', name: '49ers', alias: 'SF', market: 'San Francisco', fullName: 'San Francisco 49ers', primaryColor: '#AA0000', secondaryColor: '#B3995D', conference: 'NFC', division: 'West', sportRadarId: 'sr:team:4398' },
  { id: '32', name: 'Seahawks', alias: 'SEA', market: 'Seattle', fullName: 'Seattle Seahawks', primaryColor: '#002244', secondaryColor: '#69BE28', conference: 'NFC', division: 'West', sportRadarId: 'sr:team:4400' }
]

// Mock Week 1 matchups for testing
const mockMatchups: Matchup[] = [
  {
    id: '1',
    weekId: '1',
    week: { id: '1', number: 1, season: 2024, lockTime: '2024-09-08T17:00:00Z', isActive: true, isCompleted: false, matchups: [] },
    teamA: mockTeams.find(t => t.alias === 'DAL')!,
    teamB: mockTeams.find(t => t.alias === 'PHI')!,
    teamAId: '17',
    teamBId: '19',
    startTime: '2024-09-08T20:20:00Z',
    status: 'scheduled',
    isCompleted: false
  },
  {
    id: '2',
    weekId: '1',
    week: { id: '1', number: 1, season: 2024, lockTime: '2024-09-08T17:00:00Z', isActive: true, isCompleted: false, matchups: [] },
    teamA: mockTeams.find(t => t.alias === 'PIT')!,
    teamB: mockTeams.find(t => t.alias === 'NYJ')!,
    teamAId: '8',
    teamBId: '4',
    startTime: '2024-09-08T17:00:00Z',
    status: 'scheduled',
    isCompleted: false
  },
  {
    id: '3',
    weekId: '1',
    week: { id: '1', number: 1, season: 2024, lockTime: '2024-09-08T17:00:00Z', isActive: true, isCompleted: false, matchups: [] },
    teamA: mockTeams.find(t => t.alias === 'KC')!,
    teamB: mockTeams.find(t => t.alias === 'LAC')!,
    teamAId: '14',
    teamBId: '16',
    startTime: '2024-09-08T17:00:00Z',
    status: 'scheduled',
    isCompleted: false
  },
  {
    id: '4',
    weekId: '1',
    week: { id: '1', number: 1, season: 2024, lockTime: '2024-09-08T17:00:00Z', isActive: true, isCompleted: false, matchups: [] },
    teamA: mockTeams.find(t => t.alias === 'MIA')!,
    teamB: mockTeams.find(t => t.alias === 'BUF')!,
    teamAId: '2',
    teamBId: '1',
    startTime: '2024-09-08T17:00:00Z',
    status: 'scheduled',
    isCompleted: false
  },
  {
    id: '5',
    weekId: '1',
    week: { id: '1', number: 1, season: 2024, lockTime: '2024-09-08T17:00:00Z', isActive: true, isCompleted: false, matchups: [] },
    teamA: mockTeams.find(t => t.alias === 'CIN')!,
    teamB: mockTeams.find(t => t.alias === 'BAL')!,
    teamAId: '6',
    teamBId: '5',
    startTime: '2024-09-08T17:00:00Z',
    status: 'scheduled',
    isCompleted: false
  }
]

interface ContestPicksPageProps {
  params: { id: string }
}

export default function ContestPicksPage({ params }: ContestPicksPageProps) {
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [lockedWeeks, setLockedWeeks] = useState<number[]>([])
  const [currentWeek, setCurrentWeek] = useState(1)
  const contestId = params.id

  // Mock current picks - in real app, fetch from API
  const [existingPicks, setExistingPicks] = useState<Pick[]>([])

  const handleTeamSelect = (teamId: string, weekNumber: number) => {
    if (lockedWeeks.includes(weekNumber)) return

    const maxPicksForWeek = weekNumber >= 12 ? 2 : 1
    const currentWeekPicks = selectedTeams.filter(id => 
      mockMatchups.some(m => 
        m.week.number === weekNumber && (m.teamAId === id || m.teamBId === id)
      )
    )

    if (currentWeekPicks.length < maxPicksForWeek) {
      if (!selectedTeams.includes(teamId)) {
        setSelectedTeams(prev => [...prev, teamId])
      }
    } else if (selectedTeams.includes(teamId)) {
      // Remove if already selected
      setSelectedTeams(prev => prev.filter(id => id !== teamId))
    }
  }

  const handleSubmitPicks = async () => {
    // TODO: Submit picks to API
    console.log('Submitting picks:', selectedTeams)
    // Show success message
    // Navigate back or update UI
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Contest Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Make Your Picks</h1>
              <p className="text-gray-400">Select your team for Week {currentWeek}</p>
            </div>
            <div className="text-right">
              <div className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg border border-red-500/30">
                <p className="text-sm font-semibold">Picks lock in</p>
                <p className="text-lg font-bold">2h 45m</p>
              </div>
            </div>
          </div>
          
          {/* Warning Banner */}
          <div className="bg-gold-500/20 border border-gold-500/30 rounded-lg p-4 mb-6">
            <p className="text-gold-400 font-semibold text-center">
              🚨 Pick one team to WIN. Mon 8:20 PM • Make your picks
            </p>
          </div>
        </div>

        {/* Pick Board */}
        <PickBoard
          matchups={mockMatchups}
          selectedTeams={selectedTeams}
          onTeamSelect={handleTeamSelect}
          currentWeek={currentWeek}
          lockedWeeks={lockedWeeks}
          existingPicks={existingPicks}
        />

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <button className="btn-secondary">
            Preview Picks
          </button>
          <button 
            onClick={handleSubmitPicks}
            className="btn-primary"
            disabled={selectedTeams.length === 0}
          >
            Submit Picks
          </button>
        </div>
      </main>
    </div>
  )
}