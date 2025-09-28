const Stripe = require('stripe');
const { Client } = require('pg');

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Database connection
const client = new Client({
  connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'
});

const packages = [
  {
    package_key: '5er',
    name: '5er Paket',
    description: 'Perfekt für den Einstieg - 5 Klausuren mit persönlichem Videofeedback von Fach-Dozenten der Akademie Kraatz',
    case_study_count: 5,
    price_cents: 67500, // €675
    features: [
      '5 ausgewählte Sachverhalte',
      'Persönliches Videofeedback innerhalb von 48 Stunden',
      'Alle Rechtsgebiete verfügbar',
      'Problemschwerpunkte können vorab mitgeteilt werden'
    ]
  },
  {
    package_key: '10er',
    name: '10er Paket',
    description: 'Ideal für regelmäßiges Üben - 10 Klausuren mit persönlichem Videofeedback von Fach-Dozenten der Akademie Kraatz',
    case_study_count: 10,
    price_cents: 125000, // €1250
    features: [
      '10 ausgewählte Sachverhalte',
      'Persönliches Videofeedback innerhalb von 48 Stunden',
      'Alle Rechtsgebiete verfügbar',
      'Problemschwerpunkte können vorab mitgeteilt werden',
      'Beliebteste Wahl - Bestes Preis-Leistungs-Verhältnis'
    ]
  },
  {
    package_key: '15er',
    name: '15er Paket',
    description: 'Für intensive Vorbereitung - 15 Klausuren mit persönlichem Videofeedback von Fach-Dozenten der Akademie Kraatz',
    case_study_count: 15,
    price_cents: 180000, // €1800
    features: [
      '15 ausgewählte Sachverhalte',
      'Persönliches Videofeedback innerhalb von 48 Stunden',
      'Alle Rechtsgebiete verfügbar',
      'Problemschwerpunkte können vorab mitgeteilt werden'
    ]
  },
  {
    package_key: '20er',
    name: '20er Paket',
    description: 'Umfassende Klausurvorbereitung - 20 Klausuren mit persönlichem Videofeedback von Fach-Dozenten der Akademie Kraatz',
    case_study_count: 20,
    price_cents: 236000, // €2360
    features: [
      '20 ausgewählte Sachverhalte',
      'Persönliches Videofeedback innerhalb von 48 Stunden',
      'Alle Rechtsgebiete verfügbar',
      'Problemschwerpunkte können vorab mitgeteilt werden'
    ]
  },
  {
    package_key: '25er',
    name: '25er Paket',
    description: 'Maximale Flexibilität - 25 Klausuren mit persönlichem Videofeedback von Fach-Dozenten der Akademie Kraatz',
    case_study_count: 25,
    price_cents: 287500, // €2875
    features: [
      '25 ausgewählte Sachverhalte',
      'Persönliches Videofeedback innerhalb von 48 Stunden',
      'Alle Rechtsgebiete verfügbar',
      'Problemschwerpunkte können vorab mitgeteilt werden'
    ]
  },
  {
    package_key: '30er',
    name: '30er Paket',
    description: 'Das Komplettpaket für Profis - 30 Klausuren mit persönlichem Videofeedback von Fach-Dozenten der Akademie Kraatz',
    case_study_count: 30,
    price_cents: 337500, // €3375
    features: [
      '30 ausgewählte Sachverhalte',
      'Persönliches Videofeedback innerhalb von 48 Stunden',
      'Alle Rechtsgebiete verfügbar',
      'Problemschwerpunkte können vorab mitgeteilt werden'
    ]
  }
];

async function createStripeProducts() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');
    console.log('🎯 Creating Stripe products and prices...\n');

    const results = [];

    for (const pkg of packages) {
      console.log(`📦 Creating product: ${pkg.name}`);
      
      // Create product in Stripe
      const product = await stripe.products.create({
        name: `Kraatz Club - ${pkg.name}`,
        description: pkg.description,
        metadata: {
          package_key: pkg.package_key,
          case_study_count: pkg.case_study_count.toString(),
          features: pkg.features.join(' | ')
        },
        images: [], // You can add product images here if available
        url: 'https://kraatz-club.de/packages' // Your packages page URL
      });

      console.log(`✅ Product created: ${product.id}`);

      // Create price for the product
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: pkg.price_cents,
        currency: 'eur',
        metadata: {
          package_key: pkg.package_key,
          case_study_count: pkg.case_study_count.toString()
        }
      });

      console.log(`💰 Price created: ${price.id} (€${pkg.price_cents / 100})`);

      // Update database with Stripe price ID
      await client.query(
        'UPDATE packages SET stripe_price_id = $1 WHERE package_key = $2',
        [price.id, pkg.package_key]
      );

      console.log(`🔄 Database updated for ${pkg.package_key}\n`);

      results.push({
        package_key: pkg.package_key,
        name: pkg.name,
        product_id: product.id,
        price_id: price.id,
        amount: pkg.price_cents / 100
      });
    }

    // Verify database updates
    const dbResult = await client.query('SELECT package_key, name, stripe_price_id FROM packages ORDER BY case_study_count');
    
    console.log('📊 Final database state:');
    dbResult.rows.forEach(row => {
      console.log(`- ${row.name} (${row.package_key}): ${row.stripe_price_id}`);
    });

    console.log('\n🎉 All Stripe products and prices created successfully!');
    console.log('\n📋 Summary:');
    results.forEach(result => {
      console.log(`${result.name}:`);
      console.log(`  Product ID: ${result.product_id}`);
      console.log(`  Price ID: ${result.price_id}`);
      console.log(`  Amount: €${result.amount}`);
      console.log('');
    });

    console.log('🚀 Your Stripe integration is now ready!');
    console.log('✅ Products created in Stripe Dashboard');
    console.log('✅ Prices configured with correct amounts');
    console.log('✅ Database updated with Stripe price IDs');
    console.log('✅ Ready for live payments');

  } catch (error) {
    console.error('❌ Error creating Stripe products:', error);
    
    if (error.type === 'StripeAuthenticationError') {
      console.error('🔑 Authentication failed - please check your Stripe secret key');
    } else if (error.type === 'StripePermissionError') {
      console.error('🚫 Permission denied - please check your Stripe account permissions');
    } else {
      console.error('📝 Full error details:', error.message);
    }
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Check if Stripe key is provided
if (!process.env.STRIPE_SECRET_KEY && !stripe.secretKey) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  console.log('💡 Usage: STRIPE_SECRET_KEY=sk_live_... node scripts/create-stripe-products.js');
  process.exit(1);
}

// Run the script
createStripeProducts();
