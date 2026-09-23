import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

// 1x1 transparent PNG
const TINY_PNG =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

(async () => {
    const cfg = cloudinary.config();
    const timestamp = Math.round(Date.now() / 1000);
    const folder = "uploads";

    const signature = cloudinary.utils.api_sign_request({ folder, timestamp }, cfg.api_secret!);

    const form = new FormData();
    form.append("file", TINY_PNG);
    form.append("api_key", cfg.api_key!);
    form.append("timestamp", String(timestamp));
    form.append("folder", folder);
    form.append("signature", signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloud_name}/image/upload`, {
        method: "POST",
        body: form,
    });

    console.log("status:      ", res.status);
    console.log("server:      ", res.headers.get("server"));
    console.log("content-type:", res.headers.get("content-type"));
    console.log("x-cld-error: ", res.headers.get("x-cld-error"));
    console.log("body:        ", (await res.text()).slice(0, 600));
})();