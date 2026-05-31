const validator = require("validator");

const validateUser = (data) =>{
    const mandatoryFields = ["firstname","email","password","phoneNumber"];
    
    const isAllowed  = mandatoryFields.every((k)=> Object.keys(data).includes(k));
    
    if (!isAllowed) {
        throw new Error("Some Field missing");
    }
    if (!validator.isEmail(data.email)) {
        throw new Error("Invalid Email");
    }
    if (!validator.isStrongPassword(data.password)) {
        throw new Error("Weak Password");
    }
    if(!validator.isMobilePhone(data.phoneNumber,"en-IN")){
        throw new Error("Invalid Phone Number");
    }
    if(!validator.isLength(data.firstname,{min:3,max:40})){
        throw new Error("First name must be between 3 and 40 characters");
    }
    if(data.lastname && !validator.isLength(data.lastname,{min:3,max:40})){
        throw new Error("Last name must be between 3 and 40 characters");
    }
    if(!validator.isLength(data.password,{min:6,max:20})){
        throw new Error("Password must be between 6 and 20 characters");
    }
    if(!validator.isLength(data.phoneNumber,{min:10,max:10})){
        throw new Error("Phone number must be 10 digits");
    }
};

module.exports = validateUser;