const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.static("public"));

// Temp folder for uploaded APKs and keystores
const tempDir = path.join(__dirname, "tmp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

const upload = multer({ dest: tempDir, limits: { fileSize: 200 * 1024 * 1024 } });

// Detect OS
const isWin = process.platform === "win32";

// Upload & Sign APK
app.post("/upload", upload.single("apk"), (req, res) => {
  if (!req.file || !req.file.originalname.endsWith(".apk")) {
    return res.send("Invalid APK file");
  }

  const id = Date.now();
  const keystore = path.join(tempDir, `ks_${id}.jks`);
  const alias = `alias_${id}`;
  const pass = "123456";
  const signedApk = path.join(tempDir, `signed_${id}.apk`);
  const inputApk = req.file.path;

  // Windows command uses &&, Linux uses \ continuation
  const cmd = isWin
    ? `keytool -genkeypair -keystore "${keystore}" -storepass ${pass} -keypass ${pass} -alias ${alias} -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Random${id}, OU=Web, O=Signer, L=NA, S=NA, C=IN" && apksigner.bat sign --ks "${keystore}" --ks-pass pass:${pass} --key-pass pass:${pass} --out "${signedApk}" "${inputApk}"`
    : `
      keytool -genkeypair \
      -keystore "${keystore}" \
      -storepass ${pass} \
      -keypass ${pass} \
      -alias ${alias} \
      -keyalg RSA \
      -keysize 2048 \
      -validity 10000 \
      -dname "CN=Random${id}, OU=Web, O=Signer, L=NA, S=NA, C=IN" && \
      apksigner sign \
      --ks "${keystore}" \
      --ks-pass pass:${pass} \
      --key-pass pass:${pass} \
      --out "${signedApk}" \
      "${inputApk}"
    `;

  exec(cmd, { shell: isWin ? "cmd.exe" : "/bin/bash" }, (err, stdout, stderr) => {
    if (err) {
      console.error("Signing Error:", err);
      console.error(stderr);
      return res.send("Signing failed. Make sure keytool & apksigner are installed and in PATH.");
    }

    console.log(stdout);

    res.download(signedApk, `signed_${req.file.originalname}`, () => {
      // Cleanup temporary files
      try { fs.unlinkSync(inputApk); } catch {}
      try { fs.unlinkSync(keystore); } catch {}
      try { fs.unlinkSync(signedApk); } catch {}
    });
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`APK Random Sign Tool running on port ${port}`);
});
