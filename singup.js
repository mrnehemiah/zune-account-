
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const SUPABASE_URL = "https://rpkogiieegqgxqbzwxwo.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_2TEqZv-NBM9n5knU46ngqA_wqO3V1uf";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

/* VITU VYA HTML */

const signupForm = document.getElementById("signupForm");
const signupMessage = document.getElementById("signupMessage");

const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");

const passwordInput = document.getElementById("password");
const confirmPasswordInput =
  document.getElementById("confirmPassword");

const acceptTermsInput = document.getElementById("acceptTerms");

const emailGroup = document.getElementById("emailGroup");
const phoneGroup = document.getElementById("phoneGroup");

const emailMethodBtn = document.getElementById("emailMethodBtn");
const phoneMethodBtn = document.getElementById("phoneMethodBtn");

const togglePasswordBtn =
  document.getElementById("togglePassword");

const toggleConfirmPasswordBtn =
  document.getElementById("toggleConfirmPassword");

const signupButton = document.getElementById("signupButton");
const signupButtonText =
  document.getElementById("signupButtonText");

/* HALI YA FOMU */

let signupMethod = "email";
let isSubmitting = false;

/* UJUMBE KWA MTUMIAJI */

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

/* KUBADILISHA HALI YA KITufe */

function setLoading(loading) {
  isSubmitting = loading;

  if (signupButton) {
    signupButton.disabled = loading;
    signupButton.setAttribute(
      "aria-busy",
      String(loading)
    );
  }

  if (signupButtonText) {
    signupButtonText.textContent = loading
      ? "Inatengeneza akaunti..."
      : "Fungua Akaunti";
  }

  if (emailMethodBtn) {
    emailMethodBtn.disabled = loading;
  }

  if (phoneMethodBtn) {
    phoneMethodBtn.disabled = loading;
  }
}

/* KUHAKIKI KUWA HTML IPO */

function checkRequiredElements() {
  const requiredElements = [
    signupForm,
    signupMessage,
    fullNameInput,
    emailInput,
    phoneInput,
    passwordInput,
    confirmPasswordInput,
    acceptTermsInput,
    emailGroup,
    phoneGroup,
    emailMethodBtn,
    phoneMethodBtn,
    togglePasswordBtn,
    toggleConfirmPasswordBtn,
    signupButton,
    signupButtonText
  ];

  return requiredElements.every(Boolean);
}

if (!checkRequiredElements()) {
  console.error(
    "ZUNE Signup: Kuna HTML element inayokosekana. " +
    "Hakikisha IDs za signup.html zinafanana na signup.js."
  );
}

/* KUCHAGUA EMAIL AU SIMU */

function setSignupMethod(method) {
  if (isSubmitting) return;

  signupMethod = method === "phone" ? "phone" : "email";

  const useEmail = signupMethod === "email";

  emailGroup.hidden = !useEmail;
  phoneGroup.hidden = useEmail;

  emailInput.required = useEmail;
  phoneInput.required = !useEmail;

  emailMethodBtn.classList.toggle("active", useEmail);
  phoneMethodBtn.classList.toggle("active", !useEmail);

  emailMethodBtn.setAttribute(
    "aria-pressed",
    String(useEmail)
  );

  phoneMethodBtn.setAttribute(
    "aria-pressed",
    String(!useEmail)
  );

  emailInput.disabled = !useEmail;
  phoneInput.disabled = useEmail;

  hideMessage();
}

emailMethodBtn.addEventListener("click", () => {
  setSignupMethod("email");
});

phoneMethodBtn.addEventListener("click", () => {
  setSignupMethod("phone");
});

/* KUONYESHA AU KUFICHA PASSWORD */

function togglePasswordVisibility(input, button) {
  if (!input || !button) return;

  const shouldShow = input.type === "password";

  input.type = shouldShow ? "text" : "password";
  button.textContent = shouldShow ? "Ficha" : "Onyesha";

  button.setAttribute(
    "aria-pressed",
    String(shouldShow)
  );

  button.setAttribute(
    "aria-label",
    shouldShow ? "Ficha password" : "Onyesha password"
  );
}

togglePasswordBtn.addEventListener("click", () => {
  togglePasswordVisibility(
    passwordInput,
    togglePasswordBtn
  );
});

toggleConfirmPasswordBtn.addEventListener("click", () => {
  togglePasswordVisibility(
    confirmPasswordInput,
    toggleConfirmPasswordBtn
  );
});

/* KUSAFISHA TAARIFA */

function getFullName() {
  return fullNameInput.value.trim().replace(/\s+/g, " ");
}

function getEmail() {
  return emailInput.value.trim().toLowerCase();
}

function getPhone() {
  return phoneInput.value.trim().replace(/[\s()-]/g, "");
}

/* KUHAKIKI JINA */

function validateFullName() {
  const name = getFullName();

  if (name.length < 2) {
    return "Tafadhali andika jina lako kamili.";
  }

  if (name.length > 100) {
    return "Jina lako ni refu sana.";
  }

  return "";
}

/* KUHAKIKI EMAIL */

function validateEmail() {
  const email = getEmail();

  if (!email) {
    return "Tafadhali andika barua pepe yako.";
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return "Tafadhali andika barua pepe iliyo sahihi.";
  }

  if (email.length > 254) {
    return "Barua pepe ni ndefu sana.";
  }

  return "";
}

/* KUHAKIKI NAMBA YA SIMU */

function validatePhone() {
  const phone = getPhone();

  if (!phone) {
    return "Tafadhali andika namba yako ya simu.";
  }

  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    return (
      "Weka namba yenye msimbo wa nchi, " +
      "kwa mfano +255712345678."
    );
  }

  return "";
}

/* KUHAKIKI PASSWORD */

function validatePassword() {
  const password = passwordInput.value;
  const confirmation = confirmPasswordInput.value;

  if (password.length < 8) {
    return "Password lazima iwe na angalau herufi 8.";
  }

  if (password.length > 72) {
    return "Password imezidi urefu unaoruhusiwa.";
  }

  if (/\s/.test(password)) {
    return "Password isiwe na nafasi tupu.";
  }

  if (password !== confirmation) {
    return "Password ulizoweka hazifanani.";
  }

  return "";
}

/* KUHAKIKI MASHARTI */

function validateTerms() {
  if (!acceptTermsInput.checked) {
    return "Tafadhali kubali Masharti ya Matumizi na Sera ya Faragha.";
  }

  return "";
}

/* KUHAKIKI FOMU YOTE */

function validateSignupForm() {
  const nameError = validateFullName();

  if (nameError) return nameError;

  const contactError =
    signupMethod === "email"
      ? validateEmail()
      : validatePhone();

  if (contactError) return contactError;

  const passwordError = validatePassword();

  if (passwordError) return passwordError;

  const termsError = validateTerms();

  if (termsError) return termsError;

  return "";
}

/* KUONDOA UJUMBE WA ZAMANI */

[
  fullNameInput,
  emailInput,
  phoneInput,
  passwordInput,
  confirmPasswordInput
].forEach((input) => {
  input.addEventListener("input", hideMessage);
});

acceptTermsInput.addEventListener("change", hideMessage);

/* KUANZA KWA NJIA YA EMAIL */

setSignupMethod("email");

/* KUUNDA AKAUNTI KUPITIA SUPABASE */

async function createZuneAccount() {
  if (isSubmitting) return;

  hideMessage();

  const validationError = validateSignupForm();

  if (validationError) {
    showMessage(validationError, "error");
    return;
  }

  setLoading(true);

  try {
    const fullName = getFullName();
    const password = passwordInput.value;

    let signupResult;

    if (signupMethod === "email") {
      const email = getEmail();

      signupResult = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            signup_method: "email"
          }
        }
      });
    } else {
      const phone = getPhone();

      signupResult = await supabase.auth.signUp({
        phone,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phone,
            signup_method: "phone"
          }
        }
      });
    }

    const { data, error } = signupResult;

    if (error) {
      console.error("ZUNE signup error:", error);

      showMessage(
        getSignupErrorMessage(error),
        "error"
      );

      return;
    }

    if (!data || !data.user) {
      showMessage(
        "Hatukuweza kuthibitisha akaunti iliyoundwa. Tafadhali jaribu tena.",
        "error"
      );

      return;
    }

    /*
      Supabase inaweza kuunda akaunti bila kuanzisha
      session ikiwa uthibitishaji wa mawasiliano
      bado unahitajika kwenye mipangilio ya mradi.
    */

    if (!data.session) {
      showMessage(
        "Akaunti imepokelewa, lakini bado hujaingia. " +
        "Angalia mipangilio ya uthibitishaji wa Supabase " +
        "au tumia ukurasa wa kuingia kuendelea.",
        "info"
      );

      return;
    }

    /*
      Trigger ya Supabase inaweza kuwa imeunda profile
      yenyewe. Hatutengenezi profile ya pili hapa.
    */

    showMessage(
      "Akaunti yako ya ZUNE imefunguliwa kikamilifu!",
      "success"
    );

    signupForm.reset();

    setSignupMethod("email");

    /*
      Kuelekeza mtumiaji kwenye login baada ya
      kuonyesha ujumbe wa mafanikio.
      Sehemu ya 4 itaunganisha utaratibu huu.
    */

    window.setTimeout(() => {
      window.location.assign("login.html");
    }, 1500);

  } catch (error) {
    console.error("ZUNE signup unexpected error:", error);

    showMessage(
      "Tatizo la muunganisho limetokea. " +
      "Kagua intaneti yako kisha ujaribu tena.",
      "error"
    );

  } finally {
    setLoading(false);
  }
}

/* KUTAFSIRI MAKOSA YA SUPABASE */

function getSignupErrorMessage(error) {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toLowerCase();

  if (
    message.includes("already registered") ||
    message.includes("already been registered") ||
    message.includes("user already exists")
  ) {
    return (
      "Akaunti yenye taarifa hizi huenda tayari ipo. " +
      "Jaribu kuingia kupitia ukurasa wa login."
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
      "Password haikidhi masharti ya usalama ya Supabase. " +
      "Tengeneza password imara zaidi."
    );
  }

  if (
    message.includes("phone") &&
    (
      message.includes("disabled") ||
      message.includes("not enabled")
    )
  ) {
    return (
      "Usajili kwa simu haujawashwa kwenye mipangilio ya " +
      "Supabase Auth. Kagua mipangilio ya Phone provider."
    );
  }

  if (
    message.includes("email") &&
    (
      message.includes("disabled") ||
      message.includes("not enabled")
    )
  ) {
    return (
      "Usajili kwa barua pepe haujawashwa kwenye " +
      "mipangilio ya Supabase Auth."
    );
  }

  if (
    message.includes("phone") &&
    (
      message.includes("otp") ||
      message.includes("sms")
    )
  ) {
    return (
      "Supabase inahitaji mipangilio ya uthibitishaji wa simu. " +
      "Kagua Phone provider na chaguo la uthibitishaji."
    );
  }

  if (
    message.includes("email") &&
    (
      message.includes("confirm") ||
      message.includes("confirmation")
    )
  ) {
    return (
      "Supabase inaonekana kuhitaji uthibitishaji wa email. " +
      "Kagua mipangilio ya uthibitishaji wa email kwenye mradi wako."
    );
  }

  if (code === "429" || message.includes("rate limit")) {
    return (
      "Umejaribu mara nyingi kwa muda mfupi. " +
      "Subiri kidogo kabla ya kujaribu tena."
    );
  }

  return (
    "Usajili haukufanikiwa. Tafadhali kagua taarifa zako " +
    "na mipangilio ya Supabase, kisha ujaribu tena."
  );
}

/* KUTUMA FOMU YA USAJILI */

if (signupForm) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    await createZuneAccount();
  });
}

/* KUZUIA KUTUMA FOMU KWA ENTER MARA NYINGI */

if (signupForm) {
  signupForm.addEventListener("keydown", (event) => {
    if (
      event.key === "Enter" &&
      event.target.tagName !== "TEXTAREA" &&
      isSubmitting
    ) {
      event.preventDefault();
    }
  });
}

/* KUFICHA UJUMBE WAKATI MTUMIAJI ANABADILISHA NJIA */

[emailInput, phoneInput].forEach((input) => {
  if (input) {
    input.addEventListener("change", hideMessage);
  }
});

/* KUHAKIKI HALI YA MWANZO */

function initializeSignupPage() {
  if (!signupForm) {
    console.error(
      "ZUNE Signup: Fomu yenye ID signupForm haijapatikana."
    );
    return;
  }

  setSignupMethod("email");

  if (signupButton) {
    signupButton.disabled = false;
  }

  console.info("ZUNE Signup imeanzishwa.");
}

initializeSignupPage();
