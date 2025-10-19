# Team Information

- \<Xingda Jiang, 1007170525\>  
- \<Guanqun Dong, 1004525301\>  
- \<Zijin Liao, 1004303489\>  
- \<Tianqi Ju, 1012870467\>

---

# 1\. Motivation

## 1.1 Problem

University students frequently need short-lived items, for example, textbooks and course-specific tools. However, current resale channels are fragmented and unreliable, Facebook groups and generic classifieds bury campus-specific posts, lack verification, and expose users to spam/scams. Shipping-centric marketplaces add fees and friction for bulky items. There is no lightweight, campus-focused, mobile experience that makes it easy to discover nearby listings, message sellers, and coordinate in-person exchanges.

## 1.2 Rationale

A campus-local, payment-free marketplace directly lowers costs for students, keeps textbooks and gear in circulation, and reduces waste. By emphasizing verified, on-campus meetups, the app reduces scam risk and regulatory overhead while matching how students already transact. Focused discovery (course-code search, proximity filters) and timely notifications (“new listing: ECE472 textbook”) increase successful matches versus noisy, generic platforms. Impact is measurable via active listings, time-to-sale, repeat usage, and dollars saved. In short, the app addresses a real campus need with a well-scoped, technically appropriate solution that fits the course timeline.

## 1.3 Target users

- **Primary:** Undergraduate/graduate students and staff at universities looking to buy/sell textbooks and student essentials locally.  
- **Secondary:** Nearby community members with an interest in university-related goods, subject to verification and safety policies.

## 1.4 Existing solutions & limitations

- **Social Media Marketplace (Facebook):** Weak search for course codes; Mixed audiences; Privacy concerns.  
- **Kijiji / Craigslist:** Broad Geography; Higher scam risk; Little campus context; Poor fit for time-sensitive course needs.  
- **Amazon / eBay:** Extra shipping time and fee; Overkill for a quick, in-person swap.

---

# 2\. Objectives and Key Features

## 2.1 Objective

Build and ship a TypeScript React Native \+ Expo app that implements a **payment-free, campus-local resale marketplace** with typed navigation, durable client state, local notifications, and a real backend for listings and chat for Android and iOS.

## 2.2 Core Requirements

### 2.2.1 React Native and Expo Development

- **Framework:** React Native with Expo; Typescript  
- **Screens:**  
  - Login page: user authentication  
  - Index page: show selling items  
  - Detail page: show the details of the selected selling item  
  - Shopping cart: show items to be bought  
  - Chat page: chat with the seller/buyer  
- **Components/Hooks:** FlatList, RefreshControl, TextInput, Image, Pressable; useState, useEffect, useMemo, useCallback, useRef.

### 2.2.2 Navigation Structure

- **Chosen library:** Expo Router  
- **Data passing:**  
  - \- Use file-based routes: app/index.tsx, app/item/\[id\].tsx, app/chat/\[threadId\].tsx, app/auth/login.tsx, app/cart.tsx …  
  - \- Route params: \[id\] for item details; \[threadId\] for chat; search params for filters (q, course, minPrice, maxPrice, date) ...

### 2.2.3 State Management & Persistence

- **Global vs module-level state:** Global (Redux Toolkit slices) \= auth/session, user profile, saved searches, listings cache, chat threads, cart; Module/local (component state) \= form inputs, UI toggles, ephemeral filters.  
- **Chosen approach:** Context \+ Redux Toolkit (hybrid)  
- **Persistence strategy**: Elastic search for selling items, Redis for cache and messages, MySQL for orders.  
- **Error/loading handling patterns:** skeletons/spinners / per-slice \`status\`/\`error\`; toast banners

### 2.2.4 Notifications

- **Notification type:** Real-time update  
- **Scheduling & handling taps:** Local reminders for saved searches and meetup reminders (time/place)  
- Handle taps via deep links to app routes (/item/\[id\], /chat/\[threadId\])  
- **Opt-in/opt-out behavior:** First-run permission prompt with rationale; granular toggles: Saved Search Alerts, Chat Messages, Meetup Reminders

### 2.2.5 Backend Integration

- **Backend choice:** Customized RESTful API  
- **Data to fetch/display:** The mobile client communicates with backend APIs to fetch and display user, product, and message data. Each module has specific responsibilities as follows:  
  - Auth Module: api/auth/   
    - Handles user registration, login, email verification, password reset, and session management.  
  - User Module: api/user/  
    - Manages user profile, personal settings  
  - Service Module: api/service/  
    - Handles item listings, uploads, browsing, search, and item details.  
  - Message Module: api/message/  
    - Handle user-to-user chat, message storage.  
- **Request/response flow & error handling:** The mobile client sends HTTPS requests to the backend API with the necessary parameters in the request body. The backend first checks the validation of the session. If the session is missing, expired, or invalid, the backend immediately returns a 401 Unauthorized error. Once authenticated, the backend will check the Redis cache for existing data. If not found, it queries the database for the requested resource. The backend returns data in JSON format with appropriate HTTP status codes:  
  - 200 OK: Successful Request  
  - 400 Bad Request: invalid parameters  
  - 401 Unauthorized: invalid session  
  - 404 Not Found: requested item does not exist  
  - 500 Internal Server Error: Server Failure  
- **API-driven navigation (if any):**  
  - **Auth Module**  
    -  api/auth/signup  
      - HTTP Method: Post   
      - Navigate to Registration Page  
    -  api/auth/signin  
      - HTTP Method: Post   
      - Navigate to Home Page  
    - /api/auth/logout  
      - HTTP Method: Post   
      - Navigate to the Login Page  
    - api/auth/sendVerificationCode  
      - HTTP Method: Post   
      - Navigate to Code Verification Page  
  - **User Module**  
    - api/user/reset  
      - HTTP Method: Post   
      - Navigate to Update Profile Page  
  - **Service Module**  
    - api/service/view:idHTTP Method: Get   
      - Navigate to Item Detail Page  
    - api/service/back  
      - HTTP Method: Post   
      - Navigate to the Service Page  
  - **Message Module**  
    - api/message/:conversationId  
      - HTTP Method: Get   
      - Navigate to Chat Screen		

### 2.2.6 Deployment

- **Overall:** Configure \`eas.json\` with \`preview\` and \`production\` profiles; set \`SUPABASE\_URL\`, \`SUPABASE\_ANON\_KEY\`, \`EXPO\_PUBLIC\_API\_BASE\` via \`eas secret\`; bump \`expo.version\`, \`android.versionCode\`, \`ios.buildNumber\` each release.  
- **Build & submit**: \`eas build \-p android \--profile preview|production\` and \`eas build \-p ios \--profile preview|production\` then \`eas submit \--platform android|ios\`.  
- **OTA updates**: \`eas update \--channel preview|production\`; map git branches → channels in \`app.config.ts\`; keep updates backward-compatible with installed binaries.  
- **Release checks**: verify deep links (\`/item/\[id\]\`, \`/chat/\[threadId\]\`), notifications, and envs per profile; tag release and update CHANGELOG.

### 2.2.7 Advanced Features

- Feature 1: **User Authentication**  
  - **Scope**:  
    - User Registration  
    - Email Verification  
    - User Sign In  
    - Password Reset  
    - Session   
  - **User flow**:  
    - The user enters the email and password for registration, and the system will generate a verification code and send it to the email.  
    - After the user enters the verification code to verify their email, the account will be authorized.  
    - The user logs into the app by entering their email and password. The system will save the user’s information in the Session.  
    - When the password is forgotten, it can be reset using a verification code sent to the email.  
  - **Technical approach**:  
    - NodeMailer: Sending verification code.  
    - Cookie: Saving session ID.  
    - Redis: Store user information temporarily.  
    - Bcrypt: Hash password.  
- Feature 2: **Real-Time Updates**  
  - **Scope**: Chat Messages  
  - **User flow**: When a user clicks on the chat button on the detail page, they are navigated to a chat screen. On the chat screen, the buyer can chat with the seller.  
  - **Technical approach**: Use WebSocket for online chat through the server  
- Feature 3: **Feature Mobile Sensors or Device APIs (Optional)**:  
  - **Scope**: The *Campus Exchange* app integrates mobile device capabilities to improve location relevance and user trust in campus-based exchanges.  
    - Location (expo-location)  
      - Display nearby listings sorted by distance(e.g., within 1 km / 3 km / on-campus)  
      - Suggest pre-defined safe meet-up spots (e.g., library entrance)  
      - Support distance-based filters and location-aware notifications  
    - Camera / image picker(expo-camera / expo-image-picker)  
    - Permissions & privacy

## 2.3 Requirement Alignment

-  **React Native \+ Expo (TypeScript):** All screens/components typed; Expo SDK for device APIs.    
-  **Navigation:** Expo Router with file-based routes, dynamic params (e.g., \`/item/\[id\]\`, \`/chat/\[threadId\]\`), and deep links from notifications.    
-  **State & Persistence:** Context/useReducer (or hybrid) for session, saved items, filters; Async Storage for cross-restart persistence.    
-  **Notifications:** Local reminders for saved searches/meetups; tap actions route users to the relevant screen.    
-  **Backend Integration:** Customized backend for listings, images; live data fetch with loading/error/retry and typed DTOs. May use Supabase for auth and live chat   
-  **Deployment:** EAS Build profiles (preview/production) producing APK/TestFlight.

## 2.4 Scope & Feasibility

- **Scope**: A campus-local, payment-free resale app focused on:   
  - Create listing (title/price/course/ISBN \+ photos)  
  - Discover via course-aware search and distance filters  
  - Real-time chat  
  - Coordinate safe on-campus meetups

  Initial launch targets U of T with core categories (e.g., textbooks, small electronics, dorm items), typed navigation, Async Storage persistence, local notifications, and a Customized backend for listings, images, profiles, and chat; 

- **Out of scope**: in-app payments, shipping, and complex dispute workflows.  
    
- **Feasibility**: Expo \+ RESTful backend minimizes infra and reduces risk for auth, storage, and realtime; Expo Router, Notifications, Location, and Image Picker are mature, well-documented modules. React native provides reusable standard UI patterns (FlatList, forms), and supports offline drafts and robust error states—making a stable EAS build realistic for a 4-person team within one and a half months.

---

## 3\. Tentative Plan

### 3.1 Roles & Responsibilities

- Xingda Jiang — **UI & Navigation Development**

**Responsibilities:**

- Build all major UI screens using React Native \+ Expo Router, following TypeScript type safety.  
- Implement navigation structure and deep linking for:  
  - /index – item listings  
  - /item/\[id\] – item detail  
  - /chat/\[threadId\] – chat  
  - /auth/login – login/signup  
  - /cart – cart overview  
- Design reusable UI components such as ItemCard, ChatBubble, InputField, and PrimaryButton.  
- Work closely with Zijin Liao to integrate authenticated navigation and user session redirects.  
- Maintain layout consistency and accessibility across Android and iOS.

**Deliverables:**

- Functional screen navigation flow.  
  - Responsive and themed UI with shared component library.  
  - Integration-ready frontend for backend API connections.

- Guanqun Dong — **Backend & Data Integration**  
  **Responsibilities:**  
  - Set up and manage the backend, including database schema design for users, listings, messages, and orders.  
  - Implement RESTful APIs or direct client usage for CRUD operations.  
  - Configure Realtime (WebSocket) for chat updates and live listing refresh.  
  - Handle authentication verification through Auth with school email domain restrictions.  
  - Provide mock endpoints and sample data for frontend development during early stages.  
  - Collaborate with Tianqi Ju to ensure backend endpoints integrate smoothly with CI/CD tests.

  **Deliverables:**

  - Fully functional backend with database schema, seed data, and tested endpoints.  
  - Live chat and listing update mechanism.  
  - Backend documentation (API spec \+ schema diagram).


- Zijin Liao — **Authentication, State & Notifications**  
  **Responsibilities:**  
- Implement authentication and authorization flow using Supabase Auth (login/signup/logout).  
- Manage global app state via Context \+ useReducer for user sessions, notifications, and saved items.  
- Configure session persistence and offline caching.  
- Set up expo-notifications to deliver:  
  - New listing alerts (based on saved search)  
  - Chat message reminders  
  - Meetup time/place reminders  
- Link notifications with deep routes so tapping a notification navigates to /item/\[id\] or /chat/\[threadId\].  
- Coordinate with Xingda Jiang for UI integration and with Guanqun Dong for notification-triggered server events.  
  **Deliverables:**  
- Working login system with persistent sessions.  
- Configurable local notifications and in-app toggle settings.  
- Global state management that synchronizes with backend data and notifications.  
    
- Tianqi Ju  — **Testing, Deployment & System Integration**  
  **Responsibilities:**  
  - Set up project-wide code quality and testing environment, including ESLint, Prettier, Jest, and @testing-library/react-native.  
  - Create integration tests for key flows (login → browse → chat).  
  - Configure GitHub Actions for continuous integration (build, lint, test on every PR).  
  - Lead the EAS Build process for both Android (APK) and iOS (TestFlight).  
  - Handle app versioning, environment variable management, and error boundary setup.  
  - Contribute to frontend–backend integration testing with Guanqun Dong and overall debugging with Xingda Jiang/Zijin Liao.  
  - Prepare final README and technical report for submission.

  **Deliverables:**

  - Stable CI/CD workflow with automatic build and test pipelines.  
  - Tested and optimized app builds for Android and iOS.  
  - Integration documentation and final submission package.
