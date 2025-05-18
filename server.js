import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Kiểm tra server
app.get('/', (req, res) => {
  res.send('Server đang chạy tại http://localhost:5000 🚀');
});

// Route POST gọi gợi ý từ contentbase.py
app.post('/suggest', (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Thiếu tên địa điểm' });
  }

  const pythonProcess = spawn('python', ['contentbase.py', title]);

  let dataBuffer = '';
  pythonProcess.stdout.on('data', (data) => {
    dataBuffer += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Lỗi Python: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    try {
      const suggestions = JSON.parse(dataBuffer);
      res.json({ suggestions });
    } catch (error) {
      console.error('Lỗi parse JSON từ Python:', error);
      res.status(500).json({ error: 'Lỗi khi xử lý dữ liệu gợi ý' });
    }
  });
});

app.listen(port, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${port}`);
});
