export async function uploadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("File must be an image"));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      reject(new Error("Image exceeds 10MB limit"));
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        if (typeof e.target?.result !== "string") {
          reject(new Error("Failed to read file"));
          return;
        }

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: e.target.result,
            filename: file.name,
            mimeType: file.type,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Upload failed" }));
          reject(new Error(err.error ?? "Upload failed"));
          return;
        }

        const data = await res.json();
        resolve(data.url as string);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
