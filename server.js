const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.static("public"));

const tmpDir = path.join(__dirname, "tmp");
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

const upload = multer({ dest: tmpDir, limits: { fileSize: 200 * 1024 * 1024 } });

app.post("/upload", upload.single("apk"), (req, res) => {
  if (!req.file || !req.file.originalname.endsWith(".apk")) {
    return res.send("Invalid file.");
  }

  const id = Date.now();
  const keystore = path.join(tmpDir, `ks_${id}.jks`);
  const signedApk = path.join(tmpDir, `signed_${id}.apk`);
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
      console.error("Signing failed:", err);
      return res.send("Signing failed.");
    }
    res.download(signedApk, `${req.file.originalname.replace(".apk", "")}_signed.apk`, () => {
      fs.unlinkSync(req.file.path);
      fs.unlinkSync(keystore);
      fs.unlinkSync(signedApk);
    });
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Running on port ${port}`));
