const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Vendor = require('./models/vendor');
const Shop = require('./models/Shop');
const Order = require('./models/Order');

dotenv.config();

async function fixVendors() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get a valid existing order to clone
        const templateOrder = await Order.findOne();
        if (!templateOrder) {
            console.log("No template order found to clone!");
            return;
        }

        const vendors = await Vendor.find({});
        for (const vendor of vendors) {
            let shop = await Shop.findOne({ vendor: vendor._id });
            
            if (!shop) {
                console.log(`Fixing Vendor without Shop: ${vendor.shopName}...`);
                shop = await Shop.create({
                  vendor: vendor._id,
                  shopName: vendor.shopName || 'Test Shop',
                  email: vendor.email || 'test@example.com',
                  phone: vendor.phone || '0000000000',
                  address: vendor.address || { street: 'Main', city: 'City', state: 'State', pincode: '000000', country: 'India' },
                  location: vendor.location || { type: 'Point', coordinates: [0, 0] },
                  defaultTimings: { openingTime: '09:00 AM', closingTime: '06:00 PM' },
                  shopImage: vendor.shopImage || '/uploads/shops/default.jpg',
                  activeStatus: true
                });
                console.log(`Created shop ${shop._id} for vendor ${vendor._id}`);
            }

            // Check if this shop has any orders
            const orderCount = await Order.countDocuments({ 'items.shop': shop._id });
            if (orderCount === 0) {
                console.log(`Creating mock order for shop ${shop.shopName}...`);
                
                // Clone the template order
                const newOrderData = templateOrder.toObject();
                delete newOrderData._id;
                delete newOrderData.createdAt;
                delete newOrderData.updatedAt;
                delete newOrderData.__v;

                newOrderData.orderNumber = `ORD${Math.floor(Math.random() * 1000000000)}`;
                // Change the shop reference in the items
                newOrderData.items = newOrderData.items.map(item => {
                    const newItem = { ...item };
                    delete newItem._id;
                    newItem.shop = shop._id;
                    return newItem;
                });
                
                // Set the user to the vendor's user so it works 
                newOrderData.user = vendor.user;

                await Order.create(newOrderData);
                console.log(`Created duplicate mock order for ${shop.shopName}`);
            }
        }
        
        console.log('All legacy vendors fixed and seeded with clone mock orders!');

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}

fixVendors();
