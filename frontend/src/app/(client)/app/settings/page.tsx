"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProfileSettingsPage from "./profile/page";
import AccountSettingsPage from "./account/page";
import SecuritySettingsPage from "./security/page";
import NotificationsSettingsPage from "./notifications/page";

function SettingsContent() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    
    // Always default to profile if no tab is provided
    const currentTab = tabParam || "profile";

    switch (currentTab) {
        case "profile":
            return <ProfileSettingsPage />;
        case "account":
            return <AccountSettingsPage />;
        case "security":
            return <SecuritySettingsPage />;
        case "notifications":
            return <NotificationsSettingsPage />;
        default:
            return <ProfileSettingsPage />;
    }
}

export default function SettingsPage() {
    return (
        <Suspense fallback={null}>
            <SettingsContent />
        </Suspense>
    );
}
