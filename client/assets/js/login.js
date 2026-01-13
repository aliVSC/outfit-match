const form = document.getElementById("loginForm");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.innerHTML = "";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const r = await api("/api/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false
    });

    setToken(r.token);
    window.location.href = "wizard.html";
  } catch (err) {
    msg.innerHTML = `<div class="alert">${err.message}</div>`;
  }
});
