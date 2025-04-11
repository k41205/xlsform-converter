import { RequestHandler } from 'express';
import { getListOfFormsAndAssessmentsForAppID } from '../services/dbService';

const dropdownFormController: RequestHandler = async (req, res) => {
  const { appIdValue } = req.body;
  try {
    const forms = await getListOfFormsAndAssessmentsForAppID(appIdValue);
    const dropdownOptions = forms.map(form => ({
      key: form.formDefinitionName,
      value: `${form.type} - ${form.name}`,
    }));
    res.json(dropdownOptions);
  } catch (error) {
    console.error('Error in dropdownFormController:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default dropdownFormController;
