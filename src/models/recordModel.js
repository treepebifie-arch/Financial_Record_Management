const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    walletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true
    },
    description: {
        type: String,
    },
    amount: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },
    currency: {
        type: String,
        required: true,
        default: 'NGN'
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    category: {
        type: String,
        enum: ['transfer', 'bill',  'salary', 'other'],
        default: 'other'
    },
    balanceBefore: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },
    balanceAfter: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'successful', 'failed', 'flagged'],
        default: 'successful'
    },
    txRf: {
        type: String,
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
    },
}, {
    timestamps: true,
    versionKey: false
});

const Record = mongoose.model('Record', recordSchema);

module.exports = Record;