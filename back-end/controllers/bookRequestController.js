import BookRequestModel from '../models/bookRequestModel.js';
import BookModel from '../models/bookModel.js';
import UserModel from '../models/userModel.js';

// POST: Add or update a book request
export const addBookRequest = async (req, res) => {
  try {
    let { title, author, isbn } = req.body;
    const userId = req.userId; // Provided by auth middleware
    
    if (!title || !author) {
      return res.status(400).json({ success: false, message: 'Title and author are required.' });
    }

    // Get user details from database
    const user = await UserModel.findById(userId).select('srn');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const srn = user.srn;
    // Normalize for lookup
    title = title.trim().toLowerCase();
    author = author.trim().toLowerCase();

    // Try to find a matching book (by ISBN if provided, else by title/author)
    let matchedBook = null;
    if (isbn) {
      matchedBook = await BookModel.findOne({ isbn });
    }
    if (!matchedBook) {
      matchedBook = await BookModel.findOne({
        title: { $regex: new RegExp(`^${title}$`, 'i') },
        author: { $regex: new RegExp(`^${author}$`, 'i') }
      });
    }
    // Check if request for this book already exists
    let request = await BookRequestModel.findOne({ title, author });
    if (request) {
      // If user already requested, don't increment count
      let updated = false;
      if (!request.requestedBy.includes(srn)) {
        request.count += 1;
        request.requestedBy.push(srn);
        updated = true;
      }
      // Patch missing isbn/image if found
      if (matchedBook) {
        if (!request.isbn && matchedBook.isbn) { request.isbn = matchedBook.isbn; updated = true; }
        if (!request.image && matchedBook.image) { request.image = matchedBook.image; updated = true; }
      }
      if (updated) await request.save();
    } else {
      request = new BookRequestModel({
        title,
        author,
        isbn: matchedBook ? matchedBook.isbn : isbn || '',
        image: matchedBook ? matchedBook.image : '',
        requestedBy: [srn],
        count: 1
      });
      await request.save();
    }
    return res.status(201).json({ success: true, request });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// DELETE: Remove all book requests
export const deleteAllBookRequests = async (req, res) => {
  try {
    await BookRequestModel.deleteMany({});
    return res.status(200).json({ success: true, message: 'All book requests deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET: List all book requests, sorted by count desc, enriched with image and branch
export const listBookRequests = async (req, res) => {
  try {
    const requests = await BookRequestModel.find().sort({ count: -1, updatedAt: -1 });
    // Enrich with image and branch if book exists, and filter out deleted books
    const enriched = [];
    
    for (const req of requests) {
      // Try to find book with case-insensitive matching
      const book = await BookModel.findOne({
        title: { $regex: new RegExp(`^${req.title}$`, 'i') },
        author: { $regex: new RegExp(`^${req.author}$`, 'i') }
      });

      if (book) {
        enriched.push({
          _id: req._id,
          title: book.title, // Use the actual book title with proper case
          author: book.author, // Use the actual book author with proper case
          count: req.count,
          image: book.image || '',
          branch: book.branch || [],
        });
      } else {
        // Book not found in collection, still include the request
        enriched.push({
          _id: req._id,
          title: req.title, // Use the requested title
          author: req.author, // Use the requested author
          count: req.count,
          image: '',
          branch: [],
        });
      }
    }
    
    return res.status(200).json({ success: true, requests: enriched });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}; 