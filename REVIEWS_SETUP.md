# Reviews & Ratings System - Setup Guide

## Database Table Setup

To use the Reviews & Ratings system, you need to create a `reviews` table in your Supabase database.

### SQL Script to Create the Table

```sql
-- Create reviews table
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL,
    member_email TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_reviews_book_id ON reviews(book_id);
CREATE INDEX idx_reviews_member_email ON reviews(member_email);

-- Enable Row Level Security (RLS)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read reviews
CREATE POLICY "Anyone can view reviews"
ON reviews FOR SELECT
USING (true);

-- Policy: Authenticated users can insert reviews
CREATE POLICY "Authenticated users can insert reviews"
ON reviews FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own reviews
CREATE POLICY "Users can update own reviews"
ON reviews FOR UPDATE
USING (member_email = auth.jwt() ->> 'email');

-- Policy: Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
ON reviews FOR DELETE
USING (member_email = auth.jwt() ->> 'email');
```

## Features Implemented

### 1. HTML Structure ✅
- **Reviews Section**: Added `<section id="reviews-section">` below book details
- **Summary Card**: Displays average rating (X.X/5) and total reviews count
- **Reviews List**: Container `#reviews-container` for dynamic review injection
- **Add Review Form**: 
  - Star rating input (5 interactive stars)
  - Textarea for comments
  - Hidden for non-logged-in users

### 2. SASS Styling ✅
- **Modern Review Cards**: 
  - Rounded corners with soft shadow
  - User avatar placeholder (Bootstrap Icon)
  - Yellow stars (#ffc107) for ratings
  - Gray color for dates
  - Hover effects with transform
- **Responsive Design**: Mobile-friendly adjustments
- **Clean Form**: Well-styled input controls with focus effects
- **Summary Card**: Eye-catching display with large rating number

### 3. JavaScript Logic ✅
- **Fetch Reviews**: `loadReviews()` function queries Supabase for book reviews
- **Calculate Average**: Dynamic calculation and display in summary card
- **Render Reviews**: Each review card shows:
  - User email
  - Star rating
  - Comment text
  - Formatted date
- **Empty State**: "No reviews yet" message when list is empty
- **Form Submission**: 
  - Validates rating and comment
  - Inserts to Supabase with `book_id`, `member_email`, `rating`, `comment`
  - Auto-refreshes list after submission
  - No page reload needed
- **Interactive Stars**: 
  - Click to select rating
  - Hover preview
  - Visual feedback

## How It Works

### For Visitors (Not Logged In)
- Can view all reviews and ratings
- See average rating and total count
- Cannot add reviews (form is hidden)

### For Logged-In Members
- Can view all reviews
- Can add their own reviews with star rating and comment
- Form validates input before submission
- Reviews appear instantly after submission

## Usage

1. **Navigate to Book Details Page**: Click on any book in the library
2. **Scroll to Reviews Section**: Located below the book details
3. **View Reviews**: See all existing reviews and the average rating
4. **Add Review** (if logged in):
   - Click stars to select rating (1-5)
   - Write your comment
   - Click "إرسال التقييم" (Submit Review)
   - Review appears immediately in the list

## Technical Stack
- **Frontend**: HTML5, SASS/SCSS, Vanilla JavaScript
- **Backend**: Supabase (PostgreSQL)
- **Styling**: Bootstrap Icons, Custom SASS Mixins
- **Validation**: SweetAlert2 for user-friendly alerts

## File Modifications

### Modified Files:
1. **[src/js/pages/bookDetails.js](src/js/pages/bookDetails.js)**: Added reviews HTML structure and all JavaScript logic
2. **[src/scss/main.scss](src/scss/main.scss)**: Added comprehensive styling for reviews section

### Functions Added:
- `loadReviews(bookId)`: Fetch and display reviews
- `updateAverageStars(rating)`: Update summary card stars
- `renderReviews(reviews)`: Render review cards
- `generateStars(rating)`: Generate star HTML
- `displayNoReviews()`: Show empty state
- `setupReviewFormListeners(bookId, currentUser)`: Handle form interactions

## Next Steps

1. **Create the database table** using the SQL script above
2. **Test the system** by:
   - Viewing reviews as a guest
   - Logging in and adding a review
   - Verifying the average rating updates
3. **Optional Enhancements**:
   - Add edit/delete functionality for own reviews
   - Add pagination for many reviews
   - Add sorting options (newest, highest rated, etc.)
   - Add reply functionality
   - Add helpful/unhelpful voting

## Troubleshooting

### Reviews Not Loading
- Check browser console for errors
- Verify Supabase credentials in `.env`
- Ensure `reviews` table exists in database
- Check RLS policies are set correctly

### Cannot Submit Review
- Ensure user is logged in
- Check that `currentUser.email` is available
- Verify insert policy allows authenticated users
- Check console for error messages

### Styling Issues
- Ensure SASS is compiling correctly
- Check that `main.scss` is imported in your app
- Clear browser cache

## Support

For issues or questions, check:
- Browser console for JavaScript errors
- Supabase dashboard for database errors
- Network tab for API call failures
