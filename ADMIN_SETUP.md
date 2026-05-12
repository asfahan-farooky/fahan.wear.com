# Admin Panel Setup Guide

## How to Access the Admin Panel

### Step 1: Sign Up / Sign In
1. Go to `/signup` and create an account with your phone number
2. Verify the OTP sent to your phone
3. Your account will be created with `role: "user"`

### Step 2: Upgrade to Admin Role

Since new users are created with `role: "user"` by default, you need to manually upgrade them to `role: "admin"` in Firebase Console:

#### Option A: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Collection: users**
4. Find your user document (it will be named with your Firebase Auth UID)
5. Click on the document to open it
6. Find the `role` field
7. Change the value from `"user"` to `"admin"`
8. Click **Update**

#### Option B: Using Firebase CLI
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Update a user's role to admin (replace with actual UID)
firebase firestore:delete users/{YOUR_UID} --delete-col

# Then manually set via Console or programmatically
```

### Step 3: Access Admin Panel
1. Sign in with your account
2. Navigate to `/admin`
3. If your role is `"admin"`, you'll see the admin panel
4. If access is denied, make sure your role was updated in Firebase Console

---

## Admin Panel Features

### Product Management
- **View Products**: See all products in your catalog
- **Add Products**: Create new products with:
  - Product ID (auto-generated from name)
  - Name, Price, Category
  - Colors and Sizes
  - Global images or color-specific images
  - Upload to Firebase Storage or paste URLs
- **Edit Products**: Modify existing product details
- **Delete Products**: Remove products from catalog

### Product Image Upload
- Upload images directly to Firebase Storage
- Organize by product ID and color
- Images are stored at: `products/{productId}/{color}/`

---

## Troubleshooting

### Admin Panel Shows "Access Denied"
- **Issue**: Your account doesn't have admin role
- **Fix**: Update your `role` field to `"admin"` in Firebase Console

### Data Not Saving After Signup
- **Issue**: User document not created in Firestore
- **Fix**: 
  1. Check browser console for errors (F12 → Console tab)
  2. Verify phone number is exactly 10 digits
  3. Check Firebase Admin SDK credentials in `.env.local`
  4. Ensure Firestore has enough read/write quota

### Can't Upload Images
- **Issue**: Firebase Storage permissions denied
- **Fix**: Check your Storage Rules allow admin uploads
  ```
  allow write: if isAdmin();
  ```

### Product Changes Not Showing
- **Issue**: Firestore listener error
- **Fix**: 
  1. Verify your user role is "admin"
  2. Check Firestore rules are correctly deployed
  3. Refresh the page (F5)

---

## User Roles

### User Role (role: "user")
- Can browse products
- Can create orders
- Can view own order history
- Cannot access admin panel
- Cannot upload images
- Cannot manage products

### Admin Role (role: "admin")
- Can do everything a user can do
- Can access `/admin` panel
- Can create/update/delete products
- Can upload images to Firebase Storage
- Can manage product catalog

---

## Firebase Rules Summary

```firestore
# Products
- Public read access
- Only admins can create/update/delete

# Users
- Only user themselves can read their profile
- Users can create their own profile on signup
- Only admins can have role: "admin"

# Orders
- Only the owner can read their orders
- Only authenticated users can create orders
```

---

## First-Time Setup Checklist

- [ ] Deploy Firestore Rules (in Firebase Console → Firestore → Rules)
- [ ] Deploy Storage Rules (in Firebase Console → Storage → Rules)
- [ ] Sign up first user account
- [ ] Update first user's role to "admin" in Firebase Console
- [ ] Verify admin can access `/admin` panel
- [ ] Add sample products via admin panel
- [ ] Test product display on `/shop`

---

## Environment Variables Required

In `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_admin_email@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Order Notification Email Settings
ORDER_NOTIFICATION_EMAIL=your_admin_notification_email@example.com
EMAIL_FROM=your_store@example.com
EMAIL_SMTP_HOST=smtp.example.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=smtp_user
EMAIL_SMTP_PASS=smtp_password
```

---

## Verify User Data is Being Saved

### Using the Diagnostic API
After signing up, you can verify your data was saved:

**Option 1: Browser Console**
```javascript
// In browser DevTools (F12 → Console)
await fetch('/api/auth/check-status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '9876543210' }) // Your phone number
}).then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2)))
```

**Option 2: Using cURL**
```bash
curl -X POST http://localhost:3000/api/auth/check-status \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}'
```

**Success Response:**
```json
{
  "timestamp": "2026-04-29T14:31:00.000Z",
  "firebaseInitialized": true,
  "checks": [
    {
      "name": "Firebase Admin SDK",
      "status": "✅ Initialized"
    },
    {
      "name": "Firestore Collections",
      "status": "✅ Can read",
      "collections": ["users", "products", "orders"]
    },
    {
      "name": "User with phone 9876543210",
      "status": "✅ Found",
      "role": "user",
      "created": "2026-04-29T14:30:00.000Z"
    }
  ]
}
```

### Via Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Firestore Database**
4. Open **Collection: users**
5. You should see your user document with your phone number
6. Click the document to view your saved data:
   - `uid` - Firebase Auth UID
   - `phone` - Your phone number
   - `fullName` - Your name
   - `role` - Should be "user"
   - `createdAt` - Signup timestamp

---

## Troubleshooting Data Not Being Saved

### Issue: No data appears in Firestore

**Step 1: Check Firebase Credentials**
- Open `.env.local` in project root
- Verify these are set:
  ```
  FIREBASE_PROJECT_ID=your_project_id
  FIREBASE_CLIENT_EMAIL=your_service_account_email
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
  ```
- If missing, download from Firebase Console → Settings → Service Accounts

**Step 2: Check Browser Console Errors**
1. Open DevTools: `F12` or `Ctrl+Shift+I`
2. Go to **Console** tab
3. Sign up again
4. Look for error messages like:
   - `"Invalid phone number"` → Phone must be exactly 10 digits
   - `"Network error"` → Check internet/Firebase setup
   - `"Server error"` → Check server logs below

**Step 3: Check Server Logs**
1. Terminal where you run `npm run dev`
2. Look for logs like:
   ```
   Creating new user with ID: [uid] Phone: 9876543210
   User created successfully: [uid]
   ```
3. If you see errors, read the error message carefully

**Step 4: Verify API Route**
```bash
# In browser console, test if API is reachable
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test-user-123",
    "phone": "9876543210",
    "fullName": "Test User",
    "isSignup": true
  }'
```

### Issue: Getting "Missing or insufficient permissions"

This usually means Firestore rules don't allow the write. Check:

1. **Firestore Rules are Deployed**
   - Firebase Console → Firestore → Rules
   - Copy rules from `firebase/firestore.rules`
   - Click **Publish**

2. **Rules Include users Collection**
   ```firestore
   match /users/{userId} {
     allow create: if request.auth != null && ...
   }
   ```

3. **Admin SDK has Credentials**
   - Both `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` must be set
   - Restart dev server after updating `.env.local`



1. **Test User Creation**: Sign up → Check browser console for errors
2. **Test Admin Access**: After role upgrade, visit `/admin`
3. **Test Product Upload**: Create a product with images
4. **Test Public View**: Visit `/shop` to see uploaded products
5. **Test Admin Features**: Edit/delete products from admin panel

