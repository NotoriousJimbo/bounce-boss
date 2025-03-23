// Admin dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin/login.html';
        return;
    }

    // Initialize dashboard
    initDashboard();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadBookings();
    loadProducts();
});

// Dashboard state management
const dashboardState = {
    bookings: {
        data: [],
        filteredData: [],
        currentPage: 1,
        itemsPerPage: 10,
        filters: {
            status: '',
            startDate: '',
            endDate: '',
            search: ''
        },
        sort: {
            field: 'event_date',
            direction: 'desc'
        }
    }
};

// Initialize dashboard UI
function initDashboard() {
    // Set default dates for date filters
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    
    // Format dates for input elements (YYYY-MM-DD)
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    // Default start date to one month ago
    document.getElementById('start-date').value = formatDate(oneMonthAgo);
    
    // Default end date to today
    document.getElementById('end-date').value = formatDate(today);
    
    // Store default date values in state
    dashboardState.bookings.filters.startDate = formatDate(oneMonthAgo);
    dashboardState.bookings.filters.endDate = formatDate(today);
}

// Set up event listeners for filtering, sorting, and pagination
function setupEventListeners() {
    // Filter form submission
    document.getElementById('filter-form').addEventListener('submit', (event) => {
        event.preventDefault();
        applyFilters();
    });
    
    // Reset filters button
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
    
    // Sortable columns
    document.querySelectorAll('[data-sort]').forEach(element => {
        element.addEventListener('click', () => {
            const field = element.getAttribute('data-sort');
            sortBookings(field);
        });
    });
    
    // Pagination controls
    document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
    document.getElementById('next-page').addEventListener('click', () => changePage(1));
    document.getElementById('mobile-prev-page').addEventListener('click', () => changePage(-1));
    document.getElementById('mobile-next-page').addEventListener('click', () => changePage(1));
}

// Load all bookings
async function loadBookings() {
    try {
        showLoadingIndicator(true);
        
        // Get filter values
        const status = document.getElementById('status-filter').value;
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        
        // Build query parameters
        let queryParams = new URLSearchParams();
        if (status) queryParams.append('status', status);
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        
        const response = await fetch(`/api/bookings?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch bookings');
        }

        const result = await response.json();
        const bookings = result.data || [];
        
        // Store in dashboard state
        dashboardState.bookings.data = bookings;
        dashboardState.bookings.filteredData = [...bookings];
        
        // Update dashboard metrics
        updateDashboardMetrics(bookings);
        
        // Apply any existing filters
        applyFilters();
        
        // Apply current sort
        applySorting();
        
        // Reset to first page
        dashboardState.bookings.currentPage = 1;
        
        // Update display
        renderBookings();
        
    } catch (error) {
        console.error('Error loading bookings:', error);
        showError('Failed to load bookings');
        showLoadingIndicator(false);
        showNoResults(true);
    }
}

// Update dashboard metrics
function updateDashboardMetrics(bookings) {
    // Update total bookings count
    document.getElementById('total-bookings').textContent = bookings.length;
    
    // Count bookings by status
    const confirmedCount = bookings.filter(b => b.booking_status === 'confirmed').length;
    const pendingCount = bookings.filter(b => b.booking_status === 'pending').length;
    
    // Update status counts
    document.getElementById('confirmed-bookings').textContent = confirmedCount;
    document.getElementById('pending-bookings').textContent = pendingCount;
    
    // Count bookings for current month
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const thisMonthBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.event_date);
        return bookingDate.getMonth() === currentMonth && 
               bookingDate.getFullYear() === currentYear;
    }).length;
    
    document.getElementById('month-bookings').textContent = thisMonthBookings;
}

// Show or hide loading indicator
function showLoadingIndicator(show) {
    const indicator = document.getElementById('loading-indicator');
    if (show) {
        indicator.classList.remove('hidden');
    } else {
        indicator.classList.add('hidden');
    }
}

// Show or hide no results message
function showNoResults(show) {
    const noResults = document.getElementById('no-results');
    if (show) {
        noResults.classList.remove('hidden');
    } else {
        noResults.classList.add('hidden');
    }
}

// Apply filters to bookings
function applyFilters() {
    // Get filter values
    const status = document.getElementById('status-filter').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const searchQuery = document.getElementById('search-query').value.toLowerCase();
    
    // Save filters in state
    dashboardState.bookings.filters = {
        status,
        startDate,
        endDate,
        search: searchQuery
    };
    
    // Apply filters to data
    let filtered = [...dashboardState.bookings.data];
    
    // Filter by status
    if (status) {
        filtered = filtered.filter(booking => booking.booking_status === status);
    }
    
    // Filter by date range
    if (startDate) {
        filtered = filtered.filter(booking => new Date(booking.event_date) >= new Date(startDate));
    }
    
    if (endDate) {
        filtered = filtered.filter(booking => new Date(booking.event_date) <= new Date(endDate));
    }
    
    // Filter by search query
    if (searchQuery) {
        filtered = filtered.filter(booking => {
            const fullName = `${booking.customer_first_name} ${booking.customer_last_name}`.toLowerCase();
            const email = (booking.customer_email || '').toLowerCase();
            const location = (booking.event_address || '').toLowerCase();
            
            return fullName.includes(searchQuery) || 
                   email.includes(searchQuery) || 
                   location.includes(searchQuery);
        });
    }
    
    // Update filtered data
    dashboardState.bookings.filteredData = filtered;
    
    // Reset to first page
    dashboardState.bookings.currentPage = 1;
    
    // Render bookings with new filters
    renderBookings();
}

// Reset all filters to default
function resetFilters() {
    // Reset form inputs
    document.getElementById('status-filter').value = '';
    
    // Set default date range (last month to today)
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    document.getElementById('start-date').value = formatDate(oneMonthAgo);
    document.getElementById('end-date').value = formatDate(today);
    document.getElementById('search-query').value = '';
    
    // Reset filters in state
    dashboardState.bookings.filters = {
        status: '',
        startDate: formatDate(oneMonthAgo),
        endDate: formatDate(today),
        search: ''
    };
    
    // Reset filtered data to all data
    dashboardState.bookings.filteredData = [...dashboardState.bookings.data];
    
    // Reset to first page
    dashboardState.bookings.currentPage = 1;
    
    // Apply sorting
    applySorting();
    
    // Render bookings
    renderBookings();
}

// Sort bookings by field
function sortBookings(field) {
    // Toggle direction if sorting by same field
    if (dashboardState.bookings.sort.field === field) {
        dashboardState.bookings.sort.direction = 
            dashboardState.bookings.sort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        // Default to ascending for new field
        dashboardState.bookings.sort.field = field;
        dashboardState.bookings.sort.direction = 'asc';
    }
    
    // Apply the sorting
    applySorting();
    
    // Update UI to show sort direction
    updateSortIndicators();
    
    // Re-render with new sort
    renderBookings();
}

// Apply current sort settings to filtered data
function applySorting() {
    const { field, direction } = dashboardState.bookings.sort;
    
    dashboardState.bookings.filteredData.sort((a, b) => {
        let valueA, valueB;
        
        // Handle different field types
        if (field === 'customer_name') {
            valueA = `${a.customer_first_name} ${a.customer_last_name}`.toLowerCase();
            valueB = `${b.customer_first_name} ${b.customer_last_name}`.toLowerCase();
        } else if (field === 'event_date') {
            valueA = new Date(a.event_date);
            valueB = new Date(b.event_date);
        } else if (field === 'total_amount') {
            valueA = parseFloat(a.total || 0);
            valueB = parseFloat(b.total || 0);
        } else if (field === 'status') {
            valueA = a.booking_status || '';
            valueB = b.booking_status || '';
        } else {
            valueA = a[field] || '';
            valueB = b[field] || '';
        }
        
        // Compare based on direction
        if (direction === 'asc') {
            if (valueA < valueB) return -1;
            if (valueA > valueB) return 1;
            return 0;
        } else {
            if (valueA > valueB) return -1;
            if (valueA < valueB) return 1;
            return 0;
        }
    });
}

// Update sort indicators in the UI
function updateSortIndicators() {
    // Reset all indicators
    document.querySelectorAll('.sort-icon').forEach(icon => {
        icon.textContent = '↕';
    });
    
    // Update active indicator
    const { field, direction } = dashboardState.bookings.sort;
    const activeHeader = document.querySelector(`[data-sort="${field}"]`);
    
    if (activeHeader) {
        const icon = activeHeader.querySelector('.sort-icon');
        icon.textContent = direction === 'asc' ? '↑' : '↓';
    }
}

// Change the current page
function changePage(delta) {
    const currentPage = dashboardState.bookings.currentPage;
    const totalPages = getTotalPages();
    
    const newPage = currentPage + delta;
    
    // Ensure page is in valid range
    if (newPage >= 1 && newPage <= totalPages) {
        dashboardState.bookings.currentPage = newPage;
        renderBookings();
    }
}

// Get total number of pages
function getTotalPages() {
    const totalItems = dashboardState.bookings.filteredData.length;
    const itemsPerPage = dashboardState.bookings.itemsPerPage;
    return Math.max(1, Math.ceil(totalItems / itemsPerPage));
}

// Render pagination UI
function renderPagination() {
    const currentPage = dashboardState.bookings.currentPage;
    const totalPages = getTotalPages();
    const totalItems = dashboardState.bookings.filteredData.length;
    const itemsPerPage = dashboardState.bookings.itemsPerPage;
    
    // Enable/disable pagination buttons
    document.getElementById('prev-page').disabled = currentPage <= 1;
    document.getElementById('next-page').disabled = currentPage >= totalPages;
    document.getElementById('mobile-prev-page').disabled = currentPage <= 1;
    document.getElementById('mobile-next-page').disabled = currentPage >= totalPages;
    
    // Update pagination info text
    const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);
    
    document.getElementById('showing-start').textContent = start;
    document.getElementById('showing-end').textContent = end;
    document.getElementById('total-results').textContent = totalItems;
    
    // Render page numbers
    const paginationNumbers = document.getElementById('pagination-numbers');
    paginationNumbers.innerHTML = '';
    
    // Determine range of pages to show
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Adjust if we're near the end
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = i === currentPage
            ? 'relative z-10 inline-flex items-center bg-primary text-white px-4 py-2 text-sm font-semibold'
            : 'relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0';
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            dashboardState.bookings.currentPage = i;
            renderBookings();
        });
        paginationNumbers.appendChild(pageBtn);
    }
}

// Render bookings based on current state
function renderBookings() {
    const { filteredData, currentPage, itemsPerPage } = dashboardState.bookings;
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    // Get table body
    const tbody = document.querySelector('#bookings-table tbody');
    
    // Hide loading indicator
    showLoadingIndicator(false);
    
    // Show/hide no results message
    if (filteredData.length === 0) {
        showNoResults(true);
        tbody.innerHTML = ''; // Clear any existing rows
    } else {
        showNoResults(false);
        
        // Clear existing rows except for our special rows
        const specialRows = Array.from(tbody.querySelectorAll('#loading-indicator, #no-results'));
        tbody.innerHTML = '';
        specialRows.forEach(row => tbody.appendChild(row));
        
        // Add booking rows
        paginatedData.forEach(booking => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            // Format name
            const fullName = `${booking.customer_first_name} ${booking.customer_last_name}`;
            
            // Format date
            const eventDate = new Date(booking.event_date);
            const formattedDate = eventDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            // Format time
            const startTime = booking.event_start_time || '';
            const endTime = booking.event_end_time || '';
            const timeDisplay = startTime && endTime ? `${startTime} - ${endTime}` : '';
            
            // Format location
            const location = booking.event_address || '';
            
            // Format amount
            const amount = parseFloat(booking.total || 0).toFixed(2);
            
            // Get status badge class
            let statusClass = '';
            switch (booking.booking_status) {
                case 'confirmed':
                    statusClass = 'bg-green-100 text-green-800';
                    break;
                case 'pending':
                    statusClass = 'bg-blue-100 text-blue-800';
                    break;
                case 'cancelled':
                    statusClass = 'bg-red-100 text-red-800';
                    break;
                case 'completed':
                    statusClass = 'bg-purple-100 text-purple-800';
                    break;
                default:
                    statusClass = 'bg-gray-100 text-gray-800';
            }
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div>
                            <div class="text-sm font-medium text-gray-900">${fullName}</div>
                            <div class="text-sm text-gray-500">${booking.customer_email || ''}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${formattedDate}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${timeDisplay}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900 max-w-xs truncate">${location}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">$${amount}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                        ${booking.booking_status || 'Unknown'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-primary hover:text-primary-dark mr-2" onclick="viewBooking(${booking.id})">View</button>
                    <button class="text-secondary hover:text-secondary-dark" onclick="updateBookingStatus(${booking.id})">Update</button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    // Update pagination UI
    renderPagination();
}

// Load all products
async function loadProducts() {
    try {
        const response = await fetch('/api/products', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }

        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Failed to load products');
    }
}

// Display products in the table
function displayProducts(products) {
    const tbody = document.querySelector('#products-table tbody');
    tbody.innerHTML = '';

    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>$${product.price}</td>
            <td>${product.is_active ? 'Active' : 'Inactive'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editProduct(${product.id})">Edit</button>
                <button class="btn btn-sm btn-secondary" onclick="toggleProductStatus(${product.id})">
                    ${product.is_active ? 'Deactivate' : 'Activate'}
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// View booking details
async function viewBooking(id) {
    try {
        const response = await fetch(`/api/bookings/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch booking details');
        }

        const result = await response.json();
        const booking = result.data || {};
        
        showBookingDetailModal(booking);
        
        // Set up tabs event listeners
        setupBookingDetailsTabs();
    } catch (error) {
        console.error('Error viewing booking:', error);
        showError('Failed to load booking details');
    }
}

// Calculate duration in hours from start and end time
function calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return 'N/A';
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startDate = new Date(2000, 0, 1, startHour, startMinute);
    const endDate = new Date(2000, 0, 1, endHour, endMinute);
    
    // If end time is earlier than start time, assume it's the next day
    let timeDiff = endDate - startDate;
    if (timeDiff < 0) {
        endDate.setDate(endDate.getDate() + 1);
        timeDiff = endDate - startDate;
    }
    
    // Convert milliseconds to hours
    const hours = timeDiff / (1000 * 60 * 60);
    
    return hours.toFixed(1);
}

// Set up event listeners for booking modal tabs
function setupBookingDetailsTabs() {
    document.querySelectorAll('.booking-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get the tab name from data attribute
            const tabName = tab.getAttribute('data-tab');
            
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            
            // Show the selected tab content
            document.getElementById(`${tabName}-tab`).classList.remove('hidden');
            
            // Update tab styling
            document.querySelectorAll('.booking-tab').forEach(t => {
                t.classList.remove('active', 'border-b-2', 'border-primary', 'text-primary');
                t.classList.add('text-gray-500', 'hover:text-gray-700');
            });
            
            tab.classList.add('active', 'border-b-2', 'border-primary', 'text-primary');
            tab.classList.remove('text-gray-500', 'hover:text-gray-700');
        });
    });
}

// Save booking changes
async function saveBookingChanges(event, bookingId) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const bookingData = {};
    
    // Convert form data to JSON
    for (const [key, value] of formData.entries()) {
        bookingData[key] = value;
    }
    
    try {
        const response = await fetch(`/api/bookings/${bookingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(bookingData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update booking');
        }
        
        // Show success message
        showSuccess('Booking updated successfully');
        
        // Close modal
        closeModal();
        
        // Reload bookings list
        loadBookings();
    } catch (error) {
        console.error('Error updating booking:', error);
        showError('Failed to update booking');
    }
}

// Save admin notes
async function saveBookingNotes(event, bookingId) {
    event.preventDefault();
    
    const notes = document.getElementById('admin-notes').value;
    
    try {
        const response = await fetch(`/api/bookings/${bookingId}/notes`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ admin_notes: notes })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update notes');
        }
        
        // Show success message
        showSuccess('Notes saved successfully');
        
        // Switch to details tab
        document.querySelector('.booking-tab[data-tab="details"]').click();
    } catch (error) {
        console.error('Error saving notes:', error);
        showError('Failed to save notes');
    }
}

// Update booking status
async function updateBookingStatus(id) {
    const status = prompt('Enter new status (pending, confirmed, completed, cancelled):');
    if (!status) return;
    
    try {
        const response = await fetch(`/api/bookings/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update status');
        }
        
        // Show success message
        showSuccess('Status updated successfully');
        
        // Reload bookings list
        loadBookings();
        
        // Close modal if open
        closeModal();
    } catch (error) {
        console.error('Error updating status:', error);
        showError('Failed to update booking status');
    }
}

// Send email reminder to customer
async function sendEmailReminder(id) {
    if (!confirm('Send email reminder to customer?')) return;
    
    try {
        const response = await fetch(`/api/bookings/${id}/send-reminder`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to send reminder');
        }
        
        // Show success message
        showSuccess('Reminder email sent successfully');
    } catch (error) {
        console.error('Error sending reminder:', error);
        showError('Failed to send reminder email');
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format date for input field (YYYY-MM-DD)
function formatDateForInput(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

// Get status badge styling
function getStatusBadgeClass(status) {
    switch (status) {
        case 'confirmed': return 'bg-green-100 text-green-800';
        case 'pending': return 'bg-blue-100 text-blue-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        case 'completed': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// Get payment status badge styling  
function getPaymentStatusBadgeClass(status) {
    switch (status) {
        case 'paid': return 'bg-green-100 text-green-800';
        case 'partial': return 'bg-yellow-100 text-yellow-800';
        case 'unpaid': return 'bg-red-100 text-red-800';
        case 'refunded': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// Show booking detail modal - Implements Task 11
function showBookingDetailModal(booking) {
    const modal = document.getElementById('booking-modal');
    
    // Format dates and times
    const formattedDate = formatDate(booking.event_date);
    const formattedPaymentDate = booking.payment_date ? formatDate(booking.payment_date) : 'N/A';
    const duration = calculateDuration(booking.event_start_time, booking.event_end_time);
    
    // Get status and payment status badge classes
    const statusClass = getStatusBadgeClass(booking.booking_status);
    const paymentStatusClass = getPaymentStatusBadgeClass(booking.payment_status);
    
    // Generate products HTML if available
    let productsHTML = '';
    if (booking.products && booking.products.length > 0) {
        productsHTML = `
            <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Products</h3>
