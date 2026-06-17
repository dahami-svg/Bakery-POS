import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { THEME_MODES, THEME_PALETTES } from '@/lib/themes';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  passwordSetupRequired: { type: Boolean, default: false },
  passwordSetupTokenHash: { type: String, default: null },
  passwordSetupExpiresAt: { type: Date, default: null },
  role: {
    type: String,
    enum: ['super_admin', 'tenant_admin', 'staff'],
    required: true,
    default: 'staff',
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null,
  },
  themePalette: {
    type: String,
    enum: THEME_PALETTES,
    default: 'midnight',
  },
  themeMode: {
    type: String,
    enum: THEME_MODES,
    default: 'dark',
  },
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User: any = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;
