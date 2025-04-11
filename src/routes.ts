import express from 'express';
import indexController from './controllers/indexController';
import conversionController from './controllers/conversionController';
import dropdownSolutionController from './controllers/dropdownSolutionController';
import dropdownFormController from './controllers/dropdownFormController';

const router = express.Router();

// Define all routes here
router.get('/', indexController);
router.post('/conversion', conversionController);
router.get('/dropdownSolution', dropdownSolutionController);
router.post('/dropdownForm', dropdownFormController);

export default router;
