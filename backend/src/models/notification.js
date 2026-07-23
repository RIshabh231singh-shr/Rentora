const mongoose = require("mongoose");

const { Schema } = mongoose;

const NotificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "TENANT_REQUEST",
        "TENANT_ADDED",
        "TENANT_REQUEST_ACCEPTED",
        "TENANT_REQUEST_REJECTED",
        "TENANT_REMOVED",
        "BOOKING_CREATED",
        "BOOKING_CONFIRMED",
        "BOOKING_REJECTED",
        "BOOKING_CANCELLED",
        "CANCELLATION_REQUESTED",
        "BOOKING_REMINDER",
        "MAINTENANCE_CREATED",
        "MAINTENANCE_STATUS_CHANGED",
        "MAINTENANCE_RESOLVED",
        "ROLE_CHANGE_REQUEST",
      ],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedProperty: {
      type: Schema.Types.ObjectId,
      ref: "Property",
    },
    relatedUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    relatedBooking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
    },
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread",
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", NotificationSchema);

module.exports = Notification;
