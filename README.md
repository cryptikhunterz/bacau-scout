# Bacau Scout

A football scouting tool for FC Bacau with instant player search and scout evaluation system.

## Features

- **Instant Player Search** - Search 94+ players from Transfermarkt data with <100ms response
- **Player Profiles** - Detailed player information including stats, market value, and career history
- **Scout Grading System** - Evaluate players with ratings, recommendations, and notes
- **Grades Dashboard** - View all graded players with filters and sorting

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Data**: Local JSON + localStorage for grades

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scout Grading

The grading system allows scouts to evaluate players with:

- **Status**: FM (First Team), U23, LOAN, WATCH
- **Recommendation**: Sign, Monitor, Discard
- **Player Category**: 1-8 scale (Liga 1a to Europa top player)
- **Ability Ratings**: Current ability and potential (1.0-5.0)
- **Skill Ratings**: Technical, Tactical, Physical, Mental (1-5 stars)
- **Notes**: Free-form observations
- **Optional**: Transfer fee and salary estimates

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Grades dashboard
│   ├── player/[id]/      # Player detail page
│   └── api/              # Search and player APIs
├── components/
│   ├── SearchBar.tsx     # Player search with results
│   ├── GradingForm.tsx   # Scout evaluation form
│   ├── GradesTable.tsx   # Sortable grades table
│   ├── GradesFilters.tsx # Filter controls
│   └── ...
├── lib/
│   ├── grades.ts         # Grade CRUD with localStorage
│   └── players.ts        # Player data utilities
└── types/
    └── player.ts         # TypeScript interfaces
```

## License

MIT
