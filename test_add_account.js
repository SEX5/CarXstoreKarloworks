fetch("http://localhost:3000/api/admin/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@carxstreet.store", password: "CarxStreetAdminSecurePass123" })
})
.then(r => r.json())
.then(data => {
  return fetch("http://localhost:3000/api/admin/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${data.token}` },
    body: JSON.stringify({
      name: "New Test Garage",
      silver: 1000,
      gold: 1000,
      xp: 1,
      cars_unlocked: 0,
      maps_unlocked: 0,
      price: 15,
      snapshot_url: "",
      image_url: "",
      car_images: "",
      email: "test@domain.com",
      password: "pass"
    })
  });
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
