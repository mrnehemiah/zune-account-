
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

const fullNameInput = document.getElementById("fullName");
const phoneNumberInput = document.getElementById("phoneNumber");
const currentEmailInput = document.getElementById("currentEmail");
const newEmailInput = document.getElementById("newEmail");

const personalInfoForm = document.getElementById("personalInfoForm");
const changeEmailButton = document.getElementById("changeEmailButton");
const cancelButton = document.getElementById("cancelButton");

const displayName = document.getElementById("displayName");
const zuneIdElement = document.getElementById("zuneId");
const pageMessage = document.getElementById("pageMessage");

let currentUser = null;
let originalFullName = "";
let originalPhoneNumber = "";

function showMessage(message, type = "info") {
  if (!pageMessage) return;

  pageMessage.textContent = message;
  pageMessage.className = `message ${type}`;
}

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    window.location.href = "login.html";
    return null;
  }

  return data.session.user;
}

async function loadPersonalInfo() {
  currentUser = await getCurrentUser();

  if (!currentUser) return;

  currentEmailInput.value = currentUser.email || "";
  zuneIdElement.textContent = currentUser.id;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone_number, role, is_verified")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) {
    showMessage("Imeshindikana kupata taarifa za akaunti: " + error.message, "error");
    return;
  }

  if (!profile) {
    showMessage("Taarifa za wasifu hazijapatikana kwenye profiles.", "error");
    return;
  }

  originalFullName = profile.full_name || "";
  originalPhoneNumber = profile.phone_number || "";

  fullNameInput.value = originalFullName;
  phoneNumberInput.value = originalPhoneNumber;
  displayName.textContent = originalFullName || "Mtumiaji wa ZUNE";

  const firstLetter = (originalFullName || currentUser.email || "Z")
    .trim()
    .charAt(0)
    .toUpperCase();

  const avatar = document.getElementById("avatar");
  if (avatar) avatar.textContent = firstLetter;
}

personalInfoForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) return;

  const fullName = fullNameInput.value.trim();
  const phoneNumber = phoneNumberInput.value.trim();

  if (!fullName) {
    showMessage("Tafadhali jaza jina lako kamili.", "error");
    return;
  }

  if (
    fullName === originalFullName &&
    phoneNumber === originalPhoneNumber
  ) {
    showMessage("Hakuna mabadiliko mapya ya kuhifadhi.", "info");
    return;
  }

  const saveButton = personalInfoForm.querySelector('button[type="submit"]');

  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = "Inahifadhi...";
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone_number: phoneNumber || null
    })
    .eq("id", currentUser.id)
    .select("id, full_name, phone_number")
    .maybeSingle();

  if (saveButton) {
    saveButton.disabled = false;
    saveButton.textContent = "Hifadhi mabadiliko";
  }

  if (error) {
    showMessage("Imeshindikana kuhifadhi: " + error.message, "error");
    return;
  }

  if (!data) {
    showMessage(
      "Hakuna taarifa iliyosasishwa. Hakikisha sera za RLS zinaruhusu mtumiaji kusasisha wasifu wake.",
      "error"
    );
    return;
  }

  originalFullName = data.full_name || "";
  originalPhoneNumber = data.phone_number || "";

  displayName.textContent = originalFullName || "Mtumiaji wa ZUNE";

  const avatar = document.getElementById("avatar");
  if (avatar) {
    avatar.textContent = (originalFullName || "Z").trim().charAt(0).toUpperCase();
  }

  showMessage("Taarifa zako zimehifadhiwa kikamilifu.", "success");
});

changeEmailButton.addEventListener("click", async () => {
  if (!currentUser) return;

  const newEmail = newEmailInput.value.trim().toLowerCase();

  if (!newEmail) {
    showMessage("Tafadhali ingiza email mpya.", "error");
    return;
  }

  if (newEmail === (currentUser.email || "").toLowerCase()) {
    showMessage("Email hii tayari ndiyo inayotumika.", "info");
    return;
  }

  changeEmailButton.disabled = true;
  changeEmailButton.textContent = "Inatuma ombi...";

  const { error } = await supabase.auth.updateUser({
    email: newEmail
  });

  changeEmailButton.disabled = false;
  changeEmailButton.textContent = "Badilisha Email";

  if (error) {
    showMessage("Imeshindikana kuomba mabadiliko ya email: " + error.message, "error");
    return;
  }

  showMessage(
    "Ombi limetumwa. Fungua email yako na ufuate maelekezo ya uthibitisho kutoka Supabase. Email haitabadilika kikamilifu mpaka uthibitisho ukamilike.",
    "success"
  );

  newEmailInput.value = "";
});

cancelButton.addEventListener("click", () => {
  window.location.href = "account.html";
});

loadPersonalInfo();
