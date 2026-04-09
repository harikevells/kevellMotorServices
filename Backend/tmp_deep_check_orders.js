const mongoose = require('mongoose');
const Order = require('./models/Order');
const Document = require('./models/Document');
const Service = require('./models/Service');
const Shop = require('./models/Shop');
const dotenv = require('dotenv');

dotenv.config();

const deepCheckOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/printerse');
        console.log('Connected to MongoDB');

        const orders = await Order.find({});
        console.log(`Total orders in DB: ${orders.length}`);

        for (const order of orders) {
            console.log(`Order: ${order.orderNumber}`);
            for (const item of order.items) {
                const doc = await Document.findById(item.document);
                const svc = await Service.findById(item.service);
                const shp = await Shop.findById(item.shop);
                
                console.log(`  Item Document: ${item.document} -> Found: ${!!doc}`);
                console.log(`  Item Service: ${item.service} -> Found: ${!!svc}`);
                console.log(`  Item Shop: ${item.shop} -> Found: ${!!shp}`);
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error checking orders:', error);
    }
};

deepCheckOrders();
