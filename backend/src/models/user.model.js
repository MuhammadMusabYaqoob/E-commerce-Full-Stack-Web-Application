import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true // to enable searching field in optimised way
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        trim: true,
        required: [true, 'Password is required']
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["customer", "admin", "seller"],
        default: "customer"
    },
    refreshToken: {
        type: String
    }
}, { timestamps: true });

// ==========================================
// 2. PASSWORD HASHING MIDDLEWARE
// ==========================================

// This function runs BEFORE a user document is saved.
userSchema.pre("save", async function () {
    // Check whether the password has been changed.
    // If not changed, don't hash it again.
    if (!this.isModified("password")) return

    // Convert the original password into a bcrypt hash.
    // 10 is the bcrypt cost factor (salt rounds).
    this.password = await bcrypt.hash(this.password, 10);

});
// ==========================================
// 3. PASSWORD COMPARISON METHOD
// ==========================================

// Custom method available on individual User documents.
// Used during login to compare the entered password
// with the hashed password stored in MongoDB.
userSchema.methods.isPasswordCorrect = async function (password) {

    return await bcrypt.compare(password, this.password);

};

// ==========================================
// 4. ACCESS TOKEN GENERATION METHOD
// ==========================================

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            // payload(data) of the token
            _id: this._id,
            // other user details can be added to the payload if needed
            // name: this.name,
            // email: this.email,
            // role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
}

// ==========================================
// 5. REFRESH TOKEN GENERATION METHOD
// ==========================================

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
}

export const User = mongoose.model("User", userSchema);