require('dotenv').config();

module.exports = {
    mailer: process.env.MAIL_MAILER || 'smtp',
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT) || 587,
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || '',
    from: process.env.MAIL_FROM || 'Laptop Shop <doanatytbg@gmail.com>',
    fromName: process.env.MAIL_FROM_NAME || 'Laptop Shop'
};