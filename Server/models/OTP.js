const mongoose = require('mongoose');
const sendMail = require('../utils/mailSender');
const mailSender = require('../utils/mailSender');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
},

    { timestamps: true });


// function to send mail

async function sendVarificationEmail(email, otp) {
    try {
        const mailResponse = await mailSender(email, "varification mail From SecureDocs")
    } catch (err) {
        console.log("error occured while sending mail", err);
        // console.log(err)
    }
}

otpSchema.pre("save", async function (next) {
    await sendVarificationEmail(this.email, this.otp);
    next();
})


module.exports = mongoose.model('OTP', otpSchema);
