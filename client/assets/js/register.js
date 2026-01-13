const form = document.getElementById("registerForm");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.innerHTML = "";

  const nombres = document.getElementById("nombres").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    await api("/api/auth/register", {
      method: "POST",
      body: { nombres, email, password },
      auth: false
    });

    msg.innerHTML = `<div class="ok">Cuenta creada. Ahora inicia sesión.</div>`;
    setTimeout(() => (window.location.href = "login.html"), 800);
  } catch (err) {
    msg.innerHTML = `<div class="alert">${err.message}</div>`;
  }
});
