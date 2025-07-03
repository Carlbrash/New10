# WoBeRa - Netlify Deployment Guide

## 🚀 Quick Deploy στο Netlify

### Μέθοδος 1: Drag & Drop (Προτεινόμενο)
1. **Extract** αυτό το ZIP αρχείο
2. **Drag & drop** ολόκληρο τον φάκελο στο Netlify dashboard
3. **Περιμένετε** το build να ολοκληρωθεί
4. **Ενημερώστε** την Backend URL (βλ. παρακάτω)

### Μέθοδος 2: Git Deploy
1. **Upload** τα αρχεία σε GitHub repository
2. **Συνδέστε** το repo με το Netlify
3. **Auto-deploy** κάθε φορά που κάνετε push

## ⚙️ Environment Variables

Στο Netlify Dashboard → Site Settings → Environment Variables, προσθέστε:

```
Key: REACT_APP_BACKEND_URL
Value: https://your-backend-api-url.com
```

**Σημαντικό:** Αλλάξτε το `https://your-backend-api-url.com` με το πραγματικό URL του backend σας.

## 🏗️ Build Settings

Το Netlify θα χρησιμοποιήσει αυτόματα:
- **Build command:** `npm install && npm run build`
- **Publish directory:** `build`
- **Node version:** 18

## 🎯 Τι περιλαμβάνει

✅ **WoBeRa Frontend** - Πλήρης React application
✅ **Luxury Design** - Μαύρο/μπλε θέμα με χρυσές λεπτομέρειες  
✅ **Authentication** - Login/Register system (χρειάζεται backend)
✅ **Rankings** - Παγκόσμιες κατατάξεις
✅ **Competitions** - Διαγωνισμοί ανά περιοχή
✅ **World Map** - Στατιστικά ανά χώρα
✅ **Responsive** - Λειτουργεί σε όλες τις συσκευές

## 🔧 Backend Setup (Προαιρετικό)

Για πλήρη λειτουργικότητα, χρειάζεστε backend:

1. **Deploy το FastAPI backend** σε Heroku/Railway/Render
2. **Ενημερώστε** το `REACT_APP_BACKEND_URL` με το backend URL
3. **Redeploy** το frontend

## 🆘 Troubleshooting

**404 Error:** Βεβαιωθείτε ότι τα αρχεία είναι στο root level του φακέλου
**Build Failed:** Ελέγξτε ότι έχετε όλα τα αρχεία (package.json, src/, public/)
**API Errors:** Βεβαιωθείτε ότι το REACT_APP_BACKEND_URL είναι σωστό

## 📞 Demo Credentials

Όταν θα έχετε backend:
- **Username:** testuser  
- **Password:** test123

---
**WoBeRa (World Betting Rank)** - Luxury Sports Betting Federation Platform