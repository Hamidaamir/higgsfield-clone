import { redirect } from "next/navigation";

/** No free video-to-video model exists; the preview surface explains the gap and links to working paths. */
export default function EditVideoPage() {
  redirect("/tools/edit-video");
}
