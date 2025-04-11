import checkBrowserCompatibility from './browserCheck.js';
import serverApi from './serverApi.js';
import clientApi from './clientApi.js';
import {
  setConvertButtonState,
  emptyMessageDisplay,
  showMessageDisplay,
  toggleSpinner,
  sleep,
} from './utilities.js';

// ========== APP STATE ==========

const appState = {
  local: document.getElementById('localOption').checked,
  formSelected: false,
  fileHandle: null,
  outputDirHandle: null,
  outputFileHandle: null,
  outputFileName: '',
};

// ========== INIT ==========

// Check browser compatibility at the start and interrupt if not compatible
if (!checkBrowserCompatibility()) {
  document.getElementById('browserWarning').style.display = 'block';
  document.getElementById('appContainer').classList.add('hidden-important');
  console.warn('Incompatible browser. Script execution stopped.');
  throw new Error('Browser not supported.'); // Stops further script execution
}

// IIFE to use await at top-level
(async () => {
  try {
    const response = await serverApi.loadDropdownSolutionOptions();

    if (response.ok) {
      const dropdownOptions = await response.json();
      const dropdown = document.getElementById('appIdDropdown');

      dropdown.innerHTML = "<option value=''>Select Solution</option>"; // Clear and add default

      dropdownOptions.forEach(option => {
        const optElement = document.createElement('option');
        optElement.value = option.key;
        optElement.textContent = option.value;
        dropdown.appendChild(optElement);
      });
    } else {
      // Handle error by showing a message to the user
      const error = await response.json();
      console.error(error);
      showMessageDisplay(
        'danger',
        'A server error occurred while loading the Solution dropdown options:',
        error.message
      );
    }
  } catch (error) {
    // Catch any network or unexpected errors
    console.error(error);
    showMessageDisplay(
      'danger',
      'A network error occurred while loading the Solution dropdown options:',
      error.message
    );
  }
})();

// ========== SERVER API HANDLERS ==========
// Invoke a POST / request to the server that writes the XML file in local (by default) or push it to the DB
async function convertToXml() {
  emptyMessageDisplay();
  const convertButton = document.getElementById('convertToXmlButton');

  if (!appState.fileHandle) {
    showMessageDisplay('danger', 'Please select an input file first.');
    return;
  }

  toggleSpinner(true);

  try {
    const file = await appState.fileHandle.getFile();

    // FileReader object is used here to let the browser keep reading the file, even after a modification, without the need to select it again
    const reader = new FileReader();

    reader.readAsArrayBuffer(file);

    reader.onload = async function () {
      const arrayBuffer = reader.result;
      const binaryString = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer))
      );

      const formData = {
        fileName: appState.fileHandle.name,
        fileContent: binaryString,
        skipValidate: document.getElementById('skipValidate').checked,
        local: appState.local,
        formDefinitionReference: document.getElementById('formDropdown').value,
      };

      try {
        const response = await serverApi.conversion(formData);

        if (response.ok) {
          const data = await response.json();

          if (appState.local) {
            const blob = new Blob([data.xml], { type: 'application/xml' }); // Convert XML string to Blob
            appState.outputFileName = `${appState.fileHandle.name.split('.').shift()}.xml`;

            appState.outputFileHandle =
              await appState.outputDirHandle.getFileHandle(
                appState.outputFileName,
                {
                  create: true,
                }
              );

            const writable = await appState.outputFileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
          }

          await sleep(500);
          toggleSpinner(false);
          const warningsOn =
            data.warnings && data.warnings.length !== 0 ? true : false;

          if (appState.local) {
            showMessageDisplay(
              'success',
              `${warningsOn ? "File successfully written to the File System but you've got some warnings" : 'File successfully written to the File System'}`,
              data.warnings
            );
          }
          if (!appState.local) {
            showMessageDisplay(
              'success',
              `${warningsOn ? "File successfully written to the database but you've got some warnings" : 'File successfully written to the database'}`,
              data.warnings
            );
          }
        } else {
          const error = await response.json();
          showMessageDisplay(
            'danger',
            'Bad response. Something happened during the operation:',
            error.message
          );
        }
      } catch (error) {
        showMessageDisplay(
          'danger',
          'Something happened during the operation:',
          error.message
        );
      } finally {
        toggleSpinner(false);
      }
    };

    reader.onerror = () => {
      showMessageDisplay('danger', 'Error reading the file.');
    };
    setTimeout(null, 1000);
  } catch (error) {
    showMessageDisplay(
      'danger',
      'An error occurred while checking the form:',
      error.message
    );
  }
}

// ========== EVENT LISTENERS ==========

document
  .getElementById('inputFileButton')
  .addEventListener('click', async () => {
    try {
      appState.fileHandle = await clientApi.openFile();

      if (appState.fileHandle) {
        document.getElementById('fileNameDisplay').textContent =
          appState.fileHandle.name;
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error selecting file:', error);
        showMessageDisplay('danger', 'Error selecting the file', error);
      }
    }
    setConvertButtonState(appState);
  });

document
  .getElementById('outputFileButton')
  .addEventListener('click', async () => {
    try {
      appState.outputDirHandle = await clientApi.selectOutputDirectory();
      if (appState.outputDirHandle) {
        document.getElementById('fileNamePathDisplay').textContent =
          appState.outputDirHandle.name;
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error selecting output directory:', error);
        showMessageDisplay('danger', 'Error selecting output directory', error);
      }
    }
    setConvertButtonState(appState);
  });

// Handle radio button toggle behavior
document.querySelectorAll('input[name="downloadOption"]').forEach(radio => {
  radio.addEventListener('change', function () {
    emptyMessageDisplay();
    appState.local = this.value === 'local';
    document.getElementById('localDownloadOptions').style.display =
      appState.local ? 'block' : 'none';
    document.getElementById('dbDownloadOptions').style.display = !appState.local
      ? 'block'
      : 'none';
    setConvertButtonState(appState);
  });
});

// Handle the dynamic population of the second dropdown based on the first dropdown selection
document
  .getElementById('appIdDropdown')
  .addEventListener('change', async function () {
    emptyMessageDisplay();
    const appIdValue = this.value;
    try {
      const response = await serverApi.loadDropdownFormOptions(appIdValue);
      // Check if the response is successful
      if (response.ok) {
        const dropdownOptions = await response.json();
        const dropdown = document.getElementById('formDropdown');

        dropdown.innerHTML = "<option value=''>Select Form</option>"; // Clear and add default

        dropdownOptions.forEach(option => {
          const optElement = document.createElement('option');
          optElement.value = option.key;
          optElement.textContent = option.value;
          dropdown.appendChild(optElement);
        });
      } else {
        // Handle error by showing a message to the user
        const error = await response.json();
        console.error(error);
        showMessageDisplay(
          'danger',
          'A server error occurred while loading the Forms dropdown options:',
          error.message
        );
      }
    } catch (error) {
      // Catch any network or unexpected errors
      console.error(error);
      showMessageDisplay(
        'danger',
        'A network error occurred while loading the Forms dropdown options:',
        error.message
      );
    }
    appState.formSelected = false;
    setConvertButtonState(appState);
  });

document.getElementById('formDropdown').addEventListener('change', function () {
  emptyMessageDisplay();
  const selectedValue = this.value;

  if (selectedValue !== '') {
    appState.formSelected = true;
  } else {
    appState.formSelected = false;
  }
  setConvertButtonState(appState);
});

document
  .getElementById('convertToXmlButton')
  .addEventListener('click', convertToXml);
