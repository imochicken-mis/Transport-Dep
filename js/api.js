// ===================================================================
// API Wrapper — with session-token authentication
// ===================================================================

const Api = {
  _getToken() {
    try {
      const user = JSON.parse(sessionStorage.getItem("vms_user") || "null");
      return user && user.token ? user.token : "";
    } catch (e) {
      return "";
    }
  },

  _handleUnauthorized_() {
    sessionStorage.removeItem("vms_user");
    alert("Session expired. Please log in again.");
    window.location.href = "login.html";
  },

  async list(sheet) {
    const token = this._getToken();
    const url = `${API_URL}?sheet=${encodeURIComponent(sheet)}&action=list&token=${encodeURIComponent(token)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error (${res.status}): ${res.statusText}`);
    const data = await res.json();
    if (data.error) {
      if (String(data.error).toLowerCase().includes("unauthorized")) {
        this._handleUnauthorized_();
        throw new Error("Session expired");
      }
      throw new Error(data.error);
    }
    return data;
  },

  async _post(payload) {
    payload.token = this._getToken();
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`API error (${res.status}): ${res.statusText}`);
    const data = await res.json();
    if (data.error) {
      if (String(data.error).toLowerCase().includes("unauthorized")) {
        this._handleUnauthorized_();
        throw new Error("Session expired");
      }
      throw new Error(data.error);
    }
    return data;
  },

  add(sheet, data, username) {
    return this._post({ sheet, action: "add", data, user: username || "" });
  },

  update(sheet, data, username) {
    return this._post({ sheet, action: "update", data, user: username || "" });
  },

  remove(sheet, id) {
    return this._post({ sheet, action: "delete", data: { id } });
  },

  login(username, password) {
    return this._post({
      sheet: "Users",
      action: "login",
      data: { username, password },
    });
  },

  async ping() {
    try {
      await this.list("Vehicles");
      return true;
    } catch {
      return false;
    }
  },
};