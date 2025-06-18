"use client";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { useModal } from "../../hooks/useModal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";


export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { userProfile, isLoadingProfile, updateProfile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const profileData = {
      name: formData.get("name") as string,
      bio: formData.get("bio") as string,
    };

    try {
      const result = await updateProfile(profileData);
      if (result) {
        toast.success("Profile updated successfully!");
        await refreshProfile(); // Refresh to ensure UserDropdown updates immediately
        closeModal();
        setPreviewImage(null);
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleSaveClick = () => {
    const form = document.getElementById('meta-form') as HTMLFormElement;
    if (form) {
      // Trigger form submission
      form.requestSubmit();
    }
  };

  const handleModalClose = () => {
    closeModal();
    setPreviewImage(null);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploadingImage(true);

    try {
      // Convert image to base64 for preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // For now, we'll store the base64 string as the avatar
      // In a real app, you'd upload to a cloud storage service
      const base64 = await convertToBase64(file);
      
      const result = await updateProfile({ avatar: base64 });
      if (result) {
        toast.success('Profile picture updated successfully!');
        await refreshProfile(); // Refresh to ensure UserDropdown updates immediately
        setPreviewImage(null);
      } else {
        toast.error('Failed to update profile picture');
        setPreviewImage(null);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      setPreviewImage(null);
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          resolve(reader.result as string);
        } else {
          reject('Failed to read file');
        }
      };
      reader.onerror = () => reject('Failed to read file');
      reader.readAsDataURL(file);
    });
  };

  // Use actual profile data or empty strings
  const displayName = userProfile?.name || "";
  const displayEmail = userProfile?.email || "";
  const displayBio = userProfile?.bio || "";
  const avatarUrl = userProfile?.avatar || "/images/user/owner.jpg"; // Keep default avatar

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="relative group">
              <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 cursor-pointer" onClick={handleImageClick}>
                <Image
                  width={80}
                  height={80}
                  src={previewImage || avatarUrl}
                  alt="user"
                  className="object-cover w-full h-full"
                />
                {isUploadingImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 rounded-full opacity-0 group-hover:bg-opacity-50 group-hover:opacity-100 transition-all duration-200 cursor-pointer" onClick={handleImageClick}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {isLoadingProfile ? "Loading..." : displayName}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {displayEmail}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {displayBio}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            Edit
          </button>
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={handleModalClose} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form className="flex flex-col" onSubmit={handleSave} id="meta-form">
            <div className="custom-scrollbar h-[300px] overflow-y-auto px-2 pb-3">
              <div>
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5">
                  <div>
                    <Label>Profile Picture</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
                        <Image
                          width={64}
                          height={64}
                          src={previewImage || avatarUrl}
                          alt="user"
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleImageClick}
                          disabled={isUploadingImage}
                        >
                          {isUploadingImage ? "Uploading..." : "Change Picture"}
                        </Button>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          JPG, PNG or GIF. Max size 5MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Full Name</Label>
                    <Input
                      type="text"
                      name="name"
                      defaultValue={userProfile?.name || ""}
                    />
                  </div>

                  <div>
                    <Label>Bio</Label>
                    <Input
                      type="text"
                      name="bio"
                      defaultValue={userProfile?.bio || ""}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={handleModalClose}>
                Close
              </Button>
              <Button size="sm" onClick={handleSaveClick}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
