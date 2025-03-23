// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Try to get booking data from session storage
    const bookingDataStr = sessionStorage.getItem('bookingData');
    
    if (!bookingDataStr) {
        handleNoBookingData();
        return;
    }
    
    try {
        // Parse the booking data
        const bookingData = JSON.parse(bookingDataStr);
        // Populate the confirmation page with booking details
        populatePaymentDetails(bookingData);
        populateBookingItems(bookingData);
        
        // Set up print receipt button
        document.getElementById('print-receipt-btn').addEventListener('click', function() {
            window.print();
        });
        
    } catch (error) {
        console.error('Error processing booking data:', error);
        handleNoBookingData();
    }
});

// Function to handle cases where no booking data is available
function handleNoBookingData() {
    // Display fallback information
    document.getElementById('payment-status').textContent = 'Confirmed';
    document.getElementById('payment-status').classList.add('bg-success');
    document.getElementById('payment-amount').textContent = 'See your email for details';
    document.getElementById('payment-method').textContent = 'Credit Card';
    document.getElementById('payment-id').textContent = 'DEMO-BOOKING';
    document.getElementById('payment-date').textContent = new Date().toLocaleDateString();
    
    // Hide the booking items section or display sample data
    const bookingItemsSection = document.getElementById('booking-items');
    bookingItemsSection.innerHTML = `
        <div class="bg-yellow-50 border border-yellow-100 text-yellow-700 p-4 rounded-md">
            <p class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
                Details about your booking will be sent to your email address.
            </p>
        </div>
    `;
}

// Function to populate payment details
function populatePaymentDetails(bookingData) {
    const payment = bookingData.payment;
    
    // Set payment status with appropriate color
    const statusElement = document.getElementById('payment-status');
    statusElement.textContent = formatPaymentStatus(payment.status);
    setStatusColor(statusElement, payment.status);
    
    // Set other payment details
    document.getElementById('payment-amount').textContent = formatCurrency(payment.amount);
    
    // Format payment method - display card brand and last 4 digits if available
    const cardBrand = payment.card?.brand || 'card';
    const last4 = payment.card?.last4 || '****';
    
    const methodElement = document.getElementById('payment-method');
    methodElement.innerHTML = `
        <span class="mr-2">${getCardIcon(cardBrand)}</span>
        <span>${capitalizeFirstLetter(cardBrand)} •••• ${last4}</span>
    `;
    
    // Set payment ID and date
    document.getElementById('payment-id').textContent = payment.paymentIntentId || 'N/A';
    
    const paymentDate = payment.timestamp ? new Date(payment.timestamp) : new Date();
    document.getElementById('payment-date').textContent = formatDate(paymentDate);
}

// Function to populate booking items
function populateBookingItems(bookingData) {
    const items = bookingData.items;
    const itemListElement = document.getElementById('item-list');
    
    // Clear any existing items
    itemListElement.innerHTML = '';
    
    let subtotal = 0;
    
    // Add each item to the list
    items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${item.name}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${item.quantity}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatCurrency(item.price)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                ${formatCurrency(itemTotal)}
            </td>
        `;
        
        itemListElement.appendChild(row);
    });
    
    // Update totals
    const deliveryFee = bookingData.payment.amount - subtotal;
    
    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('delivery-fee').textContent = formatCurrency(deliveryFee);
    document.getElementById('total').textContent = formatCurrency(bookingData.payment.amount);
}

// Helper functions
function formatCurrency(amount) {
    return '$' + amount.toFixed(2);
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatPaymentStatus(status) {
    switch (status) {
        case 'succeeded':
            return 'Paid';
        case 'processing':
            return 'Processing';
        case 'requires_payment_method':
            return 'Payment Required';
        case 'requires_action':
            return 'Action Required';
        default:
            return capitalizeFirstLetter(status);
    }
}

function setStatusColor(element, status) {
    // Remove any existing background color classes
    element.className = element.className.replace(/bg-\w+-\d+/g, '');
    
    // Add appropriate background color based on status
    switch (status) {
        case 'succeeded':
            element.classList.add('bg-green-500');
            break;
        case 'processing':
            element.classList.add('bg-blue-500');
            break;
        case 'requires_payment_method':
            element.classList.add('bg-red-500');
            break;
        case 'requires_action':
            element.classList.add('bg-yellow-500');
            break;
        default:
            element.classList.add('bg-gray-500');
    }
}

function getCardIcon(brand) {
    const lowerBrand = brand.toLowerCase();
    
    switch (lowerBrand) {
        case 'visa':
            return '<i class="fab fa-cc-visa text-blue-600"></i>';
        case 'mastercard':
            return '<i class="fab fa-cc-mastercard text-red-600"></i>';
        case 'amex':
            return '<i class="fab fa-cc-amex text-blue-500"></i>';
        case 'discover':
            return '<i class="fab fa-cc-discover text-orange-600"></i>';
        default:
            return '<i class="far fa-credit-card"></i>';
    }
}
