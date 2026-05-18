import 'dotenv/config';
import express from 'express';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import articleRoutes from './modules/articles/article.routes';
import authorRoutes from './modules/author/author.routes';
import { initJobs } from './jobs';

const app = express();

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/articles', articleRoutes);
app.use('/author', authorRoutes);

// global error handler — must be last
app.use(errorHandler);

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  // init job queue after server is up
  await initJobs();
});

export default app;