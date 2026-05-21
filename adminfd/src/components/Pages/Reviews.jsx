import React, { useState, useEffect, useCallback } from 'react';
import { 
    Spinner
} from 'react-bootstrap';
import { Search, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import './Review.css';

const API_BASE_URL = 'http://localhost:5000/api/bookings/admin/all';

const dummyReviews = [
    { _id: '1', order: { bookingRef: 'EV2020234' }, user: { name: 'Vijay' }, shop: { center_name: 'Eva Bike shop' }, category: '2 wheeler', createdAt: '2026-03-13T11:00:00', comment: 'Fast & good service', rating: 4 },
    { _id: '2', order: { bookingRef: 'EV2020243' }, user: { name: 'John' }, shop: { center_name: 'Mk car service' }, category: '4 wheeler', createdAt: '2026-02-11T11:30:00', comment: 'Fast & good service', rating: 3 },
    { _id: '3', order: { bookingRef: 'EV2020232' }, user: { name: 'Rohit' }, shop: { center_name: 'Iconic motor shop' }, category: '4 wheeler', createdAt: '2026-04-21T01:00:00', comment: 'Fast & good service', rating: 4 },
    { _id: '4', order: { bookingRef: 'EV2020242' }, user: { name: 'Ravi' }, shop: { center_name: 'Ev Services' }, category: '2 wheeler', createdAt: '2026-01-16T04:00:00', comment: 'Fast & good service', rating: 4 },
    { _id: '5', order: { bookingRef: 'EV2020234' }, user: { name: 'John' }, shop: { center_name: 'Eva Bike shop' }, category: '2 wheeler', createdAt: '2026-03-13T11:00:00', comment: 'Fast & good service', rating: 4 },
    { _id: '6', order: { bookingRef: 'EV2020243' }, user: { name: 'Rohit' }, shop: { center_name: 'Mk car service' }, category: '4 wheeler', createdAt: '2026-02-11T11:30:00', comment: 'Fast & good service', rating: 4 },
    { _id: '7', order: { bookingRef: 'EV2020232' }, user: { name: 'Ravi' }, shop: { center_name: 'Iconic motor shop' }, category: '4 wheeler', createdAt: '2026-04-21T01:00:00', comment: 'Fast & good service', rating: 4 },
    { _id: '8', order: { bookingRef: 'EV2020242' }, user: { name: 'Vijay' }, shop: { center_name: 'Ev Services' }, category: '2 wheeler', createdAt: '2026-01-16T04:00:00', comment: 'Fast & good service', rating: 4 },
];

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [fetchError, setFetchError] = useState(null);
    const [rowsPerPage, setRowsPerPage] = useState(8);
    const [totalReviews, setTotalReviews] = useState(0);

    // Fetch Reviews from Backend
    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.get(API_BASE_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success && response.data.data) {
                // Filter only bookings that have a review
                const bookingsWithReviews = response.data.data.filter(b => b.review && b.review.rating);
                
                // Format data for the table
                const formattedReviews = bookingsWithReviews.map(b => ({
                    _id: b._id,
                    order: { bookingRef: b.bookingRef },
                    user: { name: b.user?.name || b.userDetails?.name || 'Unknown' },
                    shop: { center_name: b.center?.shopName || b.vendorDetails?.shopName || b.vendorDetails?.vendorName || 'Unknown' },
                    category: b.vehicleDetails?.vehicle_category || b.vehicle?.vehicle_category || '2 wheeler',
                    createdAt: b.review.createdAt,
                    comment: b.review.comment || '',
                    rating: b.review.rating
                }));

                // Apply search
                const filteredReviews = searchTerm ? formattedReviews.filter(r => 
                    r.order.bookingRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.shop.center_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.comment.toLowerCase().includes(searchTerm.toLowerCase())
                ) : formattedReviews;

                // Apply pagination
                const startIdx = (currentPage - 1) * rowsPerPage;
                const endIdx = currentPage * rowsPerPage;
                
                setReviews(filteredReviews.slice(startIdx, endIdx));
                setTotalReviews(filteredReviews.length);
                setFetchError(null);
            } else {
                // If no data, use dummy data
                setReviews(dummyReviews);
                setTotalReviews(dummyReviews.length);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            // Fallback to dummy data on error too
            setReviews(dummyReviews);
            setTotalReviews(dummyReviews.length);
            // setFetchError(`Request failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, currentPage, rowsPerPage]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    // Handle Rating Stars
    const renderStars = (rating) => {
        return (
            <div className="rating-stars">
                {[...Array(5)].map((_, i) => (
                    <Star 
                        key={i} 
                        size={16} 
                        className={i < rating ? "star-filled" : "star-empty"} 
                        fill={i < rating ? "#FFD700" : "none"}
                    />
                ))}
            </div>
        );
    };

    const totalPages = Math.ceil(totalReviews / rowsPerPage);
    const startRow = (currentPage - 1) * rowsPerPage + 1;
    const endRow = Math.min(currentPage * rowsPerPage, totalReviews);

    return (
        <div className="reviews-page-container">
            {/* Search Row */}
            <div className="search-row mb-4">
                <div className="search-input-group">
                    <Search size={18} color="#888" />
                    <input 
                        type="text" 
                        placeholder="Search" 
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            </div>

            {fetchError && (
                <div className="text-danger small mb-3">⚠️ {fetchError}</div>
            )}

            {/* Main Table */}
            <div className="reviews-table-container">
                <table className="custom-reviews-table">
                    <thead>
                        <tr>
                            <th>Booking Id</th>
                            <th>Reviewer Name</th>
                            <th>Vendor</th>
                            <th>Category</th>
                            <th>Review Date & Time</th>
                            <th>Review</th>
                            <th>Ratings</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="text-center py-5">
                                    <Spinner animation="border" variant="warning" />
                                </td>
                            </tr>
                        ) : reviews.length > 0 ? (
                            reviews.map((review) => (
                                <tr key={review._id}>
                                    <td className="td-booking-id">{review.order?.bookingRef || "N/A"}</td>
                                    <td>{review.user?.name || "N/A"}</td>
                                    <td>{review.shop?.center_name || "N/A"}</td>
                                    <td>{review.category || "2 wheeler"}</td>
                                    <td>{new Date(review.createdAt).toLocaleString()}</td>
                                    <td>
                                        <div className="review-text-cell" title={review.comment}>
                                            {review.comment}
                                        </div>
                                    </td>
                                    <td>{renderStars(review.rating)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="text-center py-5 text-muted">No reviews found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer and Pagination */}
            <div className="table-footer">
                <div className="rows-per-page">
                    Show rows per page 
                    <select value={rowsPerPage} onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                    }}>
                        <option value={8}>8</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                    </select>
                </div>
                <div className="pagination-controls">
                    <div className="pagi-numbers">
                        {totalReviews > 0 ? `${startRow}-${endRow} of ${totalReviews}` : "0-0 of 0"}
                    </div>
                    <div className="pagi-arrows">
                        <button 
                            className="pagi-arrow" 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button 
                            className="pagi-arrow"
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reviews;
