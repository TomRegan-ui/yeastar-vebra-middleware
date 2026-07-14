import express from "express";

const app = express();
app.use(express.json());

// ✅ Debug route
app.get("/debug", (req, res) => {
  res.send("NEW VERSION LIVE ✅");
});

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
      "Authorization": "Basic 7kr09htk3qo8olvi5protl3qk3:c6lkmvukt95uai3koa0elmm5pm96tehsj21ssmgl2kp9gvbtfgg"
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
  try {
    let phone = req.query.phone;
    const token = await getToken();

    let url = "https://api.alto.zoopladev.co.uk/contacts";

    // ✅ If phone is provided, add filter
    if (phone) {
      // optional: fix UK format
      if (phone.startsWith("0")) {
        phone = "+44" + phone.substring(1);
      }

      url += `?phone=${encodeURIComponent(phone)}`;
    }

    const apiRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await apiRes.json();

    // ✅ CASE 1: phone lookup
    if (phone) {
      const contact = data?.results?.[0];

      return res.json({
        name: contact?.name || "Unknown",
        phone: contact?.phone || phone,
        email: contact?.email || ""
      });
    }

    // ✅ CASE 2: no phone → return list (paginated)
    return res.json({
      count: data?.results?.length || 0,
      contacts: data?.results || [],
      page: data?.page,
      total: data?.total
    });

  } catch (err) {
    console.error("ERROR:", err);
    res.json({
      name: "Error",
      phone: req.query.phone || null,
      error: err.message
    });
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
