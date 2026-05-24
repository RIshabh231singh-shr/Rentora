const mongoose = require("mongoose");

const { Schema } = mongoose;

const PropertySchema = new Schema({
    propertyName : {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    propertyType : {
        type : String,
        required: true,
        enum : ["gym","house","villa","swimmingpool","commercial"]
    },
    propertyAddress : {
        type : String,
        required: true,
        trim: true
    },
    city : {
        type : String,
        required: true,
        trim: true
    },
    state : {
        type : String,
        required: true,
        trim: true
    },
    pincode : {
        type : Number,
        required: true,
        match: [/^[1-9][0-9]{5}$/, "Please enter valid pincode"]
    },
    country : {
        type : String,
        required: true,
        trim: true
    },
    owner : {
        type: Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    tenants : [{
        type : Schema.Types.ObjectId,
        ref : "User"
    }],
    images :{
        type: [String],
        default:[]
    },
    description :{
        type : String,
        required: true,
        trim: true
    },
    capacity : {
        type : Number,
        required: true
    },
    amenities : {
        type : [String],
        required: true
    }
},{
    timestamps : true
});

const Property = mongoose.model("Property", PropertySchema);

module.exports = Property;