const mongoose = require("mongoose");

const { Schema } = mongoose;

const AmenitySchema = new Schema({
    name : {
        type: String,
        required : true,
        trim : true
    },
    description : {
        type : String,
        trim : true
    },
    category : {
        type : String,
        trim : true,
        default : "general"
    },
    property : {
        type : Schema.Types.ObjectId,
        ref : "Property",
        required : true,
    },
    capacity : {
        type : Number,
        required : true,
        min : 1
    },
    pricePerHour : {
        type : Number,
        default : 0,
        min : 0
    },
    // Integer hour fields (0-23) — used by frontend
    openingHour : {
        type : Number,
        default : 6,
        min : 0,
        max : 23
    },
    closingHour : {
        type : Number,
        default : 22,
        min : 0,
        max : 23
    },
    // Legacy Date fields — kept for backward compatibility with booking validation
    openingTime : {
        type : Date
    },
    closingTime : {
        type : Date
    },
    isActive : {
        type : Boolean,
        default : true
    },
    images : {
        type : [String],
        default : []
    },
    slotDuration : {
        type : Number,
        default : 1,
        min : 1
    },
},{
    timestamps : true
});

const Amenity = mongoose.model("Amenity", AmenitySchema);

module.exports = Amenity;