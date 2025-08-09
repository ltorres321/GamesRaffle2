// Next.js API route for current week games
const mockCurrentWeekGames = [
  {
    id: '1',
    weekNumber: 1,
    season: 2024,
    teamA: { id: '17', name: 'Cowboys', alias: 'DAL', market: 'Dallas', primaryColor: '#041E42', secondaryColor: '#869397' },
    teamB: { id: '19', name: 'Eagles', alias: 'PHI', market: 'Philadelphia', primaryColor: '#004C54', secondaryColor: '#A5ACAF' },
    startTime: '2024-09-08T20:20:00Z',
    status: 'scheduled'
  },
  {
    id: '2',
    weekNumber: 1,
    season: 2024,
    teamA: { id: '8', name: 'Steelers', alias: 'PIT', market: 'Pittsburgh', primaryColor: '#FFB612', secondaryColor: '#101820' },
    teamB: { id: '4', name: 'Jets', alias: 'NYJ', market: 'New York', primaryColor: '#125740', secondaryColor: '#000000' },
    startTime: '2024-09-08T17:00:00Z',
    status: 'scheduled'
  },
  {
    id: '3',
    weekNumber: 1,
    season: 2024,
    teamA: { id: '14', name: 'Chiefs', alias: 'KC', market: 'Kansas City', primaryColor: '#E31837', secondaryColor: '#FFB81C' },
    teamB: { id: '16', name: 'Chargers', alias: 'LAC', market: 'Los Angeles', primaryColor: '#0080C6', secondaryColor: '#FFC20E' },
    startTime: '2024-09-08T17:00:00Z',
    status: 'scheduled'
  },
  {
    id: '4',
    weekNumber: 1,
    season: 2024,
    teamA: { id: '2', name: 'Dolphins', alias: 'MIA', market: 'Miami', primaryColor: '#008E97', secondaryColor: '#FC4C02' },
    teamB: { id: '1', name: 'Bills', alias: 'BUF', market: 'Buffalo', primaryColor: '#00338D', secondaryColor: '#C60C30' },
    startTime: '2024-09-08T17:00:00Z',
    status: 'scheduled'
  },
  {
    id: '5',
    weekNumber: 1,
    season: 2024,
    teamA: { id: '6', name: 'Bengals', alias: 'CIN', market: 'Cincinnati', primaryColor: '#FB4F14', secondaryColor: '#000000' },
    teamB: { id: '5', name: 'Ravens', alias: 'BAL', market: 'Baltimore', primaryColor: '#241773', secondaryColor: '#000000' },
    startTime: '2024-09-08T17:00:00Z',
    status: 'scheduled'
  }
];

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      res.status(200).json({
        success: true,
        data: {
          week: 1,
          season: 2024,
          games: mockCurrentWeekGames
        },
        message: 'Current week games retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve current week games',
        error: error.message
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed`
    });
  }
}