const ServiceType = require('../models/ServiceType');
const SparePart = require('../models/SparePart');

exports.globalSearch = async (req, res, next) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.json({ success: true, services: [], spareParts: [] });
        }

        const regex = new RegExp(q, 'i');

        // Query ServiceType
        const services = await ServiceType.find({
            status: true,
            $or: [
                { serviceName: regex },
                { category: regex },
                { description: regex }
            ]
        }).limit(5);

        // Query SparePart
        // Assuming 'Available' is active status. Also filtering by isListed
        const spareParts = await SparePart.find({
            isListed: true,
            status: { $ne: 'Inactive' },
            $or: [
                { name: regex },
                { brand: regex },
                { partNumber: regex },
                { category: regex }
            ]
        }).limit(5);

        res.json({
            success: true,
            services,
            spareParts
        });
    } catch (error) {
        next(error);
    }
};
