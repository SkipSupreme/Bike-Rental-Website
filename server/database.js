const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const db = new Database(path.join(__dirname, 'joes_garage.db'));

function initialize() {
  // Users table (customers and admin)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      is_admin INTEGER DEFAULT 0,
      waiver_signed INTEGER DEFAULT 0,
      waiver_signature TEXT,
      waiver_signed_at TEXT,
      stripe_customer_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bikes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bikes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      hourly_rate REAL NOT NULL,
      half_day_rate REAL,
      full_day_rate REAL,
      image_url TEXT,
      is_available INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Rentals table
  db.exec(`
    CREATE TABLE IF NOT EXISTS rentals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      bike_id TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      actual_return_time TEXT,
      rental_type TEXT NOT NULL,
      base_amount REAL NOT NULL,
      additional_charges REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      charge_notes TEXT,
      status TEXT DEFAULT 'pending',
      payment_status TEXT DEFAULT 'pending',
      stripe_payment_intent_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (bike_id) REFERENCES bikes(id)
    )
  `);

  // Additional charges table (for stolen items, damages)
  db.exec(`
    CREATE TABLE IF NOT EXISTS additional_charges (
      id TEXT PRIMARY KEY,
      rental_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      charge_type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      FOREIGN KEY (rental_id) REFERENCES rentals(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Website content table (for CMS functionality)
  db.exec(`
    CREATE TABLE IF NOT EXISTS content (
      id TEXT PRIMARY KEY,
      section TEXT UNIQUE NOT NULL,
      title TEXT,
      body TEXT,
      image_url TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT
    )
  `);

  // Reviews table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      rental_id TEXT,
      rating INTEGER NOT NULL,
      comment TEXT,
      is_approved INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (rental_id) REFERENCES rentals(id)
    )
  `);

  // Site settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create admin user if not exists
  const adminExists = db.prepare('SELECT id FROM users WHERE is_admin = 1').get();
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (id, email, password, first_name, last_name, is_admin, waiver_signed)
      VALUES (?, ?, ?, ?, ?, 1, 1)
    `).run(uuidv4(), 'joe@joesgarage.ca', hashedPassword, 'Joe', 'Nunn');
    console.log('Admin user created: joe@joesgarage.ca / admin123');
  }

  // Insert default bikes if none exist
  const bikesExist = db.prepare('SELECT COUNT(*) as count FROM bikes').get();
  if (bikesExist.count === 0) {
    const defaultBikes = [
      { name: 'City Cruiser', type: 'adult', description: 'Perfect for casual rides along the Bow River pathway. Comfortable upright position.', hourly_rate: 15, half_day_rate: 40, full_day_rate: 60, image_url: '/bikes/cruiser.svg' },
      { name: 'Mountain Explorer', type: 'adult', description: 'Rugged mountain bike for trails and adventure. 21-speed gearing.', hourly_rate: 20, half_day_rate: 55, full_day_rate: 80, image_url: '/bikes/mountain.svg' },
      { name: 'Road Racer', type: 'adult', description: 'Lightweight road bike for speed enthusiasts. Drop handlebars, thin tires.', hourly_rate: 25, half_day_rate: 65, full_day_rate: 95, image_url: '/bikes/road.svg' },
      { name: 'Hybrid Commuter', type: 'adult', description: 'Versatile bike that handles city streets and light trails with ease.', hourly_rate: 18, half_day_rate: 48, full_day_rate: 70, image_url: '/bikes/hybrid.svg' },
      { name: 'Electric Assist', type: 'adult', description: 'Pedal-assist e-bike for effortless cruising. Great for longer rides.', hourly_rate: 35, half_day_rate: 90, full_day_rate: 130, image_url: '/bikes/electric.svg' },
      { name: 'Kids Adventure (20")', type: 'kids', description: 'Perfect for young riders ages 6-9. Safe and easy to handle.', hourly_rate: 10, half_day_rate: 25, full_day_rate: 40, image_url: '/bikes/kids.svg' },
      { name: 'Kids Explorer (24")', type: 'kids', description: 'For growing riders ages 9-12. Geared for more control.', hourly_rate: 12, half_day_rate: 30, full_day_rate: 45, image_url: '/bikes/kids-large.svg' },
      { name: 'Tandem Fun', type: 'tandem', description: 'Two-person tandem bike. Perfect for couples or parent-child riding.', hourly_rate: 30, half_day_rate: 75, full_day_rate: 110, image_url: '/bikes/tandem.svg' },
      { name: 'Child Trailer', type: 'trailer', description: 'Attach to any adult bike. Safe enclosed trailer for little ones.', hourly_rate: 12, half_day_rate: 30, full_day_rate: 45, image_url: '/bikes/trailer.svg' },
      { name: 'Cargo Trailer', type: 'trailer', description: 'Haul your gear, picnic supplies, or shopping with ease.', hourly_rate: 10, half_day_rate: 25, full_day_rate: 35, image_url: '/bikes/cargo.svg' },
    ];

    const insertBike = db.prepare(`
      INSERT INTO bikes (id, name, type, description, hourly_rate, half_day_rate, full_day_rate, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Add multiple of each type to simulate 20-30 bikes
    defaultBikes.forEach(bike => {
      const count = bike.type === 'adult' ? 4 : (bike.type === 'tandem' ? 2 : 3);
      for (let i = 1; i <= count; i++) {
        insertBike.run(
          uuidv4(),
          i > 1 ? `${bike.name} #${i}` : bike.name,
          bike.type,
          bike.description,
          bike.hourly_rate,
          bike.half_day_rate,
          bike.full_day_rate,
          bike.image_url
        );
      }
    });
    console.log('Default bikes created');
  }

  // Insert default content if none exists
  const contentExists = db.prepare('SELECT COUNT(*) as count FROM content').get();
  if (contentExists.count === 0) {
    const defaultContent = [
      {
        section: 'hero',
        title: "Joe's Garage",
        body: 'Bicycle Rental & Repair on the Bow River Pathway since 2007',
        image_url: '/hero-bg.jpg'
      },
      {
        section: 'about',
        title: 'About Joe\'s Garage',
        body: 'Located on the south bank of the Bow River, near the 10th Street LRT bridge, Joe\'s Garage has been serving Calgary cyclists since 2007. Joe Nunn has over 30 years of bike repair experience and is known for fixing parts instead of replacing them—making cycling more affordable and sustainable for everyone.\n\nAll rentals include a helmet and lock. We\'re open year-round, weather permitting!',
        image_url: '/about.jpg'
      },
      {
        section: 'location',
        title: 'Find Us',
        body: '355 8 St SW, Calgary, AB\nOn the Bow River Pathway, south bank near the 10th Street LRT bridge\n\nOpen Daily: 10:00 AM - 7:00 PM\nWeather Permitting',
        image_url: null
      },
      {
        section: 'contact',
        title: 'Contact Joe',
        body: 'Phone: (403) 874-5637\nEmail: joe@joesgarage.ca\n\nFor repairs, give Joe a call—he\'s always happy to chat about your bike!',
        image_url: null
      },
      {
        section: 'repairs',
        title: 'Bike Repairs',
        body: 'Joe is Calgary\'s most trusted bike mechanic! With over 30 years of experience, he\'s known for going above and beyond for every customer.\n\nFor repair appointments, please call Joe directly at (403) 874-5637. He\'ll get your bike rolling smoothly again!',
        image_url: '/repairs.jpg'
      },
      {
        section: 'waiver',
        title: 'Rental Agreement & Liability Waiver',
        body: 'By signing this waiver, I acknowledge and agree to the following:\n\n1. ASSUMPTION OF RISK: I understand that bicycling involves inherent risks including but not limited to falls, collisions, equipment failure, and injuries. I voluntarily assume all risks associated with renting and operating a bicycle from Joe\'s Garage.\n\n2. RELEASE OF LIABILITY: I release Joe\'s Garage, its owner, employees, and agents from any and all liability for injuries, damages, or losses that may occur during my rental period.\n\n3. EQUIPMENT RESPONSIBILITY: I agree to return the bicycle, helmet, and lock in the same condition as received. I understand I am financially responsible for any damage, loss, or theft of rented equipment.\n\n4. EQUIPMENT CHARGES: Lost or stolen helmet: $50. Lost or stolen lock: $40. Bicycle damage or theft: Up to full replacement value.\n\n5. SAFETY AGREEMENT: I agree to wear the provided helmet at all times while riding, obey all traffic laws, and operate the bicycle in a safe manner.\n\n6. PHYSICAL CONDITION: I confirm that I am physically capable of operating a bicycle and have no medical conditions that would make riding dangerous.\n\n7. AGE REQUIREMENT: I confirm that I am at least 18 years of age, or if renting for a minor, I am their parent/legal guardian and accept full responsibility.',
        image_url: null
      }
    ];

    const insertContent = db.prepare(`
      INSERT INTO content (id, section, title, body, image_url)
      VALUES (?, ?, ?, ?, ?)
    `);

    defaultContent.forEach(content => {
      insertContent.run(uuidv4(), content.section, content.title, content.body, content.image_url);
    });
    console.log('Default content created');
  }

  // Insert default settings
  const settingsExist = db.prepare('SELECT COUNT(*) as count FROM settings').get();
  if (settingsExist.count === 0) {
    const defaultSettings = [
      { key: 'helmet_charge', value: '50' },
      { key: 'lock_charge', value: '40' },
      { key: 'buffer_minutes', value: '20' },
      { key: 'business_hours_start', value: '10:00' },
      { key: 'business_hours_end', value: '19:00' },
    ];

    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    defaultSettings.forEach(s => insertSetting.run(s.key, s.value));
    console.log('Default settings created');
  }

  console.log('Database initialized successfully');
}

module.exports = { db, initialize };
