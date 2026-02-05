import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: "student" | "instructor" | "admin";
  emailVerified: boolean;
  phone?: string;
  timezone?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  subscription?: {
    tierId?: string;
    status?: "active" | "inactive" | "cancelled";
    startDate?: Date;
    endDate?: Date;
    renewalDate?: Date;
  };
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phone: String,
    timezone: String,
    avatarUrl: String,
    lastLogin: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    subscription: {
      tierId: String,
      status: {
        type: String,
        enum: ["active", "inactive", "cancelled"],
        default: "inactive",
      },
      startDate: Date,
      endDate: Date,
      renewalDate: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Index for email lookups
userSchema.index({ email: 1 });
userSchema.index({ isActive: 1 });

export default model<IUser>("User", userSchema);
