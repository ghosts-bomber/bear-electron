const TOKEN_KEY = "admin-token";
const PF_TOKEN_KEY = "aip-token";
function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function setToken(token: string) {
  return localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  return localStorage.removeItem(TOKEN_KEY);
}
function getPFToken(): string {
  return localStorage.getItem(PF_TOKEN_KEY) || "";
}

function setPFToken(token: string) {
  return localStorage.setItem(PF_TOKEN_KEY, token);
}

function clearPFToken() {
  return localStorage.removeItem(PF_TOKEN_KEY);
}

export { getToken, setToken, clearToken, getPFToken, setPFToken, clearPFToken };
