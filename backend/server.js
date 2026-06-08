const dotenv = require('dotenv');

dotenv.config();

const app = require('./src/app');
const { startAutoReleaseJob } = require('./src/jobs/autoReleaseJob');
const { startTelegramPollingJob } = require('./src/jobs/telegramPollingJob');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startAutoReleaseJob();
  startTelegramPollingJob();
});
