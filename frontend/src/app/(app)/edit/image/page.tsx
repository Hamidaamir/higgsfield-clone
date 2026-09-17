import type { Metadata } from "next";

import { ImageEditor } from "@/features/image-edit/image-editor";

export const metadata: Metadata = { title: "Edit Image" };

export default function EditImagePage() {
  return <ImageEditor />;
}
