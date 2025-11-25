# Joe's Garage - Bike Rental Website

A modern, mobile-first bike rental website built for Joe's Garage in Calgary. This system allows customers to browse bikes, sign waivers, pay online, and book rentals - all without paperwork!

## Features

### For Customers
- **Browse Bikes** - View available bikes with pricing (hourly, half-day, full-day)
- **Online Booking** - Select date, time, and bike with real-time availability
- **Digital Waiver** - Sign the liability waiver with touch/mouse signature
- **Secure Payments** - Pay with credit card via Stripe
- **Account Management** - View rental history and profile

### For Joe (Admin)
- **Dashboard** - Overview of today's rentals, revenue, and upcoming bookings
- **Rental Management** - Update rental status, add charges for damages/lost items, give discounts
- **Bike Management** - Add, edit, or remove bikes from inventory
- **Customer Profiles** - View customer details, rental history, and signed waivers
- **Website CMS** - Edit all website text and images without coding
- **Review Moderation** - Approve customer reviews before they appear

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: SQLite (better-sqlite3)
- **Payments**: Stripe
- **Auth**: Session-based with bcrypt password hashing

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd Bike-Rental-Website
npm run setup
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```
PORT=3001
SESSION_SECRET=your-secret-key-here
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

3. **Start development servers:**
```bash
npm run dev
```

This starts both the backend (port 3001) and frontend (port 5173).

4. **Access the site:**
- Website: http://localhost:5173
- Admin: Login with `joe@joesgarage.ca` / `admin123`

## Project Structure

```
├── server/                 # Backend API
│   ├── index.js           # Express server setup
│   ├── database.js        # SQLite setup & seeding
│   └── routes/            # API endpoints
│       ├── auth.js        # Authentication
│       ├── bikes.js       # Bike management
│       ├── rentals.js     # Rental operations
│       ├── customers.js   # Customer data
│       ├── content.js     # CMS content
│       ├── payments.js    # Stripe integration
│       ├── waiver.js      # Digital waivers
│       └── reviews.js     # Customer reviews
│
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # Auth context
│   │   └── pages/         # Page components
│   │       ├── admin/     # Admin dashboard pages
│   │       └── ...        # Customer-facing pages
│   └── ...
│
├── .env.example           # Environment template
└── package.json           # Root package.json
```

## Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Add them to your `.env` file:
   - `STRIPE_SECRET_KEY` - From Stripe Dashboard > Developers > API Keys
   - `STRIPE_PUBLISHABLE_KEY` - The publishable key
   - `STRIPE_WEBHOOK_SECRET` - Optional, for webhook verification

### Test Card Numbers
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Use any future expiry date and any 3-digit CVC

## Admin Features

### Managing Rentals
1. View all rentals from the Rentals page
2. Filter by status or date
3. Click "Start Rental" when customer picks up bike
4. Click "Complete" when bike is returned
5. Add charges for damages/lost items
6. Give discounts for weather issues, etc.

### Managing Bikes
1. Add new bikes with name, type, pricing
2. Mark bikes as unavailable for maintenance
3. Delete bikes (only if no active rentals)

### Editing Website Content
1. Go to Admin > Website Content
2. Select section to edit (Hero, About, Contact, etc.)
3. Update title and content
4. Upload images if needed
5. Click Save - changes appear immediately

### Customer Waivers
- View signed waivers from Customer page
- Click "View" next to waiver status
- Signature opens in new window for printing/saving

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
```
NODE_ENV=production
PORT=3001
SESSION_SECRET=<strong-random-string>
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

## Business Logic

### Rental Buffer
- 20-minute buffer between rentals (configurable)
- Allows time for bike return, inspection, and prep

### Pricing Types
- **Hourly**: Per-hour rate × hours selected
- **Half Day**: 4-hour block, fixed rate
- **Full Day**: 8-hour block, fixed rate

### Included with Rentals
- Helmet (required)
- Lock
- Trail map
- Basic bike adjustment

### Additional Charges
- Lost helmet: $50 (configurable)
- Lost lock: $40 (configurable)
- Bike damage: Variable
- Late return: Variable

## Support

For technical issues, contact your developer.

For business questions:
- Joe's Garage
- 355 8 St SW, Calgary, AB
- Phone: (403) 874-5637
- Open Daily: 10 AM - 7 PM

---

Built with care for Joe's Garage - keeping Calgary rolling since 2007!
