export default {
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10) || 2525,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  from: process.env.EMAIL_FROM || "noreply@taskmanager.com",
};
