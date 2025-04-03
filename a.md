
### ** Prompt for Browser Extension Landing Page & Privacy Policy**

#### **Objective**
Create a single `index.html` file for a browser extension's landing page, hosted on GitHub Pages. The landing page should:
- Provide an overview of the extension, its features, and installation instructions.
- Include a **Privacy Policy** link that opens in a new page (`privacy-policy.html`).
- Have a clean, modern design with a dark theme and a structured layout.

A separate `privacy-policy.html` should detail data usage, required permissions, and security measures.

---

### **Landing Page (`index.html`) Requirements**

1. **Title & Meta Tags**
   - Include appropriate metadata (`charset`, `viewport`).
   - Set `<title>` to the extension name.

2. **Styling & Theme**
   - Use a **dark mode theme** with CSS variables for easy customization.
   - Implement a **responsive layout** with grid-based feature sections.
   - Include hover effects and animations for UI elements.

3. **Content Sections**
   - **Header:**
     - Display the extension **logo**, **name**, and a short **tagline**.
     - Provide **buttons** for:
       - **GitHub repository** (or Chrome Web Store link).
       - **Privacy Policy** (opens `privacy-policy.html` in a new tab).

   - **About Section:**
     - Describe the extension's purpose and how it benefits users.

   - **Features Section:**
     - Use a **grid layout** to list key features with brief descriptions.

   - **Installation Instructions:**
     - Provide a step-by-step guide to installing the extension manually.

   - **How to Use:**
     - Explain how users can interact with the extension.

   - **Technology Stack:**
     - List the core technologies used (e.g., JavaScript, Chrome Extension APIs, AI services).

   - **Footer:**
     - Display copyright info, **Privacy Policy** link, and GitHub repository link.

---

### **Privacy Policy (`privacy-policy.html`) Requirements**

1. **Title & Heading**
   - Use `Privacy Policy - [Extension Name]` as the `<title>`.
   - Include a back-to-home button (`index.html`).

2. **Content Structure**
   - **Introduction**
     - State the purpose of the Privacy Policy.
     - Mention the last updated date.

   - **Required Permissions**
     - Clearly list and explain **why** each permission is necessary.
     - Example permissions:
       - `storage` (save user preferences).
       - `activeTab` (interact with the active webpage).
       - `tabs` (detect active pages).
       - `host permissions` (access specific domains).

   - **Information We Collect**
     - Specify the data the extension collects (e.g., user preferences, page interactions).
     - Clarify **what is NOT collected** (e.g., personal data, browsing history).

   - **How We Use Your Information**
     - Explain how collected data improves the extension’s functionality.
     - Confirm that no data is sold/shared with third parties.

   - **Data Storage & Security**
     - Mention that data is stored **locally** or temporarily processed on a backend.
     - Highlight encryption/security measures.

   - **Third-Party Services**
     - Disclose any external APIs or services used (e.g., AI models, analytics).
     - Provide links to third-party privacy policies.

   - **User Rights**
     - State users' rights regarding data access, modification, and deletion.

   - **Changes to This Privacy Policy**
     - Explain how users will be notified of policy updates.

   - **Contact Information**
     - Provide a method for users to reach out (GitHub issues etc.).

---

### **Additional Notes**
- Ensure **mobile responsiveness** for both pages.
- Use **semantic HTML** for accessibility and SEO.
- Keep text **clear and concise**, avoiding unnecessary legal jargon.

---
