const mongoose = require('mongoose');

const AlertPreferencesSchema = new mongoose.Schema(
  {
    emailEnabled: { type: Boolean, default: true },
    thresholdPercent: { type: Number, default: 5 },
    frequency: { type: String, enum: ['immediate', 'daily'], default: 'immediate' }
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    alertPreferences: { type: AlertPreferencesSchema, default: () => ({}) },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date },
    lastDigestAt: { type: Date }
  },
  { minimize: false }
);

module.exports = mongoose.model('User', UserSchema);
