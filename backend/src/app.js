const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const projectRoutes = require('./routes/projectRoutes');
const freelancerRoutes = require('./routes/freelancerRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const offeringRoutes = require('./routes/offeringRoutes');
const walletRoutes = require('./routes/walletRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');
const { isS3Configured, localUploadRoot } = require('./utils/s3Storage');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '160mb' }));
app.use(express.urlencoded({ extended: true, limit: '160mb' }));
app.use('/uploads-local', express.static(localUploadRoot));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/freelancers', freelancerRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/offerings', offeringRoutes);
app.use('/api/wallet', walletRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend MediaVault berjalan',
    mediaStorage: isS3Configured() ? 's3' : 'local_fallback',
  });
});

// Error handling
app.use(errorMiddleware);

module.exports = app;
