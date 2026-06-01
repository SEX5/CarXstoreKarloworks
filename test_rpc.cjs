require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRPC() {
  const { data, error } = await supabaseAdmin.rpc("exec_sql", { sql: "ALTER TABLE accounts ADD COLUMN car_images TEXT;" });
  console.log("RPC result:", { data, error });
}
testRPC();
