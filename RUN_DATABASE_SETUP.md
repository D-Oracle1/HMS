# 🚀 ONE-COMMAND DATABASE SETUP

Choose the easiest method for you:

---

## ⚡ Method 1: One Command (Recommended)

**If you have `psql` installed:**

```bash
PGPASSWORD=VicsonDigitals psql -h db.mnjqupwgvxvckouhzqhw.supabase.co -U postgres -d postgres -p 5432 -f database-setup.sql
```

**If you don't have `psql`:**

Install it first:
- **Mac:** `brew install postgresql`
- **Ubuntu/Debian:** `sudo apt install postgresql-client`
- **Windows:** Download from https://www.postgresql.org/download/windows/

Then run the command above.

---

## 📝 Method 2: Node.js Script

```bash
node setup-database.js
```

This automatically runs the SQL file for you.

---

## 🌐 Method 3: Supabase Web Interface (Easiest - No Install)

1. **Go to:** https://supabase.com/dashboard/project/mnjqupwgvxvckouhzqhw/sql/new

2. **Open `database-setup.sql` in your code editor**

3. **Copy ALL the content** (Ctrl+A, Ctrl+C)

4. **Paste into Supabase SQL Editor**

5. **Click "Run"** or press Ctrl+Enter

6. **Done!** You'll see success messages and record counts.

---

## ✅ After Running (Any Method)

Your database will have:

- ✅ **5 Tables:** Tenant, Hotel, Room, User, Booking
- ✅ **1 Demo Tenant:** "Demo Hotel Group"
- ✅ **1 Demo Hotel:** "Demo Grand Hotel" in Lagos
- ✅ **6 Rooms:** $100-$450/night
- ✅ **5 Users:**
  - `superadmin@hms.com` (password: demo123)
  - `admin@demo.com` (password: demo123)
  - `user@demo.com` (password: demo123)
- ✅ **3 Sample Bookings**

---

## 🔍 Verify Setup

Check your Supabase dashboard:
👉 https://supabase.com/dashboard/project/mnjqupwgvxvckouhzqhw/editor

You should see all 5 tables in the left sidebar.

---

## 🆘 Troubleshooting

**Error: "relation already exists"**
- Tables already exist! You're good to go.
- If you want a fresh start, the SQL script drops existing tables first.

**Error: "permission denied"**
- Check your database password is correct: `VicsonDigitals`

**Connection timeout**
- Check Supabase project is active
- Try Method 3 (web interface)

---

**Pick whichever method is easiest for you!** 🎉

I recommend **Method 3** if you want the simplest approach (no installation needed).
