const axios = require('axios');

const BASE = 'http://192.168.0.116:5000/api';

async function test() {
  const cases = [
    // Normal cases
    { label: '4_wheeler + petrol (all)', url: `${BASE}/services?category=&vehicle_category=4_wheeler&fuel_type=petrol` },
    { label: '2_wheeler + electric (all)', url: `${BASE}/services?category=&vehicle_category=2_wheeler&fuel_type=electric` },
    // Edge case: undefined params (what happens if route params are missing?)
    { label: 'undefined vehicle_category', url: `${BASE}/services?category=&vehicle_category=undefined&fuel_type=petrol` },
    { label: 'undefined fuel_type', url: `${BASE}/services?category=&vehicle_category=4_wheeler&fuel_type=undefined` },
    { label: 'both undefined', url: `${BASE}/services?category=&vehicle_category=undefined&fuel_type=undefined` },
    // Categories endpoint
    { label: 'categories', url: `${BASE}/services/categories` },
  ];

  for (const c of cases) {
    try {
      const r = await axios.get(c.url);
      const count = r.data.count ?? r.data.data?.length;
      console.log(`✅ ${c.label}: ${count} results`);
    } catch (e) {
      console.log(`❌ ${c.label}: ${e.message}`);
    }
  }
}

test();
