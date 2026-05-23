const nodemailer = require('nodemailer');
const mailConfig = require('../config/mailconfig');

require('dotenv').config();

exports.sendEmail = async (to, subject, html) => {
    try {
        console.log('📧 Sending email...');
        console.log('   From:', mailConfig.from);
        console.log('   To:', to);
        console.log('   Host:', mailConfig.host);
        console.log('   Port:', mailConfig.port);
        console.log('   User:', mailConfig.user);

        const transporter = nodemailer.createTransport({
            host: mailConfig.host,
            port: mailConfig.port,
            secure: mailConfig.port === 465, // true for 465, false for other ports
            auth: {
                user: mailConfig.user,
                pass: mailConfig.pass,
            }
        });

        // Test connection
        await transporter.verify();
        console.log('✅ SMTP connection verified');

        const options = {
            from: mailConfig.from,
            to,
            subject,
            html
        };
    
        const info = await transporter.sendMail(options);
        console.log('✅ Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        console.error('Error details:', error);
        return { success: false, error: error.message };
    }
};