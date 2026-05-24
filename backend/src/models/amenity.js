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
    openingTime : {
        type : Date,
        required : true
    },
    closingTime : {
        type : Date,
        required : true
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
})

const Amenity = mongoose.model("Amenity", AmenitySchema);

module.exports = Amenity;