const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: {
      values: ['income', 'expense', 'transfer'],
      message: '{VALUE} is not a valid transaction type'
    },
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  division: {
    type: String,
    enum: {
      values: ['Office', 'Personal'],
      message: '{VALUE} is not a valid division'
    },
    required: [true, 'Division is required']
  },
  account: {
    type: String,
    required: [true, 'Account is required'],
    trim: true
  },
  toAccount: {
    type: String,
    trim: true,
    validate: {
      validator: function (v) {
        // toAccount is required only for transfers
        if (this.type === 'transfer') {
          return v && v.length > 0 && v !== this.account;
        }
        return true;
      },
      message: 'Valid destination account is required for transfers'
    }
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    validate: {
      validator: function (v) {
        return v <= new Date();
      },
      message: 'Date cannot be in the future'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
transactionSchema.index({ date: -1 });
transactionSchema.index({ type: 1, date: -1 });
transactionSchema.index({ division: 1, date: -1 });
transactionSchema.index({ category: 1, date: -1 });
transactionSchema.index({ createdAt: -1 });


module.exports = mongoose.model('Transaction', transactionSchema);
