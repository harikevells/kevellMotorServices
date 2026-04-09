const axios = require('axios');

const cities = ['Chennai', 'Bangalore', 'Hyderabad', 'Coimbatore', 'Madurai', 'Trichy', 'Salem'];
const languages = ['Tamil', 'English', 'Hindi', 'Malayalam', 'Telugu', 'Kannada'];

async function seed() {
    for (const city of cities) {
        try {
            await axios.post('http://localhost:5000/api/master/add', { type: 'city', name: city });
            console.log(`Added city: ${city}`);
        } catch (e) {
            console.log(`City ${city} already exists or error`);
        }
    }

    for (const lang of languages) {
        try {
            await axios.post('http://localhost:5000/api/master/add', { type: 'language', name: lang });
            console.log(`Added language: ${lang}`);
        } catch (e) {
            console.log(`Language ${lang} already exists or error`);
        }
    }
}

seed();
