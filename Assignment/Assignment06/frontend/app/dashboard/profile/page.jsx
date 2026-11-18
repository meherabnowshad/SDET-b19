// app/dashboard/profile/page.jsx — view + edit profile + avatar upload.
// GET /api/users/profile · PUT /api/users/profile/update · PATCH /api/users/profile/image
"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/user.service";
import { friendlyError } from "@/utils/errors";
import { validateProfile } from "@/utils/validation";
import { IMAGE_ACCEPT_ATTR, MAX_IMAGE_MB, validateImage } from "@/utils/image";
import { formatDate } from "@/utils/format";
import Avatar from "@/components/Avatar";
import { Spinner } from "@/components/Loader";

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [errors, setErrors] = useState({});
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imgError, setImgError] = useState("");
  const [imgInfo, setImgInfo] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFirstname(user.firstname || "");
      setLastname(user.lastname || "");
    }
  }, [user]);

  // Revoke the previous preview URL after it is replaced/unmounted.
  // (Manual revoke calls are intentionally avoided: revoking synchronously
  // while an <img> still references the blob can fire onError and, with the
  // old sticky flag, brick the avatar into initials until a reload.)
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!user) return <Spinner label="Loading profile..." />;

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = validateProfile({ firstname, lastname });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setError("");
    setInfo("");
    setSaving(true);
    try {
      await userService.updateProfile({
        firstname: firstname.trim(),
        lastname: lastname.trim(),
      });
      await refreshProfile();
      setInfo("Profile updated successfully.");
    } catch (err) {
      setError(friendlyError(err, "Could not update the profile."));
    } finally {
      setSaving(false);
    }
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    setImgError("");
    setImgInfo("");
    if (!f) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    const msg = validateImage(f);
    if (msg) {
      setImgError(msg);
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file) {
      setImgError("Please choose an image first.");
      return;
    }
    setImgError("");
    setImgInfo("");
    setUploading(true);
    try {
      await userService.uploadImage(file);
      await refreshProfile(); // context user updates → navbar AND body avatars refresh
      setImgInfo("Profile image uploaded successfully.");
      setFile(null);
      setPreviewUrl(null); // effect cleanup revokes the blob afterwards
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setImgError(friendlyError(err, "Could not upload the image."));
    } finally {
      setUploading(false);
    }
  };

  const inputCls = (bad) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100 ${
      bad ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-indigo-500"
    }`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500">Your account details and avatar.</p>
      </div>

      {/* Avatar + upload */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-800">Profile Image</h2>
        <div className="mt-4 flex flex-wrap items-center gap-5">
          <Avatar user={previewUrl ? { ...user, profileImage: previewUrl } : user} size="lg" />
          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="h-20 w-20 rounded-full object-cover ring-2 ring-indigo-300" />
          )}
          <div className="min-w-52 flex-1">
            <input
              ref={fileRef}
              type="file"
              accept={IMAGE_ACCEPT_ATTR}
              onChange={handleFile}
              aria-label="Choose profile image"
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p className="mt-1 text-xs text-gray-400">
              JPG, PNG, GIF or WEBP · max {MAX_IMAGE_MB} MB
            </p>
            {imgError && <p className="mt-1 text-xs text-red-600">{imgError}</p>}
            {imgInfo && <p className="mt-1 text-xs text-green-700">{imgInfo}</p>}
            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </section>

      {/* Details + edit */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-800">Account Details</h2>
        {info && <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">{info}</p>}
        {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <form onSubmit={handleSave} className="mt-4 grid gap-4 sm:grid-cols-2" noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">First Name</label>
            <input value={firstname} onChange={(e) => setFirstname(e.target.value)} className={inputCls(errors.firstname)} />
            {errors.firstname && <p className="mt-1 text-xs text-red-600">{errors.firstname}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Last Name</label>
            <input value={lastname} onChange={(e) => setLastname(e.target.value)} className={inputCls(errors.lastname)} />
            {errors.lastname && <p className="mt-1 text-xs text-red-600">{errors.lastname}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email (read-only)</label>
            <input value={user.email || ""} readOnly disabled className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
            <input value={user.role || ""} readOnly disabled className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm capitalize text-gray-500" />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
        <p className="mt-4 text-xs text-gray-400">
          Member since {formatDate(user.createAt)} · Status: {user.isActive ? "Active" : "Inactive"}
        </p>
      </section>
    </div>
  );
}
