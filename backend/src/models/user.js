const mongoose = require("mongoose");

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    firstname: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 40,
    },
    lastname: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 40,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      immutable:true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    password: {
      type: String,
      required: function() {
        return !this.googleId;
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: ["tenant", "landlord", "admin","maintenance_staff"],
      default: "tenant",
    },
    phoneNumber: {
      type: String,
      trim: true,
      required: true,
      match: [/^\+?[0-9\s\-()]+$/, "Please fill a valid phone number"],
    },
    profilePicture: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    myProperties : [
      {
        type: Schema.Types.ObjectId,
        ref : "Property"
      }
    ],
    myTenants : [
      {
        type: Schema.Types.ObjectId,
        ref : "User"
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

UserSchema.virtual('name').get(function() {
  return `${this.firstname} ${this.lastname || ''}`.trim();
});

UserSchema.virtual('phone').get(function() {
  return this.phoneNumber;
});

const User = mongoose.model("User", UserSchema);

module.exports = User;