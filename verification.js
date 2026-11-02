
const SUPABASE_URL = "https://rpkogiieegqgxqbzwxwo.supabase.co";
const SUPABASE_KEY = "sb_publishable_2TEqZv-NBM9n5knU46ngqA_wqO3V1uf";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const form = document.getElementById("verificationForm");
const message = document.getElementById("pageMessage");
const submitButton = document.getElementById("submitButton");
const fullNameInput = document.getElementById("fullName");

let currentUser = null;
let isSubmitting = false;

function showMessage(text, type = "error") {
  message.textContent = text;
  message.className = "message " + type;
  message.style.display = "block";
  message.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function setLoading(loading) {
  isSubmitting = loading;
  submitButton.disabled = loading;
  submitButton.textContent = loading
    ? "Inatuma ombi..."
    : "Submit Verification Application";
}

function showError(error, context) {
  console.error(context, error);

  const details = [
    error?.message || "Hitilafu isiyojulikana",
    error?.code ? "Code: " + error.code : "",
    error?.details || "",
    error?.hint || ""
  ].filter(Boolean).join(" | ");

  showMessage("Imeshindikana: " + details, "error");
}

async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) throw error;

  if (!data.session) {
    throw new Error("Session haipo. Tafadhali ingia tena kwenye ZUNE Account.");
  }

  return data.session;
}

async function checkExistingApplication() {
  const { data, error } = await supabase
    .from("verification_requests")
    .select("id, status, created_at, admin_note")
    .eq("user_id", currentUser.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;

  if (data && data.length > 0) {
    form.style.display = "none";

    showMessage(
      "Ombi lako tayari limepokelewa na linasubiri kukaguliwa na Admin wa ZUNE.",
      "success"
    );

    return true;
  }

  return false;
}

async function initializeVerification() {
  try {
    if (!window.supabase) {
      throw new Error("Supabase library haijapakiwa.");
    }

    if (!form || !message || !submitButton || !fullNameInput) {
      throw new Error("Baadhi ya vipengele vya verification.html havijapatikana.");
    }

    const session = await getCurrentSession();

    currentUser = session.user;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (profileError) {
      console.warn("Profile lookup:", profileError);
    }

    fullNameInput.value =
      profile?.full_name ||
      currentUser.user_metadata?.full_name ||
      currentUser.user_metadata?.name ||
      "";

    await checkExistingApplication();

  } catch (error) {
    console.error("VERIFICATION INITIALIZATION ERROR:", error);

    if (
      error.message?.includes("Session haipo") ||
      error.message?.includes("JWT")
    ) {
      showMessage(
        "Tafadhali ingia kwenye ZUNE Account kwanza.",
        "error"
      );

      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);

      return;
    }

    showError(error, "Initialization error");
  }
}

form.addEventListener("submit", async function(event) {
  event.preventDefault();

  if (isSubmitting) return;

  try {
    if (!currentUser) {
      throw new Error("Tafadhali ingia kwenye akaunti yako kwanza.");
    }

    const fullName = fullNameInput.value.trim();

    const documentType =
      document.getElementById("documentType").value;

    const documentNumber =
      document.getElementById("documentNumber").value.trim();

    const reason =
      document.getElementById("reason").value.trim();

    const verificationType =
      document.querySelector(
        'input[name="verificationType"]:checked'
      )?.value;

    if (!fullName || !documentType || !verificationType) {
      throw new Error("Tafadhali jaza sehemu zote zinazohitajika.");
    }

    if (fullName.length < 3) {
      throw new Error("Jina kamili lazima liwe na angalau herufi 3.");
    }

    if (!["user", "seller"].includes(verificationType)) {
      throw new Error("Aina ya verification si sahihi.");
    }

    setLoading(true);

    const session = await getCurrentSession();

    if (session.user.id !== currentUser.id) {
      throw new Error("Akaunti imebadilika. Tafadhali ingia tena.");
    }

    const alreadySubmitted = await checkExistingApplication();

    if (alreadySubmitted) return;

    const application = {
      user_id: currentUser.id,
      full_name: fullName,
      document_type: documentType,
      document_number: documentNumber || null,
      reason: reason || null,
      role: verificationType,
      status: "pending",
      updated_at: new Date().toISOString()
    };

    const { data: insertedData, error: insertError } = await supabase
      .from("verification_requests")
      .insert(application)
      .select("id, status, created_at")
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log("VERIFICATION APPLICATION SAVED:", insertedData);

    showMessage(
      "Hongera! Ombi lako la ZUNE Verification limetumwa na kuhifadhiwa kikamilifu. Admin atalipitia. Hali ya ombi lako ni PENDING.",
      "success"
    );

    form.reset();
    form.style.display = "none";

  } catch (error) {
    showError(error, "VERIFICATION SUBMISSION ERROR");

  } finally {
    setLoading(false);
  }
});

initializeVerification();
