/**
 * This module provides browser API to interact with the client File System.
 * It includes methods for selecting files and directories.
 *
 * For more details, see the official documentation:
 * @see https://developer.chrome.com/docs/capabilities/web-apis/file-system-access
 */

const clientApi = {
  /**
   * Open a file picker and return the selected file handle.
   * @returns {Promise<FileSystemFileHandle>} The file handle of the selected file.
   */
  async openFile() {
    const [newFileHandle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'XLSForm Files',
          accept: {
            'application/vnd.ms-excel': ['.xls', '.xlsx'],
          },
        },
      ],
    });
    return newFileHandle;
  },

  /**
   * Open a directory picker and return the selected directory handle.
   * @returns {Promise<FileSystemDirectoryHandle>} The directory handle of the selected directory.
   */
  async selectOutputDirectory() {
    const outputDirHandle = await window.showDirectoryPicker();
    return outputDirHandle;
  },
};

export default clientApi;
