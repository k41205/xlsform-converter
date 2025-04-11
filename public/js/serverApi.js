const serverApi = {
  /**
   * Converts form data and sends it to the server
   * @param {Object} formData - The form data to be converted
   * @returns {Promise<Response>} The server response
   */
  conversion: async formData => {
    const response = await fetch('/conversion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    return response;
  },

  /**
   * Loads dropdown solution options from the server
   * @returns {Promise<Response>} The server response
   */
  loadDropdownSolutionOptions: async () => {
    const response = await fetch('/dropdownSolution', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
  },

  /**
   * Loads dropdown form options from the server
   * @param {string} appIdValue - The app ID value to filter forms
   * @returns {Promise<Response>} The server response
   */
  loadDropdownFormOptions: async appIdValue => {
    const response = await fetch('/dropdownForm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ appIdValue }),
    });
    return response;
  },
};

export default serverApi;
