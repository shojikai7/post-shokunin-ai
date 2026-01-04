import express, { Request, Response } from 'express';
import { handleGenerationJob } from './handlers/generation';
import { handlePublishJob } from './handlers/publish';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy' });
});

// Pub/Sub push endpoint for generation jobs
app.post('/jobs/generate', async (req: Request, res: Response) => {
  try {
    // Decode Pub/Sub message
    const message = req.body.message;
    if (!message) {
      console.error('No message received');
      return res.status(400).send('Bad Request: missing message');
    }

    const data = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : {};

    console.log('Received generation job:', data);

    await handleGenerationJob(data);

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing generation job:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Pub/Sub push endpoint for publish jobs
app.post('/jobs/publish', async (req: Request, res: Response) => {
  try {
    const message = req.body.message;
    if (!message) {
      console.error('No message received');
      return res.status(400).send('Bad Request: missing message');
    }

    const data = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : {};

    console.log('Received publish job:', data);

    await handlePublishJob(data);

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing publish job:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Direct API endpoint for testing
app.post('/api/generate', async (req: Request, res: Response) => {
  try {
    const result = await handleGenerationJob(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Generation failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Worker server listening on port ${PORT}`);
});

