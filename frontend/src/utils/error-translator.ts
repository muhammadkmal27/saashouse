/**
 * Error Translator Utility
 * Maps backend error strings to localized versions based on the current language.
 */

export type Language = "EN" | "BM";

const ERROR_MAP: Record<string, { EN: string; BM: string }> = {
  // Authentication Errors
  "Email is already registered": {
    EN: "Email is already registered",
    BM: "E-mel ini sudah berdaftar"
  },
  "Invalid email or password": {
    EN: "Invalid email or password",
    BM: "E-mel atau kata laluan tidak sah"
  },
  "Unauthorized access": {
    EN: "Unauthorized access",
    BM: "Akses tidak dibenarkan"
  },
  "Registration failed": {
    EN: "Registration failed",
    BM: "Pendaftaran gagal"
  },
  "An internal server error occurred": {
    EN: "An internal server error occurred",
    BM: "Berlaku ralat dalaman pelayan"
  },

  // Validation Messages (Internal part of Validation failed: [field]: [message])
  "Nama penuh terlalu pendek": {
    EN: "Full name is too short",
    BM: "Nama penuh terlalu pendek"
  },
  "Sila masukkan emel yang sah": {
    EN: "Please enter a valid email",
    BM: "Sila masukkan e-mel yang sah"
  },
  "Kata laluan mestilah sekurang-kurangnya 8 aksara": {
    EN: "Password must be at least 8 characters",
    BM: "Kata laluan mestilah sekurang-kurangnya 8 aksara"
  },
  "Kata laluan mesti mengandungi sekurang-kurangnya satu nombor dan satu simbol": {
    EN: "Password must contain at least one number and one symbol",
    BM: "Kata laluan mesti mengandungi sekurang-kurangnya satu nombor dan satu simbol"
  },
  "Format emel tidak sah": {
    EN: "Invalid email format",
    BM: "Format e-mel tidak sah"
  },
  "Sila masukkan kata laluan": {
    EN: "Please enter your password",
    BM: "Sila masukkan kata laluan"
  },
  "Too many requests. Please try again later.": {
    EN: "Too many requests. Please try again later.",
    BM: "Terlalu banyak permintaan. Sila cuba lagi sebentar."
  },
  "Invalid verification code.": {
    EN: "Invalid verification code.",
    BM: "Kod pengesahan tidak sah."
  },
  "Server connection error.": {
    EN: "Server connection error.",
    BM: "Ralat sambungan pelayan."
  },
  "Failed to resend code.": {
    EN: "Failed to resend code.",
    BM: "Gagal menghantar semula kod."
  },
  "Failed to load project data.": {
    EN: "Failed to load project data.",
    BM: "Gagal memuatkan data projek."
  },
  "Failed to update auto-renewal settings.": {
    EN: "Failed to update auto-renewal settings.",
    BM: "Gagal mengemas kini tetapan pembaharuan automatik."
  },
  "Network error.": {
    EN: "Network error.",
    BM: "Ralat rangkaian."
  },
  "Failed to start checkout session.": {
    EN: "Failed to start checkout session.",
    BM: "Gagal memulakan sesi pembayaran."
  },
  "Failed to create admin user.": {
    EN: "Failed to create admin user.",
    BM: "Gagal mencipta pengguna admin."
  },
  "Network error: Could not reach backend.": {
    EN: "Network error: Could not reach backend.",
    BM: "Ralat rangkaian: Tidak dapat menghubungi backend."
  },
  "Failed to update status.": {
    EN: "Failed to update status.",
    BM: "Gagal mengemas kini status."
  },
  "Failed to cancel subscription.": {
    EN: "Failed to cancel subscription.",
    BM: "Gagal membatalkan langganan."
  }
};

export const translateError = (error: string, lang: Language): string => {
  if (!error) return "";

  // 1. Handle "Validation failed: [field]: [message]" pattern
  if (error.startsWith("Validation failed:")) {
    const parts = error.split(": ");
    if (parts.length >= 3) {
      const field = parts[1];
      const originalMessagesBlob = parts.slice(2).join(": ");
      
      // Split messages if there are multiple (validator joins them with ", ")
      const messageParts = originalMessagesBlob.split(", ");
      const translatedParts = messageParts.map(msg => {
        return ERROR_MAP[msg] ? ERROR_MAP[msg][lang] : msg;
      });

      const finalMessage = translatedParts.join(", ");
      
      if (lang === "BM") {
        const fieldMap: Record<string, string> = {
          "email": "emel",
          "password": "kata laluan",
          "full_name": "nama penuh",
          "new_password": "kata laluan baru",
          "code": "kod"
        };
        const bmField = fieldMap[field] || field;
        return `Ralat pengesahan: ${bmField}: ${finalMessage}`;
      } else {
        return `Validation failed: ${field}: ${finalMessage}`;
      }
    }
  }

  // 2. Handle direct matches
  if (ERROR_MAP[error]) {
    return ERROR_MAP[error][lang];
  }

  // 3. Fallback
  return error;
};
