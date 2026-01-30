const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// Get all transactions with pagination
router.get('/', async (req, res, next) => {
    try {
        const { division, category, startDate, endDate, page = 1, limit = 100 } = req.query;
        let query = {};

        if (division) query.division = division;
        if (category) query.category = category;
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const transactions = await Transaction
            .find(query)
            .sort({ date: -1 })
            .limit(parseInt(limit))
            .skip(skip)
            .lean();

        const total = await Transaction.countDocuments(query);

        res.json(transactions);
    } catch (err) {
        next(err);
    }
});


// Add new transaction
router.post('/', async (req, res, next) => {
    try {
        const { type, amount, category, division, account, toAccount, description, date } = req.body;

        // Additional validation for transfers
        if (type === 'transfer' && !toAccount) {
            return res.status(400).json({ message: 'Destination account is required for transfers' });
        }

        if (type === 'transfer' && account === toAccount) {
            return res.status(400).json({ message: 'Source and destination accounts must be different' });
        }

        const transaction = new Transaction({
            type,
            amount: Number(amount),
            category: category.trim(),
            division,
            account: account.trim(),
            toAccount: toAccount ? toAccount.trim() : undefined,
            description: description.trim(),
            date: new Date(date)
        });

        const newTransaction = await transaction.save();
        res.status(201).json(newTransaction);
    } catch (err) {
        next(err);
    }
});


// Edit transaction
router.put('/:id', async (req, res, next) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Check if 12 hours have passed
        const now = new Date();
        const createdTime = new Date(transaction.createdAt);
        const diffInHours = Math.abs(now - createdTime) / 36e5;

        if (diffInHours > 12) {
            return res.status(403).json({ message: 'Editing is restricted after 12 hours' });
        }

        // Additional validation for transfers
        if (req.body.type === 'transfer') {
            if (!req.body.toAccount) {
                return res.status(400).json({ message: 'Destination account is required for transfers' });
            }
            if (req.body.account === req.body.toAccount) {
                return res.status(400).json({ message: 'Source and destination accounts must be different' });
            }
        }

        // Update fields
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                transaction[key] = req.body[key].trim();
            } else {
                transaction[key] = req.body[key];
            }
        });

        const updatedTransaction = await transaction.save();
        res.json(updatedTransaction);
    } catch (err) {
        next(err);
    }
});

// Delete transaction
router.delete('/:id', async (req, res, next) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        await transaction.deleteOne();
        res.json({ message: 'Transaction deleted successfully' });
    } catch (err) {
        next(err);
    }
});

// Get Summary by category
router.get('/summary/category', async (req, res, next) => {
    try {
        const summary = await Transaction.aggregate([
            {
                $group: {
                    _id: { type: "$type", category: "$category" },
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { total: -1 }
            }
        ]);
        res.json(summary);
    } catch (err) {
        next(err);
    }
});

// Get monthly summary
router.get('/summary/monthly', async (req, res, next) => {
    try {
        const summary = await Transaction.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" },
                        type: "$type"
                    },
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": -1, "_id.month": -1 }
            }
        ]);
        res.json(summary);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
