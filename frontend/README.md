# Games Raffle Frontend

A Next.js-based frontend for the NFL Games Raffle betting application with vendor prizes, replicating the SplashSports interface with a Green/Black/Gold theme.

## 🎯 **Features Implemented**

### **🏠 Home Page (SplashSports-style)**
- **Banner Carousel**: Rotating prize displays ($2.5M, BMW M3, Hawaii Vacation)
- **League Chips**: NFL, PGA, MLB, NCAAF selection
- **Filter Bar**: Game Type, Payout, Entry Fee filters with dropdowns
- **Contest Grid**: Cards showing vendor prizes (cars, vacations, electronics)
- **Prize Display**: First place prizes with vendor information
- **Progress Bars**: Entry filling indicators
- **Status Badges**: Active, Upcoming, Completed contests

### **🎮 Pick Board (Game Functionality)**
- **Week Tabs**: 1-18 NFL season navigation
- **Team Selection Grid**: 3-column matchup layout
- **Radio Button Interface**: Team selection with visual feedback
- **Team Cards**: NFL team colors, logos, and names
- **Pick Validation**: 
  - 1 pick weeks 1-11
  - 2 picks weeks 12-18
  - No repeat team selections
- **Lock Timer**: Countdown to picks deadline
- **Visual States**:
  - Selected (green border, filled radio)
  - Disabled (red overlay, "Already Picked")
  - Available (hover effects)

### **🎨 Design System**
- **Green/Black/Gold Theme**: Tailwind custom color palette
- **Component Library**: Reusable UI components
- **Responsive Design**: Mobile-first approach
- **Custom Animations**: Fade-in, slide-up, pulse effects
- **Team Branding**: NFL team colors and styling

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ and npm
- Backend API running on `localhost:3001`

### **Installation**
```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:3000`

### **Environment Configuration**
Create `.env.local`:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

## 📱 **Pages & Routes**

### **Main Pages**
- `/` - Home page with contest lobby
- `/contests/[id]/picks` - Pick selection board
- `/contests/[id]` - Contest details (planned)
- `/my-contests` - User dashboard (planned)
- `/login` - Authentication (planned)
- `/register` - User registration (planned)

## 🎯 **Game Flow Testing**

### **1. Contest Selection**
1. Visit home page
2. Browse contest cards with vendor prizes
3. See BMW M3, Hawaii vacation, Tesla contests
4. Click "Enter Contest" button

### **2. Making Picks** 
1. Navigate to `/contests/1/picks`
2. See NFL matchups in 3-column grid
3. Select teams using radio buttons
4. See team colors and names
5. Notice disabled teams (already picked)
6. Submit picks

### **3. Multi-Week Logic**
- Weeks 1-11: Select 1 team per week
- Weeks 12-18: Select 2 teams per week
- Previously selected teams become disabled
- Week tabs show pick requirements

## 🎨 **Component Architecture**

### **Layout Components**
- `Header.tsx` - Navigation with user balance
- `Footer.tsx` - Site footer (planned)

### **Home Page Components**
- `BannerCarousel.tsx` - Prize showcase slider
- `LeagueChips.tsx` - Sport selection tabs
- `FilterBar.tsx` - Contest filtering
- `ContestGrid.tsx` - Contest card display

### **Game Components**
- `PickBoard.tsx` - Main pick selection interface
- `TeamCard.tsx` - Individual team selection
- `MatchupCard.tsx` - Game matchup display

### **UI Components**
- Custom button styles (`btn-primary`, `btn-gold`)
- Card components (`card`, `contest-card`)
- Badge components (`badge-green`, `badge-gold`)
- Progress bars (`progress-bar`, `progress-fill`)

## 🎮 **Game Rules Implementation**

### **Survivor Rules**
- Pick one team to WIN each week (weeks 1-11)
- Pick two teams to WIN each week (weeks 12-18)
- Cannot pick the same team twice
- One wrong pick eliminates the entry
- Last player standing wins

### **Pick Validation**
- Visual feedback for selections
- Disabled state for used teams
- Lock timer prevents late picks
- Form validation before submission

## 🏆 **Prize System**

### **Vendor Integration**
- BMW Dealership: 2024 BMW M3 Competition ($85,000)
- Travel Company: Hawaii Vacation Package ($15,000)
- Tesla Store: Model Y Performance ($68,000)

### **Contest Types**
- Vehicle Giveaways
- Vacation Packages  
- Electronics Prizes
- Cash Alternatives

## 🎯 **Testing Scenarios**

### **Home Page Testing**
1. Contest filtering by entry fee
2. League selection (NFL focus)
3. Prize information display
4. Progress bar accuracy
5. Mobile responsiveness

### **Pick Board Testing**
1. Team selection functionality
2. Week navigation
3. Pick validation rules
4. Visual state changes
5. Timer countdown
6. Form submission

### **Edge Cases**
1. No available teams
2. All weeks completed
3. Late pick attempts
4. Network errors
5. Invalid selections

## 🔧 **Development Notes**

### **TypeScript Configuration**
- Update `lib` in `tsconfig.json` to `["es2016", "dom"]` for array methods
- Import React types for JSX support
- Configure path aliases for clean imports

### **API Integration**
- Connects to backend at `localhost:3001/api`
- Fetches NFL teams and matchups
- Submits picks and validates selections
- Handles authentication tokens

### **Next.js Features**
- App Router with layout system
- Dynamic routes for contests
- Server-side rendering
- Static optimization

## 🎨 **Styling Guide**

### **Color Palette**
```css
--primary-green: #22c55e
--gold: #eab308  
--dark: #1e293b
--surface: #1a1a1a
```

### **Typography**
- Inter font family
- Bold headings for contests
- Readable body text
- Prize value emphasis

This frontend provides a complete NFL Survivor game interface with vendor prize integration, ready for deployment and testing with the backend API.