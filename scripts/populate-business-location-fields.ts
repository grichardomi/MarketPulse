import { db } from '@/lib/db/prisma';

/**
 * Populate city, state, zipcode fields for businesses that only have location
 */
async function populateLocationFields() {
  console.log('Finding businesses with null city/state/zipcode...\n');

  const businesses = await db.business.findMany({
    where: {
      OR: [
        { city: null },
        { state: null },
      ],
    },
    select: {
      id: true,
      name: true,
      location: true,
      city: true,
      state: true,
      zipcode: true,
    },
  });

  console.log(`Found ${businesses.length} businesses to update\n`);

  for (const business of businesses) {
    console.log(`\nBusiness: ${business.name}`);
    console.log(`  Location: ${business.location}`);

    const parsed = parseLocation(business.location);
    console.log(`  Parsed -> City: ${parsed.city || '(none)'}, State: ${parsed.state || '(none)'}, Zip: ${parsed.zipcode || '(none)'}`);

    if (parsed.city || parsed.state || parsed.zipcode) {
      await db.business.update({
        where: { id: business.id },
        data: {
          city: parsed.city || null,
          state: parsed.state || null,
          zipcode: parsed.zipcode || null,
        },
      });
      console.log('  ✓ Updated');
    } else {
      console.log('  ⚠ Could not parse location - skipping');
    }
  }

  console.log('\n✓ Done');
}

function parseLocation(location: string): { city: string; state: string; zipcode: string } {
  if (!location) return { city: '', state: '', zipcode: '' };

  const normalized = location.trim().toLowerCase();

  // Handle common patterns
  const patterns = [
    // "saint george utah" -> city: "saint george", state: "UT"
    /^(.+?)\s+(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming)$/i,
    // "Austin, TX 78701" or "Austin, Texas 78701"
    /^(.+?),\s*([A-Za-z\s]+?)\s*(\d{5})?$/,
    // "Austin TX" or "Austin, TX"
    /^(.+?)[\s,]+([A-Z]{2})$/i,
  ];

  const stateAbbreviations: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY'
  };

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      let city = match[1]?.trim() || '';
      let state = match[2]?.trim() || '';
      let zipcode = match[3]?.trim() || '';

      // Convert full state name to abbreviation
      if (state.length > 2) {
        state = stateAbbreviations[state.toLowerCase()] || state;
      }

      // Capitalize city
      city = city.split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      // Uppercase state
      state = state.toUpperCase();

      return { city, state, zipcode };
    }
  }

  return { city: '', state: '', zipcode: '' };
}

populateLocationFields()
  .catch(console.error)
  .finally(() => process.exit());
