# Vietnamese Support & Full i18n Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Vietnamese language detection and migrate every hardcoded user-visible string in the app to `t()` calls, with translations for `en`, `th`, and `vi`.

**Architecture:** Single JSON file per language. New keys use domain-prefixed nested structure (`flashcards.flip.back`, `dashboard.stats.xp`, etc.) so future namespace extraction is a config-only change. Existing keys are not renamed. i18n.ts gains `'vi'` and `nonExplicitSupportedLngs: true` so browser-detected `vi-VN` resolves to `vi`.

**Tech Stack:** i18next, react-i18next, i18next-browser-languagedetector, Vitest, @testing-library/react

---

## Scope note on Zod validation messages

`src/schemas/authSchema.ts`, `src/schemas/contactSchema.ts`, and the inline schema in `CreateSetModal.tsx` contain hardcoded error strings. Translating Zod messages requires either a library (e.g. `zod-i18n-map`) or converting all messages to translation keys + wrapping at every display site. That is **out of scope for this migration** — those messages remain in English. Everything else in the app is in scope.

---

### Task 1: Grep audit — confirm complete string inventory

**Files:**
- Read-only audit (no changes)

- [ ] **Step 1: Grep for JSX text literals and aria-labels likely to be missed**

```bash
# Button text
grep -rn --include="*.tsx" '>[A-Z][a-z]' src/ | grep -v '{t(' | grep -v 'node_modules' | grep -v '.test.' | grep -v '//.*>'

# Toast calls with string literals
grep -rn --include="*.ts" --include="*.tsx" "toast\.(success|error)\('" src/ | grep -v 'node_modules'

# aria-label string literals
grep -rn --include="*.tsx" 'aria-label="[^{]' src/ | grep -v 'node_modules' | grep -v '.test.'

# placeholder string literals
grep -rn --include="*.tsx" 'placeholder="[^{]' src/ | grep -v 'node_modules' | grep -v '.test.'
```

- [ ] **Step 2: Review output and confirm no files are missing from the plan**

Expected matches: `Flashcard.tsx`, `FlashcardViewer.tsx`, `FlashcardSetList.tsx`, `CreateSetModal.tsx`, `WelcomeBanner.tsx`, `ActionBar.tsx`, `ContinueStudyingCard.tsx`, `RecommendedNextCard.tsx`, `InviteFriendsCard.tsx`, `StudyGroupsCard.tsx`, `WelcomePanel.tsx`, `XPProgress.tsx`, `StudyStats.tsx`, `FlashcardGroups.tsx`, `LogoutButton.tsx`, `ErrorBoundary.tsx`, `ErrorGuidanceCard.tsx`, `GoogleAuthButton.tsx`, `Footer.tsx`, `AppSidebar.tsx`, `AuthCallback.tsx`, `useLoginForm.ts`, `passwordRules.ts`, `App.tsx`.

If any file appears that is NOT in the list above, add it to the appropriate later task before proceeding.

---

### Task 2: Write locale files

**Files:**
- Modify: `src/locales/en/en.json`
- Modify: `src/locales/th/th.json`
- Create: `src/locales/vi/vi.json`

No tests for this task (JSON data files).

- [ ] **Step 1: Add new keys to `src/locales/en/en.json`**

Append these top-level sections to the existing JSON object (keep all existing keys untouched):

```json
{
  "flashcards": {
    "choose_native_language": "Choose your native language to see translations:",
    "translation_coming_soon": "Translation coming soon",
    "card_not_translated": "Card not yet translated. Press to flip.",
    "flip": {
      "front_with_word": "Flip card for {{word}}",
      "front_no_word": "Flip card to see translation",
      "back": "Flip card back"
    },
    "tts": {
      "speak_label": "Hear pronunciation of {{word}}"
    },
    "example": {
      "show": "Show Example",
      "hide": "Hide Example"
    },
    "viewer": {
      "no_cards": "No cards in this set yet.",
      "back_to_sets": "← Back to sets",
      "back": "← Back",
      "card_count": "Card {{current}} of {{total}}",
      "previous": "← Previous",
      "next": "Next →",
      "go_to_card": "Go to card {{number}}",
      "still_learning": "Still learning",
      "i_know_this": "I know this",
      "keyboard_hint": "Use ← → arrow keys to navigate"
    },
    "sets": {
      "heading": "Flashcard Sets",
      "create": "+ Create set",
      "loading": "Loading sets…",
      "load_error": "Failed to load sets: {{error}}",
      "empty": "No sets available yet.",
      "card_singular": "card",
      "card_plural": "cards"
    },
    "create_modal": {
      "heading": "Create flashcard set",
      "title_label": "Title",
      "title_placeholder": "e.g. Business English",
      "description_label": "Description",
      "description_placeholder": "Optional description",
      "submit_loading": "Creating…",
      "submit": "Create set",
      "cancel": "Cancel",
      "error_default": "Failed to create set"
    },
    "welcome": {
      "title": "Master English with",
      "title_highlight": "Flashcards",
      "subtitle": "Practice vocabulary, improve pronunciation, and build confidence in your English learning journey."
    },
    "action_bar": {
      "play_audio": "Play Audio",
      "play_audio_tooltip": "Play pronunciation",
      "show_image": "Show Image",
      "image_tooltip": "View related image",
      "no_image_tooltip": "No image available",
      "study_mode": "Study Mode",
      "study_mode_tooltip": "Toggle study mode",
      "add_word": "Add Word",
      "add_word_tooltip": "Add to personal deck",
      "add_word_login_tooltip": "Login to add words"
    },
    "loading_cards": "Loading cards…",
    "language": {
      "th": "Thai",
      "zh": "Chinese",
      "vi": "Vietnamese"
    }
  },
  "dashboard": {
    "welcome": {
      "greeting": "Welcome back, {{name}}!",
      "journey": "Ready to continue your English learning journey?",
      "level": "Level {{level}}",
      "streak": "{{streak}} day streak"
    },
    "xp": {
      "heading": "XP Progress",
      "to_next_level": "{{percent}}% to next level",
      "xp_per_word": "+{{xp}} XP per word",
      "words": "{{count}} words",
      "tiers": {
        "beginner": "Beginner",
        "intermediate": "Intermediate",
        "expert": "Expert"
      }
    },
    "groups": {
      "heading": "Your Flashcard Groups",
      "progress": "Progress",
      "cards": "{{completed}}/{{total}} cards",
      "today": "Today",
      "yesterday": "Yesterday"
    },
    "stats": {
      "words_learned": "Words Learned",
      "today": "Today",
      "accuracy": "Accuracy",
      "day_streak": "Day Streak"
    },
    "logout": "Logout",
    "loading": "Loading..."
  },
  "about": {
    "title": "About Tiger English",
    "tagline": "Building tools for language learners",
    "story": {
      "p1": "Tiger English was created by someone who understands both the challenges of learning a language and the value of great tools. I have a background in web development, a TEFL certification, and a passion for building interactive, learner-friendly experiences.",
      "p2": "This platform started as a side project — a way to combine my technical skills with my interest in education. My goal is to help English learners grow their vocabulary and confidence through fun, focused practice.",
      "p3": "I'm currently preparing to live and teach abroad, and Tiger English is part of that journey. I'm actively improving the site, learning as I go, and building it into something that can genuinely help others."
    },
    "skills": {
      "heading": "Skills & Technologies",
      "intro": "This platform is built with modern web technologies to ensure a fast, accessible, and engaging learning experience:",
      "categories": {
        "Frontend": "Frontend",
        "Styling": "Styling",
        "Build Tool": "Build Tool",
        "Backend": "Backend",
        "Internationalization": "Internationalization"
      }
    },
    "connect": {
      "heading": "Connect With Me",
      "contact_heading": "Get In Touch",
      "contact_desc": "Want to share feedback, ideas, or just say hi?",
      "contact_button": "Contact Me",
      "coming_soon": "Coming soon",
      "social_aria": "{{name}} profile",
      "avatar_alt": "Profile picture of the Tiger English creator"
    }
  },
  "contact": {
    "heading": "Get In Touch",
    "intro": "Have questions, feedback, or just want to say hello? I'd love to hear from you!",
    "form": {
      "name_label": "Name",
      "name_placeholder": "Your full name",
      "email_label": "Email",
      "email_placeholder": "your.email@example.com",
      "message_label": "Message",
      "message_placeholder": "Tell me about your question, feedback, or just say hello...",
      "submit": "Send Message",
      "sending": "Sending...",
      "success": "Message sent successfully! I'll get back to you soon.",
      "error": "Failed to send message. Please try again."
    },
    "info": {
      "heading": "Let's Connect",
      "intro": "I'm always excited to connect with fellow language learners, educators, and developers.",
      "direct_heading": "Direct Contact",
      "social_heading": "Social Media",
      "coming_soon": "Coming soon",
      "social_aria": "{{name}} profile"
    },
    "faq": {
      "heading": "Quick Questions?",
      "q1": "What's the best way to reach you?",
      "a1": "Email is the most reliable way to get in touch. I typically respond within 24-48 hours.",
      "q2": "Can you help with my English learning?",
      "a2": "Absolutely! I love helping learners. Feel free to share your questions or challenges.",
      "q3": "Are you available for collaboration?",
      "a3": "I'm always open to interesting projects and collaborations. Let's discuss your ideas!"
    }
  },
  "authhome": {
    "continue_studying": {
      "heading": "Continue Studying",
      "empty": "You haven't studied any sets yet.",
      "start": "Start your first set",
      "reviewed": "Reviewed {{reviewed}} of {{total}} cards",
      "completed": "Completed ✓",
      "continue": "Continue Studying",
      "streak_badge": "{{streak}} day streak",
      "accuracy_badge": "{{accuracy}}% accuracy",
      "time": {
        "less_than_hour": "Less than an hour ago",
        "one_hour": "1 hour ago",
        "hours": "{{hours}} hours ago",
        "one_day": "1 day ago",
        "days": "{{days}} days ago"
      }
    },
    "recommended": {
      "heading": "Recommended Next",
      "empty": "Complete a set to unlock recommendations.",
      "reasons": {
        "review": "Needs review",
        "sequence": "Next in sequence",
        "related": "Related to recent study"
      },
      "study": "Study"
    },
    "invite": {
      "heading": "Invite Friends",
      "desc": "Know someone who wants to learn English? Invite them to Tiger English.",
      "copy": "Copy Invite Link",
      "invite": "Invite a Friend",
      "toast": {
        "no_clipboard": "Clipboard not available. Please copy the link manually.",
        "copied": "Invite link copied!",
        "copy_failed": "Failed to copy link. Please copy it manually."
      }
    },
    "study_groups": {
      "heading": "Study Groups",
      "empty": "No study groups yet. Create one to study with friends.",
      "members": "{{count}} members",
      "create": "Create Study Group",
      "invite": "Invite to Group"
    }
  },
  "auth": {
    "errors": {
      "email_registered": "It looks like you already have an account with this email.",
      "login_instead": "Log in instead →",
      "username_taken": "Please try a different username. You can use letters, numbers, and underscores.",
      "general": "Please check your information and try again.",
      "invalid_credentials": "Invalid email or password"
    },
    "google": {
      "button": "Continue with Google",
      "connecting": "Connecting…"
    },
    "separator": "or",
    "toast": {
      "login_success": "Login successful"
    },
    "password_rules": {
      "min_length": "At least 8 characters",
      "uppercase": "One uppercase letter",
      "special": "One special character (!@#$%^&*)"
    },
    "callback": {
      "checking": "Signing you in…",
      "waiting": "Setting up your account…",
      "timeout_title": "Taking longer than expected",
      "timeout_message": "Your account is being set up. This usually takes just a moment.",
      "try_again": "Try again",
      "back_to_login": "Back to login",
      "error_title": "Authentication failed",
      "error_default": "Something went wrong during sign-in. Please try again.",
      "session_expired": "Your session has expired. Please sign in again.",
      "timed_out": "Authentication timed out. Please try again."
    }
  },
  "common": {
    "loading": "Loading...",
    "error": {
      "title": "Something went wrong",
      "message": "We're sorry, but something unexpected happened. Please try refreshing the page.",
      "refresh": "Refresh Page",
      "dev_details": "Error Details (Development)"
    },
    "nav": {
      "open_menu": "Open menu",
      "close_menu": "Close menu",
      "open_nav": "Open navigation",
      "close_nav": "Close navigation",
      "expand_sidebar": "Expand sidebar",
      "collapse_sidebar": "Collapse sidebar"
    },
    "footer": "© {{year}} Tiger English — All rights reserved.",
    "coming_soon": "coming soon",
    "sidebar": {
      "title": "Tiger English",
      "nav": {
        "home": "Home",
        "dashboard": "Dashboard",
        "library": "Library",
        "study_groups": "Study Groups",
        "notifications": "Notifications",
        "flashcards": "Flashcards",
        "drag_drop": "Drag & Drop",
        "ad_libs": "Ad Libs"
      },
      "utility": {
        "settings": "Settings",
        "help": "Help",
        "profile": "Profile",
        "logout": "Logout"
      }
    },
    "stub": {
      "coming_soon": "{{title}} — coming soon"
    }
  }
}
```

Note: the `flashcards` top-level key already exists in en.json with `choose_native_language`, `translation_coming_soon`, and `card_not_translated`. Merge the new sub-keys into the existing object — do not duplicate the top-level `flashcards` key. Similarly, `auth` is a new top-level key; the existing `register`, `login`, `logout`, `settings` keys are separate and untouched.

- [ ] **Step 2: Add new keys to `src/locales/th/th.json`**

Append these sections (same merge rule as above):

```json
{
  "flashcards": {
    "flip": {
      "front_with_word": "พลิกการ์ดสำหรับ {{word}}",
      "front_no_word": "พลิกการ์ดเพื่อดูคำแปล",
      "back": "พลิกกลับการ์ด"
    },
    "tts": {
      "speak_label": "ฟังการออกเสียง {{word}}"
    },
    "example": {
      "show": "แสดงตัวอย่าง",
      "hide": "ซ่อนตัวอย่าง"
    },
    "viewer": {
      "no_cards": "ยังไม่มีการ์ดในชุดนี้",
      "back_to_sets": "← กลับไปยังชุดการ์ด",
      "back": "← กลับ",
      "card_count": "การ์ดที่ {{current}} จาก {{total}}",
      "previous": "← ก่อนหน้า",
      "next": "ถัดไป →",
      "go_to_card": "ไปยังการ์ดที่ {{number}}",
      "still_learning": "กำลังเรียนรู้",
      "i_know_this": "ฉันรู้คำนี้แล้ว",
      "keyboard_hint": "ใช้ปุ่ม ← → เพื่อนำทาง"
    },
    "sets": {
      "heading": "ชุดแฟลชการ์ด",
      "create": "+ สร้างชุด",
      "loading": "กำลังโหลดชุดการ์ด…",
      "load_error": "โหลดชุดการ์ดล้มเหลว: {{error}}",
      "empty": "ยังไม่มีชุดการ์ด",
      "card_singular": "การ์ด",
      "card_plural": "การ์ด"
    },
    "create_modal": {
      "heading": "สร้างชุดแฟลชการ์ด",
      "title_label": "ชื่อ",
      "title_placeholder": "เช่น Business English",
      "description_label": "คำอธิบาย",
      "description_placeholder": "คำอธิบาย (ไม่จำเป็น)",
      "submit_loading": "กำลังสร้าง…",
      "submit": "สร้างชุด",
      "cancel": "ยกเลิก",
      "error_default": "สร้างชุดไม่สำเร็จ"
    },
    "welcome": {
      "title": "เชี่ยวชาญภาษาอังกฤษด้วย",
      "title_highlight": "แฟลชการ์ด",
      "subtitle": "ฝึกคำศัพท์ พัฒนาการออกเสียง และสร้างความมั่นใจในการเรียนรู้ภาษาอังกฤษ"
    },
    "action_bar": {
      "play_audio": "เล่นเสียง",
      "play_audio_tooltip": "เล่นการออกเสียง",
      "show_image": "แสดงรูปภาพ",
      "image_tooltip": "ดูรูปภาพที่เกี่ยวข้อง",
      "no_image_tooltip": "ไม่มีรูปภาพ",
      "study_mode": "โหมดเรียน",
      "study_mode_tooltip": "สลับโหมดเรียน",
      "add_word": "เพิ่มคำ",
      "add_word_tooltip": "เพิ่มในสำรับส่วนตัว",
      "add_word_login_tooltip": "เข้าสู่ระบบเพื่อเพิ่มคำ"
    },
    "loading_cards": "กำลังโหลดการ์ด…",
    "language": {
      "th": "ภาษาไทย",
      "zh": "ภาษาจีน",
      "vi": "ภาษาเวียดนาม"
    }
  },
  "dashboard": {
    "welcome": {
      "greeting": "ยินดีต้อนรับกลับ {{name}}!",
      "journey": "พร้อมเรียนรู้ภาษาอังกฤษต่อแล้วใช่ไหม?",
      "level": "เลเวล {{level}}",
      "streak": "ต่อเนื่อง {{streak}} วัน"
    },
    "xp": {
      "heading": "ความคืบหน้า XP",
      "to_next_level": "{{percent}}% ถึงเลเวลถัดไป",
      "xp_per_word": "+{{xp}} XP ต่อคำ",
      "words": "{{count}} คำ",
      "tiers": {
        "beginner": "ผู้เริ่มต้น",
        "intermediate": "ระดับกลาง",
        "expert": "ผู้เชี่ยวชาญ"
      }
    },
    "groups": {
      "heading": "กลุ่มแฟลชการ์ดของคุณ",
      "progress": "ความคืบหน้า",
      "cards": "{{completed}}/{{total}} การ์ด",
      "today": "วันนี้",
      "yesterday": "เมื่อวาน"
    },
    "stats": {
      "words_learned": "คำที่เรียนรู้แล้ว",
      "today": "วันนี้",
      "accuracy": "ความแม่นยำ",
      "day_streak": "วันต่อเนื่อง"
    },
    "logout": "ออกจากระบบ",
    "loading": "กำลังโหลด..."
  },
  "about": {
    "title": "เกี่ยวกับ Tiger English",
    "tagline": "สร้างเครื่องมือสำหรับผู้เรียนภาษา",
    "story": {
      "p1": "Tiger English สร้างขึ้นโดยผู้ที่เข้าใจทั้งความท้าทายในการเรียนภาษาและคุณค่าของเครื่องมือที่ดี ฉันมีพื้นฐานด้านการพัฒนาเว็บ ใบรับรอง TEFL และความหลงใหลในการสร้างประสบการณ์การเรียนรู้แบบโต้ตอบ",
      "p2": "แพลตฟอร์มนี้เริ่มต้นเป็นโปรเจกต์ส่วนตัว เพื่อผสานทักษะด้านเทคนิคกับความสนใจในการศึกษา เป้าหมายของฉันคือช่วยผู้เรียนภาษาอังกฤษพัฒนาคำศัพท์และความมั่นใจผ่านการฝึกฝนที่สนุกและเน้นประสิทธิภาพ",
      "p3": "ฉันกำลังเตรียมตัวไปอาศัยและสอนต่างประเทศ และ Tiger English เป็นส่วนหนึ่งของเส้นทางนั้น ฉันกำลังพัฒนาเว็บไซต์อย่างต่อเนื่อง เรียนรู้ไปพร้อมกัน และสร้างให้เป็นสิ่งที่ช่วยคนอื่นได้จริงๆ"
    },
    "skills": {
      "heading": "ทักษะและเทคโนโลยี",
      "intro": "แพลตฟอร์มนี้สร้างด้วยเทคโนโลยีเว็บสมัยใหม่เพื่อให้มีประสบการณ์การเรียนรู้ที่รวดเร็ว เข้าถึงได้ และน่าสนใจ:",
      "categories": {
        "Frontend": "ฟรอนต์เอนด์",
        "Styling": "สไตล์",
        "Build Tool": "บิลด์ทูล",
        "Backend": "แบ็กเอนด์",
        "Internationalization": "การทำให้เป็นสากล"
      }
    },
    "connect": {
      "heading": "ติดต่อฉัน",
      "contact_heading": "ติดต่อ",
      "contact_desc": "ต้องการแบ่งปันความคิดเห็น ไอเดีย หรือแค่ทักทาย?",
      "contact_button": "ติดต่อ",
      "coming_soon": "เร็วๆ นี้",
      "social_aria": "โปรไฟล์ {{name}}",
      "avatar_alt": "รูปโปรไฟล์ของผู้สร้าง Tiger English"
    }
  },
  "contact": {
    "heading": "ติดต่อ",
    "intro": "มีคำถาม ความคิดเห็น หรือแค่อยากทักทาย? ยินดีรับฟังทุกอย่าง!",
    "form": {
      "name_label": "ชื่อ",
      "name_placeholder": "ชื่อ-นามสกุล",
      "email_label": "อีเมล",
      "email_placeholder": "your.email@example.com",
      "message_label": "ข้อความ",
      "message_placeholder": "บอกฉันเกี่ยวกับคำถาม ความคิดเห็น หรือแค่ทักทาย...",
      "submit": "ส่งข้อความ",
      "sending": "กำลังส่ง...",
      "success": "ส่งข้อความสำเร็จแล้ว! ฉันจะติดต่อกลับเร็วๆ นี้",
      "error": "ส่งข้อความล้มเหลว กรุณาลองอีกครั้ง"
    },
    "info": {
      "heading": "มาเชื่อมต่อกัน",
      "intro": "ฉันยินดีเชื่อมต่อกับผู้เรียนภาษา นักการศึกษา และนักพัฒนา",
      "direct_heading": "ติดต่อโดยตรง",
      "social_heading": "โซเชียลมีเดีย",
      "coming_soon": "เร็วๆ นี้",
      "social_aria": "โปรไฟล์ {{name}}"
    },
    "faq": {
      "heading": "คำถามทั่วไป",
      "q1": "วิธีที่ดีที่สุดในการติดต่อคุณคืออะไร?",
      "a1": "อีเมลเป็นวิธีที่น่าเชื่อถือที่สุดในการติดต่อ ฉันมักตอบกลับภายใน 24-48 ชั่วโมง",
      "q2": "คุณสามารถช่วยในการเรียนภาษาอังกฤษของฉันได้ไหม?",
      "a2": "แน่นอน! ฉันชอบช่วยเหลือผู้เรียน อย่าลังเลที่จะแบ่งปันคำถามหรือความท้าทายของคุณ",
      "q3": "คุณพร้อมร่วมงานไหม?",
      "a3": "ฉันเปิดรับโปรเจกต์และความร่วมมือที่น่าสนใจเสมอ มาพูดคุยเกี่ยวกับไอเดียของคุณ!"
    }
  },
  "authhome": {
    "continue_studying": {
      "heading": "เรียนต่อ",
      "empty": "คุณยังไม่ได้เรียนชุดการ์ดใดเลย",
      "start": "เริ่มชุดแรกของคุณ",
      "reviewed": "ทบทวน {{reviewed}} จาก {{total}} การ์ด",
      "completed": "เสร็จสิ้น ✓",
      "continue": "เรียนต่อ",
      "streak_badge": "ต่อเนื่อง {{streak}} วัน",
      "accuracy_badge": "ความแม่นยำ {{accuracy}}%",
      "time": {
        "less_than_hour": "น้อยกว่าหนึ่งชั่วโมงที่ผ่านมา",
        "one_hour": "1 ชั่วโมงที่ผ่านมา",
        "hours": "{{hours}} ชั่วโมงที่ผ่านมา",
        "one_day": "1 วันที่ผ่านมา",
        "days": "{{days}} วันที่ผ่านมา"
      }
    },
    "recommended": {
      "heading": "แนะนำถัดไป",
      "empty": "เรียนชุดการ์ดให้ครบเพื่อรับคำแนะนำ",
      "reasons": {
        "review": "ต้องทบทวน",
        "sequence": "ลำดับถัดไป",
        "related": "เกี่ยวข้องกับการเรียนล่าสุด"
      },
      "study": "เรียน"
    },
    "invite": {
      "heading": "เชิญเพื่อน",
      "desc": "รู้จักคนที่ต้องการเรียนภาษาอังกฤษไหม? เชิญพวกเขามาที่ Tiger English",
      "copy": "คัดลอกลิงก์เชิญ",
      "invite": "เชิญเพื่อน",
      "toast": {
        "no_clipboard": "ไม่สามารถใช้คลิปบอร์ดได้ กรุณาคัดลอกลิงก์ด้วยตนเอง",
        "copied": "คัดลอกลิงก์เชิญแล้ว!",
        "copy_failed": "คัดลอกลิงก์ล้มเหลว กรุณาคัดลอกด้วยตนเอง"
      }
    },
    "study_groups": {
      "heading": "กลุ่มเรียน",
      "empty": "ยังไม่มีกลุ่มเรียน สร้างกลุ่มเพื่อเรียนกับเพื่อน",
      "members": "{{count}} สมาชิก",
      "create": "สร้างกลุ่มเรียน",
      "invite": "เชิญเข้ากลุ่ม"
    }
  },
  "auth": {
    "errors": {
      "email_registered": "ดูเหมือนว่าคุณมีบัญชีอยู่แล้วด้วยอีเมลนี้",
      "login_instead": "เข้าสู่ระบบแทน →",
      "username_taken": "กรุณาลองชื่อผู้ใช้อื่น สามารถใช้ตัวอักษร ตัวเลข และขีดล่าง",
      "general": "กรุณาตรวจสอบข้อมูลของคุณและลองอีกครั้ง",
      "invalid_credentials": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
    },
    "google": {
      "button": "ดำเนินการต่อด้วย Google",
      "connecting": "กำลังเชื่อมต่อ…"
    },
    "separator": "หรือ",
    "toast": {
      "login_success": "เข้าสู่ระบบสำเร็จ"
    },
    "password_rules": {
      "min_length": "อย่างน้อย 8 ตัวอักษร",
      "uppercase": "ตัวพิมพ์ใหญ่หนึ่งตัว",
      "special": "อักขระพิเศษหนึ่งตัว (!@#$%^&*)"
    },
    "callback": {
      "checking": "กำลังเข้าสู่ระบบ…",
      "waiting": "กำลังตั้งค่าบัญชีของคุณ…",
      "timeout_title": "ใช้เวลานานกว่าที่คาด",
      "timeout_message": "บัญชีของคุณกำลังถูกตั้งค่า ปกติใช้เวลาเพียงชั่วครู่",
      "try_again": "ลองอีกครั้ง",
      "back_to_login": "กลับไปเข้าสู่ระบบ",
      "error_title": "การยืนยันตัวตนล้มเหลว",
      "error_default": "มีบางอย่างผิดพลาดระหว่างการเข้าสู่ระบบ กรุณาลองอีกครั้ง",
      "session_expired": "เซสชันของคุณหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง",
      "timed_out": "การยืนยันตัวตนหมดเวลา กรุณาลองอีกครั้ง"
    }
  },
  "common": {
    "loading": "กำลังโหลด...",
    "error": {
      "title": "มีบางอย่างผิดพลาด",
      "message": "ขออภัย มีบางอย่างที่ไม่คาดคิดเกิดขึ้น กรุณารีเฟรชหน้า",
      "refresh": "รีเฟรชหน้า",
      "dev_details": "รายละเอียดข้อผิดพลาด (การพัฒนา)"
    },
    "nav": {
      "open_menu": "เปิดเมนู",
      "close_menu": "ปิดเมนู",
      "open_nav": "เปิดการนำทาง",
      "close_nav": "ปิดการนำทาง",
      "expand_sidebar": "ขยายแถบด้านข้าง",
      "collapse_sidebar": "ย่อแถบด้านข้าง"
    },
    "footer": "© {{year}} Tiger English — สงวนลิขสิทธิ์",
    "coming_soon": "เร็วๆ นี้",
    "sidebar": {
      "title": "Tiger English",
      "nav": {
        "home": "หน้าแรก",
        "dashboard": "แดชบอร์ด",
        "library": "ห้องสมุด",
        "study_groups": "กลุ่มเรียน",
        "notifications": "การแจ้งเตือน",
        "flashcards": "แฟลชการ์ด",
        "drag_drop": "ลากและวาง",
        "ad_libs": "เติมคำ"
      },
      "utility": {
        "settings": "การตั้งค่า",
        "help": "ช่วยเหลือ",
        "profile": "โปรไฟล์",
        "logout": "ออกจากระบบ"
      }
    },
    "stub": {
      "coming_soon": "{{title}} — เร็วๆ นี้"
    }
  }
}
```

- [ ] **Step 3: Create `src/locales/vi/vi.json` with the full key set**

This file must contain ALL keys — both the existing ones from `en.json` AND the new keys added in Step 1. Create the file with this complete content:

```json
{
  "hero": {
    "badge": "Học tiếng Anh với AI",
    "title": "Học tiếng Anh tự tin hơn",
    "subtitle": "Được thiết kế cho học sinh và người đi làm. Xây dựng vốn từ, cải thiện sự lưu loát và phát triển kỹ năng với các công cụ AI và gia sư cá nhân.",
    "cta": "Bắt đầu học ngay hôm nay",
    "try_flashcards": "Thử thẻ học",
    "learn_more": "Tìm hiểu thêm"
  },
  "features": {
    "heading": "Mọi thứ bạn cần để thành thạo tiếng Anh",
    "subheading": "Nền tảng toàn diện của chúng tôi kết hợp AI tiên tiến với các phương pháp giảng dạy đã được chứng minh",
    "cards": {
      "flashcards": {
        "title": "Thẻ học tương tác",
        "desc": "Tạo thẻ từ vựng hỗ trợ AI với hình ảnh theo ngữ cảnh, phát âm và định nghĩa cá nhân hóa phù hợp với phong cách học của bạn."
      },
      "tutoring": {
        "title": "Gia sư cá nhân",
        "desc": "Nhận hỗ trợ 1-1 từ các gia sư giàu kinh nghiệm, hiểu những thách thức đặc thù của người học và thích nghi với tốc độ cũng như mục tiêu của bạn."
      },
      "ai": {
        "title": "Học tập với AI",
        "desc": "Trải nghiệm nội dung thông minh thích nghi với tiến trình của bạn, xác định điểm yếu và cung cấp bài tập có mục tiêu để cải thiện tối đa."
      }
    }
  },
  "cta": {
    "heading": "Sẵn sàng nâng cao kỹ năng tiếng Anh?",
    "desc": "Tiếng Anh tự tin cho học sinh, người đi làm và các nhà lãnh đạo tương lai.",
    "button": "Tạo tài khoản",
    "contact": "Liên hệ chúng tôi"
  },
  "header": {
    "logo": "Tiger English",
    "tagline": "Thắp sáng con đường đến tiếng Anh tự tin",
    "nav": {
      "flashcards": "Thẻ học",
      "about": "Giới thiệu",
      "contact": "Liên hệ",
      "login": "Đăng nhập",
      "register": "Đăng ký",
      "dashboard": "Bảng điều khiển",
      "logout": "Đăng xuất"
    }
  },
  "register": {
    "title": "Tạo tài khoản",
    "subtitle": "Tham gia Tiger English và bắt đầu học tiếng Anh với các công cụ AI và gia sư thực tế.",
    "first_name": "Tên",
    "last_name": "Họ",
    "email": "Email",
    "password": "Mật khẩu",
    "confirm_password": "Xác nhận mật khẩu",
    "submit": "Đăng ký",
    "login_link": "Đã có tài khoản?",
    "login_cta": "Đăng nhập",
    "loading": "Đang tạo tài khoản...",
    "username": "Tên người dùng",
    "native_language": "Ngôn ngữ mẹ đẻ của bạn",
    "native_language_hint": "Thẻ sẽ hiển thị ngôn ngữ này ở mặt trước. Bạn có thể thay đổi trong Cài đặt."
  },
  "login": {
    "title": "Chào mừng trở lại",
    "subtitle": "Đăng nhập để tiếp tục học",
    "email": "Địa chỉ email",
    "password": "Mật khẩu",
    "submit": "Đăng nhập",
    "loading": "Đang đăng nhập...",
    "no_account": "Chưa có tài khoản?",
    "create_account": "Đăng ký"
  },
  "logout": {
    "success": "Đăng xuất thành công",
    "fail": "Đăng xuất thất bại"
  },
  "flashcards": {
    "choose_native_language": "Chọn ngôn ngữ mẹ đẻ để xem bản dịch:",
    "translation_coming_soon": "Bản dịch sắp có",
    "card_not_translated": "Thẻ này chưa có bản dịch. Nhấn để lật.",
    "flip": {
      "front_with_word": "Lật thẻ cho {{word}}",
      "front_no_word": "Lật thẻ để xem bản dịch",
      "back": "Lật thẻ lại"
    },
    "tts": {
      "speak_label": "Nghe cách phát âm {{word}}"
    },
    "example": {
      "show": "Xem ví dụ",
      "hide": "Ẩn ví dụ"
    },
    "viewer": {
      "no_cards": "Chưa có thẻ nào trong bộ này.",
      "back_to_sets": "← Quay lại bộ thẻ",
      "back": "← Quay lại",
      "card_count": "Thẻ {{current}} / {{total}}",
      "previous": "← Trước",
      "next": "Tiếp →",
      "go_to_card": "Đi đến thẻ {{number}}",
      "still_learning": "Vẫn đang học",
      "i_know_this": "Tôi đã biết",
      "keyboard_hint": "Dùng phím ← → để điều hướng"
    },
    "sets": {
      "heading": "Bộ thẻ học",
      "create": "+ Tạo bộ thẻ",
      "loading": "Đang tải bộ thẻ…",
      "load_error": "Không tải được bộ thẻ: {{error}}",
      "empty": "Chưa có bộ thẻ nào.",
      "card_singular": "thẻ",
      "card_plural": "thẻ"
    },
    "create_modal": {
      "heading": "Tạo bộ thẻ học",
      "title_label": "Tiêu đề",
      "title_placeholder": "vd: Business English",
      "description_label": "Mô tả",
      "description_placeholder": "Mô tả (không bắt buộc)",
      "submit_loading": "Đang tạo…",
      "submit": "Tạo bộ thẻ",
      "cancel": "Hủy",
      "error_default": "Không thể tạo bộ thẻ"
    },
    "welcome": {
      "title": "Thành thạo tiếng Anh với",
      "title_highlight": "Thẻ học",
      "subtitle": "Luyện từ vựng, cải thiện phát âm và xây dựng sự tự tin trong hành trình học tiếng Anh."
    },
    "action_bar": {
      "play_audio": "Phát âm thanh",
      "play_audio_tooltip": "Phát cách phát âm",
      "show_image": "Xem hình ảnh",
      "image_tooltip": "Xem hình ảnh liên quan",
      "no_image_tooltip": "Không có hình ảnh",
      "study_mode": "Chế độ học",
      "study_mode_tooltip": "Bật/tắt chế độ học",
      "add_word": "Thêm từ",
      "add_word_tooltip": "Thêm vào bộ thẻ cá nhân",
      "add_word_login_tooltip": "Đăng nhập để thêm từ"
    },
    "loading_cards": "Đang tải thẻ…",
    "language": {
      "th": "Tiếng Thái",
      "zh": "Tiếng Trung",
      "vi": "Tiếng Việt"
    }
  },
  "settings": {
    "title": "Cài đặt",
    "native_language": "Ngôn ngữ mẹ đẻ",
    "native_language_desc": "Thẻ học sẽ hiển thị bản dịch theo ngôn ngữ bạn chọn.",
    "save": "Lưu thay đổi",
    "saving": "Đang lưu…",
    "saved": "Đã lưu!"
  },
  "dashboard": {
    "welcome": {
      "greeting": "Chào mừng trở lại, {{name}}!",
      "journey": "Sẵn sàng tiếp tục hành trình học tiếng Anh chưa?",
      "level": "Cấp độ {{level}}",
      "streak": "Chuỗi {{streak}} ngày"
    },
    "xp": {
      "heading": "Tiến độ XP",
      "to_next_level": "{{percent}}% đến cấp độ tiếp theo",
      "xp_per_word": "+{{xp}} XP mỗi từ",
      "words": "{{count}} từ",
      "tiers": {
        "beginner": "Người mới",
        "intermediate": "Trung cấp",
        "expert": "Chuyên gia"
      }
    },
    "groups": {
      "heading": "Bộ thẻ của bạn",
      "progress": "Tiến độ",
      "cards": "{{completed}}/{{total}} thẻ",
      "today": "Hôm nay",
      "yesterday": "Hôm qua"
    },
    "stats": {
      "words_learned": "Từ đã học",
      "today": "Hôm nay",
      "accuracy": "Độ chính xác",
      "day_streak": "Chuỗi ngày"
    },
    "logout": "Đăng xuất",
    "loading": "Đang tải..."
  },
  "about": {
    "title": "Giới thiệu Tiger English",
    "tagline": "Xây dựng công cụ cho người học ngôn ngữ",
    "story": {
      "p1": "Tiger English được tạo ra bởi người hiểu cả thách thức học ngôn ngữ lẫn giá trị của công cụ tốt. Tôi có nền tảng phát triển web, chứng chỉ TEFL và niềm đam mê xây dựng trải nghiệm học tập tương tác.",
      "p2": "Nền tảng này bắt đầu như một dự án cá nhân — kết hợp kỹ năng kỹ thuật với niềm yêu thích giáo dục. Mục tiêu của tôi là giúp người học tiếng Anh phát triển vốn từ vựng và sự tự tin thông qua việc luyện tập vui vẻ và hiệu quả.",
      "p3": "Tôi đang chuẩn bị sống và dạy học ở nước ngoài, và Tiger English là một phần của hành trình đó. Tôi liên tục cải thiện trang web, học hỏi theo từng bước và xây dựng nó thành điều gì đó thực sự hữu ích cho mọi người."
    },
    "skills": {
      "heading": "Kỹ năng & Công nghệ",
      "intro": "Nền tảng này được xây dựng với các công nghệ web hiện đại để đảm bảo trải nghiệm học tập nhanh, dễ tiếp cận và hấp dẫn:",
      "categories": {
        "Frontend": "Giao diện",
        "Styling": "Kiểu dáng",
        "Build Tool": "Công cụ build",
        "Backend": "Backend",
        "Internationalization": "Đa ngôn ngữ"
      }
    },
    "connect": {
      "heading": "Kết nối với tôi",
      "contact_heading": "Liên hệ",
      "contact_desc": "Muốn chia sẻ phản hồi, ý tưởng hoặc chỉ nói xin chào?",
      "contact_button": "Liên hệ ngay",
      "coming_soon": "Sắp ra mắt",
      "social_aria": "Hồ sơ {{name}}",
      "avatar_alt": "Ảnh đại diện của người tạo Tiger English"
    }
  },
  "contact": {
    "heading": "Liên hệ",
    "intro": "Bạn có câu hỏi, phản hồi hoặc chỉ muốn chào hỏi? Tôi rất vui được nghe từ bạn!",
    "form": {
      "name_label": "Họ tên",
      "name_placeholder": "Họ và tên đầy đủ",
      "email_label": "Email",
      "email_placeholder": "your.email@example.com",
      "message_label": "Tin nhắn",
      "message_placeholder": "Hãy chia sẻ câu hỏi, phản hồi hoặc chỉ chào hỏi...",
      "submit": "Gửi tin nhắn",
      "sending": "Đang gửi...",
      "success": "Gửi tin nhắn thành công! Tôi sẽ liên hệ lại sớm.",
      "error": "Gửi tin nhắn thất bại. Vui lòng thử lại."
    },
    "info": {
      "heading": "Hãy kết nối",
      "intro": "Tôi luôn hứng thú kết nối với những người học ngôn ngữ, nhà giáo dục và nhà phát triển.",
      "direct_heading": "Liên hệ trực tiếp",
      "social_heading": "Mạng xã hội",
      "coming_soon": "Sắp ra mắt",
      "social_aria": "Hồ sơ {{name}}"
    },
    "faq": {
      "heading": "Câu hỏi nhanh",
      "q1": "Cách tốt nhất để liên hệ với bạn là gì?",
      "a1": "Email là cách đáng tin cậy nhất để liên hệ. Tôi thường trả lời trong vòng 24-48 giờ.",
      "q2": "Bạn có thể giúp tôi học tiếng Anh không?",
      "a2": "Hoàn toàn có thể! Tôi thích giúp đỡ người học. Hãy thoải mái chia sẻ câu hỏi hoặc thách thức của bạn.",
      "q3": "Bạn có sẵn sàng hợp tác không?",
      "a3": "Tôi luôn sẵn lòng với các dự án và sự hợp tác thú vị. Hãy thảo luận về ý tưởng của bạn!"
    }
  },
  "authhome": {
    "continue_studying": {
      "heading": "Tiếp tục học",
      "empty": "Bạn chưa học bộ thẻ nào.",
      "start": "Bắt đầu bộ thẻ đầu tiên",
      "reviewed": "Đã ôn {{reviewed}} / {{total}} thẻ",
      "completed": "Hoàn thành ✓",
      "continue": "Tiếp tục học",
      "streak_badge": "Chuỗi {{streak}} ngày",
      "accuracy_badge": "Độ chính xác {{accuracy}}%",
      "time": {
        "less_than_hour": "Dưới một giờ trước",
        "one_hour": "1 giờ trước",
        "hours": "{{hours}} giờ trước",
        "one_day": "1 ngày trước",
        "days": "{{days}} ngày trước"
      }
    },
    "recommended": {
      "heading": "Đề xuất tiếp theo",
      "empty": "Hoàn thành một bộ thẻ để nhận đề xuất.",
      "reasons": {
        "review": "Cần ôn lại",
        "sequence": "Tiếp theo trong chuỗi",
        "related": "Liên quan đến bài học gần đây"
      },
      "study": "Học"
    },
    "invite": {
      "heading": "Mời bạn bè",
      "desc": "Bạn có biết ai muốn học tiếng Anh không? Hãy mời họ đến Tiger English.",
      "copy": "Sao chép liên kết mời",
      "invite": "Mời bạn bè",
      "toast": {
        "no_clipboard": "Không thể dùng clipboard. Vui lòng sao chép liên kết thủ công.",
        "copied": "Đã sao chép liên kết mời!",
        "copy_failed": "Sao chép liên kết thất bại. Vui lòng sao chép thủ công."
      }
    },
    "study_groups": {
      "heading": "Nhóm học",
      "empty": "Chưa có nhóm học. Tạo nhóm để học cùng bạn bè.",
      "members": "{{count}} thành viên",
      "create": "Tạo nhóm học",
      "invite": "Mời vào nhóm"
    }
  },
  "auth": {
    "errors": {
      "email_registered": "Có vẻ như bạn đã có tài khoản với email này.",
      "login_instead": "Đăng nhập thay vì →",
      "username_taken": "Vui lòng thử tên người dùng khác. Bạn có thể dùng chữ cái, số và dấu gạch dưới.",
      "general": "Vui lòng kiểm tra thông tin và thử lại.",
      "invalid_credentials": "Email hoặc mật khẩu không đúng"
    },
    "google": {
      "button": "Tiếp tục với Google",
      "connecting": "Đang kết nối…"
    },
    "separator": "hoặc",
    "toast": {
      "login_success": "Đăng nhập thành công"
    },
    "password_rules": {
      "min_length": "Ít nhất 8 ký tự",
      "uppercase": "Một chữ hoa",
      "special": "Một ký tự đặc biệt (!@#$%^&*)"
    },
    "callback": {
      "checking": "Đang đăng nhập…",
      "waiting": "Đang thiết lập tài khoản…",
      "timeout_title": "Mất nhiều thời gian hơn dự kiến",
      "timeout_message": "Tài khoản của bạn đang được thiết lập. Thường chỉ mất một lúc.",
      "try_again": "Thử lại",
      "back_to_login": "Quay lại đăng nhập",
      "error_title": "Xác thực thất bại",
      "error_default": "Đã xảy ra sự cố trong quá trình đăng nhập. Vui lòng thử lại.",
      "session_expired": "Phiên của bạn đã hết hạn. Vui lòng đăng nhập lại.",
      "timed_out": "Xác thực đã hết thời gian. Vui lòng thử lại."
    }
  },
  "common": {
    "loading": "Đang tải...",
    "error": {
      "title": "Có gì đó không ổn",
      "message": "Xin lỗi, đã xảy ra sự cố ngoài mong đợi. Vui lòng thử tải lại trang.",
      "refresh": "Tải lại trang",
      "dev_details": "Chi tiết lỗi (Phát triển)"
    },
    "nav": {
      "open_menu": "Mở menu",
      "close_menu": "Đóng menu",
      "open_nav": "Mở điều hướng",
      "close_nav": "Đóng điều hướng",
      "expand_sidebar": "Mở rộng thanh bên",
      "collapse_sidebar": "Thu nhỏ thanh bên"
    },
    "footer": "© {{year}} Tiger English — Bảo lưu mọi quyền",
    "coming_soon": "sắp ra mắt",
    "sidebar": {
      "title": "Tiger English",
      "nav": {
        "home": "Trang chủ",
        "dashboard": "Bảng điều khiển",
        "library": "Thư viện",
        "study_groups": "Nhóm học",
        "notifications": "Thông báo",
        "flashcards": "Thẻ học",
        "drag_drop": "Kéo & Thả",
        "ad_libs": "Điền từ"
      },
      "utility": {
        "settings": "Cài đặt",
        "help": "Trợ giúp",
        "profile": "Hồ sơ",
        "logout": "Đăng xuất"
      }
    },
    "stub": {
      "coming_soon": "{{title}} — sắp ra mắt"
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/locales/
git commit -m "feat: add Vietnamese locale and i18n keys for all app domains"
```

---

### Task 3: Update i18n.ts and write an i18n test

**Files:**
- Modify: `src/lib/i18n.ts`
- Create: `src/__tests__/i18n.test.ts`

- [ ] **Step 1: Write a failing test**

Create `src/__tests__/i18n.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import i18n from '@/lib/i18n';
import en from '@/locales/en/en.json';
import vi from '@/locales/vi/vi.json';

describe('i18n config', () => {
  it('supports Vietnamese', () => {
    expect(i18n.options.supportedLngs).toContain('vi');
  });

  it('has nonExplicitSupportedLngs enabled so vi-VN resolves to vi', () => {
    expect((i18n.options as Record<string, unknown>).nonExplicitSupportedLngs).toBe(true);
  });

  it('vi locale has all keys that en locale has at top level', () => {
    const enKeys = Object.keys(en);
    const viKeys = Object.keys(vi);
    for (const key of enKeys) {
      expect(viKeys).toContain(key);
    }
  });

  it('resolves a Vietnamese key', () => {
    i18n.changeLanguage('vi');
    expect(i18n.t('login.title')).toBe('Chào mừng trở lại');
  });

  it('falls back to English for unknown language', () => {
    i18n.changeLanguage('fr');
    expect(i18n.t('login.title')).toBe('Welcome back');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/__tests__/i18n.test.ts
```

Expected: FAIL — `vi` not in supportedLngs, `nonExplicitSupportedLngs` undefined.

- [ ] **Step 3: Update `src/lib/i18n.ts`**

```ts
// src/lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en/en.json';
import th from '../locales/th/th.json';
import vi from '../locales/vi/vi.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'th', 'vi'],
    nonExplicitSupportedLngs: true,
    resources: {
      en: { translation: en },
      th: { translation: th },
      vi: { translation: vi },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/__tests__/i18n.test.ts
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n.ts src/__tests__/i18n.test.ts
git commit -m "feat: add Vietnamese language support to i18n config"
```

---

### Task 4: Migrate Flashcard.tsx

**Files:**
- Modify: `src/components/flashcards/Flashcard.tsx`
- Modify: `src/components/flashcards/__tests__/Flashcard.test.tsx`

The existing test file mocks `react-i18next` with an identity function. After migration the component uses `t()` for flip labels, TTS aria-label, and example toggle — update tests to assert on translated keys.

- [ ] **Step 1: Update the test file**

Replace the relevant test assertions in `src/components/flashcards/__tests__/Flashcard.test.tsx`. The mock at the top already returns keys as-is (`(key) => key`). Change assertions that check hardcoded English strings:

- `aria-label="Flip card for Hello"` → `aria-label="flashcards.flip.front_with_word"`  
  *(The mock receives the key string — interpolation is not applied, so assert on the key)*
- `aria-label="Flip card to see translation"` → `aria-label="flashcards.flip.front_no_word"`
- `aria-label="Flip card back"` → `aria-label="flashcards.flip.back"`
- `aria-label="Hear pronunciation of Hello"` → `aria-label="flashcards.tts.speak_label"`
- `"Show Example"` → `"flashcards.example.show"`
- `"Hide Example"` → `"flashcards.example.hide"`

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/components/flashcards/__tests__/Flashcard.test.tsx
```

Expected: Several tests FAIL because the component still uses hardcoded strings.

- [ ] **Step 3: Update `src/components/flashcards/Flashcard.tsx`**

```tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Volume2 } from "lucide-react";
import type { FlashcardCard } from "@/features/flashcards/types";

export interface FlashcardProps {
  data: FlashcardCard;
}

export function Flashcard({ data }: FlashcardProps) {
  const { t } = useTranslation();
  const { nativeText, englishText, partOfSpeech, level, exampleSentence } = data;
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const handleFlip = () => setIsFlipped((prev) => !prev);
  const handleExampleToggle = () => setShowExample((prev) => !prev);
  const handleSpeak = () => {
    if (!englishText) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(englishText);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'basic':        return 'bg-success-100 text-success-700 border-success-200';
      case 'intermediate': return 'bg-accent-100 text-accent-700 border-accent-200';
      case 'advanced':     return 'bg-red-100 text-red-700 border-red-200';
      default:             return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const frontFlipLabel = englishText
    ? t('flashcards.flip.front_with_word', { word: englishText })
    : t('flashcards.flip.front_no_word');

  return (
    <div className="w-full h-52 sm:w-[500px] sm:h-72 lg:w-[800px] lg:h-[480px] mx-auto perspective">
      {/* Flip Container */}
      <div
        className={`relative w-full h-full transition-transform duration-700 preserve-3d transform-gpu origin-center ${
          isFlipped ? "rotate-y-180" : ""
        }`}
        style={{ willChange: 'transform' }}
      >
        {/* Front Side - Native Language */}
        <div
          className={`absolute inset-0 w-full h-full backface-hidden transition-opacity duration-300 ${
            isFlipped ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="w-full h-full bg-white border-2 border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow relative p-8 select-none [&:has(>.flip-btn:focus-visible)]:ring-2 [&:has(>.flip-btn:focus-visible)]:ring-primary-400/40">
            <button
              type="button"
              className="flip-btn absolute inset-0 rounded-xl focus:outline-none"
              onClick={handleFlip}
              tabIndex={isFlipped ? -1 : 0}
              aria-label={frontFlipLabel}
            />
            {level && (
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(level)}`}>
                {level.toUpperCase()}
              </div>
            )}
            {partOfSpeech && (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700 border border-primary-200">
                {partOfSpeech}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                {nativeText ? (
                  <>
                    <p className="text-4xl sm:text-5xl font-semibold text-gray-800 mb-4">
                      {nativeText}
                    </p>
                    <div className="w-16 h-1 bg-primary-300 mx-auto rounded-full" />
                  </>
                ) : (
                  <>
                    <p className="text-lg text-gray-400 italic mb-2">{t('flashcards.translation_coming_soon')}</p>
                    <div className="w-16 h-1 bg-gray-200 mx-auto rounded-full" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Back Side - English Translation */}
        <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 transition-opacity duration-300 ${
            isFlipped ? 'opacity-100' : 'opacity-0'
          }`}>
          <div className="w-full h-full bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow relative p-8 flex flex-col select-none [&:has(>.flip-btn:focus-visible)]:ring-2 [&:has(>.flip-btn:focus-visible)]:ring-primary-400/40">
            <button
              type="button"
              className="flip-btn absolute inset-0 rounded-xl focus:outline-none"
              onClick={handleFlip}
              tabIndex={isFlipped ? 0 : -1}
              aria-label={t('flashcards.flip.back')}
            />
            {level && (
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(level)}`}>
                {level.toUpperCase()}
              </div>
            )}
            {partOfSpeech && (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium bg-primary-200 text-primary-800 border border-primary-300">
                {partOfSpeech}
              </div>
            )}

            <div className="flex-1 flex items-center justify-center pt-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <p className="text-4xl sm:text-5xl font-semibold text-primary-800">
                    {englishText}
                  </p>
                  {ttsSupported && (
                    <button
                      type="button"
                      aria-label={t('flashcards.tts.speak_label', { word: englishText })}
                      onClick={handleSpeak}
                      tabIndex={isFlipped ? 0 : -1}
                      className="flex-shrink-0 p-2 rounded-full text-primary-500 hover:text-primary-700 hover:bg-primary-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40"
                    >
                      <Volume2 className="w-6 h-6 sm:w-7 sm:h-7" />
                    </button>
                  )}
                </div>
                <div className="w-16 h-1 bg-primary-400 mx-auto rounded-full" />
              </div>
            </div>

            {exampleSentence && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleExampleToggle}
                  tabIndex={isFlipped ? 0 : -1}
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40 border-2 border-primary-400 bg-white text-primary-700 hover:bg-primary-50"
                >
                  {showExample ? t('flashcards.example.hide') : t('flashcards.example.show')}
                </button>

                <div className={`transition-all duration-300 overflow-hidden ${
                  showExample ? 'max-h-32 opacity-100 mt-3' : 'max-h-0 opacity-0'
                }`}>
                  <p className="text-lg text-primary-700 italic text-center px-4">
                    "{exampleSentence}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- src/components/flashcards/__tests__/Flashcard.test.tsx
```

Expected: PASS (13 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/flashcards/Flashcard.tsx src/components/flashcards/__tests__/Flashcard.test.tsx
git commit -m "feat(i18n): migrate Flashcard.tsx strings"
```

---

### Task 5: Migrate dashboard components

**Files:**
- Modify: `src/components/dashboard/WelcomePanel.tsx`
- Modify: `src/components/dashboard/XPProgress.tsx`
- Modify: `src/components/dashboard/StudyStats.tsx`
- Modify: `src/components/dashboard/FlashcardGroups.tsx`
- Modify: `src/components/dashboard/LogoutButton.tsx`
- Modify: `src/pages/Dashboard.tsx`

No existing tests for these components — no test step needed. Run the full suite at the end to check for regressions.

- [ ] **Step 1: Update `src/components/dashboard/WelcomePanel.tsx`**

```tsx
import { useTranslation } from 'react-i18next';
import type { Profile, XPData, StudyStats as StudyStatsType } from "@/types/dashboard";

interface WelcomePanelProps {
  profile: Profile | null;
  xp: XPData;
  studyStats: StudyStatsType;
}

export default function WelcomePanel({ profile, xp, studyStats }: WelcomePanelProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 rounded-2xl p-6 sm:p-8 mb-8 text-white shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            {t('dashboard.welcome.greeting', { name: profile?.first_name || 'Student' })} 👋
          </h1>
          <p className="text-primary-100 text-sm sm:text-base">
            {t('dashboard.welcome.journey')}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 text-right">
          <div className="text-2xl sm:text-3xl font-bold">
            {t('dashboard.welcome.level', { level: xp.currentLevel })}
          </div>
          <div className="text-primary-200 text-sm">
            {t('dashboard.welcome.streak', { streak: studyStats.currentStreak })} 🔥
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `src/components/dashboard/XPProgress.tsx`**

```tsx
// src/components/dashboard/XPProgress.tsx
import { useTranslation } from 'react-i18next';
import { XPData } from "@/types/dashboard";

type TierKey = keyof XPData["xpBreakdown"];

const tierStyles: Record<TierKey, { card: string; label: string; xp: string; meta: string }> = {
  beginner: {
    card: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    label: "text-green-700 dark:text-green-300",
    xp: "text-green-800 dark:text-green-200",
    meta: "text-green-600 dark:text-green-400",
  },
  intermediate: {
    card: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    label: "text-blue-700 dark:text-blue-300",
    xp: "text-blue-800 dark:text-blue-200",
    meta: "text-blue-600 dark:text-blue-400",
  },
  expert: {
    card: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
    label: "text-purple-700 dark:text-purple-300",
    xp: "text-purple-800 dark:text-purple-200",
    meta: "text-purple-600 dark:text-purple-400",
  },
};

interface XPProgressProps {
  xp: XPData;
  progressColorClass: string;
}

export default function XPProgress({ xp, progressColorClass }: XPProgressProps) {
  const { t } = useTranslation();

  return (
    <div className="card mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-display heading-accent">
          {t('dashboard.xp.heading')}
        </h2>
        <div className="text-right">
          <div className="text-lg sm:text-xl font-semibold text-text-light dark:text-text-dark">
            {xp.currentXP.toLocaleString()} / {xp.totalXPForNextLevel.toLocaleString()} XP
          </div>
          <div className="text-sm text-text-light/70 dark:text-text-dark/70">
            {t('dashboard.xp.to_next_level', { percent: Math.round(xp.progressPercentage) })}
          </div>
        </div>
      </div>

      <div className="relative mb-6">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${progressColorClass} rounded-full transition-all duration-1000 ease-out shadow-sm`}
            style={{ width: `${xp.progressPercentage}%` }}
          >
            <div className="h-full bg-white/20 animate-pulse"></div>
          </div>
        </div>
        <div
          className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2"
          style={{ left: `${xp.progressPercentage}%` }}
        >
          <div className="w-6 h-6 bg-white dark:bg-gray-800 rounded-full shadow-lg border-2 border-primary-500"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(Object.entries(xp.xpBreakdown) as [TierKey, (typeof xp.xpBreakdown)[TierKey]][]).map(([tier, data]) => {
          const styles = tierStyles[tier];
          return (
            <div key={tier} className={`${styles.card} rounded-xl p-4 border`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-sm font-medium ${styles.label}`}>
                    {t(`dashboard.xp.tiers.${tier}`)}
                  </div>
                  <div className={`text-lg font-bold ${styles.xp}`}>
                    {t('dashboard.xp.xp_per_word', { xp: data.totalXP })}
                  </div>
                </div>
                <div className={`${styles.meta} text-right`}>
                  <div className="text-xs">
                    {t('dashboard.xp.xp_per_word', { xp: data.xpPerWord })}
                  </div>
                  <div className="text-sm font-medium">
                    {t('dashboard.xp.words', { count: data.wordsCompleted })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update `src/components/dashboard/StudyStats.tsx`**

```tsx
// src/components/dashboard/StudyStats.tsx
import { useTranslation } from 'react-i18next';
import { StudyStats as StudyStatsType } from "@/types/dashboard";

interface StudyStatsProps {
  studyStats: StudyStatsType;
}

export default function StudyStats({ studyStats }: StudyStatsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="card">
        <div className="flex items-center">
          <div className="p-3 bg-success-100 dark:bg-success-900/30 rounded-lg">
            <span className="text-2xl">📚</span>
          </div>
          <div className="ml-4">
            <div className="text-2xl font-bold text-text-light dark:text-text-dark">
              {studyStats.totalWordsLearned}
            </div>
            <div className="text-sm text-text-light/70 dark:text-text-dark/70">
              {t('dashboard.stats.words_learned')}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <span className="text-2xl">⏱️</span>
          </div>
          <div className="ml-4">
            <div className="text-2xl font-bold text-text-light dark:text-text-dark">
              {studyStats.studyTimeToday}m
            </div>
            <div className="text-sm text-text-light/70 dark:text-text-dark/70">
              {t('dashboard.stats.today')}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center">
          <div className="p-3 bg-accent-100 dark:bg-accent-900/30 rounded-lg">
            <span className="text-2xl">🎯</span>
          </div>
          <div className="ml-4">
            <div className="text-2xl font-bold text-text-light dark:text-text-dark">
              {studyStats.accuracyRate}%
            </div>
            <div className="text-sm text-text-light/70 dark:text-text-dark/70">
              {t('dashboard.stats.accuracy')}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg hover:shadow-[0_0_12px_rgba(252,211,77,0.2)] transition-all duration-200">
            <span className="text-2xl">🔥</span>
          </div>
          <div className="ml-4">
            <div className="text-2xl font-bold text-text-light dark:text-text-dark">
              {studyStats.currentStreak}
            </div>
            <div className="text-sm text-text-light/70 dark:text-text-dark/70">
              {t('dashboard.stats.day_streak')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update `src/components/dashboard/FlashcardGroups.tsx`**

```tsx
// src/components/dashboard/FlashcardGroups.tsx
import { useTranslation } from 'react-i18next';
import { FlashcardGroup } from "@/types/dashboard";

interface FlashcardGroupsProps {
  flashcardGroups: FlashcardGroup[];
  getDifficultyColor: (difficulty: string) => string;
}

export default function FlashcardGroups({ flashcardGroups, getDifficultyColor }: FlashcardGroupsProps) {
  const { t } = useTranslation();

  return (
    <div className="card mb-8">
      <h2 className="text-display heading-accent mb-6">
        {t('dashboard.groups.heading')}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {flashcardGroups.slice(0, 5).map((group) => (
          <div key={group.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-text-light dark:text-text-dark group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {group.name}
                </h3>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getDifficultyColor(group.difficulty)}`}>
                  {group.difficulty}
                </span>
              </div>
              <div className={`w-3 h-3 rounded-full ${group.color}`}></div>
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-sm text-text-light/70 dark:text-text-dark/70 mb-1">
                <span>{t('dashboard.groups.progress')}</span>
                <span>{group.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 ${group.color} rounded-full transition-all duration-500`}
                  style={{ width: `${group.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="flex justify-between text-sm text-text-light/70 dark:text-text-dark/70">
              <span>
                {t('dashboard.groups.cards', { completed: group.completedCards, total: group.totalCards })}
              </span>
              <span>
                {group.lastStudied === "2025-06-29"
                  ? t('dashboard.groups.today')
                  : group.lastStudied === "2025-06-28"
                  ? t('dashboard.groups.yesterday')
                  : new Date(group.lastStudied).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update `src/components/dashboard/LogoutButton.tsx`**

```tsx
// src/components/dashboard/LogoutButton.tsx
import { useTranslation } from 'react-i18next';

interface LogoutButtonProps {
  onLogout: () => void;
}

export default function LogoutButton({ onLogout }: LogoutButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onLogout}
      className="fixed bottom-6 right-6 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-sm font-medium z-10"
    >
      {t('dashboard.logout')}
    </button>
  );
}
```

- [ ] **Step 6: Update `src/pages/Dashboard.tsx`**

```tsx
// src/pages/Dashboard.tsx
import { useTranslation } from 'react-i18next';
import { mockDashboardData, getXPProgressColor, getDifficultyColor } from "@/mocks/mockDashboardData";
import { useDashboard } from "@/features/dashboard/useDashboard";
import WelcomePanel from "@/components/dashboard/WelcomePanel";
import XPProgress from "@/components/dashboard/XPProgress";
import FlashcardGroups from "@/components/dashboard/FlashcardGroups";
import StudyStats from "@/components/dashboard/StudyStats";
import LogoutButton from "@/components/dashboard/LogoutButton";

export default function Dashboard() {
  const { t } = useTranslation();
  const { handleLogout, loading, profile } = useDashboard();
  const { xp, flashcardGroups, studyStats } = mockDashboardData;
  const progressColorClass = getXPProgressColor(xp.progressPercentage);

  if (loading) {
    return (
      <div className="min-h-screen bg-semantic-bg dark:bg-semantic-bg flex items-center justify-center">
        <div className="text-xl text-text-light dark:text-text-dark">{t('dashboard.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-semantic-bg dark:bg-semantic-bg">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <WelcomePanel profile={profile} xp={xp} studyStats={studyStats} />
        <XPProgress xp={xp} progressColorClass={progressColorClass} />
        <FlashcardGroups flashcardGroups={flashcardGroups} getDifficultyColor={getDifficultyColor} />
        <StudyStats studyStats={studyStats} />
      </div>
      <LogoutButton onLogout={handleLogout} />
    </div>
  );
}
```

- [ ] **Step 7: Run tests**

```bash
npm test
```

Expected: all tests PASS. No regressions.

- [ ] **Step 8: Commit**

```bash
git add src/components/dashboard/ src/pages/Dashboard.tsx
git commit -m "feat(i18n): migrate dashboard component strings"
```

---

### Task 6: Migrate About and Contact pages

**Files:**
- Modify: `src/pages/About.tsx`
- Modify: `src/pages/Contact.tsx`

- [ ] **Step 1: Update `src/pages/About.tsx`**

```tsx
import { useTranslation } from 'react-i18next';
import avatar from "@/assets/TE-logo.png";
import { SITE_GITHUB_URL, SITE_CONTACT_EMAIL } from "@/lib/siteConfig";

export default function About() {
  const { t } = useTranslation();

  const technologies = [
    { name: "React", category: "Frontend" },
    { name: "TypeScript", category: "Frontend" },
    { name: "Tailwind CSS", category: "Styling" },
    { name: "Vite", category: "Build Tool" },
    { name: "Supabase", category: "Backend" },
    { name: "i18n", category: "Internationalization" },
  ];

  const socialLinks = [
    { name: "GitHub", icon: "🐙", href: SITE_GITHUB_URL },
    { name: "LinkedIn", icon: "💼", href: "#", comingSoon: true },
    { name: "Twitter", icon: "🐦", href: "#", comingSoon: true },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
      <article className="card card-lg">
        <header className="flex items-center mb-8">
          <img
            src={avatar}
            alt={t('about.connect.avatar_alt')}
            className="w-16 h-16 rounded-full border-2 border-primary-500 shadow-sm mr-4 flex-shrink-0"
          />
          <div>
            <h1 className="text-display heading-accent">
              {t('about.title')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('about.tagline')}
            </p>
          </div>
        </header>

        <section className="mb-10">
          <h2 className="sr-only">My Story</h2>
          <p className="text-base md:text-lg text-text-light dark:text-text-dark mb-4 leading-relaxed">
            {t('about.story.p1')}
          </p>
          <p className="text-sm md:text-base text-text-light dark:text-text-dark mb-4 leading-relaxed">
            {t('about.story.p2')}
          </p>
          <p className="text-sm md:text-base text-text-light dark:text-text-dark mb-4 leading-relaxed">
            {t('about.story.p3')}
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-display heading-accent mb-6">
            {t('about.skills.heading')}
          </h2>
          <p className="text-sm md:text-base text-text-light dark:text-text-dark mb-4 leading-relaxed">
            {t('about.skills.intro')}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {technologies.map((tech) => (
              <div key={tech.name} className="card text-center">
                <div className="font-medium text-text-light dark:text-text-dark text-sm">
                  {tech.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t(`about.skills.categories.${tech.category}`, tech.category)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-display heading-accent mb-6">
            {t('about.connect.heading')}
          </h2>
          <div className="flex flex-wrap gap-4 justify-center sm:justify-start mb-6">
            {socialLinks.map((social) => (
              <div key={social.name} className="relative group">
                {social.comingSoon ? (
                  <div
                    aria-disabled="true"
                    title={t('about.connect.coming_soon')}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 opacity-60 cursor-not-allowed"
                  >
                    <span className="text-lg" role="img" aria-hidden="true">{social.icon}</span>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{social.name}</span>
                  </div>
                ) : (
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t('about.connect.social_aria', { name: social.name })}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  >
                    <span className="text-lg" role="img" aria-hidden="true">{social.icon}</span>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{social.name}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="text-center">
          <h2 className="text-display heading-accent mb-4">
            {t('about.connect.contact_heading')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('about.connect.contact_desc')}
          </p>
          <a
            href={`mailto:${SITE_CONTACT_EMAIL}`}
            className="inline-block bg-primary-600 hover:bg-primary-700 focus:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
            aria-label={t('about.connect.contact_button')}
          >
            {t('about.connect.contact_button')}
          </a>
        </section>
      </article>
    </div>
  );
}
```

- [ ] **Step 2: Update `src/pages/Contact.tsx`**

```tsx
import { useTranslation } from 'react-i18next';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState } from "react";
import { contactFormSchema, type ContactFormData } from "@/schemas/contactSchema";
import FormInput from "@/components/ui/FormInput";
import Button from "@/components/ui/Button";
import { SITE_GITHUB_URL, SITE_CONTACT_EMAIL } from "@/lib/siteConfig";

export default function Contact() {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log("Contact form data:", data);
      toast.success(t('contact.form.success'));
      reset();
    } catch (error) {
      toast.error(t('contact.form.error'));
      console.error("Contact form error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const socialLinks = [
    { name: "GitHub", icon: "🐙", href: SITE_GITHUB_URL },
    { name: "LinkedIn", icon: "💼", href: "#", comingSoon: true },
    { name: "Twitter", icon: "🐦", href: "#", comingSoon: true },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="card card-lg">
          <header className="mb-8">
            <h1 className="text-display heading-accent mb-2">
              {t('contact.heading')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('contact.intro')}
            </p>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <FormInput
                {...register("name")}
                name="name"
                label={t('contact.form.name_label')}
                placeholder={t('contact.form.name_placeholder')}
                disabled={isSubmitting}
                icon={
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <FormInput
                {...register("email")}
                name="email"
                label={t('contact.form.email_label')}
                type="email"
                placeholder={t('contact.form.email_placeholder')}
                disabled={isSubmitting}
                icon={
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('contact.form.message_label')}
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 flex items-start">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <textarea
                  {...register("message")}
                  id="message"
                  name="message"
                  rows={5}
                  placeholder={t('contact.form.message_placeholder')}
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-white dark:border-gray-700 dark:placeholder-gray-500 resize-none"
                />
              </div>
              {errors.message && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.message.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-600 hover:bg-primary-700 focus:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-gray font-medium py-3 px-6 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('contact.form.sending')}
                </div>
              ) : (
                t('contact.form.submit')
              )}
            </Button>
          </form>
        </section>

        <section className="card card-lg">
          <header className="mb-8">
            <h2 className="text-display heading-accent mb-4">
              {t('contact.info.heading')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('contact.info.intro')}
            </p>
          </header>

          <div className="mb-8">
            <h3 className="text-base md:text-lg font-semibold text-semantic-text dark:text-semantic-text mb-4">
              {t('contact.info.direct_heading')}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <div className="ml-3">
                  <a
                    href={`mailto:${SITE_CONTACT_EMAIL}`}
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    {SITE_CONTACT_EMAIL}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-base md:text-lg font-semibold text-semantic-text dark:text-semantic-text mb-4">
              {t('contact.info.social_heading')}
            </h3>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <div key={social.name} className="relative group">
                  {social.comingSoon ? (
                    <div
                      aria-disabled="true"
                      title={t('contact.info.coming_soon')}
                      className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 opacity-60 cursor-not-allowed"
                    >
                      <span className="text-sm" role="img" aria-hidden="true">{social.icon}</span>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{social.name}</span>
                    </div>
                  ) : (
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('contact.info.social_aria', { name: social.name })}
                      className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                    >
                      <span className="text-sm" role="img" aria-hidden="true">{social.icon}</span>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{social.name}</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-base md:text-lg font-semibold text-semantic-text dark:text-semantic-text mb-4">
              {t('contact.faq.heading')}
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{t('contact.faq.q1')}</p>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{t('contact.faq.a1')}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{t('contact.faq.q2')}</p>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{t('contact.faq.a2')}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{t('contact.faq.q3')}</p>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{t('contact.faq.a3')}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: PASS. No regressions.

- [ ] **Step 4: Commit**

```bash
git add src/pages/About.tsx src/pages/Contact.tsx
git commit -m "feat(i18n): migrate About and Contact page strings"
```

---

### Task 7: Migrate flashcard feature components

**Files:**
- Modify: `src/components/flashcards/WelcomeBanner.tsx`
- Modify: `src/components/flashcards/ActionBar.tsx`
- Modify: `src/features/flashcards/components/FlashcardSetList.tsx`
- Modify: `src/features/flashcards/components/FlashcardViewer.tsx`
- Modify: `src/features/flashcards/components/CreateSetModal.tsx`
- Modify: `src/pages/FlashcardsPage.tsx`
- Modify: `src/features/flashcards/__tests__/FlashcardViewer.test.tsx`

- [ ] **Step 1: Update `FlashcardViewer.test.tsx` to mock react-i18next and use translation keys**

The test currently asserts on hardcoded English strings. Add the mock and update assertions:

```tsx
// Add at the top of the file, before any imports of the component under test:
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
```

Update these assertions:
- `getByText('No cards in this set yet.')` → `getByText('flashcards.viewer.no_cards')`
- `getByRole('button', { name: /back to sets/i })` → `getByRole('button', { name: 'flashcards.viewer.back_to_sets' })`
- `getByText('Card 1 of 2')` → `getByText('flashcards.viewer.card_count')` (key, since mock doesn't interpolate)
- `getByRole('button', { name: /next/i })` → `getByRole('button', { name: 'flashcards.viewer.next' })`
- `getByRole('button', { name: /previous/i })` → `getByRole('button', { name: 'flashcards.viewer.previous' })`
- `getByLabelText('Go to card 3')` → `getByLabelText('flashcards.viewer.go_to_card')`
- `getByRole('button', { name: /^← back$/i })` → `getByRole('button', { name: 'flashcards.viewer.back' })`
- `getByRole('button', { name: /i know this/i })` → `getByRole('button', { name: 'flashcards.viewer.i_know_this' })`
- `getByRole('button', { name: /still learning/i })` → `getByRole('button', { name: 'flashcards.viewer.still_learning' })`

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/features/flashcards/__tests__/FlashcardViewer.test.tsx
```

Expected: FAIL — component doesn't have `useTranslation` yet.

- [ ] **Step 3: Update `src/components/flashcards/WelcomeBanner.tsx`**

```tsx
// src/components/flashcards/WelcomeBanner.tsx
import { useTranslation } from 'react-i18next';

export function WelcomeBanner() {
  const { t } = useTranslation();

  return (
    <div className="text-center py-8 px-4">
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-800 mb-4">
        {t('flashcards.welcome.title')}{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-600 to-accent-400">
          {t('flashcards.welcome.title_highlight')}
        </span>
      </h1>
      <p className="text-lg md:text-xl text-primary-600 max-w-2xl mx-auto leading-relaxed">
        {t('flashcards.welcome.subtitle')}
      </p>
      <div className="mt-6 w-24 h-1 bg-gradient-to-r from-accent-600 to-accent-400 mx-auto rounded-full"></div>
    </div>
  );
}
```

- [ ] **Step 4: Update `src/components/flashcards/ActionBar.tsx`**

```tsx
// src/components/flashcards/ActionBar.tsx
import { useTranslation } from 'react-i18next';
import { FlashcardActionButton } from "./FlashcardActionButton";
import clsx from "clsx";

export interface ActionBarProps {
  onPlayAudio: () => void;
  onShowImage: () => void;
  onToggleStudyMode: () => void;
  onAddWord: () => void;
  studyModeActive?: boolean;
  isAuthenticated?: boolean;
  imageAvailable?: boolean;
  className?: string;
}

const SpeakerIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12H5a1 1 0 01-1-1V9a1 1 0 011-1h4l5-5v14l-5-5z" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const BookIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

export function ActionBar({
  onPlayAudio,
  onShowImage,
  onToggleStudyMode,
  onAddWord,
  studyModeActive = false,
  isAuthenticated = false,
  imageAvailable = true,
  className = ""
}: ActionBarProps) {
  const { t } = useTranslation();

  return (
    <div
      className={clsx(
        "flex items-center justify-center gap-6 p-4",
        "bg-white border border-gray-200 rounded-lg shadow-sm",
        "sm:gap-8",
        className
      )}
    >
      <FlashcardActionButton
        icon={<SpeakerIcon />}
        label={t('flashcards.action_bar.play_audio')}
        tooltip={t('flashcards.action_bar.play_audio_tooltip')}
        onClick={onPlayAudio}
      />
      <FlashcardActionButton
        icon={<ImageIcon />}
        label={t('flashcards.action_bar.show_image')}
        tooltip={imageAvailable ? t('flashcards.action_bar.image_tooltip') : t('flashcards.action_bar.no_image_tooltip')}
        onClick={onShowImage}
        disabled={!imageAvailable}
      />
      <FlashcardActionButton
        icon={<BookIcon />}
        label={t('flashcards.action_bar.study_mode')}
        tooltip={t('flashcards.action_bar.study_mode_tooltip')}
        onClick={onToggleStudyMode}
        active={studyModeActive}
      />
      <FlashcardActionButton
        icon={<PlusIcon />}
        label={t('flashcards.action_bar.add_word')}
        tooltip={isAuthenticated ? t('flashcards.action_bar.add_word_tooltip') : t('flashcards.action_bar.add_word_login_tooltip')}
        onClick={onAddWord}
        disabled={!isAuthenticated}
      />
    </div>
  );
}
```

- [ ] **Step 5: Update `src/features/flashcards/components/FlashcardSetList.tsx`**

```tsx
import { useTranslation } from 'react-i18next';
import type { FlashcardSet } from '../types';
import Button from '@/components/ui/Button';

interface FlashcardSetListProps {
  sets: FlashcardSet[];
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  onSelectSet: (setId: string) => void;
  onCreateSet: () => void;
}

export function FlashcardSetList({
  sets,
  loading,
  error,
  isAuthenticated,
  onSelectSet,
  onCreateSet,
}: FlashcardSetListProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-semantic-muted">{t('flashcards.sets.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-semantic-error">{t('flashcards.sets.load_error', { error })}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-display heading-accent">{t('flashcards.sets.heading')}</h2>
        {isAuthenticated && (
          <Button variant="primary" size="sm" onClick={onCreateSet}>
            {t('flashcards.sets.create')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {sets.map((set) => (
          <button
            key={set.id}
            onClick={() => onSelectSet(set.id)}
            className="card card-interactive text-left space-y-3"
          >
            <h3 className="text-base md:text-lg font-semibold text-semantic-text dark:text-semantic-text">
              {set.title}
            </h3>
            {set.description && (
              <p className="text-sm leading-relaxed text-semantic-muted dark:text-semantic-muted">
                {set.description}
              </p>
            )}
            <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
              {set.cardCount}{' '}
              {set.cardCount === 1
                ? t('flashcards.sets.card_singular')
                : t('flashcards.sets.card_plural')}
            </p>
          </button>
        ))}
      </div>

      {sets.length === 0 && (
        <p className="text-center text-semantic-muted py-12">
          {t('flashcards.sets.empty')}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Update `src/features/flashcards/components/FlashcardViewer.tsx`**

```tsx
import { useTranslation } from 'react-i18next';
import { Flashcard } from '@/components/flashcards/Flashcard';
import Button from '@/components/ui/Button';
import { useFlashcardNavigation } from '../hooks/useFlashcardNavigation';
import type { FlashcardCard, CardProgress } from '../types';

interface FlashcardViewerProps {
  setId: string;
  cards: FlashcardCard[];
  progressMap: Record<string, CardProgress>;
  onMarkKnown: (cardId: string) => void;
  onMarkUnknown: (cardId: string) => void;
  onBack: () => void;
  isAuthenticated: boolean;
}

export function FlashcardViewer({
  setId,
  cards,
  progressMap,
  onMarkKnown,
  onMarkUnknown,
  onBack,
  isAuthenticated,
}: FlashcardViewerProps) {
  const { t } = useTranslation();
  const { currentCardIndex, setCurrentCardIndex, goToPrevious, goToNext } =
    useFlashcardNavigation(cards.length, setId);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <p className="text-semantic-muted">{t('flashcards.viewer.no_cards')}</p>
        <Button variant="secondary" size="sm" onClick={onBack}>
          {t('flashcards.viewer.back_to_sets')}
        </Button>
      </div>
    );
  }

  const currentCard = cards[currentCardIndex];
  const progress = progressMap[currentCard.id];

  const handleMarkKnown = () => {
    onMarkKnown(currentCard.id);
    goToNext();
  };

  const handleMarkUnknown = () => {
    onMarkUnknown(currentCard.id);
    goToNext();
  };

  return (
    <div className="card card-lg flex flex-col items-center space-y-6">
      <div className="flex items-center justify-between w-full">
        <Button variant="secondary" size="sm" onClick={onBack}>
          {t('flashcards.viewer.back')}
        </Button>
        <div className="flex items-center gap-2 text-sm text-semantic-muted font-medium">
          {t('flashcards.viewer.card_count', { current: currentCardIndex + 1, total: cards.length })}
          {progress && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              progress.status === 'known'
                ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {progress.status}
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-center w-full">
        <Flashcard data={currentCard} />
      </div>

      <div className="flex items-center justify-between w-full gap-2">
        <Button variant="secondary" size="sm" onClick={goToPrevious}>
          {t('flashcards.viewer.previous')}
        </Button>

        <div className="flex gap-1 overflow-x-auto py-1 flex-1 min-w-0 justify-center">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentCardIndex(index)}
              className={`w-2 h-2 flex-shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40 ${
                index === currentCardIndex
                  ? 'bg-primary-500'
                  : 'bg-primary-200 hover:bg-primary-300'
              }`}
              aria-label={t('flashcards.viewer.go_to_card', { number: index + 1 })}
            />
          ))}
        </div>

        <Button variant="secondary" size="sm" onClick={goToNext}>
          {t('flashcards.viewer.next')}
        </Button>
      </div>

      {isAuthenticated && (
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkUnknown}
            className="w-full sm:w-auto border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            {t('flashcards.viewer.still_learning')}
          </Button>
          <Button variant="primary" size="sm" onClick={handleMarkKnown} className="w-full sm:w-auto">
            {t('flashcards.viewer.i_know_this')}
          </Button>
        </div>
      )}

      <p className="text-xs text-semantic-muted text-center">
        {t('flashcards.viewer.keyboard_hint')}
      </p>
    </div>
  );
}
```

- [ ] **Step 7: Update `src/features/flashcards/components/CreateSetModal.tsx`**

```tsx
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or fewer'),
  description: z.string().max(300, 'Description must be 300 characters or fewer').optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateSetModalProps {
  onClose: () => void;
  onSubmit: (title: string, description: string | null) => Promise<void>;
}

export function CreateSetModal({ onClose, onSubmit }: CreateSetModalProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable]:not([contenteditable="false"]), audio[controls], video[controls]',
        ),
      ).filter((el) => !el.closest('[aria-hidden="true"]') && el.getAttribute('aria-hidden') !== 'true');

    getFocusable()[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = getFocusable();
        if (focusable.length === 0) { e.preventDefault(); return; }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const submit = async (data: FormData) => {
    try {
      await onSubmit(data.title, data.description ?? null);
      onClose();
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : t('flashcards.create_modal.error_default'),
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-set-modal-title"
        className="card card-lg w-full max-w-md"
      >
        <h2 id="create-set-modal-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t('flashcards.create_modal.heading')}
        </h2>

        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('flashcards.create_modal.title_label')} <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-700 dark:text-gray-100"
              placeholder={t('flashcards.create_modal.title_placeholder')}
            />
            {errors.title && (
              <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('flashcards.create_modal.description_label')}
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-700 dark:text-gray-100 resize-none"
              placeholder={t('flashcards.create_modal.description_placeholder')}
            />
            {errors.description && (
              <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          {errors.root && (
            <p className="text-xs text-red-600">{errors.root.message}</p>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
              {t('flashcards.create_modal.cancel')}
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? t('flashcards.create_modal.submit_loading') : t('flashcards.create_modal.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Update `src/pages/FlashcardsPage.tsx`**

Move `LANGUAGE_NAMES` inside the component and use translation keys:

```tsx
// src/pages/FlashcardsPage.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '@/stores/useUserStore';
import { useFlashcardSets } from '@/features/flashcards/hooks/useFlashcardSets';
import { useFlashcards } from '@/features/flashcards/hooks/useFlashcards';
import { useCardProgress } from '@/features/flashcards/hooks/useCardProgress';
import { FlashcardSetList } from '@/features/flashcards/components/FlashcardSetList';
import { FlashcardViewer } from '@/features/flashcards/components/FlashcardViewer';
import { CreateSetModal } from '@/features/flashcards/components/CreateSetModal';
import { SUPPORTED_LANGUAGES } from '@/schemas/authSchema';

export default function FlashcardsPage() {
  const { t } = useTranslation();
  const { profile } = useUserStore();
  const isAuthenticated = profile !== null;

  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [localLanguage, setLocalLanguage] = useState<string | null>(null);

  const languageCode = profile?.native_language ?? localLanguage;

  const { sets, loading: setsLoading, error: setsError, createSet } = useFlashcardSets(profile?.id);
  const { cards, loading: cardsLoading } = useFlashcards(selectedSetId, languageCode ?? null);
  const { progressMap, markKnown, markUnknown } = useCardProgress(
    cards.map((c) => c.id),
    profile?.id,
  );

  const LANGUAGE_NAMES: Record<typeof SUPPORTED_LANGUAGES[number], string> = {
    th: t('flashcards.language.th'),
    zh: t('flashcards.language.zh'),
    vi: t('flashcards.language.vi'),
  };

  return (
    <div className="min-h-screen bg-semantic-bg dark:bg-semantic-bg">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {!languageCode && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('flashcards.choose_native_language')}
            </p>
            <div className="flex gap-2 flex-wrap">
              {SUPPORTED_LANGUAGES.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocalLanguage(code)}
                  className="px-4 py-2 rounded-lg border border-primary-300 text-primary-700 hover:bg-primary-50 dark:border-primary-600 dark:text-primary-300 dark:hover:bg-primary-900/20 text-sm font-medium transition-colors"
                >
                  {LANGUAGE_NAMES[code]}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedSetId === null ? (
          <FlashcardSetList
            sets={sets}
            loading={setsLoading}
            error={setsError}
            isAuthenticated={isAuthenticated}
            onSelectSet={setSelectedSetId}
            onCreateSet={() => setIsCreateModalOpen(true)}
          />
        ) : cardsLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-primary-600">{t('flashcards.loading_cards')}</p>
          </div>
        ) : (
          <FlashcardViewer
            setId={selectedSetId}
            cards={cards}
            progressMap={progressMap}
            onMarkKnown={markKnown}
            onMarkUnknown={markUnknown}
            onBack={() => setSelectedSetId(null)}
            isAuthenticated={isAuthenticated}
          />
        )}

        {isCreateModalOpen && (
          <CreateSetModal
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={createSet}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Run tests**

```bash
npm test -- src/features/flashcards/__tests__/FlashcardViewer.test.tsx
```

Expected: PASS.

```bash
npm test
```

Expected: all tests PASS.

- [ ] **Step 10: Commit**

```bash
git add src/components/flashcards/WelcomeBanner.tsx src/components/flashcards/ActionBar.tsx \
  src/features/flashcards/components/ src/pages/FlashcardsPage.tsx \
  src/features/flashcards/__tests__/FlashcardViewer.test.tsx
git commit -m "feat(i18n): migrate flashcard feature component strings"
```

---

### Task 8: Migrate authenticated home cards

**Files:**
- Modify: `src/components/home/authenticated/ContinueStudyingCard.tsx`
- Modify: `src/components/home/authenticated/RecommendedNextCard.tsx`
- Modify: `src/components/home/authenticated/InviteFriendsCard.tsx`
- Modify: `src/components/home/authenticated/StudyGroupsCard.tsx`

These components have tests. Add the `react-i18next` mock to each test file and update string assertions to use translation keys.

- [ ] **Step 1: Add mock to test files and update assertions**

In each of `ContinueStudyingCard.test.tsx`, `RecommendedNextCard.test.tsx`, `InviteFriendsCard.test.tsx`, `StudyGroupsCard.test.tsx`, add at the top:

```tsx
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
```

Then update any `getByText` / `getByRole` assertions that check hardcoded English strings to use the translation key. Common patterns:

- `'Continue Studying'` → `'authhome.continue_studying.heading'` (heading) or `'authhome.continue_studying.continue'` (button)
- `"You haven't studied any sets yet."` → `'authhome.continue_studying.empty'`
- `'Start your first set'` → `'authhome.continue_studying.start'`
- `'Recommended Next'` → `'authhome.recommended.heading'`
- `'Complete a set to unlock recommendations.'` → `'authhome.recommended.empty'`
- `'Study'` → `'authhome.recommended.study'`
- `'Invite Friends'` → `'authhome.invite.heading'`
- `'Copy Invite Link'` → `'authhome.invite.copy'`
- `'Study Groups'` → `'authhome.study_groups.heading'`
- `'No study groups yet. Create one to study with friends.'` → `'authhome.study_groups.empty'`
- `'Create Study Group'` → `'authhome.study_groups.create'`

- [ ] **Step 2: Run test to verify failures**

```bash
npm test -- src/components/home/authenticated/
```

Expected: FAIL on string assertions.

- [ ] **Step 3: Update `src/components/home/authenticated/ContinueStudyingCard.tsx`**

```tsx
// src/components/home/authenticated/ContinueStudyingCard.tsx
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import type { ContinueStudyingData } from "./types";

interface Props {
  data: ContinueStudyingData | null;
  isLoading: boolean;
}

export default function ContinueStudyingCard({ data, isLoading }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isLoading) {
    return <div data-testid="skeleton" className="rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse h-48" />;
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {t('authhome.continue_studying.heading')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('authhome.continue_studying.empty')}
        </p>
        <button
          onClick={() => navigate("/flashcards")}
          className="self-start px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium"
        >
          {t('authhome.continue_studying.start')}
        </button>
      </div>
    );
  }

  const progress = data.totalCards === 0 ? 0 : Math.round((data.reviewedCount / data.totalCards) * 100);
  const isComplete = data.totalCards > 0 && data.reviewedCount === data.totalCards;

  const timeAgo = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return t('authhome.continue_studying.time.less_than_hour');
    if (hours === 1) return t('authhome.continue_studying.time.one_hour');
    if (hours < 24) return t('authhome.continue_studying.time.hours', { hours });
    const days = Math.floor(hours / 24);
    return days === 1
      ? t('authhome.continue_studying.time.one_day')
      : t('authhome.continue_studying.time.days', { days });
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4 bg-white dark:bg-gray-900">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{data.title}</h2>
          <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">{data.theme}</span>
        </div>
        <div className="flex gap-2">
          {data.streak !== undefined && (
            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
              🔥 {t('authhome.continue_studying.streak_badge', { streak: data.streak })}
            </span>
          )}
          {data.accuracy !== undefined && (
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
              {t('authhome.continue_studying.accuracy_badge', { accuracy: data.accuracy })}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {t('authhome.continue_studying.reviewed', { reviewed: data.reviewedCount, total: data.totalCards })}
          </span>
          {isComplete && (
            <span className="text-green-600 dark:text-green-400 font-medium">
              {t('authhome.continue_studying.completed')}
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(data.lastStudiedAt)}</span>
        <button
          onClick={() => navigate("/flashcards", { state: { setId: data.setId } })}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {t('authhome.continue_studying.continue')}
        </button>
      </div>
    </div>
  );
}
```

Note: `timeAgo` moved inside the component to access `t`.

- [ ] **Step 4: Update `src/components/home/authenticated/RecommendedNextCard.tsx`**

```tsx
// src/components/home/authenticated/RecommendedNextCard.tsx
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import type { RecommendedItem, ReasonType } from "./types";

interface Props {
  data: RecommendedItem[] | null;
  isLoading: boolean;
}

export default function RecommendedNextCard({ data, isLoading }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isLoading) {
    return <div data-testid="skeleton" className="rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse h-48" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-3">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
          {t('authhome.recommended.heading')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('authhome.recommended.empty')}
        </p>
      </div>
    );
  }

  const items = [...data].sort((a, b) => a.priority - b.priority).slice(0, 3);

  const reasonLabel = (item: RecommendedItem): string =>
    item.reasonLabel ?? t(`authhome.recommended.reasons.${item.reasonType}` as const);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4 bg-white dark:bg-gray-900">
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
        {t('authhome.recommended.heading')}
      </h2>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.setId} className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{item.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{reasonLabel(item)}</p>
            </div>
            <button
              onClick={() => navigate("/flashcards", { state: { setId: item.setId } })}
              className="flex-shrink-0 px-3 py-1 text-xs bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
            >
              {t('authhome.recommended.study')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update `src/components/home/authenticated/InviteFriendsCard.tsx`**

```tsx
// src/components/home/authenticated/InviteFriendsCard.tsx
import { useTranslation } from 'react-i18next';
import { toast } from "sonner";
import { Link } from "lucide-react";
import type { InviteFriendsData } from "./types";

interface Props {
  data: InviteFriendsData;
  isLoading: boolean;
}

export default function InviteFriendsCard({ data, isLoading }: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return <div data-testid="skeleton" className="rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse h-40" />;
  }

  const handleCopy = async () => {
    if (!navigator.clipboard) {
      toast.error(t('authhome.invite.toast.no_clipboard'));
      return;
    }
    try {
      await navigator.clipboard.writeText(data.inviteUrl);
      toast.success(t('authhome.invite.toast.copied'));
    } catch {
      toast.error(t('authhome.invite.toast.copy_failed'));
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-2">
        <Link className="w-5 h-5 text-primary-500" />
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
          {t('authhome.invite.heading')}
        </h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t('authhome.invite.desc')}
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {t('authhome.invite.copy')}
        </button>
        <button
          disabled
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
        >
          {t('authhome.invite.invite')}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Update `src/components/home/authenticated/StudyGroupsCard.tsx`**

```tsx
// src/components/home/authenticated/StudyGroupsCard.tsx
import { useTranslation } from 'react-i18next';
import { Users } from "lucide-react";
import type { StudyGroupsData } from "./types";

interface Props {
  data: StudyGroupsData;
  isLoading: boolean;
}

export default function StudyGroupsCard({ data, isLoading }: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return <div data-testid="skeleton" className="rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse h-40" />;
  }

  const hasGroups = data.groups.length > 0;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4 bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-500" />
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            {t('authhome.study_groups.heading')}
          </h2>
        </div>
        {data.pendingInviteCount > 0 && (
          <span
            data-testid="pending-badge"
            className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full font-medium"
          >
            {data.pendingInviteCount}
          </span>
        )}
      </div>

      {!hasGroups && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('authhome.study_groups.empty')}
        </p>
      )}

      {hasGroups && (
        <div className="flex flex-col gap-2">
          {data.groups.map((group) => (
            <div key={group.id} className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-800 dark:text-gray-100">{group.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t('authhome.study_groups.members', { count: group.memberCount })}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors">
          {t('authhome.study_groups.create')}
        </button>
        <button
          disabled={!hasGroups}
          className={[
            "px-4 py-2 border rounded-lg text-sm font-medium transition-colors",
            hasGroups
              ? "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed",
          ].join(" ")}
        >
          {t('authhome.study_groups.invite')}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Run tests**

```bash
npm test -- src/components/home/authenticated/
npm test
```

Expected: PASS on all home card tests. Full suite PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/home/authenticated/
git commit -m "feat(i18n): migrate authenticated home card strings"
```

---

### Task 9: Migrate shared components

**Files:**
- Modify: `src/components/ErrorBoundary.tsx`
- Modify: `src/components/auth/ErrorGuidanceCard.tsx`
- Modify: `src/components/ui/GoogleAuthButton.tsx`
- Modify: `src/components/Footer.tsx`
- Modify: `src/components/sidebar/AppSidebar.tsx`

- [ ] **Step 1: Update `src/components/ErrorBoundary.tsx`**

`ErrorBoundary` is a class component — it cannot use React hooks. Use the `i18n.t()` function directly from the i18n instance instead of `useTranslation`.

```tsx
// src/components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import i18n from '@/lib/i18n';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-semantic-bg dark:bg-semantic-bg flex items-center justify-center p-4">
          <div className="max-w-md w-full card card-lg text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {i18n.t('common.error.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {i18n.t('common.error.message')}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {i18n.t('common.error.refresh')}
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400">
                  {i18n.t('common.error.dev_details')}
                </summary>
                <pre className="mt-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

- [ ] **Step 2: Update `src/components/auth/ErrorGuidanceCard.tsx`**

```tsx
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";

export interface ErrorGuidanceCardProps {
  errorType: 'email-registered' | 'username-taken' | 'general';
  message?: string;
  showLoginLink?: boolean;
}

export default function ErrorGuidanceCard({
  errorType,
  message,
  showLoginLink = false
}: ErrorGuidanceCardProps) {
  const { t } = useTranslation();

  const getGuidanceContent = () => {
    switch (errorType) {
      case 'email-registered':
        return {
          text: t('auth.errors.email_registered'),
          actionText: t('auth.errors.login_instead'),
          actionLink: "/login"
        };
      case 'username-taken':
        return {
          text: t('auth.errors.username_taken'),
          actionText: null,
          actionLink: null
        };
      case 'general':
      default:
        return {
          text: message || t('auth.errors.general'),
          actionText: null,
          actionLink: null
        };
    }
  };

  const guidance = getGuidanceContent();

  return (
    <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
      <p className="text-sm text-red-700 dark:text-red-300 mb-2">
        {guidance.text}
      </p>
      {(showLoginLink || guidance.actionLink) && guidance.actionText && guidance.actionLink && (
        <Link
          to={guidance.actionLink}
          className="inline-flex items-center text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 underline"
        >
          {guidance.actionText}
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update `src/components/ui/GoogleAuthButton.tsx`**

```tsx
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function GoogleAuthButton() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    const redirectTo = window.location.origin + '/auth/callback';
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {loading ? t('auth.google.connecting') : t('auth.google.button')}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Update `src/components/Footer.tsx`**

```tsx
// src/components/Footer.tsx
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="text-center text-sm text-gray-500 dark:text-gray-400 py-6 bg-base-light dark:bg-base-dark border-t border-gray-200 dark:border-gray-700 font-sans">
      {t('common.footer', { year: new Date().getFullYear() })}
    </footer>
  );
}
```

- [ ] **Step 5: Update `src/components/sidebar/AppSidebar.tsx`**

Replace the hardcoded label strings in `NAV_ITEMS` and `UTILITY_ITEMS` with translation keys, then translate them inside the component. Also update aria-labels.

```tsx
import { useRef, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import {
  Home, LayoutDashboard, BookOpen, Users, Bell,
  Layers, MousePointer2, FileText,
  Settings, HelpCircle, User, LogOut,
  ChevronLeft, ChevronRight, X,
} from "lucide-react";
import SidebarNavItem from "./SidebarNavItem";
import Logo from "@/assets/TE-logo.png";

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function AppSidebar({ collapsed, onToggleCollapsed, isOpen, onClose, triggerRef }: AppSidebarProps) {
  const { t } = useTranslation();

  const NAV_ITEMS = [
    { to: "/home",          labelKey: "common.sidebar.nav.home",           icon: Home,           end: true },
    { to: "/dashboard",     labelKey: "common.sidebar.nav.dashboard",      icon: LayoutDashboard },
    { to: "/library",       labelKey: "common.sidebar.nav.library",        icon: BookOpen },
    { to: "/study-groups",  labelKey: "common.sidebar.nav.study_groups",   icon: Users },
    { to: "/notifications", labelKey: "common.sidebar.nav.notifications",  icon: Bell },
    { to: "/flashcards",    labelKey: "common.sidebar.nav.flashcards",     icon: Layers },
    { to: "/drag-drop",     labelKey: "common.sidebar.nav.drag_drop",      icon: MousePointer2 },
    { to: "/ad-libs",       labelKey: "common.sidebar.nav.ad_libs",        icon: FileText },
  ] as const;

  const UTILITY_ITEMS = [
    { labelKey: "common.sidebar.utility.settings", icon: Settings },
    { labelKey: "common.sidebar.utility.help",     icon: HelpCircle },
    { labelKey: "common.sidebar.utility.profile",  icon: User },
    { labelKey: "common.sidebar.utility.logout",   icon: LogOut },
  ] as const;

  const prevIsOpen = useRef(isOpen);
  useEffect(() => {
    if (prevIsOpen.current && !isOpen && triggerRef?.current) {
      triggerRef.current.focus();
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, triggerRef]);

  const sidebarContent = (
    <div
      className={[
        "flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700",
        "transition-[width] duration-150 ease-in-out",
        collapsed ? "w-16" : "w-60",
      ].join(" ")}
    >
      <div className="flex items-center justify-between px-3 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 min-w-0">
          <img src={Logo} alt={t('common.sidebar.title')} className="w-7 h-7 flex-shrink-0 rounded" />
          {!collapsed && (
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
              {t('common.sidebar.title')}
            </span>
          )}
        </div>
        <button
          onClick={onToggleCollapsed}
          aria-label={collapsed ? t('common.nav.expand_sidebar') : t('common.nav.collapse_sidebar')}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 flex-shrink-0"
        >
          {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.to}
            to={item.to}
            label={t(item.labelKey)}
            icon={item.icon}
            collapsed={collapsed}
            end={'end' in item ? item.end : false}
          />
        ))}
      </nav>

      <div className="px-2 py-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
        {UTILITY_ITEMS.map((item) => {
          const label = t(item.labelKey);
          return (
            <button
              key={item.labelKey}
              aria-label={collapsed ? label : undefined}
              title={collapsed ? label : undefined}
              disabled
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-400 dark:text-gray-600 cursor-not-allowed"
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  const desktopPanel = (
    <div className="hidden md:flex h-full">{sidebarContent}</div>
  );

  const mobileDrawer = (
    <div className="md:hidden">
      <div
        data-testid="sidebar-overlay"
        onClick={onClose}
        className={[
          "fixed inset-0 bg-black/50 z-40 transition-opacity duration-200",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('common.nav.open_nav')}
        className={[
          "fixed right-0 top-0 h-full z-50 transition-transform duration-200",
          isOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-start h-full">
          <button
            onClick={onClose}
            aria-label={t('common.nav.close_nav')}
            className="m-2 p-2 rounded-full bg-white dark:bg-gray-800 shadow flex-shrink-0 mt-2"
          >
            <X className="w-4 h-4" />
          </button>
          {sidebarContent}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {desktopPanel}
      {mobileDrawer}
    </>
  );
}
```

- [ ] **Step 6: Run tests**

```bash
npm test
```

Expected: PASS. Note: `AppSidebar` tests check for aria-labels — if they test for `"Expand sidebar"` or `"Collapse sidebar"`, update those assertions to use the translation keys `'common.nav.expand_sidebar'` / `'common.nav.collapse_sidebar'` (and add the `react-i18next` mock to the AppSidebar test file).

- [ ] **Step 7: Commit**

```bash
git add src/components/ErrorBoundary.tsx src/components/auth/ErrorGuidanceCard.tsx \
  src/components/ui/GoogleAuthButton.tsx src/components/Footer.tsx \
  src/components/sidebar/AppSidebar.tsx
git commit -m "feat(i18n): migrate shared component strings"
```

---

### Task 10: Migrate auth strings

**Files:**
- Modify: `src/features/auth/passwordRules.ts`
- Modify: `src/components/auth/PasswordChecklist.tsx`
- Modify: `src/features/auth/useLoginForm.ts`
- Modify: `src/pages/AuthCallback.tsx`
- Modify: `src/pages/Settings.tsx`
- Modify: `src/pages/Register.tsx`

- [ ] **Step 1: Update `src/features/auth/passwordRules.ts`**

Change `label` to `labelKey` so the checklist can translate:

```ts
export const UPPERCASE_RE = /[A-Z]/;
export const SPECIAL_CHAR_RE = /[!@#$%^&*]/;

export type PasswordRule = {
  key: string;
  labelKey: string;
  test: (v: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  {
    key: "minLength",
    labelKey: "auth.password_rules.min_length",
    test: (v: string) => v.length >= 8,
  },
  {
    key: "uppercase",
    labelKey: "auth.password_rules.uppercase",
    test: (v: string) => UPPERCASE_RE.test(v),
  },
  {
    key: "special",
    labelKey: "auth.password_rules.special",
    test: (v: string) => SPECIAL_CHAR_RE.test(v),
  },
];

export const isPasswordValid = (v: string) =>
  PASSWORD_RULES.every((r) => r.test(v));
```

- [ ] **Step 2: Update `src/components/auth/PasswordChecklist.tsx`**

```tsx
import { useTranslation } from 'react-i18next';
import { Check, Circle } from 'lucide-react';
import { PASSWORD_RULES, PasswordRule } from '@/features/auth/passwordRules';

interface PasswordChecklistProps {
  value: string;
}

export function PasswordChecklist({ value }: PasswordChecklistProps) {
  const { t } = useTranslation();

  if (value === '') return null;

  return (
    <ul data-testid="password-checklist" className="mt-2 space-y-1">
      {PASSWORD_RULES.map((rule: PasswordRule) => {
        const met = rule.test(value);
        return (
          <li key={rule.key} className="flex items-center gap-2 text-sm">
            {met ? (
              <Check className="w-4 h-4 text-green-500 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-gray-400 shrink-0" />
            )}
            <span className={met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
              {t(rule.labelKey)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 3: Update `src/features/auth/useLoginForm.ts`**

Replace hardcoded toast and error strings:

```ts
// In onSubmit, replace:
//   message: result.message || 'Invalid email or password',
// with:
//   message: result.message || i18n.t('auth.errors.invalid_credentials'),
// and replace:
//   toast.success('Login successful');
// with:
//   toast.success(i18n.t('auth.toast.login_success'));
```

The hook doesn't use React hooks other than `useForm`, so we can't use `useTranslation()`. Import the i18n instance directly:

```ts
// Add at top of file:
import i18n from '@/lib/i18n';

// In onSubmit:
setError('password', {
  type: 'server',
  message: result.message || i18n.t('auth.errors.invalid_credentials'),
});
// ...
toast.success(i18n.t('auth.toast.login_success'));
```

Full file `src/features/auth/useLoginForm.ts`:

```ts
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { loginSchema, LoginFormData } from '@/schemas/authSchema';
import { loginUser } from '@/features/auth/loginUser';
import i18n from '@/lib/i18n';

export interface UseLoginFormReturn {
  register: ReturnType<typeof useForm<LoginFormData>>['register'];
  handleSubmit: ReturnType<typeof useForm<LoginFormData>>['handleSubmit'];
  onSubmit: (data: LoginFormData) => Promise<void>;
  errors: ReturnType<typeof useForm<LoginFormData>>['formState']['errors'];
  setError: ReturnType<typeof useForm<LoginFormData>>['setError'];
  formState: {
    touchedFields: ReturnType<typeof useForm<LoginFormData>>['formState']['touchedFields'];
    isSubmitting: boolean;
  };
  getEmailValidationIcon: () => React.ReactNode | null;
  handleEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function useLoginForm(): UseLoginFormReturn {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, touchedFields, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const handleEmailChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
    if (errors.email?.type === 'server') clearErrors('email');
  };

  const handlePasswordChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
    if (errors.password?.type === 'server') clearErrors('password');
  };

  const getEmailValidationIcon = (): React.ReactNode | null => {
    if (!touchedFields.email) return null;
    return errors.email
      ? React.createElement(X, { className: 'w-5 h-5 text-red-500' })
      : React.createElement(Check, { className: 'w-5 h-5 text-green-500' });
  };

  const onSubmit = async (data: LoginFormData) => {
    const result = await loginUser(data);

    if (!result.success) {
      setError('password', {
        type: 'server',
        message: result.message || i18n.t('auth.errors.invalid_credentials'),
      });
      return;
    }

    toast.success(i18n.t('auth.toast.login_success'));
    navigate('/home');
  };

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
    setError,
    formState: { touchedFields, isSubmitting },
    getEmailValidationIcon,
    handleEmailChange,
    handlePasswordChange,
  };
}
```

- [ ] **Step 4: Update `src/pages/AuthCallback.tsx`**

Add `useTranslation` (it's a function component):

```tsx
// Add import:
import { useTranslation } from 'react-i18next';

// Add inside AuthCallback function, before any return:
const { t } = useTranslation();
```

Replace string literals:
- `'Signing you in\u2026'` → `t('auth.callback.checking')`
- `'Setting up your account\u2026'` → `t('auth.callback.waiting')`
- `'Taking longer than expected'` → `t('auth.callback.timeout_title')`
- `'Your account is being set up. This usually takes just a moment.'` → `t('auth.callback.timeout_message')`
- `'Try again'` → `t('auth.callback.try_again')`
- `'Back to login'` (both occurrences) → `t('auth.callback.back_to_login')`
- `'Authentication failed'` → `t('auth.callback.error_title')`
- `'Something went wrong during sign-in. Please try again.'` → `t('auth.callback.error_default')`
- `'Your session has expired. Please sign in again.'` → `t('auth.callback.session_expired')`
- `'Authentication timed out. Please try again.'` → `t('auth.callback.timed_out')`

Complete file:

```tsx
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/useUserStore';

type CallbackState = 'checking' | 'waiting_profile' | 'auth_error' | 'timeout';

export default function AuthCallback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useUserStore((s) => s.profile);
  const storeError = useUserStore((s) => s.error);

  const [state, setState] = useState<CallbackState>(() => {
    const params = new URLSearchParams(location.search);
    return params.get('error') ? 'auth_error' : 'checking';
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sessionTimerRef    = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const profileTimerRef    = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const profileIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (sessionTimerRef.current)    clearTimeout(sessionTimerRef.current);
    if (profileTimerRef.current)    clearTimeout(profileTimerRef.current);
    if (profileIntervalRef.current) clearInterval(profileIntervalRef.current);
  };

  const startProfilePolling = () => {
    setState('waiting_profile');
    useUserStore.getState().fetchProfile();
    profileIntervalRef.current = setInterval(() => {
      useUserStore.getState().fetchProfile();
    }, 1500);
    profileTimerRef.current = setTimeout(() => {
      clearTimers();
      setState('timeout');
    }, 10_000);
  };

  const handleRetry = async () => {
    clearTimers();
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setState('auth_error');
      setErrorMessage(t('auth.callback.session_expired'));
      return;
    }
    startProfilePolling();
  };

  useEffect(() => {
    if (state === 'auth_error') return;

    let handled = false;

    const handle = (sub: { unsubscribe: () => void }) => {
      if (handled) return;
      handled = true;
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      sub.unsubscribe();
      startProfilePolling();
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && session)) {
        handle(subscription);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) handle(subscription);
    });

    sessionTimerRef.current = setTimeout(() => {
      if (!handled) {
        subscription.unsubscribe();
        setState('auth_error');
        setErrorMessage(t('auth.callback.timed_out'));
      }
    }, 3_000);

    return () => {
      handled = true;
      clearTimers();
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state !== 'waiting_profile') return;
    if (profile?.username) {
      clearTimers();
      navigate('/home', { replace: true });
      return;
    }
    if (storeError) {
      clearTimers();
      setState('auth_error');
      setErrorMessage(storeError);
    }
  }, [state, profile, storeError, navigate]);

  if (state === 'checking' || state === 'waiting_profile') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-semantic-bg dark:bg-semantic-bg">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-semantic-muted dark:text-semantic-muted">
          {state === 'checking' ? t('auth.callback.checking') : t('auth.callback.waiting')}
        </p>
      </div>
    );
  }

  if (state === 'timeout') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 bg-semantic-bg dark:bg-semantic-bg">
        <p className="text-base font-medium text-semantic-text dark:text-semantic-text">
          {t('auth.callback.timeout_title')}
        </p>
        <p className="text-sm text-semantic-muted dark:text-semantic-muted text-center max-w-sm">
          {t('auth.callback.timeout_message')}
        </p>
        <button
          onClick={handleRetry}
          className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          {t('auth.callback.try_again')}
        </button>
        <Link to="/login" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
          {t('auth.callback.back_to_login')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 bg-semantic-bg dark:bg-semantic-bg">
      <p className="text-base font-medium text-semantic-text dark:text-semantic-text">
        {t('auth.callback.error_title')}
      </p>
      <p className="text-sm text-semantic-muted dark:text-semantic-muted text-center max-w-sm">
        {errorMessage ?? t('auth.callback.error_default')}
      </p>
      <Link
        to="/login"
        className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors"
      >
        {t('auth.callback.back_to_login')}
      </Link>
    </div>
  );
}
```

- [ ] **Step 5: Update `src/pages/Settings.tsx` — add LANGUAGE_NAMES translation**

`Settings.tsx` already uses `useTranslation` for most strings. The only hardcoded item is `LANGUAGE_NAMES`. Move it inside the component:

```tsx
// Remove the module-level LANGUAGE_NAMES constant.
// Inside the Settings function, after const { t } = useTranslation():
const LANGUAGE_NAMES: Record<typeof SUPPORTED_LANGUAGES[number], string> = {
  th: t('flashcards.language.th'),
  zh: t('flashcards.language.zh'),
  vi: t('flashcards.language.vi'),
};
```

Also translate the `'Failed to save'` fallback error in `handleSave`:

```tsx
setError(err instanceof Error ? err.message : t('common.error.message'));
```

- [ ] **Step 6: Update `src/pages/Register.tsx` — add LANGUAGE_NAMES translation**

`Register.tsx` already uses `useTranslation`. Move `LANGUAGE_NAMES` inside the component:

```tsx
// Remove the module-level LANGUAGE_NAMES constant.
// Inside Register function, after const { t } = useTranslation():
const LANGUAGE_NAMES: Record<typeof SUPPORTED_LANGUAGES[number], string> = {
  th: t('flashcards.language.th'),
  zh: t('flashcards.language.zh'),
  vi: t('flashcards.language.vi'),
};
```

Also add an `"or"` separator translation:

```tsx
// Replace: <span className="bg-white dark:bg-gray-900 px-2 text-gray-400 dark:text-gray-500">or</span>
// With:    <span className="bg-white dark:bg-gray-900 px-2 text-gray-400 dark:text-gray-500">{t('auth.separator')}</span>
```

Same change in `src/pages/Login.tsx`.

- [ ] **Step 7: Run tests**

```bash
npm test
```

Expected: PASS. If any `PasswordChecklist` test checks for label text, update it to use translation keys (`auth.password_rules.min_length` etc.) and add the `react-i18next` mock.

- [ ] **Step 8: Commit**

```bash
git add src/features/auth/passwordRules.ts src/components/auth/PasswordChecklist.tsx \
  src/features/auth/useLoginForm.ts src/pages/AuthCallback.tsx \
  src/pages/Settings.tsx src/pages/Register.tsx src/pages/Login.tsx
git commit -m "feat(i18n): migrate auth strings"
```

---

### Task 11: Migrate App.tsx stub pages

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update `src/App.tsx`**

Add `useTranslation` to App and update `StubPage` to use the translation key.

```tsx
// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import AppInitializer from "./components/AppInitializer";
import PublicLayout from "./components/layout/PublicLayout";
import AuthLayout from "./components/layout/AuthLayout";
import RequireAuth from "./features/auth/RequireAuth";
import RequireGuest from "./features/auth/RequireGuest";
import ErrorBoundary from "./components/ErrorBoundary";

const Home           = lazy(() => import("@/pages/Home"));
const AuthHome       = lazy(() => import("@/pages/AuthHome"));
const Register       = lazy(() => import("@/pages/Register"));
const Login          = lazy(() => import("@/pages/Login"));
const AuthCallback   = lazy(() => import("@/pages/AuthCallback"));
const About          = lazy(() => import("@/pages/About"));
const Contact        = lazy(() => import("@/pages/Contact"));
const FlashcardsPage = lazy(() => import("./pages/FlashcardsPage"));
const Dashboard      = lazy(() => import("./pages/Dashboard"));
const Settings       = lazy(() => import("@/pages/Settings"));

const StubPage = ({ titleKey }: { titleKey: string }) => {
  const { t } = useTranslation();
  return (
    <div className="p-8 text-2xl font-semibold text-gray-700 dark:text-gray-300">
      {t('common.stub.coming_soon', { title: t(titleKey) })}
    </div>
  );
};

const PageLoader = () => (
  <div className="min-h-screen bg-semantic-bg flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppInitializer />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/flashcards" element={<FlashcardsPage />} />
              <Route path="/u/:username" element={<StubPage titleKey="common.sidebar.nav.home" />} />
              <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
              <Route path="/register" element={<RequireGuest><Register /></RequireGuest>} />
            </Route>

            <Route path="/auth/callback" element={<AuthCallback />} />

            <Route element={<RequireAuth><AuthLayout /></RequireAuth>}>
              <Route path="/home" element={<AuthHome />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/library" element={<StubPage titleKey="common.sidebar.nav.library" />} />
              <Route path="/study-groups" element={<StubPage titleKey="common.sidebar.nav.study_groups" />} />
              <Route path="/notifications" element={<StubPage titleKey="common.sidebar.nav.notifications" />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/drag-drop" element={<StubPage titleKey="common.sidebar.nav.drag_drop" />} />
              <Route path="/ad-libs" element={<StubPage titleKey="common.sidebar.nav.ad_libs" />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
```

Note: The `/u/:username` public profile stub uses `common.sidebar.nav.home` as a placeholder key since there is no dedicated public profile label. If a `common.stub.public_profile` key is preferred, add it to all three locale files: `en: "Public Profile"`, `th: "โปรไฟล์สาธารณะ"`, `vi: "Hồ sơ công khai"`.

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(i18n): migrate stub page strings"
```

---

### Task 12: Final grep verification and full test run

**Files:**
- Read-only verification

- [ ] **Step 1: Re-run the audit grep from Task 1**

```bash
# Check for remaining hardcoded button/heading text in JSX (excluding test files, comments, and already-translated files)
grep -rn --include="*.tsx" --include="*.ts" "toast\.(success|error)\('" src/ | grep -v 'node_modules' | grep -v '.test.'

grep -rn --include="*.tsx" 'aria-label="[^{]' src/ | grep -v 'node_modules' | grep -v '.test.'

grep -rn --include="*.tsx" 'placeholder="[^{]' src/ | grep -v 'node_modules' | grep -v '.test.'
```

- [ ] **Step 2: Review any remaining hits**

Acceptable remaining hardcoded strings:
- Zod schema error messages (explicitly deferred — see scope note at top of plan)
- `placeholder="••••••••"` in password fields (decorative, not translatable)
- `placeholder="you@example.com"` in login/register forms (already in locales as `register.native_language_hint` — verify)
- Technical values, URLs, data-testid attributes
- Developer-only strings (e.g. `console.error` messages)

Any unexpected hits should be wrapped in `t()` and keys added to all three locale files.

- [ ] **Step 3: Run the full test suite**

```bash
npm test
```

Expected: all tests PASS.

- [ ] **Step 4: Run type check**

```bash
npm run type-check
```

Expected: no TypeScript errors.

- [ ] **Step 5: Commit if any fixes were made in Steps 1-2**

```bash
git add -p
git commit -m "feat(i18n): fix remaining hardcoded strings found in final audit"
```

If no fixes needed, skip this step.
