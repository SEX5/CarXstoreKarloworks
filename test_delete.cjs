require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDelete() {
  const { data, error } = await supabaseAdmin.from("accounts").delete().eq("id", "3e589bdc-15a5-48b9-8798-29ea30e70332");
  console.log("Delete result:", { data, error });
}
testDelete();
