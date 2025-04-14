import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        require: true
    },
    userName: {
        type: String,
        require: true,
        unique: true
    },
    phoneNumber: {
        type: String,
        require: true,
        minlength: 10,
        maxlength: 10,
        unique: true
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
    gender: {
        type: String,
        require: true,
        enum: ["male", "female", "other"]
    },
    passWord: {
        type: String,
        require: true,
        minlength: 6

    },
    dob: {
        type: Date,
        require: false
    },
    avatar: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["active", "deactive", "verify-register-otp"],
        default: "active"
    },
    background: {
        type: String,
        default: ""
    },
    is_twofa_enabled: {
        type: Boolean,
        default: false
    },
    twofa_method: {
        type: String,
        enum: ["OTP_EMAIL"],
        default: "OTP_EMAIL"
    },
    is_visible_dob: {
        type: String,
        enum: ["ONLY_DAY_MONTH", "FULL", "NO_VISIBLE"],
        default: "FULL"
    },
    allow_message: {
        type: String,
        enum: ["EVERY_ONE", "FRIEND"],
        default: "EVERY_ONE"
    },
    allow_search_by_phone: {
        type: Boolean,
        default: true
    },
    enable_fast_message: {
        type: Boolean,
        default: true
    },
    list_fast_message: {
        type: Array,
        default: []
    }
},
    { timestamps: true }
)
const User = mongoose.model("user", userSchema);

export default User;
