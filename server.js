const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.static("public"));

// Create temp folder if not exists
const tempDir = path.join(__dirname, "tmp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// File upload config
const upload = multer({ dest: tempDir, limits: { fileSize: 200 * 1024 * 1024 } });

app.post("/upload", upload.single("apk"), (req, res) => {
  if (!req.file || !req.file.originalname.endsWith(".apk")) {
    return res.send("Invalid APK file.");
  }

  const id = Date.now();
  const keystore = path.join(tempDir, `ks_${id}.jks`);
  const signedApk = path.join(tempDir, `signed_${id}.apk`);
  const pass = "123456"; // You can later change this to ENV variable if needed

  // Updated signing command with --min-sdk-version
  const cmd = `
    keytool -genkeypair \
      -keystore "${keystore}" -storepass ${pass} -keypass ${pass} \
      -alias alias_${id} -keyalg RSA -keysize 2048 -validity 10000 \
      -dname "CN=Random${id}, OU=Web, O=Signer, L=NA, S=NA, C=IN" && \
    apksigner sign \
      --min-sdk-version 21 \
      --ks "${keystore}" --ks-pass pass:${pass} --key-pass pass:${pass} \
      --out "${signedApk}" "${req.file.path}"
  `;

  exec(cmd, { shell: "/bin/bash" }, (err, stdout, stderr) => {
    if (err) {
      console.error("Signing failed ⚠️", stderr || err);
      return res.send("Signing failed (internal error).");
    }

    // Send signed APK back to user
    res.download(signedApk, `${req.file.originalname.replace(".apk", "")}_signed.apk`, () => {
      try { fs.unlinkSync(req.file.path); } catch {}
      try { fs.unlinkSync(keystore); } catch {}
      try { fs.unlinkSync(signedApk); } catch {}
    });
  });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`APK Random Sign Tool running on port ${port}`));
