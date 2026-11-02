"use strict";

// =====================================================
// ZUNE ACCOUNT — VERIFICATION SYSTEM
// Personal Verification + Approved Seller Verification
// =====================================================

const SUPABASE_URL = "https://rpkogiieegqgxqbzwxwo.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_2TEqZv-NBM9n5knU46ngqA_wqO3V1uf";

// =====================================================
// ELEMENTS
// =====================================================

const message = document.getElementById("pageMessage");
const form = document.getElementById("verificationForm");
const submitButton = document.getElementById("submitButton");
const retryButton = document.getElementById("retryButton");

const personalSection = document.getElementById("personalSection");
const sellerSection = document.getElementById("sellerSection");

const typeUser = document.getElementById("typeUser");
const typeSeller = document.getElementById("typeSeller");
const sellerOption = document.getElementById("sellerOption");
const sellerOptionDescription =
  document.getElementById("sellerOptionDescription");

const formHeading = document.getElementById("formHeading");
const formDescription = document.getElementById("formDescription");

const verificationHistory =
  document.getElementById("verificationHistory");

const storeLoading = document.getElementById("storeLoading");
const storeDetails = document.getElementById("storeDetails");

// =====================================================
// STATE
// =====================================================

let supabaseClient = null;
let currentUser = null;
let currentSession = null;

let approvedStore = null;
let latestRequests = {
  user: null,
  seller: null
};

let isSubmitting = false;

// =====================================================
// MESSAGE
// =====================================================

function showMessage(text, type = "info") {
  message.textContent = text;
  message.className = "message " + type;
  message.style.display = "block";
}

function hideMessage() {
  message.textContent = "";
  message.className = "message";
  message.style.display = "none";
}

function showError(error, context) {
  console.error(context, error);

  const details = [
    error?.message || "Hitilafu isiyojulikana",
    error?.code ? "Code: " + error.code : ""
  ].filter(Boolean).join(" | ");

  showMessage(
    "Imeshindikana kukamilisha hatua hii: " + details,
    "error"
  );
}

// =====================================================
// SESSION
// =====================================================

async function getValidSession() {
  const { data, error } =
    await supabaseClient.auth.getSession();

  if (error) throw error;

  if (!data.session || !data.session.user) {
    throw new Error(
      "Hujawaingia kwenye ZUNE Account. Tafadhali ingia kwanza."
    );
  }

  currentSession = data.session;
  currentUser = data.session.user;

  return data.session;
}

// =====================================================
// PROFILE
// =====================================================

async function loadProfile() {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("full_name, phone_number, email")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) throw error;

  const metadataName =
    currentUser.user_metadata?.full_name ||
    currentUser.user_metadata?.name ||
    "";

  const fullName =
    data?.full_name ||
    metadataName ||
    "";

  document.getElementById("personalFullName").value =
    fullName;

  return data;
}

// =====================================================
// SELLER APPLICATION
// =====================================================

async function loadApprovedStore() {
  approvedStore = null;

  storeLoading.textContent =
    "Tunapakia taarifa za duka...";

  storeLoading.classList.remove("hidden");
  storeDetails.classList.add("hidden");

  const { data, error } = await supabaseClient
    .from("seller_applications")
    .select(`
      id,
      store_name,
      owner_name,
      phone,
      country,
      city,
      category,
      district,
      region,
      address,
      email,
      status,
      created_at
    `)
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const applications = data || [];

  // Tafuta ombi lolote lililoidhinishwa.
  // Hatuangalii role pekee kwa sababu duka lazima
  // liwe na status = approved kwenye database.

  approvedStore = applications.find(application =>
    String(application.status || "").toLowerCase() ===
    "approved"
  ) || null;

  if (!approvedStore) {
    sellerOption.classList.add("hidden");
    sellerOption.classList.add("disabled");

    typeSeller.disabled = true;
    typeSeller.checked = false;
    typeUser.checked = true;

    sellerOptionDescription.textContent =
      "Seller Verification inahitaji duka lililoidhinishwa.";

    storeLoading.textContent =
      "Hakuna duka lililoidhinishwa kwenye akaunti yako. " +
      "Seller Verification haipatikani kwa sasa.";

    storeLoading.classList.remove("hidden");
    storeDetails.classList.add("hidden");

    return false;
  }

  // Duka limeidhinishwa.
  sellerOption.classList.remove("hidden");
  sellerOption.classList.remove("disabled");

  typeSeller.disabled = false;

  sellerOptionDescription.textContent =
    "Thibitisha akaunti yako kama mmiliki wa duka.";

  displayStoreDetails(approvedStore);

  return true;
}

// =====================================================
// DISPLAY STORE DETAILS
// =====================================================

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent =
      value === null ||
      value === undefined ||
      String(value).trim() === ""
        ? "Haijawekwa"
        : String(value);
  }
}

function displayStoreDetails(store) {
  setText("storeNameValue", store.store_name);
  setText("storeOwnerValue", store.owner_name);
  setText("storeCategoryValue", store.category);

  setText("storeCountryValue", store.country);
  setText("storeRegionValue", store.region);

  setText(
    "storeDistrictValue",
    store.district || store.city
  );

  setText("storePhoneValue", store.phone);
  setText("storeEmailValue", store.email);

  setText(
    "storeAddressValue",
    store.address || store.city
  );

  setText("storeStatusValue", "Approved");

  storeLoading.classList.add("hidden");
  storeDetails.classList.remove("hidden");
}

// =====================================================
// VERIFICATION REQUESTS
// =====================================================

async function loadVerificationRequests() {
  const { data, error } = await supabaseClient
    .from("verification_requests")
    .select(`
      id,
      role,
      status,
      document_type,
      created_at,
      updated_at,
      admin_note
    `)
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  latestRequests = {
    user: null,
    seller: null
  };

  const requests = data || [];

  // Data imeshapangwa kuanzia mpya hadi ya zamani.
  // Tunachukua ombi la karibuni kwa kila aina.

  requests.forEach(request => {
    const role = request.role;

    if (
      (role === "user" || role === "seller") &&
      !latestRequests[role]
    ) {
      latestRequests[role] = request;
    }
  });

  displayVerificationHistory(requests);
}

// =====================================================
// HISTORY
// =====================================================

function getStatusLabel(status) {
  const normalized = String(status || "").toLowerCase();

  const labels = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    review: "Under Review",
    more_info: "More Information Required"
  };

  return labels[normalized] || status || "Unknown";
}

function getStatusClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "pending") {
    return "status-pending";
  }

  if (normalized === "approved") {
    return "status-approved";
  }

  if (normalized === "rejected") {
    return "status-rejected";
  }

  return "status-other";
}

function formatDate(value) {
  if (!value) return "Tarehe haijapatikana";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tarehe haijapatikana";
  }

  return date.toLocaleString("sw-TZ", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function displayVerificationHistory(requests) {
  verificationHistory.innerHTML = "";

  if (!requests.length) {
    verificationHistory.innerHTML =
      '<div class="empty-state">' +
      "Bado hujatuma ombi lolote la verification." +
      "</div>";

    return;
  }

  requests.forEach(request => {
    const item = document.createElement("div");
    item.className = "status-item";

    const details = document.createElement("div");

    const heading = document.createElement("strong");

    heading.textContent =
      request.role === "seller"
        ? "Seller Verification"
        : "Personal Verification";

    const date = document.createElement("small");

    date.textContent =
      "Tarehe: " + formatDate(request.created_at);

    details.appendChild(heading);
    details.appendChild(date);

    if (request.admin_note) {
      const note = document.createElement("div");

      note.className = "admin-note";
      note.textContent =
        "Ujumbe kutoka Admin: " + request.admin_note;

      details.appendChild(note);
    }

    const badge = document.createElement("span");

    badge.className =
      "status-badge " + getStatusClass(request.status);

    badge.textContent =
      getStatusLabel(request.status);

    item.appendChild(details);
    item.appendChild(badge);

    verificationHistory.appendChild(item);
  });
}

// =====================================================
// SELECTED TYPE
// =====================================================

function getVerificationType() {
  return typeSeller.checked ? "seller" : "user";
}

// =====================================================
// REQUIRED FIELDS
// =====================================================

function setFieldRequirements(type) {
  const personalName =
    document.getElementById("personalFullName");

  const personalDocument =
    document.getElementById("personalDocumentType");

  const sellerDocument =
    document.getElementById("sellerDocumentType");

  personalName.required = type === "user";
  personalDocument.required = type === "user";

  sellerDocument.required = type === "seller";
}

// =====================================================
// BUTTON STATE
// =====================================================

function setButtonState() {
  const type = getVerificationType();
  const existing = latestRequests[type];

  const status = String(
    existing?.status || ""
  ).toLowerCase();

  submitButton.disabled =
    isSubmitting ||
    !currentUser ||
    (type === "seller" && !approvedStore) ||
    status === "pending" ||
    status === "approved";

  if (isSubmitting) {
    submitButton.textContent = "Inatuma ombi...";
  } else if (status === "pending") {
    submitButton.textContent = "Ombi linasubiri ukaguzi";
  } else if (status === "approved") {
    submitButton.textContent = "Akaunti imethibitishwa";
  } else if (type === "seller" && !approvedStore) {
    submitButton.textContent = "Duka halijaidhinishwa";
  } else {
    submitButton.textContent = "Tuma Ombi la Verification";
  }
}

// =====================================================
// UPDATE FORM
// =====================================================

function updateSelectedForm() {
  const type = getVerificationType();

  if (type === "seller" && !approvedStore) {
    typeSeller.checked = false;
    typeUser.checked = true;
  }

  const selectedType = getVerificationType();

  personalSection.classList.toggle(
    "active",
    selectedType === "user"
  );

  sellerSection.classList.toggle(
    "active",
    selectedType === "seller"
  );

  if (selectedType === "seller") {
    formHeading.textContent = "Seller Verification";

    formDescription.textContent =
      "Thibitisha utambulisho wako kama mmiliki wa duka " +
      "lililoidhinishwa na ZUNE.";
  } else {
    formHeading.textContent = "Personal Verification";

    formDescription.textContent =
      "Jaza taarifa zako sahihi kwa ajili ya ukaguzi.";
  }

  setFieldRequirements(selectedType);
  updateExistingRequestMessage();
  setButtonState();
}

// =====================================================
// EXISTING REQUEST MESSAGE
// =====================================================

function updateExistingRequestMessage() {
  const type = getVerificationType();
  const existing = latestRequests[type];

  if (!existing) {
    hideMessage();
    return;
  }

  const status = String(
    existing.status || ""
  ).toLowerCase();

  if (status === "pending") {
    showMessage(
      "Ombi lako la " +
      (type === "seller"
        ? "Seller Verification"
        : "Personal Verification") +
      " limepokelewa na linasubiri kukaguliwa na Admin.",
      "info"
    );

    return;
  }

  if (status === "approved") {
    showMessage(
      "Hongera! Ombi lako limeidhinishwa na Admin wa ZUNE.",
      "success"
    );

    return;
  }

  if (status === "rejected") {
    showMessage(
      "Ombi lako la awali lilikataliwa. " +
      "Unaweza kutuma ombi jipya baada ya kurekebisha taarifa.",
      "error"
    );

    return;
  }

  hideMessage();
}

// =====================================================
// PERSONAL APPLICATION DATA
// =====================================================

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
    throw new Error(
      "Jina kamili lazima liwe na herufi angalau 3."
    );
  }

  return {
    full_name: fullName,
    document_type: documentType,
    document_number: documentNumber || null,
    reason: reason || "Personal Verification Application"
  };
}

// =====================================================
// SELLER APPLICATION DATA
// =====================================================

function getSellerApplication() {
  if (!approvedStore) {
    throw new Error(
      "Huna duka lililoidhinishwa kwa Seller Verification."
    );
  }

  const documentType = document
    .getElementById("sellerDocumentType")
    .value;

  const documentNumber = document
    .getElementById("sellerDocumentNumber")
    .value.trim();

  const additionalReason = document
    .getElementById("sellerReason")
    .value.trim();

  if (!documentType) {
    throw new Error(
      "Chagua aina ya kitambulisho."
    );
  }

  // Taarifa za duka zinatoka Supabase.
  // Hazichukuliwi kutoka kwenye input za mtumiaji.

  const sellerDetails = [
    "SELLER VERIFICATION APPLICATION",
    "",
    "SELLER APPLICATION ID: " + approvedStore.id,
    "STORE NAME: " + approvedStore.store_name,
    "OWNER NAME: " + approvedStore.owner_name,
    "BUSINESS CATEGORY: " + (approvedStore.category || ""),
    "COUNTRY: " + (approvedStore.country || ""),
    "REGION: " + (approvedStore.region || ""),
    "DISTRICT: " + (approvedStore.district || ""),
    "CITY: " + (approvedStore.city || ""),
    "PHONE: " + (approvedStore.phone || ""),
    "EMAIL: " + (approvedStore.email || ""),
    "ADDRESS: " + (approvedStore.address || ""),
    "STORE APPLICATION STATUS: approved",
    "",
    "ADDITIONAL INFORMATION:",
    additionalReason || "No additional information provided."
  ].join("\n");

  return {
    full_name: approvedStore.owner_name,
    document_type: documentType,
    document_number: documentNumber || null,
    reason: sellerDetails
  };
}

// =====================================================
// CHECK REQUEST BEFORE SUBMISSION
// =====================================================

async function checkExistingApplication(type) {
  const { data, error } = await supabaseClient
    .from("verification_requests")
    .select("id, role, status, created_at")
    .eq("user_id", currentUser.id)
    .eq("role", type)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;

  return data && data.length ? data[0] : null;
}

// =====================================================
// SUBMIT APPLICATION
// =====================================================

async function submitApplication(event) {
  event.preventDefault();

  if (isSubmitting) return;

  isSubmitting = true;
  setButtonState();
  hideMessage();

  try {
    if (!currentUser) {
      throw new Error(
        "Hujawaingia kwenye akaunti yako."
      );
    }

    const session = await getValidSession();

    if (session.user.id !== currentUser.id) {
      throw new Error(
        "Session imebadilika. Tafadhali ingia tena."
      );
    }

    const type = getVerificationType();

    if (!["user", "seller"].includes(type)) {
      throw new Error(
        "Aina ya verification si sahihi."
      );
    }

    // Hakiki tena duka moja kwa moja kutoka Supabase.
    // Hii inazuia kutegemea taarifa za zamani za ukurasa.

    if (type === "seller") {
      await loadApprovedStore();

      if (!approvedStore) {
        throw new Error(
          "Seller Verification inahitaji duka lililoidhinishwa."
        );
      }
    }

    // Hakiki kama tayari kuna ombi pending au approved.

    const existing =
      await checkExistingApplication(type);

    if (existing) {
      const status = String(
        existing.status || ""
      ).toLowerCase();

      latestRequests[type] = existing;

      if (status === "pending") {
        showMessage(
          "Tayari una ombi linalosubiri kukaguliwa na Admin.",
          "info"
        );

        return;
      }

      if (status === "approved") {
        showMessage(
          "Aina hii ya verification tayari imeidhinishwa.",
          "success"
        );

        return;
      }
    }

    const details =
      type === "seller"
        ? getSellerApplication()
        : getPersonalApplication();

    const application = {
      user_id: currentUser.id,
      full_name: details.full_name,
      document_type: details.document_type,
      document_number: details.document_number,
      reason: details.reason,
      role: type
    };

    showMessage(
      "Tunatuma ombi lako kwa Supabase...",
      "info"
    );

    const { data, error } = await supabaseClient
      .from("verification_requests")
      .insert([application])
      .select(`
        id,
        role,
        status,
        created_at
      `)
      .single();

    if (error) throw error;

    if (!data || !data.id) {
      throw new Error(
        "Supabase haikurudisha uthibitisho wa kuhifadhi ombi."
      );
    }

    console.log(
      "ZUNE VERIFICATION APPLICATION SAVED:",
      data.id
    );

    // Safisha fields baada ya kuhifadhi.
    document.getElementById(
      type === "seller"
        ? "sellerDocumentType"
        : "personalDocumentType"
    ).value = "";

    document.getElementById(
      type === "seller"
        ? "sellerDocumentNumber"
        : "personalDocumentNumber"
    ).value = "";

    document.getElementById(
      type === "seller"
        ? "sellerReason"
        : "personalReason"
    ).value = "";

    // Pakia upya historia na status.
    await loadVerificationRequests();

    updateSelectedForm();

    showMessage(
      "Ombi lako limehifadhiwa kikamilifu. " +
      "Namba ya ombi: " + data.id +
      ". Hali: PENDING. Admin wa ZUNE atalipitia.",
      "success"
    );

  } catch (error) {
    showError(error, "VERIFICATION SUBMISSION ERROR");

  } finally {
    isSubmitting = false;
    setButtonState();
  }
}

// =====================================================
// AUTH STATE
// =====================================================

function listenToAuthChanges() {
  supabaseClient.auth.onAuthStateChange(
    async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        window.location.href = "login.html";
      }
    }
  );
}

// =====================================================
// INITIALIZATION
// =====================================================

async function initializeVerification() {
  try {
    if (!window.supabase) {
      throw new Error(
        "Supabase library haijapakiwa. Angalia internet."
      );
    }

    if (
      !form ||
      !message ||
      !submitButton ||
      !verificationHistory
    ) {
      throw new Error(
        "Baadhi ya vipengele vya verification.html havijapatikana."
      );
    }

    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

    showMessage(
      "Tunaangalia akaunti yako ya ZUNE...",
      "info"
    );

    submitButton.disabled = true;

    // Login/session
    await getValidSession();

    // Profile
    await loadProfile();

    // Seller application
    await loadApprovedStore();

    // Verification history
    await loadVerificationRequests();

    // Radio events
    typeUser.addEventListener(
      "change",
      updateSelectedForm
    );

    typeSeller.addEventListener(
      "change",
      updateSelectedForm
    );

    // Form submission
    form.addEventListener(
      "submit",
      submitApplication
    );

    // Retry
    retryButton.addEventListener(
      "click",
      () => window.location.reload()
    );
retryButton.classList.add("hidden");

    // Default selected form
    typeUser.checked = true;

    updateSelectedForm();

    hideMessage();

    listenToAuthChanges();

    console.log(
      "ZUNE VERIFICATION INITIALIZED SUCCESSFULLY"
    );

  } catch (error) {
    console.error(
      "VERIFICATION INITIALIZATION ERROR:",
      error
    );

    submitButton.disabled = true;

    showError(
      error,
      "INITIALIZATION ERROR"
    );

    retryButton.classList.remove("hidden");

    if (
      error.message?.includes("Hujawaingia") ||
      error.message?.includes("JWT")
    ) {
      showMessage(
        "Hujawaingia kwenye ZUNE Account. " +
        "Tafadhali ingia kwanza.",
        "error"
      );

      retryButton.textContent = "Fungua Login";

      retryButton.onclick = () => {
        window.location.href = "login.html";
      };
    }
  }
}

// =====================================================
// START
// =====================================================

initializeVerification();