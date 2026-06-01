require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSelect() {
  const { data, error } = await supabaseAdmin.from("accounts").select("*");
  console.log("Select result:", { data, error });
}
testSelect();
