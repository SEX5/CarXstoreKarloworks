require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testInsert() {
  const newAccount = {
    id: "fc538e1e-af63-44f2-9599-fb93ccf96020",
    name: "Test Garage",
    silver: 0,
    gold: 0,
    xp: 0,
    cars_unlocked: 0,
    maps_unlocked: 0,
    price: 0,
    snapshot_url: "",
    image_url: "",
    car_images: "",
    credentials: "enc_test",
    is_sold: false,
    created_at: new Date().toISOString()
  };
  const { data, error } = await supabaseAdmin.from("accounts").insert([newAccount]).select();
  console.log("Insert result:", { data, error });
}
testInsert();
