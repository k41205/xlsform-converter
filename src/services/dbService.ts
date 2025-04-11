// @ts-ignore
import dbstore from '../../../server/framework/persistence/dbstore';
// @ts-ignore
import Binary from '../../../server/CommonServices/datastore/Binary';

/**
 * Retrieves a list of App IDs and their corresponding names.
 * @returns {Promise<Array<{appID: string, name: string}>>} Array of app IDs and names.
 */
export const getAppIDs = async (): Promise<
  { appID: string; name: string }[]
> => {
  try {
    const dmSolutionsCodeTable = await dbstore.readExactlyOne_p('CodeLookups', {
      name: 'DMSolutions',
    });

    return dmSolutionsCodeTable.values.map(
      (value: { code: string; locales: { [key: string]: string } }) => ({
        appID: value.code,
        name: value.locales[''], // Default locale
      })
    );
  } catch (error) {
    console.error('Error fetching App IDs:', error);
    throw new Error('Failed to fetch App IDs');
  }
};

/**
 * Retrieves a list of forms and assessments for a given App ID.
 * @param {string} appID - The App ID to query.
 * @returns {Promise<Array<{formDefinitionName: string, type: string, name: string}>>} List of forms/assessments.
 */
export const getListOfFormsAndAssessmentsForAppID = async (
  appID: string
): Promise<{ formDefinitionName: string; type: string; name: string }[]> => {
  try {
    const formDefinitions: {
      formDefinitionName: string;
      type: string;
      name: string;
    }[] = [];

    // Fetch active form categories for the app
    const formCategories = await dbstore.readMulti_p('FormTypeCategories', {
      appID,
      active: true,
    });

    for (const formCategory of formCategories) {
      const formTypes = await dbstore.readMulti_p('FormTypes', {
        category: formCategory.name,
        active: true,
      });

      formTypes.forEach(
        (formType: {
          formTypeName: string;
          locales: { [key: string]: string };
        }) => {
          formDefinitions.push({
            formDefinitionName: formType.formTypeName,
            type: 'FORM',
            name: formType.locales[''],
          });
        }
      );
    }

    // Fetch active assessment categories for the app
    const assessmentCategories = await dbstore.readMulti_p(
      'AssessmentTypeCategories',
      {
        appID,
        active: true,
      }
    );

    for (const assessmentCategory of assessmentCategories) {
      const assessmentTypes = await dbstore.readMulti_p('AssessmentTypes', {
        category: assessmentCategory.name,
        active: true,
      });

      assessmentTypes.forEach(
        (assessmentType: {
          formTypeName: string;
          locales: { [key: string]: string };
        }) => {
          formDefinitions.push({
            formDefinitionName: assessmentType.formTypeName,
            type: 'ASSESSMENT',
            name: assessmentType.locales[''],
          });
        }
      );
    }

    return formDefinitions;
  } catch (error) {
    console.error('Error fetching forms and assessments:', error);
    throw new Error('Failed to fetch forms and assessments');
  }
};

/**
 * Updates the database by linking a form definition to a new binary (XML file).
 * @param {string} formDefRef - The form definition reference.
 * @param {string} filePath - The path to the XML file to upload.
 * @returns {Promise<void>}
 */
export const updateDb = async (
  formDefRef: string,
  filePath: string
): Promise<void> => {
  try {
    const formDefinitionVersions = await dbstore.readMulti_p(
      'FormDefinitionVersions',
      {
        formDefinitionName: formDefRef,
      }
    );

    if (!formDefinitionVersions.length) {
      throw new Error('Form definition reference not found.');
    }

    let latestVersion: any = formDefinitionVersions.reduce(
      (latest: any, current: any) =>
        !latest ||
        current.formDefinitionVersionNumber > latest.formDefinitionVersionNumber
          ? current
          : latest
    );

    // Insert the new XML file as a binary record
    const fileBinaryDetails = await Binary.insertFromFile({
      filePath,
    });

    // Update the form definition to use the new binary
    await dbstore.updateExactlyOne_p(
      'FormDefinitionVersions',
      {
        formDefinitionName: latestVersion.formDefinitionName,
        formDefinitionVersionNumber: latestVersion.formDefinitionVersionNumber,
      },
      {
        $set: {
          formDefinitionBinaryID: fileBinaryDetails.binaryID,
        },
      }
    );

    // Delete the old binary file if necessary
    if (latestVersion.formDefinitionBinaryID) {
      await Binary.remove({ binaryID: latestVersion.formDefinitionBinaryID });
    }

    // Clear the config cache
    await dbstore.removeMulti_p('ConfigCache', {});

    console.log(`Database successfully updated for form: ${formDefRef}`);
  } catch (error) {
    console.error('Error updating the database:', error);
    throw new Error('Failed to update the database');
  }
};
