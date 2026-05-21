const mongoose = require('mongoose');
const Wallet = require('./models/Wallet');
const WalletTransaction = require('./models/WalletTransaction');

require('dotenv').config();

const clearCollections = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/EVService';
    await mongoose.connect(mongoURI);
    console.log('🔥 MongoDB Connected for Database Cleanup...');

    // Delete all records in Wallet and WalletTransaction
    const walletRes = await Wallet.deleteMany({});
    console.log(`Deleted ${walletRes.deletedCount} Wallet records.`);

    const txRes = await WalletTransaction.deleteMany({});
    console.log(`Deleted ${txRes.deletedCount} WalletTransaction records.`);

    console.log('✅ Wallet and WalletTransaction collections successfully cleared!');
  } catch (error) {
    console.error('❌ Error clearing databases:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

clearCollections();
