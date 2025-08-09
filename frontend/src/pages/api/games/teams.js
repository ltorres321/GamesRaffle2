// Next.js API route for NFL teams
const mockTeams = [
  // AFC East
  { id: '1', name: 'Bills', alias: 'BUF', market: 'Buffalo', fullName: 'Buffalo Bills', primaryColor: '#00338D', secondaryColor: '#C60C30', conference: 'AFC', division: 'East' },
  { id: '2', name: 'Dolphins', alias: 'MIA', market: 'Miami', fullName: 'Miami Dolphins', primaryColor: '#008E97', secondaryColor: '#FC4C02', conference: 'AFC', division: 'East' },
  { id: '3', name: 'Patriots', alias: 'NE', market: 'New England', fullName: 'New England Patriots', primaryColor: '#002244', secondaryColor: '#C60C30', conference: 'AFC', division: 'East' },
  { id: '4', name: 'Jets', alias: 'NYJ', market: 'New York', fullName: 'New York Jets', primaryColor: '#125740', secondaryColor: '#000000', conference: 'AFC', division: 'East' },
  
  // AFC North
  { id: '5', name: 'Ravens', alias: 'BAL', market: 'Baltimore', fullName: 'Baltimore Ravens', primaryColor: '#241773', secondaryColor: '#000000', conference: 'AFC', division: 'North' },
  { id: '6', name: 'Bengals', alias: 'CIN', market: 'Cincinnati', fullName: 'Cincinnati Bengals', primaryColor: '#FB4F14', secondaryColor: '#000000', conference: 'AFC', division: 'North' },
  { id: '7', name: 'Browns', alias: 'CLE', market: 'Cleveland', fullName: 'Cleveland Browns', primaryColor: '#311D00', secondaryColor: '#FF3C00', conference: 'AFC', division: 'North' },
  { id: '8', name: 'Steelers', alias: 'PIT', market: 'Pittsburgh', fullName: 'Pittsburgh Steelers', primaryColor: '#FFB612', secondaryColor: '#101820', conference: 'AFC', division: 'North' },
  
  // AFC South
  { id: '9', name: 'Texans', alias: 'HOU', market: 'Houston', fullName: 'Houston Texans', primaryColor: '#03202F', secondaryColor: '#A71930', conference: 'AFC', division: 'South' },
  { id: '10', name: 'Colts', alias: 'IND', market: 'Indianapolis', fullName: 'Indianapolis Colts', primaryColor: '#002C5F', secondaryColor: '#A2AAAD', conference: 'AFC', division: 'South' },
  { id: '11', name: 'Jaguars', alias: 'JAX', market: 'Jacksonville', fullName: 'Jacksonville Jaguars', primaryColor: '#101820', secondaryColor: '#D7A22A', conference: 'AFC', division: 'South' },
  { id: '12', name: 'Titans', alias: 'TEN', market: 'Tennessee', fullName: 'Tennessee Titans', primaryColor: '#0C2340', secondaryColor: '#4B92DB', conference: 'AFC', division: 'South' },
  
  // AFC West
  { id: '13', name: 'Broncos', alias: 'DEN', market: 'Denver', fullName: 'Denver Broncos', primaryColor: '#FB4F14', secondaryColor: '#002244', conference: 'AFC', division: 'West' },
  { id: '14', name: 'Chiefs', alias: 'KC', market: 'Kansas City', fullName: 'Kansas City Chiefs', primaryColor: '#E31837', secondaryColor: '#FFB81C', conference: 'AFC', division: 'West' },
  { id: '15', name: 'Raiders', alias: 'LV', market: 'Las Vegas', fullName: 'Las Vegas Raiders', primaryColor: '#000000', secondaryColor: '#A5ACAF', conference: 'AFC', division: 'West' },
  { id: '16', name: 'Chargers', alias: 'LAC', market: 'Los Angeles', fullName: 'Los Angeles Chargers', primaryColor: '#0080C6', secondaryColor: '#FFC20E', conference: 'AFC', division: 'West' },
  
  // NFC East
  { id: '17', name: 'Cowboys', alias: 'DAL', market: 'Dallas', fullName: 'Dallas Cowboys', primaryColor: '#041E42', secondaryColor: '#869397', conference: 'NFC', division: 'East' },
  { id: '18', name: 'Giants', alias: 'NYG', market: 'New York', fullName: 'New York Giants', primaryColor: '#0B2265', secondaryColor: '#A71930', conference: 'NFC', division: 'East' },
  { id: '19', name: 'Eagles', alias: 'PHI', market: 'Philadelphia', fullName: 'Philadelphia Eagles', primaryColor: '#004C54', secondaryColor: '#A5ACAF', conference: 'NFC', division: 'East' },
  { id: '20', name: 'Commanders', alias: 'WAS', market: 'Washington', fullName: 'Washington Commanders', primaryColor: '#5A1414', secondaryColor: '#FFB612', conference: 'NFC', division: 'East' },
  
  // NFC North
  { id: '21', name: 'Bears', alias: 'CHI', market: 'Chicago', fullName: 'Chicago Bears', primaryColor: '#0B162A', secondaryColor: '#C83803', conference: 'NFC', division: 'North' },
  { id: '22', name: 'Lions', alias: 'DET', market: 'Detroit', fullName: 'Detroit Lions', primaryColor: '#0076B6', secondaryColor: '#B0B7BC', conference: 'NFC', division: 'North' },
  { id: '23', name: 'Packers', alias: 'GB', market: 'Green Bay', fullName: 'Green Bay Packers', primaryColor: '#203731', secondaryColor: '#FFB612', conference: 'NFC', division: 'North' },
  { id: '24', name: 'Vikings', alias: 'MIN', market: 'Minnesota', fullName: 'Minnesota Vikings', primaryColor: '#4F2683', secondaryColor: '#FFC62F', conference: 'NFC', division: 'North' },
  
  // NFC South
  { id: '25', name: 'Falcons', alias: 'ATL', market: 'Atlanta', fullName: 'Atlanta Falcons', primaryColor: '#A71930', secondaryColor: '#000000', conference: 'NFC', division: 'South' },
  { id: '26', name: 'Panthers', alias: 'CAR', market: 'Carolina', fullName: 'Carolina Panthers', primaryColor: '#0085CA', secondaryColor: '#101820', conference: 'NFC', division: 'South' },
  { id: '27', name: 'Saints', alias: 'NO', market: 'New Orleans', fullName: 'New Orleans Saints', primaryColor: '#101820', secondaryColor: '#D3BC8D', conference: 'NFC', division: 'South' },
  { id: '28', name: 'Buccaneers', alias: 'TB', market: 'Tampa Bay', fullName: 'Tampa Bay Buccaneers', primaryColor: '#D50A0A', secondaryColor: '#FF7900', conference: 'NFC', division: 'South' },
  
  // NFC West
  { id: '29', name: 'Cardinals', alias: 'ARI', market: 'Arizona', fullName: 'Arizona Cardinals', primaryColor: '#97233F', secondaryColor: '#000000', conference: 'NFC', division: 'West' },
  { id: '30', name: 'Rams', alias: 'LAR', market: 'Los Angeles', fullName: 'Los Angeles Rams', primaryColor: '#003594', secondaryColor: '#FFA300', conference: 'NFC', division: 'West' },
  { id: '31', name: '49ers', alias: 'SF', market: 'San Francisco', fullName: 'San Francisco 49ers', primaryColor: '#AA0000', secondaryColor: '#B3995D', conference: 'NFC', division: 'West' },
  { id: '32', name: 'Seahawks', alias: 'SEA', market: 'Seattle', fullName: 'Seattle Seahawks', primaryColor: '#002244', secondaryColor: '#69BE28', conference: 'NFC', division: 'West' }
];

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      res.status(200).json({
        success: true,
        data: mockTeams,
        message: 'NFL teams retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve teams',
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