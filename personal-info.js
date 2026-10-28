
import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL =
  "https://rpkogiieegqgxqbzwxwo.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_2TEqZv-NBM9n5knU46ngqA_wqO3V1uf";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

const $ = (id) => document.getElementById(id);

const form = $("personalInfoForm");
const saveButton = $("saveButton");
const saveButtonText = $("saveButtonText");
const resetButton = $("resetButton");

let currentUser = null;
let savedFullName = "";
let savedPhoneNumber = "";
let accountLoaded = false;

function showMessage(message, type = "info") {
  const element = $("pageMessage");

  if (!element) return;

  element.textContent = message;
  element.className = `status-message visible ${type}`;
}

function setText(id, value, fallback = "Haijawekwa") {
  const element = $(id);

  if (element) {
    element.textContent = value || fallback;
  }
}

function setInput(id, value) {
  const element = $(id);

  if (element) {
    element.value = value || "";
  }
}

function getInitial(name) {
  return (name || "Z").trim().charAt(0).toUpperCase() || "Z";
}

function updateBanner(name, email) {
  setText("bannerName", name, "Mtumiaji wa ZUNE");
  setText("bannerEmail", email, "Hakuna email");
  setText("profileAvatar", getInitial(name), "Z");
}

function setSaving(isSaving) {
  if (!saveButton || !saveButtonText) return;

  saveButton.disabled = isSaving;
  saveButtonText.textContent = isSaving
    ? "Inahifadhi..."
    : "Hifadhi Mabadiliko";
}

async function loadPersonalInfo() {
  accountLoaded = false;
  showMessage("Inapakia taarifa zako kutoka Supabase...");

  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Session error:", sessionError);
    showMessage(
      "Imeshindikana kuthibitisha akaunti. Tafadhali jaribu tena.",
      "error"
    );
    return;
  }

  if (!session?.user) {
    window.location.replace("login.html");
    return;
  }

  currentUser = session.user;

  const email = currentUser.email || "";
  let fullName =
    currentUser.user_metadata?.full_name ||
    currentUser.user_metadata?.name ||
    "";

  let phoneNumber =
    currentUser.phone ||
    currentUser.user_metadata?.phone_number ||
    "";

  let role = "Mtumiaji";

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, phone_number, role")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (profileError) {
    console.error("Profile loading error:", profileError);

    showMessage(
      "Akaunti imepatikana, lakini taarifa za profile hazikusomeka. " +
      "Angalia ruhusa za kusoma profiles kwenye Supabase.",
      "error"
    );

    // Bado onyesha taarifa za msingi zinazopatikana kutoka Auth.
    // Usihifadhi mabadiliko bila kusoma profile kwa mafanikio.
    setInput("fullName", fullName);
    setInput("email", email);
    setInput("phoneNumber", phoneNumber);
    setInput("zuneId", currentUser.id);
    setInput("accountRole", role);

    updateBanner(fullName || email.split("@")[0], email);
    saveButton.disabled = true;
    resetButton.disabled = true;
    return;
  }

  if (profile) {
    fullName = profile.full_name || fullName;
    phoneNumber = profile.phone_number || phoneNumber;
    role = profile.role || role;
  } else {
    // Profile haipo. Tusijaribu kuiunda au kubadilisha data moja kwa moja.
    showMessage(
      "Profile haijapatikana kwenye jedwali la profiles. " +
      "Hakuna data iliyobadilishwa.",
      "error"
    );

    setInput("fullName", fullName);
    setInput("email", email);
    setInput("phoneNumber", phoneNumber);
    setInput("zuneId", currentUser.id);
    setInput("accountRole", role);

    updateBanner(fullName || email.split("@")[0], email);
    saveButton.disabled = true;
    resetButton.disabled = true;
    return;
  }

  savedFullName = fullName;
  savedPhoneNumber = phoneNumber;

  setInput("fullName", fullName);
  setInput("email", email);
  setInput("phoneNumber", phoneNumber);
  setInput("zuneId", currentUser.id);
  setInput("accountRole", role);

  updateBanner(
    fullName || email.split("@")[0] || "Mtumiaji wa ZUNE",
    email
  );

  saveButton.disabled = false;
  resetButton.disabled = false;
  accountLoaded = true;

  showMessage("Taarifa zako zimepakiwa kikamilifu.", "success");
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser || !accountLoaded) {
    showMessage(
      "Taarifa hazijapakiwa kikamilifu. Tafadhali pakia ukurasa tena.",
      "error"
    );
    return;
  }

  const fullName = $("fullName").value.trim();
  const phoneNumber = $("phoneNumber").value.trim();

  if (fullName.length < 2) {
    showMessage(
      "Tafadhali andika jina kamili lenye angalau herufi mbili.",
      "error"
    );
    $("fullName").focus();
    return;
  }

  if (fullName.length > 100) {
    showMessage("Jina ni refu sana. Tumia herufi zisizozidi 100.", "error");
    $("fullName").focus();
    return;
  }

  if (phoneNumber.length > 20) {
    showMessage(
      "Namba ya simu ni ndefu sana. Tafadhali hakiki namba yako.",
      "error"
    );
    $("phoneNumber").focus();
    return;
  }

  setSaving(true);
  showMessage("Inahifadhi taarifa zako...");

  try {
    // Sasisha profile ya mtumiaji aliyeingia pekee.
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone_number: phoneNumber || null
      })
      .eq("id", currentUser.id)
      .select("id, full_name, phone_number")
      .maybeSingle();

    if (error) {
      console.error("Profile update error:", error);

      showMessage(
        "Taarifa hazijahifadhiwa. Supabase imekataa mabadiliko " +
        "au kuna tatizo la mtandao. Hakiki ruhusa za UPDATE kwenye " +
        "profiles. Maelezo: " + error.message,
        "error"
      );

      return;
    }

    if (!data) {
      showMessage(
        "Hakuna taarifa iliyobadilishwa. Hakiki sera za RLS " +
        "za jedwali la profiles.",
        "error"
      );
      return;
    }

    savedFullName = data.full_name || "";
    savedPhoneNumber = data.phone_number || "";

    setInput("fullName", savedFullName);
    setInput("phoneNumber", savedPhoneNumber);

    updateBanner(
      savedFullName || currentUser.email?.split("@")[0],
      currentUser.email || ""
    );

    showMessage("Mabadiliko yako yamehifadhiwa kikamilifu.", "success");
  } catch (error) {
    console.error("Unexpected save error:", error);

    showMessage(
      "Hitilafu ya mtandao imetokea. Tafadhali jaribu tena.",
      "error"
    );
  } finally {
    setSaving(false);
  }
});

resetButton?.addEventListener("click", () => {
  if (!accountLoaded) {
    showMessage("Taarifa zilizohifadhiwa bado hazijapatikana.", "error");
    return;
  }

  setInput("fullName", savedFullName);
  setInput("phoneNumber", savedPhoneNumber);

  showMessage(
    "Umerudisha taarifa zilizohifadhiwa mwisho. Bado hazijabadilishwa.",
    "info"
  );
});

supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT" || !session?.user) {
    window.location.replace("login.html");
  }
});

loadPersonalInfo().catch((error) => {
  console.error("Personal info loading error:", error);

  showMessage(
    "Kuna tatizo la kupakia taarifa zako. Tafadhali jaribu tena.",
    "error"
  );
});
