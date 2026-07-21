const mongoose = require("mongoose");

const { Schema } = mongoose;

const MaintenanceRequestSchema = new Schema({
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
    title:{
        type : String,
        required : true,
        trim : true,
        minlength : 5,
        maxlength : 100
    },
    description : {
        type : String,
        required : true,
        trim : true,
        minlength : 10,
        maxlength : 1000
    },
    category : {
        type : String,
        required : true,
        enum : ["plumbing","electrical","cleaning","others"]
    },
    status : {
        type : String,
        enum : ["pending","assigned","in_progress","resolved","cancelled"],
        default : "pending"
    },
    assignedStaff : {
        type : Schema.Types.ObjectId,
        ref : "User"
    },
    images : {
        type : [String],
        default : []
    },
    resolvedAt : {
        type : Date
    },
    resolvedBy : {
        type : Schema.Types.ObjectId,
        ref : "User"
    },
    resolutionNotes : {
        type : String,
        trim : true
    },
    feedback : {
        type : String,
        trim : true
    },
    rating : {
        type : Number,
        min : 1,
        max : 5
    },
    paymentStatus : {
        type : String,
        enum : ["pending","paid","failed"],
        default : "pending"
    },
    totalAmount : {
        type : Number,
        default : 0,
        min : 0
    }
},{timestamps:true});


const MaintenanceRequest = mongoose.model("MaintenanceRequest", MaintenanceRequestSchema);

module.exports = MaintenanceRequest;
