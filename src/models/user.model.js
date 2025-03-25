//Người dùng
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
        enum: ["male", "female"]
    },
    passWord: {
        type: String,
        require: true,
        minlength: 6

    },
    dob: {
        type: Date,
        require : false
    },
    avatar: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["active", "deactive"],
        default : "active"
    }

},
    { timestamps: true }
)
const User = mongoose.model("user", userSchema);

export default User;
