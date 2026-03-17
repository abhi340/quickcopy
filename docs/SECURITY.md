# QuickCopy Pro - Security Configuration

## Critical Action Required: Firestore Security Rules

As part of our security audit, we identified a potential <strong>IDOR (Insecure Direct Object Reference)</strong> vulnerability in the standard client-side Firebase setup. 

To prevent malicious users from updating or deleting snippets they do not own, you <strong>must</strong> apply these security rules in your Firebase Console.

### How to apply these rules:
1. Go to your [Firebase Console](https://console.firebase.google.com/).
2. Select your project (`quickcopy-d4d0f`).
3. Click on <strong>Firestore Database</strong> in the left sidebar.
4. Click on <strong>Rules</strong> tab.
5. Replace the existing rules with the following code:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users Collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.uid;
    }

    // Snippets Collection
    match /snippets/{snippetId} {
      // Anyone can read a snippet IF it is marked as public
      // Otherwise, only the owner can read it
      allow read: if (resource.data.isPublic == true) || (request.auth != null && request.auth.uid == resource.data.userId);
      
      // Only authenticated users can create snippets, and they must assign their own ID
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      
      // ONLY the owner of the snippet can update or delete it
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

6. Click <strong>Publish</strong>.

### Why is this necessary?
Without these rules, the backend database blindly trusts the client. A hacker could use the browser console to run `deleteDoc(doc(db, 'snippets', 'SOME_OTHER_USERS_ID'))` and your database would allow it. These rules enforce authorization at the server level, rendering IDOR attacks impossible.
