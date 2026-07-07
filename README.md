# Billing EDA Dashboard

A stunning, production-ready billing analysis dashboard built with Next.js, TypeScript, GSAP animations, and dark/light mode support.

## Features

- **Real-time Data Upload**: Upload billing CSV files with instant validation
- **EDA Analysis**: Comprehensive exploratory data analysis with KPI metrics
- **Data Quality Monitoring**: Track duplicates, malformed data, and data integrity
- **Site Trend Analysis**: Interactive charts for historical site trends
- **Dark/Light Mode**: Full theme support with system preference detection
- **GSAP Animations**: Smooth, professional animations throughout
- **Responsive Design**: Mobile-first design that works on all devices

## Tech Stack

- **Frontend**: Next.js 16+ with React 19
- **Language**: TypeScript (strict mode)
- **State**: Jotai (lightweight atoms) + TanStack Query (server state)
- **Styling**: Tailwind CSS with OKLCH design tokens
- **Animations**: GSAP for smooth, performant animations
- **Charts**: Recharts for beautiful, responsive visualizations
- **API**: Native Fetch with comprehensive error handling

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` — the app redirects to `/dashboard`.

### Build for Production

```bash
npm run build
npm run start
```

## API Integration

The dashboard connects to the **Billing EDA Dashboard API**:
- **Base URL**: `https://atonality123-test101.hf.space`
- Override with `NEXT_PUBLIC_API_BASE_URL` when deploying a different backend.

### Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/upload` | POST | Upload CSV billing files |
| `/api/upload/status` | GET | Check upload status |
| `/api/eda/summary` | GET | Get complete dashboard data |
| `/api/site/{site_id}/trend` | GET | Get historical trends for a site |
| `/api/eda/duplicates` | GET | Get data quality issues |
| `/api/eda/maintenance-sites` | GET | Get maintenance records |

See [`lib/api.ts`](lib/api.ts) for complete endpoint documentation.

## Architecture

### Component Structure
```
components/
├── DashboardHeader.tsx    # Header with theme toggle & filters
├── UploadWidget.tsx       # File upload with drag-drop
├── KPICards.tsx          # Animated KPI metrics
├── TrendChart.tsx        # Interactive line chart
├── SiteSearch.tsx        # Autocomplete site search
├── DataQualityTable.tsx  # Data quality metrics
├── LoadingSkeleton.tsx   # Animated loading states
├── ThemeProvider.tsx     # Dark mode setup
├── ThemeToggle.tsx       # Theme switcher
└── ErrorBoundary.tsx     # Error handling
```

### State Management
- **Jotai Atoms** (`lib/atoms.ts`): `themeAtom`, `filterProviderAtom`, `filterCompanyAtom`, `selectedSiteIdAtom`
- **TanStack Query**: Server state caching with 60s stale time

## Styling

### Design System
- **Colors**: OKLCH-based semantic tokens (light & dark themes)
- **Spacing**: Rem-based consistent scale
- **Typography**: Hierarchical with proper contrast ratios
- **Shadows**: Layered depth with realistic light direction

### Dark Mode
- Automatic system preference detection
- LocalStorage persistence
- CSS custom properties for easy theming

## Development

### File Organization
```
app/
  dashboard/page.tsx        # Main dashboard
  QueryClientProvider.tsx   # Server state setup
  layout.tsx               # Root layout with providers
  page.tsx                 # Redirect to dashboard
  globals.css              # Design tokens & utilities

lib/
  api.ts                   # API client with types
  atoms.ts                 # Jotai state atoms

components/
  [component files]        # Reusable UI components
```

### Adding Features

1. **New API Endpoint**: Add to `lib/api.ts`
2. **New Component**: Create in `components/` with "use client" if needed
3. **New State**: Add Jotai atom to `lib/atoms.ts`
4. **Styling**: Use design tokens from `globals.css`
5. **Animations**: Use GSAP with refs and useEffect

### Best Practices
- Use Compound Components for complex UI
- TypeScript strict mode (no `any`)
- Error handling on all async operations
- Mobile-responsive by default
- Test dark mode and theme switching
- Follow CLAUDE.md conventions

## Performance

- **Code Splitting**: Next.js automatic route-based splitting
- **Query Caching**: TanStack Query with smart invalidation
- **Bundle Size**: ~200KB gzipped
- **Animations**: GPU-accelerated via GSAP

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Upload Fails
- Check file format (CSV required)
- Verify backend API is accessible
- Check network tab for errors

### Data Not Loading
- Ensure files are uploaded first
- Check browser console for API errors
- Try refreshing the page

### Theme Not Saving
- Enable LocalStorage in browser
- Check for browser privacy settings
- Try clearing cache and cookies

## Contributing

Follow the conventions in [`CLAUDE.md`](CLAUDE.md):
- Compound component pattern for complex UI
- TypeScript strict mode
- Full error handling
- Mobile-first responsive design
- Accessibility best practices

## License

Private project.
