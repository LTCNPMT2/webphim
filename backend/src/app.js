const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.disable('x-powered-by');
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Phục vụ ảnh đã upload: http://localhost:5000/uploads/posters/xxx.jpg
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Trang chào mừng khi truy cập trực tiếp từ trình duyệt
app.get('/', (req, res) => {
  res.json({
    name: 'CineBooking Backend API',
    status: 'running',
    message: 'Backend server đang hoạt động bình thường!',
    api: 'http://localhost:5000/api',
    health: 'http://localhost:5000/api/health',
    frontend: 'http://localhost:5173',
  });
});

// Tiếp nhận Webhook SePay ở mọi biến thể đường dẫn phổ biến
const sepayController = require('./controllers/sepayController');
app.post('/api/sepay-webhook', sepayController.webhook);
app.post('/sepay-webhook', sepayController.webhook);
app.post('/api/payments/sepay-webhook', sepayController.webhook);
app.post('/api/payments/sepay/webhook', sepayController.webhook);
app.post('/api/sepay/webhook', sepayController.webhook);
app.post('/sepay/webhook', sepayController.webhook);
app.post('/webhook', sepayController.webhook);

app.use('/api', routes);

// Hai middleware này PHẢI đặt cuối cùng
app.use(notFound);
app.use(errorHandler);

module.exports = app;
