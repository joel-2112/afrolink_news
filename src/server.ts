import 'dotenv/config';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import articleRoutes from './modules/articles/article.routes';
import authorRoutes from './modules/author/author.routes';
import { initJobs } from './jobs';

const app = express();

app.use(express.json());

// ── Swagger UI ────────────────────────────────────────────────
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'News API Docs',
    swaggerOptions: {
      persistAuthorization: true, // JWT stays after page refresh
    },
  })
);

// ── Serve raw spec for Postman/Insomnia import ────────────────
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ── Routes ────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/articles', articleRoutes);
app.use('/author', authorRoutes);

// ── Global error handler — must be last ──────────────────────
app.use(errorHandler);

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
  await initJobs();
});

export default app;