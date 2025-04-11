import { RequestHandler } from 'express';
import { getAppIDs } from '../services/dbService';

const dropdownSolutionController: RequestHandler = async (_req, res) => {
  try {
    const appIDs = await getAppIDs();
    const dropdownOptions = appIDs.map(app => ({
      key: app.appID,
      value: app.name,
    }));
    res.json(dropdownOptions);
  } catch (error) {
    console.error('Error in dropdownSolutionController:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default dropdownSolutionController;
