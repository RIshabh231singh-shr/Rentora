const mongoose = require("mongoose");

const { Schema } = mongoose;

const BookingSchema = new Schema({
    user : {
        type : Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    property : {
        type : Schema.Types.ObjectId,
        ref : "Property",
        required : true
    },
    amenity : {
        type : Schema.Types.ObjectId,
        ref : "Amenity",
        required : false
    },
    bookingStartTime : {
        type : Date,
        required : true
    },
    bookingEndTime : {
        type : Date,
        required : true
    },
    checkInTime : {
        type : Date
    },
    checkOutTime : {
        type : Date
    },
    paymentStatus : {
        type : String,
        enum : ["pending", "paid", "failed"],
        default : "pending"
    },
    totalAmount : {
        type : Number,
        default : 0,
        min : 0
    },
    status : {
        type : String,
        enum : ["pending","booked","checked_in","completed","cancelled", "cancellation_requested"],
        default : "pending"
    }
},{
    timestamps : true
})

const Booking = mongoose.model("Booking", BookingSchema);

module.exports = Booking;
