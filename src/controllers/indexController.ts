import { RequestHandler } from 'express';

const indexController: RequestHandler = (_req, res) => {
  res.render('index', { title: 'XLSForm Converter' });
};

export default indexController;
