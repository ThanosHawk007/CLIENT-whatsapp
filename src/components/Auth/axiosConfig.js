import axios from "axios";

// Enable sending cookies with each request
axios.defaults.withCredentials = true;

// Helper to get cookie value
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

// Add CSRF token to every request
axios.interceptors.request.use((config) => {
  const csrfToken = getCookie("XSRF-TOKEN");

  console.log({ csrfToken });

  if (csrfToken) {
    config.headers["X-XSRF-TOKEN"] = csrfToken;
  }
  return config;
});

export default axios;
