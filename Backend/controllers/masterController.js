const { City, Country } = require('country-state-city');
const ISO6391 = require('iso-639-1');

exports.getMasterDataByType = async (req, res, next) => {
    try {
        const { type } = req.params;
        const { search = '' } = req.query;

        let result = [];

        if (type === 'city') {
            const searchLower = search.toLowerCase().trim();

            if (searchLower.length < 2) {
                // Diverse global popular cities if no search
                const globalCities = [
                    'Chennai, IN', 'Bangalore, IN', 'Hyderabad, IN', 'Mumbai, IN', 'Delhi, IN',
                    'London, GB', 'New York, US', 'Dubai, AE', 'Singapore, SG', 'Paris, FR',
                    'Sydney, AU', 'Tokyo, JP', 'Toronto, CA', 'Berlin, DE', 'Kolkata, IN'
                ];

                result = globalCities.map(cityStr => {
                    const [name, code] = cityStr.split(', ');
                    const country = Country.getCountryByCode(code);
                    return `${name}, ${country ? country.name : code}`;
                });
            } else {
                const allCities = City.getAllCities();

                // Search across Name, StateCode, and CountryCode
                const filtered = allCities.filter(c => {
                    const cityName = c.name.toLowerCase();
                    return cityName.includes(searchLower);
                });

                // Sort for relevance
                result = filtered
                    .sort((a, b) => {
                        const aName = a.name.toLowerCase();
                        const bName = b.name.toLowerCase();

                        // 1. Exact matches first
                        if (aName === searchLower && bName !== searchLower) return -1;
                        if (aName !== searchLower && bName === searchLower) return 1;

                        // 2. Starts with search term
                        const aStarts = aName.startsWith(searchLower);
                        const bStarts = bName.startsWith(searchLower);
                        if (aStarts && !bStarts) return -1;
                        if (!aStarts && bStarts) return 1;

                        // 3. Alphabetical
                        return a.name.localeCompare(b.name);
                    })
                    .slice(0, 100)
                    .map(c => {
                        const country = Country.getCountryByCode(c.countryCode);
                        return `${c.name}, ${country ? country.name : c.countryCode}`;
                    });

                result = [...new Set(result)];
            }
        } else if (type === 'language') {
            const allLanguages = ISO6391.getAllNames();
            const searchLower = search.toLowerCase().trim();

            if (searchLower) {
                result = allLanguages
                    .filter(l => l.toLowerCase().includes(searchLower))
                    .sort((a, b) => {
                        const aLower = a.toLowerCase();
                        const bLower = b.toLowerCase();
                        if (aLower.startsWith(searchLower) && !bLower.startsWith(searchLower)) return -1;
                        if (!aLower.startsWith(searchLower) && bLower.startsWith(searchLower)) return 1;
                        return a.localeCompare(b);
                    })
                    .slice(0, 100);
            } else {
                result = allLanguages.sort();
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid data type'
            });
        }

        res.json({
            success: true,
            count: result.length,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.addMasterData = async (req, res, next) => {
    res.status(405).json({
        success: false,
        message: 'Method not allowed for library-based data'
    });
};
