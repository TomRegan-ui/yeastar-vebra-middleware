import express from "express";

app.get("/debug", (req, res) => {
  res.send("NEW VERSION LIVE
✅");
});
``
const app = express();
app.use(express.json());

let accessToken = null;
let tokenExpiry = 0;

// 🔐 Get OAuth token
async function getToken() {
  const now = Date.now();

  if (accessToken && now < tokenExpiry) {
    return accessToken;
  }

  const res = await fetch("https://api.alto.zoopladev.co.uk/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET
    })
  });

  const data = await res.json();

  accessToken = data.access_token;
  tokenExpiry = now + (data.expires_in * 1000) - 60000;

  return accessToken;
}

// 🔍 Contact lookup
app.get("/vebraalto/contacts", async (req, res) => {
  ``
  try {
    const phone = req.query.phone;
    const token = await getToken();

    const apiRes = await fetch(
      `https://api.alto.zoopladev.co.uk/contacts?phone=${phone}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await apiRes.json();
    const contact = data?.results?.[0];

    res.json({
      name: contact?.name || "Unknown",
      phone: contact?.phone || phone,
      email: contact?.email || ""
    });

  } catch (err) {
    console.error(err);
    res.json({ name: "Error", phone: req.query.phone });
  }
});

// 📞 Call events
app.post("/vebraalto/calllog", (req, res) => {
  console.log("Call log:", req.body);
  res.sendStatus(200);
});

app.post("/vebraalto/clicktocall", (req, res) => {
  console.log("Click to call:", req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

