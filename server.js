const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.static("public"));

const tempDir = path.join(__dirname, "tmp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

const upload = multer({ dest: tempDir, limits: { fileSize: 200 * 1024 * 1024 } });

app.post("/upload", upload.single("apk"), (req, res) => {
  if (!req.file || !req.file.originalname.endsWith(".apk")) {
    return res.send("Invalid APK file");
  }

  const id = Date.now();
  const keystore = path.join(tempDir, `ks_${id}.jks`);
  const signedApk = path.join(tempDir, `signed_${id}.apk`);
  const pass = "123456";

  const cmd = `
    keytool -genkeypair \
      -keystore "${keystore}" -storepass ${pass} -keypass ${pass} \
      -alias alias_${id} -keyalg RSA -keysize 2048 -validity 10000 \
      -dname "CN=Random${id}, OU=Web, O=Signer, L=NA, S=NA, C=IN" && \
    apksigner sign \
      --ks "${keystore}" --ks-pass pass:${pass} --key-pass pass:${pass} \
      --out "${signedApk}" "${req.file.path}"
  `;

  exec(cmd, { shell: "/bin/bash" }, (err) => {
    if (err) {
      console.error("Signing failed ⚠️", err);
      return res.send("Signing failed, internal error.");
    }

    res.download(signedApk, `${req.file.originalname.replace(".apk", "")}_signed.apk`, () => {
      fs.unlinkSync(req.file.path);
      fs.unlinkSync(keystore);
      fs.unlinkSync(signedApk);
    });
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`APK Random Sign Tool running on port ${port}`));
