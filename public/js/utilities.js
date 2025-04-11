export const setConvertButtonState = appState => {
  const { local, fileHandle, outputDirHandle, formSelected } = appState;
  if (fileHandle && ((local && outputDirHandle) || (!local && formSelected))) {
    document.getElementById('convertToXmlButton').disabled = false;
  } else {
    document.getElementById('convertToXmlButton').disabled = true;
  }
};

export const emptyMessageDisplay = () => {
  const messageDisplay = document.getElementById('messageDisplay');
  messageDisplay.innerHTML = '';
  messageDisplay.className = 'mt-3';
};

export const showMessageDisplay = (type, messageText, error = null) => {
  const messageDisplay = document.getElementById('messageDisplay');
  emptyMessageDisplay();
  messageDisplay.classList.add('alert', `alert-${type}`);

  // Create main message content
  const messageContent = document.createElement('p');
  messageContent.textContent = messageText;
  messageDisplay.appendChild(messageContent);

  // If error details exist, add them below the main message
  if (error && error.length !== 0) {
    const errorDetails = document.createElement('pre'); // <pre> preserves formatting for error stacks
    errorDetails.style.whiteSpace = 'pre-wrap'; // Make long error messages wrap properly
    errorDetails.style.marginTop = '10px';
    errorDetails.style.marginBottom = '0';
    errorDetails.textContent = `Details: ${error.message || error}`;
    messageDisplay.appendChild(errorDetails);
  }
};

export const toggleSpinner = show => {
  const spinner = document.getElementById('spinner');
  const convertButton = document.getElementById('convertToXmlButton');
  if (show) {
    spinner.style.display = 'inline-block';
    convertButton.disabled = true;
  } else {
    spinner.style.display = 'none';
    convertButton.disabled = false;
  }
};

export const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
