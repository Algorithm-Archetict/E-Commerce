const API_URL = 'http://localhost:3000';

export async function submitReview(review) {
    try {
        const response = await fetch(`${API_URL}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(review)
        });
        if (!response.ok) throw new Error('Failed to submit review');
        alert('Review submitted!');
    } catch (error) {
        console.error('Submit review error:', error);
        alert('Failed to submit review');
    }
}