
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/* =====================================
   1. SUPABASE CONFIGURATION
===================================== */

const SUPABASE_URL =
  "https://rpkogiieegqgxqbzwxwo.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_2TEqZv-NBM9n5knU46ngqA_wqO3V1uf";

const MARKETPLACE_URL =
  "https://mrnehemiah.github.io/";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

/* =====================================
   2. HTML ELEMENTS
===================================== */

const signupForm = document.getElementById("signupForm");
const signupMessage = document.getElementById("signupMessage");

const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");

const passwordInput = document.getElementById("password");
const confirmPasswordInput =
  document.getElementById("confirmPassword");

const acceptTermsInput =
  document.getElementById("acceptTerms");

const signupButton =
  document.getElementById("signupButton");

const signupButtonText =
  document.getElementById("signupButtonText");

/* =====================================
   3. HALI YA USAJILI
===================================== */

let isSubmitting = false;
let redirecting = false;

/* =====================================
   4. UJUMBE KWA MTEJA
===================================== */

function showMessage(message, type = "info") {
  if (!signupMessage) return;

  signupMessage.textContent = message;
  signupMessage.className = `message-box ${type}`;
  signupMessage.hidden = false;

  signupMessage.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
}

function hideMessage() {
  if (!signupMessage) return;

  signupMessage.textContent = "";
  signupMessage.hidden = true;
  signupMessage.className = "message-box";
}

/* =====================================
   5. HALI YA KITufe
===================================== */

function setLoading(loading) {
  isSubmitting = loading;

  if (signupButton) {
    signupButton.disabled = loading || redirecting;
    signupButton.setAttribute(
      "aria-busy",
      String(loading || redirecting)
    );
  }

  if (signupButtonText) {
    if (redirecting) {
      signupButtonText.textContent = "Unaelekezwa sokoni...";
    } else {
      signupButtonText.textContent = loading
        ? "Inatengeneza akaunti..."
        : "Fungua Akaunti";
    }
  }
}

/* =====================================
   6. KUSAFISHA TAARIFA
===================================== */

function getFullName() {
  return (fullNameInput?.value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function getEmail() {
  return (emailInput?.value || "")
    .trim()
    .toLowerCase();
}

function getPhone() {
  return (phoneInput?.value || "")
    .trim()
    .replace(/[\s()-]/g, "");
}

/* =====================================
   7. KUHAKIKI FOMU
===================================== */

function validateForm() {
  const fullName = getFullName();
  const email = getEmail();
  const phone = getPhone();
  const password = passwordInput?.value || "";
  const confirmation = confirmPasswordInput?.value || "";

  if (fullName.length < 2 || fullName.length > 100) {
    return "Tafadhali andika jina lako kamili.";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email) || email.length > 254) {
    return "Tafadhali andika barua pepe iliyo sahihi.";
  }

  /*
    Namba ihifadhiwe katika muundo wa kimataifa.
    Mfano: +255712345678
  */

  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    return (
      "Andika namba ya simu yenye msimbo wa nchi. " +
      "Mfano: +255712345678."
    );
  }

  if (password.length < 8) {
    return "Password lazima iwe na angalau herufi 8.";
  }

  if (password.length > 72) {
    return "Password ni ndefu sana.";
  }

  if (/\s/.test(password)) {
    return "Password isiwe na nafasi tupu.";
  }

  if (password !== confirmation) {
    return "Password ulizoweka hazifanani.";
  }

  if (!acceptTermsInput?.checked) {
    return (
      "Tafadhali kubali Masharti ya Matumizi " +
      "na Sera ya Faragha."
    );
  }

  return "";
}

/* =====================================
   8. KUTAFSIRI MAKOSA YA SUPABASE
===================================== */

function getErrorMessage(error) {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toLowerCase();

  if (
    message.includes("already registered") ||
    message.includes("already been registered") ||
    message.includes("user already exists")
  ) {
    return (
      "Akaunti yenye email hii huenda tayari ipo. " +
      "Jaribu kuingia kupitia ukurasa wa Login."
    );
  }

  if (
    message.includes("password") &&
    (
      message.includes("weak") ||
      message.includes("short") ||
      message.includes("characters")
    )
  ) {
    return (
      "Password haikidhi masharti ya usalama. " +
      "Tafadhali tumia password imara zaidi."
    );
  }

  if (
    message.includes("phone") &&
    (
      message.includes("invalid") ||
      message.includes("format")
    )
  ) {
    return "Kagua muundo wa namba yako ya simu.";
  }

  if (
    message.includes("rate limit") ||
    code === "429"
  ) {
    return (
      "Umejaribu mara nyingi kwa muda mfupi. " +
      "Subiri kidogo kisha ujaribu tena."
    );
  }

  if (
    message.includes("network") ||
    message.includes("fetch")
  ) {
    return (
      "Tatizo la intaneti limetokea. " +
      "Kagua muunganisho wako."
    );
  }

  console.error("ZUNE signup error:", error);

  return (
    "Usajili haukufanikiwa. Tafadhali kagua taarifa zako " +
    "na mipangilio ya Supabase kisha ujaribu tena."
  );
}

/* =====================================
   9. KUELEKEZA ZUNE MARKETPLACE
===================================== */

function redirectToMarketplace() {
  redirecting = true;
  setLoading(false);

  showMessage(
    "Akaunti yako imefunguliwa! " +
    "Unaelekezwa ZUNE Marketplace...",
    "success"
  );

  setLoading(false);

  window.setTimeout(() => {
    window.location.replace(MARKETPLACE_URL);
  }, 1200);
}

/* =====================================
   10. KUTENGENEZA AKAUNTI
===================================== */

async function createAccount(event) {
  event.preventDefault();

  if (isSubmitting || redirecting) return;

  hideMessage();

  const validationError = validateForm();

  if (validationError) {
    showMessage(validationError, "error");
    return;
  }

  setLoading(true);

  try {
    const fullName = getFullName();
    const email = getEmail();
    const phone = getPhone();
    const password = passwordInput.value;

    /*
      Email ndiyo kitambulisho cha msingi cha Supabase Auth.
      Namba ya simu inahifadhiwa kwenye user metadata.
      Hatutumii OTP kwenye code hii.
    */

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phone
        }
      }
    });

    if (error) {
      showMessage(getErrorMessage(error), "error");
      return;
    }

    if (!data?.user) {
      showMessage(
        "Akaunti haikuweza kuthibitishwa. Tafadhali jaribu tena.",
        "error"
      );
      return;
    }

    /*
      Session ikiwa ipo, mteja tayari ameingia.
    */

    if (data.session) {
      redirectToMarketplace();
      return;
    }

    /*
      Hakuna session: huenda Supabase inahitaji email
      ithibitishwe au haijaanzisha login ya moja kwa moja.
    */

    showMessage(
      "Akaunti imeundwa, lakini Supabase haijakuingiza moja kwa moja. " +
      "Ili kuendelea bila uthibitishaji, kagua mipangilio ya " +
      "Email Confirmations kwenye Supabase Auth. " +
      "Unaweza pia kuingia kupitia ukurasa wa Login.",
      "info"
    );

  } catch (error) {
    console.error("ZUNE signup unexpected error:", error);

    showMessage(
      "Tatizo limetokea wakati wa kutengeneza akaunti. " +
      "Kagua intaneti yako kisha ujaribu tena.",
      "error"
    );

  } finally {
    setLoading(false);
  }
}

/* =====================================
   11. KUSIKILIZA FOMU
===================================== */

if (signupForm) {
  signupForm.addEventListener("submit", createAccount);
} else {
  console.error(
    "ZUNE Signup: signupForm haijapatikana kwenye HTML."
  );
}

/* =====================================
   12. KUFUTA UJUMBE WA ZAMANI
===================================== */

[
  fullNameInput,
  emailInput,
  phoneInput,
  passwordInput,
  confirmPasswordInput
].forEach((input) => {
  input?.addEventListener("input", hideMessage);
});

acceptTermsInput?.addEventListener("change", hideMessage);

/* =====================================
   13. KUHAKIKI HTML
===================================== */

function initializeSignup() {
  const requiredElements = [
    signupForm,
    signupMessage,
    fullNameInput,
    emailInput,
    phoneInput,
    passwordInput,
    confirmPasswordInput,
    acceptTermsInput,
    signupButton,
    signupButtonText
  ];

  if (requiredElements.some((element) => !element)) {
    console.error(
      "ZUNE Signup: Kuna HTML element inayokosekana. " +
      "Hakikisha IDs za signup.html zinafanana na signup.js."
    );

    if (signupButton) {
      signupButton.disabled = true;
    }

    if (signupMessage) {
      showMessage(
        "Fomu ya usajili haijakamilika. Tafadhali kagua signup.html.",
        "error"
      );
    }

    return;
  }

  console.info("ZUNE Signup imeanzishwa.");
}

initializeSignup();
