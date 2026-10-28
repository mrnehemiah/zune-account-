
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

function showMessage(message) {
  const element = $("pageMessage");
  if (element) element.textContent = message;
}

function displayText(id, value, fallback = "Haijawekwa") {
  const element = $(id);
  if (element) element.textContent = value || fallback;
}

function getInitial(name) {
  return (name || "Z").trim().charAt(0).toUpperCase() || "Z";
}

async function loadAccount() {
  showMessage("Inapakia taarifa za akaunti yako...");

  // Hakikisha kuna session halali.
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Session error:", sessionError.message);
    showMessage("Imeshindikana kuthibitisha session. Jaribu tena.");
    return;
  }

  if (!session?.user) {
    window.location.replace("login.html");
    return;
  }

  const user = session.user;

  // Taarifa za msingi kutoka Supabase Auth.
  const email = user.email || "";
  let fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "";

  let phone =
    user.phone ||
    user.user_metadata?.phone_number ||
    "";

  let role = "Mtumiaji";

  // Soma profile ya mtumiaji aliyeingia pekee.
  // RLS ya Supabase inapaswa kuzuia kusoma profile za wengine.
  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("id, full_name, phone_number, role, is_verified")
      .eq("id", user.id)
      .maybeSingle();

  if (profileError) {
    console.error("Profile loading error:", profileError.message);
    showMessage(
      "Akaunti imethibitishwa, lakini taarifa za profile hazikuweza kupakiwa."
    );
  } else {
    if (profile) {
      fullName = profile.full_name || fullName;
      phone = profile.phone_number || phone;
      role = profile.role || role;

      if (profile.is_verified === true) {
        displayText("accountStatus", "Akaunti imethibitishwa");
      } else {
        displayText("accountStatus", "Akaunti ya ZUNE");
      }
    } else {
      displayText("accountStatus", "Akaunti ya ZUNE");
    }

    showMessage("Taarifa za akaunti zimepakiwa.");
  }

  if (!fullName) {
    fullName = email.split("@")[0] || "Mtumiaji wa ZUNE";
  }

  displayText("profileName", fullName, "Mtumiaji wa ZUNE");
  displayText("profileEmail", email, "Hakuna email");
  displayText("fullName", fullName);
  displayText("emailValue", email);
  displayText("phoneValue", phone);
  displayText("zuneId", user.id);
  displayText("roleValue", role);

  displayText("avatar", getInitial(fullName), "Z");
}

// Toka kwenye session ya Supabase.
$("logoutButton")?.addEventListener("click", async () => {
  const button = $("logoutButton");
  button.disabled = true;
  button.textContent = "Inatoka...";

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error.message);
      showMessage("Imeshindikana kutoka. Jaribu tena.");
      button.disabled = false;
      button.textContent = "Toka";
      return;
    }

    window.location.replace("login.html");
  } catch (error) {
    console.error("Unexpected logout error:", error);
    showMessage("Kuna tatizo la mtandao wakati wa kutoka.");
    button.disabled = false;
    button.textContent = "Toka";
  }
});

loadAccount().catch((error) => {
  console.error("Account loading error:", error);
  showMessage("Kuna tatizo la kupakia akaunti. Jaribu tena.");
});
