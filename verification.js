
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

function showMessage(text, type) {
  message.textContent = text;
  message.className = "message " + type;
  message.style.display = "block";
}

function setLoading(loading) {
  submitButton.disabled = loading;
  submitButton.textContent = loading
    ? "Submitting application..."
    : "Submit Verification Application";
}

async function initializeVerification() {
  try {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    if (error) throw error;

    if (!session) {
      window.location.href = "login.html";
      return;
    }

    currentUser = session.user;

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", currentUser.id)
        .maybeSingle();

    if (profileError) {
      console.warn("Profile lookup:", profileError.message);
    }

    fullNameInput.value =
      profile?.full_name ||
      currentUser.user_metadata?.full_name ||
      currentUser.user_metadata?.name ||
      "";

    await checkExistingApplication();

  } catch (error) {
    showMessage(
      "Imeshindikana kufungua ukurasa. Tafadhali jaribu tena.",
      "error"
    );
    console.error(error);
  }
}

async function checkExistingApplication() {
  const { data, error } = await supabase
    .from("verification_requests")
    .select("id, status, created_at, admin_note")
    .eq("user_id", currentUser.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Application check:", error.message);
    return;
  }

  if (data && data.length > 0) {
    form.style.display = "none";

    showMessage(
      "Tayari una ombi la uthibitishaji linalosubiri kukaguliwa. Tafadhali subiri majibu ya Admin.",
      "success"
    );
  }
}

form.addEventListener("submit", async function(event) {
  event.preventDefault();

  if (!currentUser) {
    showMessage(
      "Tafadhali ingia kwenye akaunti yako kwanza.",
      "error"
    );
    return;
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
    showMessage(
      "Tafadhali jaza sehemu zote zinazohitajika.",
      "error"
    );
    return;
  }

  if (fullName.length < 3) {
    showMessage(
      "Tafadhali ingiza jina lako kamili.",
      "error"
    );
    return;
  }

  setLoading(true);

  try {
    // Hakikisha bado kuna session halali.
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    if (!session || session.user.id !== currentUser.id) {
      throw new Error("Session yako imeisha. Ingia tena.");
    }

    // Zuia maombi mengi yanayosubiri kwa akaunti moja.
    const { data: existing, error: existingError } =
      await supabase
        .from("verification_requests")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq("status", "pending")
        .limit(1);

    if (existingError) throw existingError;

    if (existing && existing.length > 0) {
      form.style.display = "none";

      showMessage(
        "Una ombi ambalo bado linasubiri kukaguliwa.",
        "success"
      );

      return;
    }

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

    const { error: insertError } = await supabase
      .from("verification_requests")
      .insert(application);

    if (insertError) throw insertError;

    showMessage(
      "Ombi lako limetumwa kikamilifu! Admin wa ZUNE atalipitia na utapata matokeo kupitia akaunti yako.",
      "success"
    );

    form.reset();
    form.style.display = "none";

  } catch (error) {
    console.error("Verification submission:", error);

    showMessage(
      error.message ||
      "Imeshindikana kutuma ombi. Tafadhali jaribu tena.",
      "error"
    );

  } finally {
    setLoading(false);
  }
});

initializeVerification();
