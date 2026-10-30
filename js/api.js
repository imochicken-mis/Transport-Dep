// ===================================================================
// API Wrapper — handles all communication with Google Apps Script backend
// ===================================================================

const Api = {
  /**
   * Fetch all rows from a sheet
   * @param {string} sheet - Sheet name
   * @returns {Promise<Array>} Array of row objects
   */
  async list(sheet) {
    const url = `${API_URL}?sheet=${encodeURIComponent(sheet)}&action=list`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error (${res.status}): ${res.statusText}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  },

  /**
   * Send POST request to Apps Script backend
   * @param {Object} payload - { sheet, action, data }
   * @returns {Promise<Object>} Response from server
   */
  async _post(payload) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`API error (${res.status}): ${res.statusText}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  },

  /**
   * Add a new record
   * @param {string} sheet - Sheet name
   * @param {Object} data - Record data (key-value pairs)
   * @returns {Promise<Object>} Response with new ID
   */
  add(sheet, data, username) {
    return this._post({ sheet, action: "add", data, user: username || "" });
  },

  /**
   * Update an existing record
   * @param {string} sheet - Sheet name
   * @param {Object} data - Record data including ID
   * @returns {Promise<Object>} Response
   */
  update(sheet, data, username) {
    return this._post({ sheet, action: "update", data, user: username || "" });
  },

  /**
   * Delete a record
   * @param {string} sheet - Sheet name
   * @param {string|number} id - Record ID
   * @returns {Promise<Object>} Response
   */
  remove(sheet, id) {
    return this._post({ sheet, action: "delete", data: { id } });
  },

  /**
   * User login
   * @param {string} username
   * @param {string} password
   * @returns {Promise<Object>} { success, username, role, allowedTabs, ... }
   */
  login(username, password) {
    return this._post({
      sheet: "Users",
      action: "login",
      data: { username, password }
    });
  },

  /**
   * Check API connectivity
   * @returns {Promise<boolean>}
   */
  async ping() {
    try {
      await this.list("Vehicles");
      return true;
    } catch {
      return false;
    }
  }
};