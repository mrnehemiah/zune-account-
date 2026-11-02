
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://rpkogiieegqgxqbzwxwo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_2TEqZv-NBM9n5knU46ngqA_wqO3V1uf";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

const pageMessage = document.getElementById("pageMessage");
const passwordForm = document.getElementById("passwordForm");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const changePasswordButton = document.getElementById("changePasswordButton");
const resetPasswordButton = document.getElementById("resetPasswordButton");
const signOutButton = document.getElementById("signOutButton");

let currentUser = null;

function showMessage(message, type = "info") {
  pageMessage.textContent = message;
  pageMessage.className = `message ${type}`;
}

async function initializeSecurity() {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    window.location.href = "login.html";
    return;
  }

  currentUser = data.session.user;
}

passwordForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) {
    showMessage("Tafadhali ingia kwenye akaunti yako tena.", "error");
    return;
  }

  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (newPassword.length < 8) {
    showMessage("Password lazima iwe na angalau herufi 8.", "error");
    return;
  }

  if (newPassword !== confirmPassword) {
    showMessage("Password ulizoingiza hazifanani.", "error");
    return;
  }

  changePasswordButton.disabled = true;
  changePasswordButton.textContent = "Inasasisha...";

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  changePasswordButton.disabled = false;
  changePasswordButton.textContent = "Sasisha Password";

  if (error) {
    showMessage("Imeshindikana kubadilisha password: " + error.message, "error");
    return;
  }

  passwordForm.reset();

  showMessage(
    "Password yako imesasishwa kikamilifu.",
    "success"
  );
});

resetPasswordButton.addEventListener("click", async () => {
  if (!currentUser?.email) {
    showMessage("Email ya akaunti haijapatikana.", "error");
    return;
  }

  resetPasswordButton.disabled = true;
  resetPasswordButton.textContent = "Inatuma...";

  const { error } = await supabase.auth.resetPasswordForEmail(
    currentUser.email,
    {
      redirectTo: "https://mrnehemiah.github.io/zune-account-/reset-password.html"
    }
  );

  resetPasswordButton.disabled = false;
  resetPasswordButton.textContent = "Tuma Link ya Kurejesha Password";

  if (error) {
    showMessage("Imeshindikana kutuma link: " + error.message, "error");
    return;
  }

  showMessage(
    "Link ya kurejesha password imetumwa kwenye email yako. Angalia pia Spam/Junk.",
    "success"
  );
});

signOutButton.addEventListener("click", async () => {
  const confirmSignOut = window.confirm(
    "Una uhakika unataka kutoka kwenye akaunti yako?"
  );

  if (!confirmSignOut) return;

  signOutButton.disabled = true;
  signOutButton.textContent = "Unatoka...";

  const { error } = await supabase.auth.signOut();

  if (error) {
    signOutButton.disabled = false;
    signOutButton.textContent = "Sign Out";
    showMessage("Imeshindikana kutoka: " + error.message, "error");
    return;
  }

  window.location.href = "login.html";
});

initializeSecurity();
