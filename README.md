# Final report
## Video Demo
**Video URL:**
https://youtube.com/shorts/IVdWhLth9r8?feature=share

also available in demo.mp4


## Team Information

| Name          | Student Number | Email                         |
|---------------|----------------|-------------------------------|
| Xingda Jiang  | 1007170525     | jasonj.jiang@mail.utoronto.ca |
| Guanqun Dong  | 1004525301     | TODO: add email               |
| Zijin Liao    | 1004303489     | TODO: add email               |
| Tianqi Ju     | 1012870467     | tianqi.ju@mail.utoronto.ca    |


## Motivation

University students frequently need short-term or course-specific items such as textbooks, lab equipment, calculators, and small appliances. Existing platforms like Facebook Marketplace or Kijiji are not campus-focused, can feel unsafe, and often mix unrelated listings from the whole city, which is inconvenient for students who just want to trade with other students near campus.

We wanted a **campus-local marketplace** where:

- Buyers and sellers are all students.
- Listings are relevant to student life (courses, dorms, labs).
- In-person trades can be coordinated safely near campus.

This app is built as a focused, student-oriented marketplace with a clear buy/sell flow, live chat between buyer and seller, and backend-managed authentication.


## Objectives

Our main objectives were:

- Build a **multi-screen mobile application** using **React Native + Expo + TypeScript**.
- Implement **typed navigation** with Expo Router and dynamic routes.
- Demonstrate all **core technical requirements**:
  - React Native/Expo with TypeScript
  - Navigation
  - State management and persistence
  - Notifications
  - Backend integration
  - Deployment with Expo EAS
- Implement **at least two advanced features**, and in our case:
  - **User authentication** with backend-managed login/logout and token storage.
  - **Real-time updates** through a WebSocket-based chat system.
  - **Mobile device APIs** (camera/image picker and location).
  - **Social sharing** from within the app for product information.
- Provide a **clean user flow** for:
  - Signup / Signin
  - Adding a product
  - Searching for product
  - Shopping cart
  - Order history
  - Live chat
  - Profile management


## Technical Stack

### Mobile frontend
```text
React Native, Expo, Typescript
```

### Backend
```text
Django rest framework, Elasticsearch, Redis, Nginx, Docker, Mysql
```


## Features

### Core Technical Requirements

1. **React Native and Expo Development**

   - Mobile app built entirely with **React Native** and **Expo** in **TypeScript**.
   - Multiple screens: market, item detail, cart, orders, chat, profile, login, signup, etc.
   - Components and hooks are fully typed (props, navigation params, API types).

2. **Navigation**

   - Uses **Expo Router** as the navigation solution.
   - File-based routing under `app/` (e.g., dynamic route `app/item/[id].tsx` for viewing an item by ID).
   - Route parameters handled via `useLocalSearchParams`, allowing data passing between screens (e.g., passing `threadId` into the chat screen).

3. **State Management and Persistence**

   - **Context API** used for module-level state:
     - `AuthContext` handles current user, login/logout, and token state.
     - `CartContext` stores items added to cart and computed totals.
     - `MessageContext` manages global Snackbar notifications.
   - **AsyncStorage** used to persist:
     - JWT access/refresh tokens.
     - Auth state across app restarts.
   - This satisfies the requirement of Context / useReducer + persistent storage.

4. **Notifications**

   - Uses **Expo Notifications** to schedule local notifications for important events, such as:
     - Order status has been changed.
     - Successful creation of a new listing.
     - Received a new message
   - Handles permission requests and schedules notifications with meaningful titles and bodies.

5. **Backend Integration**

   - Integrates with a custom **Django REST API** backend.
   - All main data (users, products, orders, chat metadata) is fetched from the backend, not local static JSON.
   - Error handling includes:
     - Loading states.
     - Toast/Snackbar error messages via `MessageContext`.
   - Search results, order history, cart operations, and chat metadata are all driven by the backend.

6. **Deployment**

   - Backend packaged via Docker and Docker Compose.
   - Android build generated with **Expo EAS Build** using a production profile.
   - The client is configurable via `constant.ts` (`BASE_URL`, `IMAGE_URL_PREFIX`) to point to the correct backend IP address.

### Advanced Features

#### User Authentication

- Implements backend-managed authentication with Django + JWT (email/username + password), issuing access and refresh tokens instead of storing credentials on the device.
- Uses `AuthContext` on the client to manage login/logout, hold the current user and tokens in memory, and persist them securely in AsyncStorage for session restoration.
- On successful login, tokens and user profile are saved, user is redirected to the Market screen, and feedback is shown via Snackbar; on failure, a non-sensitive error message is displayed.

#### Real-Time Updates

- Provides a **live chat** feature between buyers and sellers using WebSockets, connecting to the backend endpoint (e.g., `ws://{backend_ip}:8000/chat/`) after login.
- The backend maintains a mapping between usernames and WebSocket connections and routes messages using a simple JSON protocol with fields like `me`, `peer`, and `message`.
- The chat screen listens for incoming WebSocket messages and updates the UI in real time without polling.

#### Mobile Sensors or Device APIs

- Integrates **location services** via `expo-location`, requesting foreground location permission and using the result to center a `react-native-maps` `MapView` near the user or a default campus coordinate if denied.
- Allows users to pick a meetup point on the map and send it as a structured location message in chat, helping buyers and sellers coordinate in-person exchanges.
- Uses `expo-image-picker` to select product photos (and chat images where applicable), with explicit permission handling and fallbacks.

#### Social Sharing

- Implements a clipboard-based sharing flow on the Market screen using `expo-clipboard` to read specially formatted text like `Item ID: 123` and optional title copied from other apps.
- When such content is detected, the app shows a temporary banner card with a countdown and actions (e.g., “Open now” / “Later”) that can deep-link directly into the corresponding item detail screen.
- This cross-app flow lets users share and reopen listings via text in chat, email, or notes; although implemented via clipboard rather than `expo-sharing`.

#### Custom Animations

- The project includes small interactive animations to enhance user experience (Although didn't use React Native Reanimated)
- The Market clipboard banner and similar transient UI elements are designed to appear and disappear smoothly with timed visibility and progress-style behavior.
- Buttons, floating actions (e.g., cart access), and certain modals/sheets use simple visual feedback and transition effects (such as gentle scaling or fading and smooth screen transitions via navigation).


## User Guide

### Starting the App

- Install the Android APK or run the app via Expo (see **Deployment Information**).
- On first launch, you will see the **login** screen.

### Sign Up / Login

1. **Sign Up** (if your account does not exist yet):
   - Navigate to the signup screen.
   - Enter required fields (username/email/password).
   - Submit the form to create your account.
2. **Login**:
   - Enter your email and password.
   - On success, the app saves your session and takes you to the **Market** screen.

### Market (Browse Products)

- The **Market** screen shows a list of items for sale.
- You can:
  - Scroll through items.
  - Use the search bar to filter by keyword.
  - See basic info: title, price, thumbnail, and stock.

When the app detects a shared item snippet in your clipboard (e.g. “Item ID: 123\nTitle: Example”), a top card appears allowing you to jump directly to that item’s detail screen.

### View Item Detail

- Tap any item to open its **detail screen**:
  - Large product image.
  - Title, description, category.
  - Price and remaining quantity.
  - Seller information (username).
- From here you can:
  - Add the item to your **cart**.
  - Open **chat** with the seller.

### Cart and Checkout

- Open the **Cart** screen from the cart button/fab/tab.
- In the cart, you can:
  - Adjust quantity of each item.
  - Remove items.
  - See total price.
- Press **Checkout** to place an order:
  - The app sends a request to the backend.
  - On success, a local notification and success message are shown.
  - The cart is cleared.

### Order History

- Navigate to the **Orders** screen.
- See all your orders with basic status.
- Tap an order to open detailed view with items and totals.

### Chat and Meetups

- Open **Chat** from an item or order.
- Send text messages to the other party in real time.
- Use the integrated **map picker** in the chat:
  - On first use, the app asks for location permission.
  - If granted, map centers near your current location; otherwise, it falls back to a default campus location.
  - Pick a point on the map and send it as a meetup location message.
- Optionally open the location in an external map app via a link.

### Profile

- Open the **Profile** screen to view your user info.
- Edit your profile via the **Edit Profile** screen and save changes.
- Log out from the Profile or Settings area if needed.


## Development Guide
#### important: 
```text
due to network issue, backend may not run on the same machine with client.
the client should change the EXPO_PUBLIC_API_BASE and EXPO_PUBLIC_IMAGE_BASE in .env to point to the real backend IP address
The localhost in mobile app point to itself.
even If you are using emulator, backend network may not be accessible from emulator network.
To test network setup, visit http://{backend_ip}:8000/api/docs,
if you can see the page, you can access backend from this device
It's recommended to use release apk on a real device and backend on your computer.

To start backend, MYSQL_ROOT_PASSWORD environment variable must be set to start mysql
```
### backend setup
navigate to backend folder, build backend develop container by

> docker build . -t backend:latest

for develop environment, use

> docker-compose --profile dev up -d

for release environment, use

> docker-compose --profile release up -d
```text
all profile provides following service:
mysql on port 3306, redis on port 6379, elasticsearch on port 9200

dev profile provies extra visualization tools:
phpmyadmin on port 8080, redis insight on port 5540, kibana on port 5601, backend-dev-container on 8000

init elasticsearch index by running esIndexInit.py this will set up tokenizer for search (auto run in dev container)
initTestUser.py creates a test user "testuser" alice with password "test", "testuser2" bob with password "test" (auto run in dev container)
development code will be mapped into dev container so that it will be on the same network to other services
changing of dependency need to rebuild the image
```
### build local apk and install on your phone(android)
change the backend ip address EXPO_PUBLIC_API_BASE and EXPO_PUBLIC_IMAGE_BASE in .env pointing to your computer, then

> npx expo prebuild --platform android

this will create an android folder, then
> cd android
> .\gradlew assembleRelease (windows)

this will create an apk in android/app/build/outputs/apk/release/app-release.apk.

then use USB to install the app on your phone.

### documentation

backend api document available at http://{backend_ip}:8000/api/docs

### real time chat API

when user login, the mobile device will establish a websocket connection with server by ws://localhost:8000/chat/.

backend will save a mapping between username and this connection.

when sending a chat message, the format should be like this

```json
{
    "type": "chat_message",
    "me": "alice",
    "peer": "bob",
    "message": "hello"
}
```
the peer will receive a message like this
```json
{
    "type": "chat_message",
    "message": "hello",
    "sender": "alice"
}
```

### running tests

To run backend unit tests inside the Docker container:

#### run all tests

```bash
docker compose exec backend python manage.py test
```

#### Run tests for a specific app

```bash
docker compose exec backend python manage.py test user
```
```bash
docker compose exec backend python manage.py test order
```
```bash
docker compose exec backend python manage.py test product
```
```bash
docker compose exec backend python manage.py test chat
```

## Development Guide

This section describes how to set up the local development environment for both backend and frontend, including required tools, environment variables, and local testing.

### Prerequisites

- Node.js and npm (LTS recommended)
- Python 3.x (for tooling if needed)
- Docker and Docker Compose
- Expo CLI (installed via npm)
- Android Studio or an Android emulator (optional, for local emulator testing)
- Expo Go app on your physical Android device (for LAN testing)

### Environment variables

**Frontend (project root `.env`)**

Create a file named `.env` in the project root with:

```env
EXPO_PUBLIC_API_BASE=http://localhost:8000
EXPO_PUBLIC_IMAGE_BASE=http://localhost:8090/
```

For testing on a real Android device, replace `localhost` with your computer’s LAN IP (for example `http://192.168.x.x:8000` and `http://192.168.x.x:8090/`), making sure the phone and computer are on the same Wi-Fi network.

**Backend (`backend/.env`)**

Inside the `backend` directory, create a file named `.env` with:

```env
DB_HOST=db
DB_NAME=campus
DB_USER=django
DB_PASSWORD=supersecret123
MYSQL_ROOT_PASSWORD=rootsecret123
```

Add any additional Django settings (for example `SECRET_KEY`, `DEBUG`, etc.) as needed, but keep backend-only variables here and frontend-only variables in the root `.env`.

### Backend setup and local testing

1. From the project root, go to the backend folder:
   
   - `cd backend`

2. Make sure `backend/.env` exists as described above.

3. Start the backend services in development mode:
   
   - `docker compose --profile dev up --build`

4. Once the containers are running, verify the backend:
   
   - API docs: open `http://localhost:8000/api/docs/` in a browser  
   - Static images: open `http://localhost:8090/`

The backend should now be ready for local development and reachable from the frontend using the configured base URLs.

### Frontend setup and local testing

1. In the project root, ensure `.env` exists as described above.

2. Install dependencies:
   
   - `npm install`

3. Start the Expo development server:
   
   - `npm run start`

4. For browser- or emulator-based testing, use the Expo Dev Tools interface to open the app in an Android emulator.

5. For testing on a physical Android device:
   
   - Make sure the device and your computer are on the same Wi-Fi network.  
   - Set `EXPO_PUBLIC_API_BASE` and `EXPO_PUBLIC_IMAGE_BASE` in the root `.env` to use your computer’s LAN IP instead of `localhost`.  
   - Open the Expo Go app on your phone and scan the QR code shown in the terminal or Dev Tools.

With these steps, you can run the backend in Docker and the frontend via Expo, and develop and test the application locally on an emulator or a real Android device.


## Deployment Information

We use GitHub Actions CI/CD to produce the Android build. When a new version tag (for example, `v1.0.0`) is pushed to the repository, the workflow runs an EAS production build for Android and uploads the generated APK/AAB as an asset to the corresponding GitHub Release.

The Android build can be downloaded from our Releases page:

- Android build (APK/AAB via EAS Build): https://github.com/ECE1778Group/ECE1778project/releases


## Individual Contribution
- **Xingda Jiang**
  - Implemented the core mobile UI and navigation flow.
  - Implemented pages and components
    - Market
    - Item details
    - Cart
    - Orders
    - Chat
    - Old login
    - Old profile
  - Integration with the backend.
  - CI/CD for Android .apk deployment

- **Guanqun Dong**
  - backend architecture
  - backend basic implementation,
    - chat, 
    - order, 
    - product
    - user
  - some integration debugging
- **Zijin Liao**
- **Tianqi Ju**
  - 


## Lessons Learned and Concluding Remarks
```text
1. assigning tasks to different members with no overlapping duty is very efficient.
2. API programming(swagger ui) is important at the beginning of the project. It helps members to understand their tasks.
3. changing API is expensive in developing
4. tests helps to prevent feature break during developing
The development should follow this pattern:
API programming(backend) | -> backend development
                         | -> frontend development
                         | -> test development(API testing)
5. docker provides a consistent development environment.
```