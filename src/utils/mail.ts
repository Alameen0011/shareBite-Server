import config from "../config/env"
import nodemailer from 'nodemailer'




// Configure the transporter
export const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this to your email provider
    auth: {
      user:config.EMAIL_APP, // Replace with your email address
      pass:config.EMAIL_PASS, // Replace with your email password or app-specific password
    },
  });


  //veyfying connection configuration
  transporter.verify((error,success) => {
    console.log(`email: ${ process.env.EMAIL_APP}  password: ${ process.env.EMAIL_PASS}`)
 
    if(error){
        console.log("Error settting up Nodemailer: " ,error)
    }else{
        console.log("Node mailer is ready to send emails")
    }
  })