import { RequestHandler } from 'express';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { updateDb } from '../services/dbService';

const conversionController: RequestHandler = (req, res) => {
  const {
    fileName,
    fileContent,
    skipValidate,
    formDefinitionReference,
    local,
  } = req.body;

  if (!fileName || !fileContent) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded or provided.',
    });
  }

  const baseFilename = path.basename(fileName, path.extname(fileName));
  const tempDirPath = path.join(__dirname, '..', '..', 'temp');
  const tempFilePath = path.join(tempDirPath, `${baseFilename}.xlsx`);
  const outputFilePath = path.join(tempDirPath, `${baseFilename}.xml`);

  try {
    // Ensure temp directory exists and write the file
    fs.mkdirSync(tempDirPath, { recursive: true });
    const fileBuffer = Buffer.from(fileContent, 'base64');
    fs.writeFileSync(tempFilePath, fileBuffer);
  } catch (err: any) {
    console.error(`Error creating/writing temp file: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to process the uploaded file.',
    });
  }

  const args = ['--json', tempFilePath, outputFilePath];
  if (skipValidate) args.unshift('--skip_validate');

  const xlsformProcess = spawn('xlsform', args);

  let errorOutput = '';

  xlsformProcess.stderr.on('data', data => {
    errorOutput += data.toString();
  });

  xlsformProcess.on('error', err => {
    console.error('Error during xlsform process:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to execute conversion process.',
    });
  });

  xlsformProcess.on('close', async code => {
    try {
      // Check if the process exited successfully (code === 0 indicates success)
      if (code !== 0) {
        console.error(
          `xlsform process failed with code ${code}: ${errorOutput}`
        );
        return res.status(500).json({
          success: false,
          message: `Conversion process failed: ${errorOutput || `Process exited with code ${code}`}`,
        });
      }

      // Parse errorOutput if it exists (for warnings or status messages)
      interface XlsformOutput {
        code: number;
        message: string;
        warnings?: any[];
      }

      let parsedOutput: XlsformOutput = { code: -1, message: 'Unknown Error' };
      if (errorOutput.trim()) {
        try {
          parsedOutput = JSON.parse(errorOutput);
        } catch (parseErr) {
          console.warn('Failed to parse error output as JSON:', parseErr);
        }
      }

      // Check if parsed output indicates success with code 100 or 101
      if (parsedOutput.code === 100 || parsedOutput.code === 101) {
        // Ensure output file exists
        if (!fs.existsSync(outputFilePath)) {
          console.error('Output file not found:', outputFilePath);
          return res.status(500).json({
            success: false,
            message: 'Conversion process failed: Output file not generated.',
          });
        }

        const xmlContent = fs.readFileSync(outputFilePath, 'utf-8');

        if (local) {
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="${baseFilename}.xml"`
          );
          res.setHeader('Content-Type', 'application/xml');
          return res.json({
            success: true,
            message: parsedOutput.message,
            warnings: parsedOutput.warnings,
            xml: xmlContent, // Base64 encode the XML if necessary
          });
        }
        if (!local) {
          try {
            // Update database with the generated XML file
            await updateDb(formDefinitionReference, outputFilePath);
            return res.json({
              success: true,
              message: parsedOutput.message,
              warnings: parsedOutput.warnings,
            });
          } catch (error) {
            console.error('Error pushing file to the DB:', error);
            return res.status(500).json({
              success: false,
              message: 'Failed to push the XML file to the database.',
            });
          }
        }
      } else {
        return res.status(500).json({
          success: false,
          message: `Conversion failed: ${parsedOutput.message || errorOutput}`,
        });
      }
    } catch (err: any) {
      console.error('Error processing the output:', err);
      return res.status(500).json({
        success: false,
        message: 'Conversion failed due to an unexpected error.',
      });
    } finally {
      // Cleanup temp files
      cleanupFile(tempFilePath);
      cleanupFile(outputFilePath);
    }
  });
};

/**
 * Utility function to safely delete a file.
 * @param {string} filePath - Path of the file to delete.
 */
const cleanupFile = (filePath: string) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err: any) {
    console.error(`Error cleaning up file at ${filePath}: ${err.message}`);
  }
};

export default conversionController;
