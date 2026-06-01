fetch("http://localhost:3000/api/admin/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@carxstreet.store", password: "CarxStreetAdminSecurePass123" })
})
.then(r => r.json())
.then(data => {
  console.log("Token:", data.token);
  return fetch("http://localhost:3000/api/admin/accounts", {
    headers: { "Authorization": `Bearer ${data.token}` }
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
