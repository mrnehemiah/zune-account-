"use strict";

const SUPABASE_URL = "https://rpkogiieegqgxqbzwxwo.supabase.co";
const SUPABASE_KEY = "sb_publishable_2TEqZv-NBM9n5knU46ngqA_wqO3V1uf";

const message = document.getElementById("pageMessage");
const form = document.getElementById("verificationForm");
const submitButton = document.getElementById("submitButton");
const retryButton = document.getElementById("retryButton");

const personalSection = document.getElementById("personalSection");
const sellerSection = document.getElementById("sellerSection");

let supabaseClient = null;
let currentUser = null;
let currentSession = null;
let isSubmitting = false;
let pendingApplication = false;

function showMessage(text, type = "info") {
  message.textContent = text;
  message.className = "message " + type;
  message.style.display = "block";

  message.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function hideMessage() {
  message.textContent = "";
  message.className = "message";
  message.style.display = "none";
}

function setButtonState(loading) {
  isSubmitting = loading;
  submitButton.disabled = loading || !currentUser || pendingApplication;

  submitButton.textContent = loading
    ? "Inatuma ombi..."
    : pendingApplication
      ? "Ombi tayari limepokelewa"
      : "Submit Verification Application";
}

function getVerificationType() {
  return document.querySelector(
    'input[name="verificationType"]:checked'
  )?.value || "user";
}

function setFieldRequirements(type) {
  const personalFields = [
    document.getElementById("personalFullName"),
    document.getElementById("personalDocumentType")
  ];

  const sellerFields = [
    document.getElementById("sellerFullName"),
    document.getElementById("storeName"),
    document.getElementById("businessCategory"),
    document.getElementById("sellerCountry"),
    document.getElementById("sellerRegion"),
    document.getElementById("sellerDistrict"),
    document.getElementById("storeAddress"),
    document.getElementById("sellerDocumentType")
  ];

  personalFields.forEach(field => {
    field.required = type === "user";
  });

  sellerFields.forEach(field => {
    field.required = type === "seller";
  });
}

function switchVerificationForm() {
  const type = getVerificationType();

  personalSection.classList.toggle("active", type === "user");
  sellerSection.classList.toggle("active", type === "seller");

  setFieldRequirements(type);
  hideMessage();

  if (pendingApplication) {
    submitButton.disabled = true;
    submitButton.textContent = "Ombi tayari limepokelewa";
  } else {
    submitButton.disabled = !currentUser || isSubmitting;
    submitButton.textContent = "Submit Verification Application";
  }
}

function showError(error, context) {
  console.error(context, error);

  const details = [
    error?.message || "Hitilafu isiyojulikana",
    error?.code ? "Code: " + error.code : "",
    error?.details || "",
    error?.hint || ""
  ].filter(Boolean).join(" | ");

  showMessage("Imeshindikana kutuma ombi: " + details, "error");
}

async function getValidSession() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    throw error;
  }

  if (!data.session || !data.session.user) {
    throw new Error(
      "Hujawaingia kwenye ZUNE Account. Tafadhali ingia kwanza."
    );
  }

  currentSession = data.session;
  currentUser = data.session.user;

  return data.session;
}

async function loadProfileName() {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("full_name")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) {
    console.warn("Profile lookup warning:", error);
    return "";
  }

  return data?.full_name || "";
}

async function checkExistingApplication(type) {
  const { data, error } = await supabaseClient
    .from("verification_requests")
    .select("id, status, created_at")
    .eq("user_id", currentUser.id)
    .eq("role", type)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  return data && data.length > 0 ? data[0] : null;
}

async function refreshPendingStatus() {
  const type = getVerificationType();
  const existing = await checkExistingApplication(type);

  pendingApplication = Boolean(existing);

  if (existing) {
    showMessage(
      "Ombi lako la " +
      (type === "seller" ? "Seller Verification" : "Personal Verification") +
      " tayari limepokelewa. Linasubiri kukaguliwa na Admin wa ZUNE.",
      "success"
    );
  } else {
    hideMessage();
  }

  setButtonState(false);
}

function getPersonalApplication() {
  const fullName = document
    .getElementById("personalFullName")
    .value.trim();

  const documentType = document
    .getElementById("personalDocumentType")
    .value;

  const documentNumber = document
    .getElementById("personalDocumentNumber")
    .value.trim();

  const reason = document
    .getElementById("personalReason")
    .value.trim();

  if (!fullName || !documentType) {
    throw new Error(
      "Jaza jina kamili na chagua aina ya kitambulisho."
    );
  }

  if (fullName.length < 3) {
    throw new Error("Jina kamili lazima liwe na herufi angalau 3.");
  }

  return {
    full_name: fullName,
    document_type: documentType,
    document_number: documentNumber || null,
    reason: reason || "Personal Verification Application"
  };
}

function getSellerApplication() {
  const fullName = document
    .getElementById("sellerFullName")
    .value.trim();

  const storeName = document
    .getElementById("storeName")
    .value.trim();

  const category = document
    .getElementById("businessCategory")
    .value;

  const country = document
    .getElementById("sellerCountry")
    .value;

  const region = document
    .getElementById("sellerRegion")
    .value.trim();

  const district = document
    .getElementById("sellerDistrict")
    .value.trim();

  const address = document
    .getElementById("storeAddress")
    .value.trim();

  const documentType = document
    .getElementById("sellerDocumentType")
    .value;

  const documentNumber = document
    .getElementById("sellerDocumentNumber")
    .value.trim();

  const reason = document
    .getElementById("sellerReason")
    .value.trim();

  if (
    !fullName ||
    !storeName ||
    !category ||
    !country ||
    !region ||
    !district ||
    !address ||
    !documentType
  ) {
    throw new Error(
      "Tafadhali jaza taarifa zote zinazohitajika za biashara."
    );
  }

  if (fullName.length < 3 || storeName.length < 2) {
    throw new Error(
      "Jina la mmiliki au jina la duka si sahihi."
    );
  }

  const businessDetails = [
    "SELLER VERIFICATION APPLICATION",
    "",
    "STORE NAME: " + storeName,
    "BUSINESS CATEGORY: " + category,
    "COUNTRY: " + country,
    "REGION: " + region,
    "DISTRICT/CITY: " + district,
    "STORE ADDRESS: " + address,
    "DOCUMENT TYPE: " + documentType,
    "DOCUMENT NUMBER: " + (documentNumber || "Not provided"),
    "",
    "SELLER DESCRIPTION:",
    reason || "No additional description provided."
  ].join("\n");

  return {
    full_name: fullName,
    document_type: documentType,
    document_number: documentNumber || null,
    reason: businessDetails
  };
}

async function submitApplication(event) {
  event.preventDefault();

  if (isSubmitting) return;

  try {
    if (!currentUser) {
      throw new Error(
        "Hujawaingia kwenye akaunti. Ingia tena kisha ujaribu."
      );
    }

    setButtonState(true);
    hideMessage();

    const session = await getValidSession();

    if (session.user.id !== currentUser.id) {
      throw new Error(
        "Session imebadilika. Tafadhali ingia tena."
      );
    }

    const type = getVerificationType();

    if (!["user", "seller"].includes(type)) {
      throw new Error("Aina ya verification si sahihi.");
    }

    const existing = await checkExistingApplication(type);

    if (existing) {
      pendingApplication = true;

      showMessage(
        "Tayari una ombi la aina hii linalosubiri kukaguliwa na Admin.",
        "success"
      );

      setButtonState(false);
      return;
    }

    const details = type === "seller"
      ? getSellerApplication()
      : getPersonalApplication();

    const application = {
      user_id: currentUser.id,
      full_name: details.full_name,
      document_type: details.document_type,
      document_number: details.document_number,
      reason: details.reason,
      role: type,
      status: "pending",
      updated_at: new Date().toISOString()
    };

    showMessage(
      "Taarifa zimekamilika. Tunatuma ombi lako kwa Supabase...",
      "info"
    );

    const { data, error } = await supabaseClient
      .from("verification_requests")
      .insert([application])
      .select("id, status, created_at")
      .single();

    if (error) {
      throw error;
    }

    if (!data || !data.id) {
      throw new Error(
        "Supabase haikurudisha uthibitisho wa kuhifadhi ombi."
      );
    }

    console.log("ZUNE VERIFICATION SAVED:", data);

    pendingApplication = true;

    form.reset();

    document.querySelector(
      'input[name="verificationType"][value="user"]'
    ).checked = true;

    switchVerificationForm();

    showMessage(
      "Hongera! Ombi lako la " +
      (type === "seller" ? "Seller Verification" : "Personal Verification") +
      " limehifadhiwa kikamilifu. Namba ya ombi: " +
      data.id +
      ". Hali: PENDING. Admin wa ZUNE atalipitia.",
      "success"
    );

    setButtonState(false);

  } catch (error) {
    showError(error, "VERIFICATION SUBMISSION ERROR");
    setButtonState(false);
  }
}

async function initializeVerification() {
  try {
    if (!window.supabase) {
      throw new Error(
        "Supabase library haijapakiwa. Angalia internet na jaribu tena."
      );
    }

    if (!form || !message || !submitButton) {
      throw new Error(
        "Baadhi ya vipengele vya verification.html havijapatikana."
      );
    }

    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

    document.querySelectorAll(
      'input[name="verificationType"]'
    ).forEach(radio => {
      radio.addEventListener("change", async () => {
        switchVerificationForm();

        if (currentUser) {
          try {
            await refreshPendingStatus();
          } catch (error) {
            showError(error, "PENDING APPLICATION CHECK");
          }
        }
      });
    });

    form.addEventListener("submit", submitApplication);

    retryButton.addEventListener("click", () => {
      window.location.reload();
    });

    setFieldRequirements("user");

    showMessage(
      "Tunaangalia akaunti yako ya ZUNE...",
      "info"
    );

    submitButton.disabled = true;

    await getValidSession();

    const profileName = await loadProfileName();

    if (profileName) {
      document.getElementById("personalFullName").value = profileName;
      document.getElementById("sellerFullName").value = profileName;
    } else {
      const metadataName =
        currentUser.user_metadata?.full_name ||
        currentUser.user_metadata?.name ||
        "";

      document.getElementById("personalFullName").value = metadataName;
      document.getElementById("sellerFullName").value = metadataName;
    }

    await refreshPendingStatus();

    retryButton.classList.add("hidden");

  } catch (error) {
    console.error("VERIFICATION INITIALIZATION ERROR:", error);

    submitButton.disabled = true;

    showError(error, "INITIALIZATION ERROR");

    retryButton.classList.remove("hidden");

    if (
      error.message?.includes("Hujawaingia") ||
      error.message?.includes("JWT")
    ) {
      showMessage(
        "Hujawaingia kwenye ZUNE Account. Tafadhali ingia kwanza kupitia ukurasa wa Login.",
        "error"
      );

      retryButton.textContent = "Fungua Login";
      retryButton.classList.remove("hidden");

      retryButton.onclick = () => {
        window.location.href = "login.html";
      };
    }
  }
}

initializeVerification();