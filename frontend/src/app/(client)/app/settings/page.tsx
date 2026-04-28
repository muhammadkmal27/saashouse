"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProfileSettingsPage from "./profile/page";
import AccountSettingsPage from "./account/page";
import SecuritySettingsPage from "./security/page";
import NotificationsSettingsPage from "./notifications/page";

function SettingsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const currentTab = searchParams.get("tab") || "profile";

    // This component will act as a router for the settings tabs
    // and provide the smooth experience the user requested.
    
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
