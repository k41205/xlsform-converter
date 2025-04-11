import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 4000;

// Increase limit for JSON and URL-encoded data
app.use(bodyParser.json({ limit: '10mb' })); // Adjust '10mb' as necessary
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.json());
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views/pages'));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(routes);

// Error handling middleware for other unhandled errors
app.use(
  (
    err: Error & { status?: number },
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    console.error('Unexpected error:', err);

    if (res.headersSent) {
      return next(err);
    }

    res.status(err.status || 500).render('error', {
      title: 'Server Error',
      message:
        'An unexpected error occurred. Please, see the server log for further details.',
    });
  }
);

// Catch 404 and render a generic error view
app.use((req, res, next) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
