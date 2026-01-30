# Add Book Functionality - Setup Guide

## Overview
Complete implementation of the "Add New Book" functionality with Supabase Storage integration and admin-only access control.

## Features Implemented ✅

### 1. Admin-Only Access Control
- **Security Check**: Page is only accessible to users with `role: 'admin'`
- Non-admin users are redirected to homepage with error message
- "Add Book" navigation link only appears for admin users
- Automatic redirect if user is not logged in

### 2. HTML Form ([src/js/pages/addBook.js](src/js/pages/addBook.js))
Complete form with the following fields:
- **Title** (required) - Text input for book title
- **Author** (required) - Text input for author name
- **Category** (required) - Dropdown with predefined categories:
  - أدب (Literature)
  - تاريخ (History)
  - فلسفة (Philosophy)
  - علوم (Science)
  - دين (Religion)
  - سيرة (Biography)
  - شعر (Poetry)
  - أخرى (Other)
- **Description** (required) - Textarea for book description
- **Status** (required) - Book status:
  - upcoming (قادم)
  - current (قيد القراءة)
  - read (مقروء)
- **Cover Image** (optional) - File upload with preview

### 3. Supabase Storage Integration
**Image Upload Process:**
1. User selects image file (JPG, PNG, GIF)
2. Image is validated (max 2MB size)
3. Preview is shown before upload
4. On form submit, image is uploaded to `covers` bucket
5. Public URL is retrieved from Supabase Storage
6. URL is saved with book data in database

**Fallback:**
- If no image is selected, uses default placeholder
- If upload fails, uses placeholder and continues

### 4. Database Integration
**Books Table Insert:**
```javascript
{
    title: string,
    author: string,
    category: string,
    description: string,
    status: string,
    cover_url: string
}
```

### 5. User Experience
- Real-time image preview
- File size validation (2MB max)
- Form validation for required fields
- Loading spinner during upload
- Success message with redirect
- Error handling with user-friendly messages

## Database Requirements

### Books Table Schema
```sql
CREATE TABLE books (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT,
    category TEXT,
    description TEXT,
    status TEXT DEFAULT 'upcoming',
    cover_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Supabase Storage Bucket Setup

1. **Create Storage Bucket:**
```sql
-- Create the 'covers' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true);
```

2. **Set Storage Policies:**
```sql
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'covers');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'covers' 
    AND auth.role() = 'authenticated'
);

-- Allow users to update their own uploads
CREATE POLICY "Users can update own uploads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'covers');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'covers');
```

## File Modifications

### New Files Created:
1. **[src/js/pages/addBook.js](src/js/pages/addBook.js)** - Complete Add Book page component

### Modified Files:
1. **[src/js/app.js](src/js/app.js)**:
   - Added `renderAddBookPage` import
   - Registered `/add-book` route
   - Added `updateAdminNavigation()` function
   - Updated `updateAuthUI()` to show/hide admin links

2. **[src/scss/main.scss](src/scss/main.scss)**:
   - Added comprehensive styling for `.add-book-page`
   - Styled form inputs, file upload, and image preview
   - Added responsive design for mobile devices

## Usage Instructions

### For Admin Users:

1. **Login** with an admin account (role: 'admin')
2. **Navigate** to the "إضافة كتاب" (Add Book) link in the navbar
3. **Fill the form**:
   - Enter book title, author, category, and description
   - Select book status
   - Optionally upload a cover image
4. **Submit** the form
5. **Success** - Book is added and you're redirected to the library

### Navigation
The "Add Book" link appears in the navbar between "Library" and "Admin Panel" for admin users only.

## Security Features

### Access Control
- ✅ Page-level authentication check
- ✅ Role-based authorization (admin only)
- ✅ Automatic redirect for unauthorized access
- ✅ Navigation link visibility control

### Data Validation
- ✅ Required field validation
- ✅ File type validation (images only)
- ✅ File size validation (2MB max)
- ✅ Form data sanitization

### Error Handling
- ✅ Upload error fallback
- ✅ Database error handling
- ✅ User-friendly error messages
- ✅ Console logging for debugging

## Testing Checklist

### Before Testing:
- [ ] Create `covers` bucket in Supabase Storage
- [ ] Set up storage policies (see above)
- [ ] Ensure `books` table exists with correct schema
- [ ] Have an admin user account ready

### Test Cases:
1. **Access Control**
   - [ ] Non-logged-in user cannot access page
   - [ ] Non-admin user cannot access page
   - [ ] Admin user can access page
   - [ ] Navigation link only visible to admin

2. **Form Validation**
   - [ ] Submit with empty fields shows error
   - [ ] File size over 2MB shows warning
   - [ ] Non-image files are rejected

3. **Image Upload**
   - [ ] Image preview works correctly
   - [ ] Image uploads to Supabase Storage
   - [ ] Public URL is generated correctly
   - [ ] Remove image button works

4. **Book Creation**
   - [ ] Book with image is created successfully
   - [ ] Book without image uses placeholder
   - [ ] All form data is saved correctly
   - [ ] Success message appears
   - [ ] Redirects to library page

5. **Error Handling**
   - [ ] Upload failure uses placeholder
   - [ ] Database error shows message
   - [ ] Network error is handled gracefully

## Troubleshooting

### Issue: "Cannot access this page"
- **Solution**: Ensure you're logged in with an admin account

### Issue: Image upload fails
- **Solution**: 
  - Check Supabase Storage bucket exists
  - Verify storage policies are set
  - Check console for specific error
  - Verify file size is under 2MB

### Issue: Book not appearing in library
- **Solution**:
  - Check console for database errors
  - Verify `books` table schema
  - Refresh the page after adding book
  - Check Supabase dashboard for new entry

### Issue: Navigation link not appearing
- **Solution**:
  - Verify user role is 'admin' in database
  - Check localStorage for correct user data
  - Try logging out and back in
  - Clear browser cache

## Next Steps & Enhancements

### Possible Improvements:
1. **Image Editor**: Add crop/resize functionality before upload
2. **Multiple Images**: Allow multiple cover images or gallery
3. **Bulk Import**: CSV/JSON import for multiple books
4. **Preview Mode**: Preview how book will look before saving
5. **Edit Book**: Add functionality to edit existing books
6. **Delete Book**: Add ability to delete books
7. **Image Optimization**: Compress images before upload
8. **Drag & Drop**: Enhanced drag-and-drop file upload
9. **ISBN Lookup**: Auto-fill book data using ISBN API
10. **Tags System**: Add tags/keywords for better organization

## API Reference

### Functions in addBook.js

#### `renderAddBookPage(currentUser)`
Main render function that creates the Add Book page.
- **Parameters**: `currentUser` - Current logged-in user object
- **Returns**: void
- **Security**: Checks admin role before rendering

#### `uploadCoverImage(file)`
Uploads cover image to Supabase Storage.
- **Parameters**: `file` - File object from input
- **Returns**: Promise<string> - Public URL of uploaded image
- **Throws**: Returns placeholder URL on error

#### `handleFormSubmit()`
Handles form submission and book creation.
- **Validates**: All required fields
- **Uploads**: Cover image if provided
- **Inserts**: Book data into database
- **Redirects**: To library on success

## Support

For issues or questions:
- Check browser console for errors
- Verify Supabase configuration in `.env`
- Check Supabase dashboard for Storage and Database status
- Review this documentation for setup steps
