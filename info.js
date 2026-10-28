
import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/* Supabase configuration */
const SUPABASE_URL =
  "https://rpkogiieegqgxqbzwxwo.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_2TEqZv-NBM9n5knU46ngqA_wqO3V1uf";

/* Tumia session iliyopo ya Supabase */
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

/* HTML elements */
const form = document.getElementById("personalInfoForm");
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phoneNumber");
const zuneIdInput = document.getElementById("zuneId");
const accountRoleInput = document.getElementById("accountRole");

const profileAvatar = document.getElementById("profileAvatar");
const profileDisplayName =
  document.getElementById("profileDisplayName");
const profileDisplayEmail =
  document.getElementById("profileDisplayEmail");

const zuneIdBadge = document.getElementById("zuneIdBadge");
const accountStatus = document.getElementById("accountStatus");
const pageMessage = document.getElementById("pageMessage");

const saveInfoBtn = document.getElementById("saveInfoBtn");
const saveBtnText = document.getElementById("saveBtnText");
const resetInfoBtn = document.getElementById("resetInfoBtn");

/* Hali ya ukurasa */
let currentUser = null;
let originalValues = null;
let isSaving = false;

/* Onyesha ujumbe kwenye ukurasa */
function showMessage(message, type = "info") {
  if (!pageMessage) return;

  pageMessage.textContent = message;
  pageMessage.className = `message-box ${type}`;
  pageMessage.hidden = false;
}

/* Ficha ujumbe */
function hideMessage() {
  if (!pageMessage) return;

  pageMessage.hidden = true;
  pageMessage.textContent = "";
  pageMessage.className = "message-box";
}

/* Zuia vitufe wakati wa kuhifadhi */
function setSavingState(saving) {
  isSaving = saving;

  if (saveInfoBtn) {
    saveInfoBtn.disabled = saving;
  }

  if (saveBtnText) {
    saveBtnText.textContent = saving
      ? "Inahifadhi..."
      : "Hifadhi Mabadiliko";
  }

  if (resetInfoBtn) {
    resetInfoBtn.disabled = saving;
  }
}

/* Andaa maandishi kwa kuonyesha */
function safeText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim() || fallback;
}

/* Onyesha herufi ya kwanza ya jina */
function getInitial(name) {
  const cleanedName = safeText(name, "ZUNE");

  return Array.from(cleanedName)[0].toUpperCase();
}

/* Pata jina la kuonyesha */
function getDisplayName(profile, user) {
  return safeText(
    profile?.full_name,
    safeText(
      user?.user_metadata?.full_name,
      safeText(user?.user_metadata?.name, "Mtumiaji wa ZUNE")
    )
  );
}

/* Hakikisha mtumiaji ameingia */
async function getAuthenticatedUser() {
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session?.user) {
    window.location.replace("login.html");
    return null;
  }

  currentUser = session.user;
  return currentUser;
}

/* Soma profile ya mtumiaji aliyeingia pekee */
async function loadUserProfile() {
  hideMessage();

  try {
    const user = await getAuthenticatedUser();

    if (!user) return;

    const {
      data: profile,
      error: profileError
    } = await supabase
      .from("profiles")
      .select("id, full_name, phone_number, role, is_verified")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile loading error:", profileError);
      showMessage(
        "Imeshindikana kupakia taarifa zako. Tafadhali jaribu tena.",
        "error"
      );
      return;
    }

    if (!profile) {
      showMessage(
        "Taarifa za wasifu hazijapatikana. Hakikisha akaunti yako imesanidiwa vizuri.",
        "error"
      );
      return;
    }

    populateProfile(user, profile);
  } catch (error) {
    console.error("Account loading error:", error);

    showMessage(
      "Kuna tatizo la kuunganisha akaunti. Tafadhali jaribu tena.",
      "error"
    );
  }
}

/* Jaza fomu kwa taarifa za akaunti */
function populateProfile(user, profile) {
  const displayName = getDisplayName(profile, user);
  const email = safeText(user.email, "Hakuna barua pepe");

  const phone = safeText(profile.phone_number, "");

  if (fullNameInput) {
    fullNameInput.value = safeText(profile.full_name, "");
  }

  if (emailInput) {
    emailInput.value = email;
  }

  if (phoneInput) {
    phoneInput.value = phone;
  }

  /*
   * UUID ya mtumiaji ndiyo utambulisho wa akaunti.
   * Usibuni ZUNE ID tofauti bila mfumo rasmi wa ID.
   */
  if (zuneIdInput) {
    zuneIdInput.value = user.id;
  }

  if (accountRoleInput) {
    accountRoleInput.value = formatRole(profile.role);
  }

  if (profileAvatar) {
    profileAvatar.textContent = getInitial(displayName);
  }

  if (profileDisplayName) {
    profileDisplayName.textContent = displayName;
  }

  if (profileDisplayEmail) {
    profileDisplayEmail.textContent = email;
  }

  if (zuneIdBadge) {
    zuneIdBadge.textContent =
      `ZUNE ID: ${user.id.slice(0, 8).toUpperCase()}`;
  }

  if (accountStatus) {
    const verified = profile.is_verified === true;

    accountStatus.textContent = verified
      ? "✓ Akaunti imethibitishwa"
      : "Akaunti ya ZUNE";
  }

  /* Hifadhi nakala ya awali kwa ajili ya reset */
  originalValues = {
    fullName: fullNameInput?.value ?? "",
    phoneNumber: phoneInput?.value ?? ""
  };
}

/* Geuza role kuwa maandishi yanayoeleweka */
function formatRole(role) {
  const roles = {
    buyer: "Mnunuzi",
    vendor: "Muuzaji",
    admin: "Msimamizi"
  };

  return roles[role] || "Mtumiaji";
}

/* Anza kupakia taarifa */
loadUserProfile();

/* Hakiki taarifa kabla ya kuhifadhi */
function validateProfileForm() {
  const fullName = safeText(fullNameInput?.value, "");
  const phoneNumber = safeText(phoneInput?.value, "");

  if (fullName.length < 2) {
    showMessage(
      "Tafadhali andika jina kamili lenye angalau herufi mbili.",
      "error"
    );
    fullNameInput?.focus();
    return null;
  }

  if (fullName.length > 100) {
    showMessage(
      "Jina limezidi urefu unaoruhusiwa.",
      "error"
    );
    fullNameInput?.focus();
    return null;
  }

  if (phoneNumber.length > 20) {
    showMessage(
      "Namba ya simu ni ndefu sana.",
      "error"
    );
    phoneInput?.focus();
    return null;
  }

  if (
    phoneNumber &&
    !/^[+()\d\s-]+$/.test(phoneNumber)
  ) {
    showMessage(
      "Tafadhali hakiki muundo wa namba ya simu.",
      "error"
    );
    phoneInput?.focus();
    return null;
  }

  return {
    full_name: fullName,
    phone_number: phoneNumber || null
  };
}

/* Hifadhi taarifa za mtumiaji aliyeingia */
async function saveProfileChanges(event) {
  event.preventDefault();

  if (isSaving) return;

  hideMessage();

  const updates = validateProfileForm();

  if (!updates) return;

  setSavingState(true);

  try {
    /* Hakiki session upya kabla ya kuhifadhi */
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError) throw authError;

    if (!user) {
      showMessage(
        "Session yako imeisha. Tafadhali ingia tena.",
        "error"
      );

      window.location.replace("login.html");
      return;
    }

    /*
     * Tumia ID ya mtumiaji aliyeingia.
     * Usibadilishe role, email au is_verified hapa.
     */
    const {
      data: updatedProfile,
      error: updateError
    } = await supabase
      .from("profiles")
      .update({
        full_name: updates.full_name,
        phone_number: updates.phone_number
      })
      .eq("id", user.id)
      .select("id, full_name, phone_number, role, is_verified")
      .maybeSingle();

    if (updateError) {
      console.error("Profile update error:", updateError);

      showMessage(
        "Imeshindikana kuhifadhi taarifa. Hakikisha sera za RLS za profiles zinaruhusu mtumiaji kusasisha taarifa zake.",
        "error"
      );

      return;
    }

    if (!updatedProfile) {
      showMessage(
        "Hakuna taarifa iliyosasishwa. Hakikisha akaunti yako ina ruhusa ya kubadilisha taarifa hizi.",
        "error"
      );

      return;
    }

    currentUser = user;

    populateProfile(user, updatedProfile);

    showMessage(
      "Taarifa zako zimehifadhiwa kikamilifu.",
      "success"
    );
  } catch (error) {
    console.error("Save profile error:", error);

    showMessage(
      "Hitilafu imetokea wakati wa kuhifadhi. Angalia muunganisho wa intaneti kisha ujaribu tena.",
      "error"
    );
  } finally {
    setSavingState(false);
  }
}

/* Unganisha fomu na kitendo cha kuhifadhi */
if (form) {
  form.addEventListener("submit", saveProfileChanges);
}

/* Rejesha taarifa zilizohifadhiwa kwenye fomu */
if (form) {
  form.addEventListener("reset", (event) => {
    /*
     * Ruhusu reset ya kawaida kwanza,
     * kisha rejesha thamani zilizopakiwa kutoka Supabase.
     */
    window.setTimeout(() => {
      if (!originalValues) return;

      if (fullNameInput) {
        fullNameInput.value = originalValues.fullName;
      }

      if (phoneInput) {
        phoneInput.value = originalValues.phoneNumber;
      }

      hideMessage();
    }, 0);
  });
}

/* Ondoa ujumbe wa zamani mtumiaji anapoanza kuhariri */
[fullNameInput, phoneInput].forEach((input) => {
  if (!input) return;

  input.addEventListener("input", () => {
    hideMessage();
  });
});

/* Linda dhidi ya kutuma fomu mara nyingi */
if (form) {
  form.addEventListener("submit", (event) => {
    if (isSaving) {
      event.preventDefault();
    }
  });
}

/* Taarifa za hitilafu zionekane kwenye console kwa ukaguzi */
window.addEventListener("unhandledrejection", (event) => {
  console.error(
    "ZUNE info.js unhandled error:",
    event.reason
  );
});

/* Mwisho wa ZUNE info.js */
console.info("ZUNE Personal Information module loaded.");
