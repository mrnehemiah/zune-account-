
import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// ZUNE Supabase project iliyopo
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

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const messageBox = document.getElementById("message");

function showMessage(message, type = "error") {
  messageBox.textContent = message;
  messageBox.style.display = "block";

  messageBox.style.background =
    type === "success" ? "#e5f5eb" : "#fff0ed";

  messageBox.style.color =
    type === "success" ? "#176b40" : "#a52b20";
}

function setLoading(isLoading) {
  loginButton.disabled = isLoading;

  loginButton.textContent = isLoading
    ? "Inaingia..."
    : "Ingia kwenye akaunti";
}

// Hakikisha ukurasa wa login umefunguka vizuri.
if (
  !loginForm ||
  !emailInput ||
  !passwordInput ||
  !loginButton ||
  !messageBox
) {
  console.error(
    "ZUNE Account: Baadhi ya vipengele vya login.html havijapatikana."
  );
}

// Ikiwa tayari ameingia, mpe nafasi ya kufungua akaunti yake.
async function checkExistingSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Session check failed:", error.message);
    return;
  }

  if (data.session?.user) {
    window.location.replace("account.html");
  }
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showMessage("Tafadhali jaza email na password yako.");
    return;
  }

  setLoading(true);
  messageBox.style.display = "none";

  try {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      console.error("ZUNE login error:", error.message);

      showMessage(
        "Imeshindikana kuingia. Hakikisha email na password ni sahihi, kisha jaribu tena."
      );
      return;
    }

    if (!data.session || !data.user) {
      showMessage(
        "Session haijapatikana. Tafadhali jaribu tena."
      );
      return;
    }

    showMessage(
      "Umeingia kikamilifu. Tunafungua akaunti yako...",
      "success"
    );

    window.location.replace("account.html");

  } catch (error) {
    console.error("Unexpected login error:", error);

    showMessage(
      "Kuna tatizo la mtandao. Angalia internet kisha ujaribu tena."
    );

  } finally {
    setLoading(false);
  }
});

checkExistingSession();
