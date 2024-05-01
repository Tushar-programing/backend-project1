import nodemailer from "nodemailer";
import dotenv from 'dotenv';
dotenv.config();

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com', // Your SMTP host
  port: 587, // Your SMTP port
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.user, // Your email username
    pass: process.env.pass // Your email password
  }
});

// Function to send email after user registration
const sendWelcomeEmail = (email, token) => {
    // const {email} = req.body
  const mailOptions = {
    from: process.env.user, 
    to: email, 
    subject: 'Welcome to Our Application',
    html: '<p>Hey, Please copy this link to reset passoword <a href="http://localhost:8000/api/v1/users/changeCurrentPassword?token='+token+'">Link</a></p>'
  };

  
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error occurred while sending email:', error.message);
    } else {
      console.log('Email sent successfully:', info.response);
    }
  });
};

export default sendWelcomeEmail;
