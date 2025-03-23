/**
 * Bounce Boss Booking Form
 * Enhanced version with step-by-step navigation, validation, and availability checking
 */

// Initialize Stripe with the publishable key
const stripe = Stripe('pk_test_51R5fgOIrObeZHL3VYEZikxWFkE2O4lVun04cVBQYteFzWhTAFuaMVkUerfodhqEP5dNThIE6AkS47S6dYQCawnpa002jcjUkXo');

// Create a Stripe Elements instance
const elements = stripe.elements();

// Create a card Element and mount it to the card-element container
const cardElement = elements.create('card');
cardElement.mount('#card-element');

// Initialize payment status elements
const cardContainer = document.getElementById('card-element-container');
const cardStatus = document.createElement('div');
cardStatus.className = 'card-status mt-2';
cardContainer.appendChild(cardStatus);

// Handle real-time validation errors from the card Element
cardElement.on('change', function(event) {
    const displayError = document.getElementById('card-errors');
    updateCardStatus(event);
    
    if (event.error) {
        displayError.textContent = event.error.message;
        displayError.classList.add('py-2', 'px-3', 'bg-red-50', 'border', 'border-red-200', 'rounded-md');
    } else {
        displayError.textContent = '';
        displayError.classList.remove('py-2', 'px-3', 'bg-red-50', 'border', 'border-red-200', 'rounded-md');
    }
});

// Step navigation variables
let currentStep = 1;
const totalSteps = 4;

// DOM Elements for steps
const stepElements = {
    1: document.getElementById('step1'),
    2: document.getElementById('step2'),
    3: document.getElementById('step3'),
    4: document.getElementById('step4')
};

const formStepElements = {
    1: document.getElementById('formStep1'),
    2: document.getElementById('formStep2'),
    3: document.getElementById('formStep3'),
    4: document.getElementById('formStep4')
};

// Step progress bar
const stepProgressBar = document.getElementById('stepProgressBar');

// Step navigation buttons
const step1NextBtn = document.getElementById('step1Next');
const step2PrevBtn = document.getElementById('step2Prev');
const step2NextBtn = document.getElementById('step2Next');
const step3PrevBtn = document.getElementById('step3Prev');
const step3NextBtn = document.getElementById('step3Next');
const step4PrevBtn = document.getElementById('step4Prev');

// Form inputs
const dateInput = document.getElementById('date');
const timeInput = document.getElementById('time');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const addressInput = document.getElementById('address');
const notesInput = document.getElementById('notes');
const signatureInput = document.getElementById('signature');
const termsCheckbox = document.getElementById('terms-checkbox');

// Form validation error elements
const dateErrorElement = document.getElementById('dateError');
const timeErrorElement = document.getElementById('timeError');
const nameErrorElement = document.getElementById('nameError');
const emailErrorElement = document.getElementById('emailError');
const phoneErrorElement = document.getElementById('phoneError');
const addressErrorElement = document.getElementById('addressError');
const signatureErrorElement = document.getElementById('signatureError');
const termsErrorElement = document.getElementById('termsError');

// Summary elements
const summaryDateElement = document.getElementById('summaryDate');
const summaryTimeElement = document.getElementById('summaryTime');
const noItemsMessageElement = document.getElementById('noItemsMessage');

// Date availability element
const dateAvailabilityElement = document.getElementById('dateAvailability');

// Function to update card validation status
function updateCardStatus(event) {
    const { complete, empty, error } = event;
    
    // Clear previous status
    cardStatus.className = 'card-status flex items-center mt-2 text-sm';
    cardStatus.innerHTML = '';
    
    if (empty) {
        cardStatus.innerHTML = '<span class="text-gray-400">Enter card details</span>';
    } else if (error) {
        cardStatus.innerHTML = `
            <svg class="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <span class="text-red-500">${error.message}</span>
        `;
    } else if (complete) {
        cardStatus.innerHTML = `
            <svg class="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span class="text-green-500">Card information complete</span>
        `;
    } else {
        cardStatus.innerHTML = `
            <svg class="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <span class="text-yellow-500">Continue entering card details</span>
        `;
    }
}

// Step navigation functions
function goToStep(step) {
    // Hide all form steps
    Object.values(formStepElements).forEach(element => {
        element.classList.remove('active');
    });
    
    // Show the current step
    formStepElements[step].classList.add('active');
    
    // Update step indicators
    Object.entries(stepElements).forEach(([stepNum, element]) => {
        const stepNumber = parseInt(stepNum);
        
        if (stepNumber < step) {
            element.classList.remove('active');
            element.classList.add('completed');
            element.innerHTML = '<i class="fas fa-check"></i>';
        } else if (stepNumber === step) {
            element.classList.add('active');
            element.classList.remove('completed');
            element.innerHTML = `<span>${stepNumber}</span>`;
        } else {
            element.classList.remove('active', 'completed');
            element.innerHTML = `<span>${stepNumber}</span>`;
        }
    });
    
    // Update the progress bar
    const progressPercentage = ((step - 1) / (totalSteps - 1)) * 100;
    stepProgressBar.style.width = `${progressPercentage}%`;
    
    // Update current step
    currentStep = step;
    
    // Scroll to top of the form
    formStepElements[step].scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Validate date and time (Step 1)
function validateStep1() {
    let isValid = true;
    
    // Validate date
    if (!dateInput.value) {
        dateInput.classList.add('invalid');
        dateInput.classList.remove('valid');
        isValid = false;
    } else {
        const selectedDate = new Date(dateInput.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            dateInput.classList.add('invalid');
            dateInput.classList.remove('valid');
            dateErrorElement.textContent = "Please select a future date";
            isValid = false;
        } else {
            dateInput.classList.remove('invalid');
            dateInput.classList.add('valid');
        }
    }
    
    // Validate time
    if (!timeInput.value) {
        timeInput.classList.add('invalid');
        timeInput.classList.remove('valid');
        isValid = false;
    } else {
        timeInput.classList.remove('invalid');
        timeInput.classList.add('valid');
    }
    
    return isValid;
}

// Validate product selection (Step 2)
function validateStep2() {
    // Check if at least one product is selected
    return cart.length > 0;
}

// Validate customer details (Step 3)
function validateStep3() {
    let isValid = true;
    
    // Validate name
    if (!nameInput.value.trim()) {
        nameInput.classList.add('invalid');
        nameInput.classList.remove('valid');
        isValid = false;
    } else {
        nameInput.classList.remove('invalid');
        nameInput.classList.add('valid');
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
        emailInput.classList.add('invalid');
        emailInput.classList.remove('valid');
        isValid = false;
    } else {
        emailInput.classList.remove('invalid');
        emailInput.classList.add('valid');
    }
    
    // Validate phone
    const phoneRegex = /^[0-9]{3}[\-\s]?[0-9]{3}[\-\s]?[0-9]{4}$/;
    if (!phoneInput.value.trim() || !phoneRegex.test(phoneInput.value.trim())) {
        phoneInput.classList.add('invalid');
        phoneInput.classList.remove('valid');
        isValid = false;
    } else {
        phoneInput.classList.remove('invalid');
        phoneInput.classList.add('valid');
    }
    
    // Validate address
    if (!addressInput.value.trim()) {
        addressInput.classList.add('invalid');
        addressInput.classList.remove('valid');
        isValid = false;
    } else {
        addressInput.classList.remove('invalid');
        addressInput.classList.add('valid');
    }
    
    return isValid;
}

// Validate terms and payment (Step 4)
function validateStep4() {
    let isValid = true;
    
    // Validate signature
    if (!signatureInput.value.trim()) {
        signatureInput.classList.add('invalid');
        signatureInput.classList.remove('valid');
        isValid = false;
    } else {
        signatureInput.classList.remove('invalid');
        signatureInput.classList.add('valid');
    }
    
    // Validate terms checkbox
    if (!termsCheckbox.checked) {
        termsErrorElement.style.display = 'block';
        isValid = false;
    } else {
        termsErrorElement.style.display = 'none';
    }
    
    return isValid;
}

// Check date availability
async function checkDateAvailability() {
    if (!dateInput.value || !timeInput.value) return;
    
    // Show loading indicator
    dateAvailabilityElement.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Checking availability...</span>
    `;
    dateAvailabilityElement.className = 'date-availability loading flex items-center';
    
    // Map the time slot to actual start and end times
    let startTime, endTime;
    switch (timeInput.value) {
        case 'morning':
            startTime = '08:00';
            endTime = '12:00';
            break;
        case 'afternoon':
            startTime = '12:00';
            endTime = '16:00';
            break;
        case 'evening':
            startTime = '16:00';
            endTime = '20:00';
            break;
        case 'full-day':
            startTime = '08:00';
            endTime = '20:00';
            break;
    }
    
    // For demo purposes, we'll simulate the availability check since the API endpoint might not be available
    try {
        // Simulate API call with a delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Always show as available for demo purposes
        dateAvailabilityElement.innerHTML = `
            <svg class="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span>Date and time available!</span>
        `;
        dateAvailabilityElement.className = 'date-availability available flex items-center';
        
        // Update the summary
        updateDateTimeSummary();
        
        return true;
        
        /* Uncomment this code when the API is ready
        const response = await fetch(`/api/bookings/availability/check?date=${dateInput.value}&startTime=${startTime}&endTime=${endTime}`);
        const data = await response.json();
        
        if (data.success) {
            if (data.available) {
                dateAvailabilityElement.innerHTML = `
                    <svg class="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span>Date and time available!</span>
                `;
                dateAvailabilityElement.className = 'date-availability available flex items-center';
                
                // Update the summary
                updateDateTimeSummary();
                
                return true;
            } else {
                dateAvailabilityElement.innerHTML = `
                    <svg class="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                    <span>This date and time is already booked. Please select another.</span>
                `;
                dateAvailabilityElement.className = 'date-availability unavailable flex items-center';
                return false;
            }
        } else {
            throw new Error(data.error || 'Failed to check availability');
        }
        */
    } catch (error) {
        console.error('Error checking availability:', error);
        dateAvailabilityElement.innerHTML = `
            <svg class="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <span>Error checking availability. Please try again.</span>
        `;
        dateAvailabilityElement.className = 'date-availability unavailable flex items-center';
        return false;
    }
}

// Update date and time in summary
function updateDateTimeSummary() {
    if (dateInput.value) {
        const formattedDate = new Date(dateInput.value).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        summaryDateElement.textContent = formattedDate;
    } else {
        summaryDateElement.textContent = 'Select a date';
    }
    
    if (timeInput.value) {
        let timeText;
        switch (timeInput.value) {
            case 'morning':
                timeText = 'Morning (8:00 AM - 12:00 PM)';
                break;
            case 'afternoon':
                timeText = 'Afternoon (12:00 PM - 4:00 PM)';
                break;
            case 'evening':
                timeText = 'Evening (4:00 PM - 8:00 PM)';
                break;
            case 'full-day':
                timeText = 'Full Day (8:00 AM - 8:00 PM)';
                break;
            default:
                timeText = 'Select a time';
        }
        summaryTimeElement.textContent = timeText;
    } else {
        summaryTimeElement.textContent = 'Select a time';
    }
}

// Set up Google Maps address autocomplete
function initializeAddressAutocomplete() {
    if (window.google && window.google.maps && window.google.maps.places) {
        const autocomplete = new google.maps.places.Autocomplete(addressInput, {
            types: ['address'],
            componentRestrictions: { country: 'ca' } // Restrict to Canada
        });
        
        autocomplete.addListener('place_changed', function() {
            const place = autocomplete.getPlace();
            addressInput.classList.add('valid');
            addressInput.classList.remove('invalid');
        });
    }
}

// Load Google Maps API script
function loadGoogleMapsScript() {
    const googleMapsScript = document.createElement('script');
    googleMapsScript.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyBNLrJhOMz6idD05pzfn5lhA-TAw-mAZCU&libraries=places&callback=initializeAddressAutocomplete';
    googleMapsScript.async = true;
    googleMapsScript.defer = true;
    document.head.appendChild(googleMapsScript);
    
    // Define the callback function globally
    window.initializeAddressAutocomplete = initializeAddressAutocomplete;
}

// Payment processing state and UI elements
let isProcessingPayment = false;
const loadingOverlay = document.createElement('div');
loadingOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50';
loadingOverlay.innerHTML = `
    <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h3 class="text-xl font-bold text-center mb-2">Processing Payment</h3>
        <p class="text-center text-gray-600" id="processing-message">Please wait while we process your payment...</p>
    </div>
`;
document.body.appendChild(loadingOverlay);

// Summary elements
const subtotalElement = document.getElementById('subtotal');
const deliveryFeeElement = document.getElementById('deliveryFee');
const totalElement = document.getElementById('total');
const selectedItemsContainer = document.getElementById('selectedItems');
const submitButton = document.getElementById('submit-button');

// Terms & Conditions elements
const termsContainer = document.getElementById('terms-container');
const agreementTimestampElement = document.getElementById('agreement-timestamp');
const termsSummaryElement = document.getElementById('terms-summary');

// Terms acceptance variables
let hasScrolledToBottom = false;
let userIpAddress = '';

// Shopping cart
let cart = [];
let subtotal = 0;
let deliveryFee = 50; // Fixed delivery fee

// Product quantity management
function increaseQuantity(id, name, price) {
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(item => item.id === id);
    
    if (existingItemIndex >= 0) {
        // Item already in cart, increment quantity
        cart[existingItemIndex].quantity += 1;
    } else {
        // Add new item to cart
        cart.push({
            id: id,
            name: name,
            price: price,
            quantity: 1
        });
    }
    
    // Update the quantity display
    const qtyElement = document.getElementById(`${id}-qty`);
    if (qtyElement) {
        const newQty = existingItemIndex >= 0 ? cart[existingItemIndex].quantity : 1;
        qtyElement.textContent = newQty;
    }
    
    // Update the UI
    updateBookingSummary();
}

function decreaseQuantity(id) {
    // Find the item in the cart
    const existingItemIndex = cart.findIndex(item => item.id === id);
    
    if (existingItemIndex >= 0) {
        if (cart[existingItemIndex].quantity > 1) {
            // Decrease quantity if more than 1
            cart[existingItemIndex].quantity -= 1;
        } else {
            // Remove item if quantity is 1
            cart.splice(existingItemIndex, 1);
        }
        
        // Update the quantity display
        const qtyElement = document.getElementById(`${id}-qty`);
        if (qtyElement) {
            const newQty = existingItemIndex >= 0 && cart[existingItemIndex] ? cart[existingItemIndex].quantity : 0;
            qtyElement.textContent = newQty;
        }
        
        // Update the UI
        updateBookingSummary();
    }
}

// Update booking summary
function updateBookingSummary() {
    // Clear the selected items container
    selectedItemsContainer.innerHTML = '';
    
    // Reset subtotal
    subtotal = 0;
    
    // Add each item to the summary
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'flex justify-between items-center mb-4';
        itemElement.innerHTML = `
            <div>
                <h4 class="font-bold">${item.name}</h4>
                <p class="text-sm text-gray-600">$${item.price} x ${item.quantity}</p>
            </div>
            <div class="flex items-center">
                <span class="font-bold">$${itemTotal}</span>
                <button onclick="removeFromBooking('${item.id}')" class="ml-2 text-red-500">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        selectedItemsContainer.appendChild(itemElement);
    });
    
    // Update totals
    subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    deliveryFeeElement.textContent = `$${deliveryFee.toFixed(2)}`;
    totalElement.textContent = `$${(subtotal + deliveryFee).toFixed(2)}`;
}

// Remove item from booking
function removeFromBooking(id) {
    cart = cart.filter(item => item.id !== id);
    updateBookingSummary();
}

// Load terms summary into the terms container
function loadTermsSummary() {
    // Key points from the terms and conditions
    const termsSummary = `
        <h4 class="font-bold mt-4">Key Points:</h4>
        <ul class="list-disc pl-6 mt-2 space-y-1">
            <li>Full payment required at time of booking</li>
            <li>Cancellations made more than 48 hours prior to rental date receive full refund</li>
            <li>Adult supervision required at all times</li>
            <li>You must provide a suitable flat area and access to electricity</li>
            <li>You assume responsibility for injuries and damages during rental period</li>
            <li>BOUNCE BOSS will deliver, set up, and collect equipment</li>
        </ul>

        <h4 class="font-bold mt-6">1. Rental Agreement</h4>
        <p class="text-sm mt-2">This rental agreement is between BOUNCE BOSS INFLATABLES ("we", "our", "us") and the customer ("you", "your") identified in the booking form. By proceeding with the rental of our equipment, you agree to be bound by these terms and conditions.</p>

        <h4 class="font-bold mt-4">2. Booking and Payment</h4>
        <p class="text-sm mt-2">Full payment is required at the time of booking to secure your rental. Cancellations made more than 48 hours prior to the rental date will receive a full refund. Cancellations made within 48 hours of the rental date are non-refundable but may be eligible for rescheduling subject to availability.</p>
        <p class="text-sm mt-2">In the event of severe weather conditions (heavy rain, strong winds, etc.) that make it unsafe to operate inflatable equipment, we reserve the right to reschedule your rental or provide a full refund.</p>

        <h4 class="font-bold mt-4">3. Safety Requirements</h4>
        <p class="text-sm mt-2">For safety reasons, the following rules must be adhered to at all times:</p>
        <ul class="list-disc pl-6 mt-1 text-sm space-y-1">
            <li>Adult supervision is required at all times when inflatables are in use</li>
            <li>No food, drinks, shoes, sharp objects, or glasses are permitted on the inflatables</li>
            <li>No flips, rough play, or climbing on walls</li>
            <li>Inflatables must not be used during rain or when wet</li>
        </ul>

        <p class="mt-6 mb-4 text-center font-semibold">When you reach this point, you have viewed the entire agreement summary.</p>
        <p class="mt-4 mb-4">This is only a summary. You must read and agree to the <a href="/terms-and-conditions.html" target="_blank" class="text-blue-600 hover:underline">complete Terms & Conditions</a>.</p>
    `;
    
    termsSummaryElement.innerHTML = termsSummary;
}

// Get client IP address for record-keeping
async function getClientIpAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        userIpAddress = data.ip;
    } catch (error) {
        console.error('Could not fetch IP address:', error);
        userIpAddress = 'Not available';
    }
}

// Track scrolling through terms
termsContainer.addEventListener('scroll', function() {
    const scrollPosition = termsContainer.scrollTop + termsContainer.clientHeight;
    const totalHeight = termsContainer.scrollHeight;
    
    // Check if user has scrolled to bottom (or close enough - within 10px)
    if (scrollPosition >= totalHeight - 10 && !hasScrolledToBottom) {
        hasScrolledToBottom = true;
        
        // Update UI to show the user has viewed the terms
        termsContainer.classList.add('border-green-500');
        agreementTimestampElement.textContent = `Terms viewed on ${new Date().toLocaleString()}`;
    }
});

// Update digital signature validation
signatureInput.addEventListener('input', function() {
    validateTermsAgreement();
});

// Update checkbox validation
termsCheckbox.addEventListener('change', function() {
    validateTermsAgreement();
});

// Validate terms agreement
function validateTermsAgreement() {
    const signatureValid = signatureInput.value.trim().length > 0;
    const checkboxChecked = termsCheckbox.checked;
    
    // Both signature and checkbox are required
    if (signatureValid && checkboxChecked) {
        termsCheckbox.setCustomValidity('');
        signatureInput.setCustomValidity('');
    } else {
        if (!signatureValid) {
            signatureInput.setCustomValidity('Please provide your digital signature');
        } else {
            signatureInput.setCustomValidity('');
        }
        
        if (!checkboxChecked) {
            termsCheckbox.setCustomValidity('You must agree to the terms and conditions');
        } else {
            termsCheckbox.setCustomValidity('');
        }
    }
}

// Initialize terms functionality
loadTermsSummary();
getClientIpAddress();

// For demo purposes, we'll skip the availability check
// In a real application, you would implement this to check if the selected date and time are available

// Function to show user-friendly error messages
function showPaymentError(errorMessage) {
    const errorElement = document.getElementById('card-errors');
    let userFriendlyMessage = errorMessage;
    
    // Convert technical error messages to user-friendly ones
    if (errorMessage.includes('card was declined')) {
        userFriendlyMessage = 'Your card was declined. Please try another payment method.';
    } else if (errorMessage.includes('expired')) {
        userFriendlyMessage = 'Your card has expired. Please use a different card.';
    } else if (errorMessage.includes('invalid cvc')) {
        userFriendlyMessage = 'The security code (CVC) is incorrect. Please check and try again.';
    } else if (errorMessage.includes('insufficient funds')) {
        userFriendlyMessage = 'Your card has insufficient funds. Please try another payment method.';
    } else if (errorMessage.includes('network')) {
        userFriendlyMessage = 'A network error occurred. Please check your connection and try again.';
    }
    
    errorElement.innerHTML = `
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong class="font-bold">Payment Failed:</strong>
            <span class="block sm:inline"> ${userFriendlyMessage}</span>
        </div>
    `;
    
    // Scroll to error message
    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Function to show loading state
function setLoadingState(isLoading, message = 'Processing your payment...') {
    isProcessingPayment = isLoading;
    
    if (isLoading) {
        submitButton.disabled = true;
        submitButton.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
        `;
        loadingOverlay.classList.remove('hidden');
        document.getElementById('processing-message').textContent = message;
    } else {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Complete Booking & Pay';
        loadingOverlay.classList.add('hidden');
    }
}

// Function to save booking data to session storage for confirmation page
function saveBookingToSession(bookingData) {
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
}

// Handle form submission
bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Don't process if already processing payment
    if (isProcessingPayment) return;
    
    // Clear previous errors
    const errorElement = document.getElementById('card-errors');
    errorElement.innerHTML = '';
    errorElement.classList.remove('py-2', 'px-3', 'bg-red-50', 'border', 'border-red-200', 'rounded-md');
    
    // Validate cart is not empty
    if (cart.length === 0) {
        const errorMsg = 'Please add at least one product to your booking';
        errorElement.innerHTML = `
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span class="block sm:inline">${errorMsg}</span>
            </div>
        `;
        return;
    }
    
    // Validate terms agreement
    if (!hasScrolledToBottom) {
        const errorMsg = 'Please scroll through and read the entire terms and conditions';
        errorElement.innerHTML = `
            <div class="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
                <span class="block sm:inline">${errorMsg}</span>
            </div>
        `;
        termsContainer.scrollIntoView({ behavior: 'smooth' });
        return;
    }
    
    if (!termsCheckbox.checked || !signatureInput.value.trim()) {
        validateTermsAgreement();
        const errorMsg = 'You must provide your digital signature and agree to the terms and conditions';
        errorElement.innerHTML = `
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span class="block sm:inline">${errorMsg}</span>
            </div>
        `;
        return;
    }
    
    // Start loading state
    setLoadingState(true, 'Initializing payment...');
    
    try {
        // Step 1: Create a payment intent on the server
        setLoadingState(true, 'Creating payment request...');
        const paymentResponse = await fetch('/api/stripe/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: subtotal + deliveryFee
            })
        });
        
        if (!paymentResponse.ok) {
            const responseData = await paymentResponse.json();
            throw new Error(responseData.error || 'Failed to create payment intent');
        }
        
        const { clientSecret } = await paymentResponse.json();
        
        // Step 2: Process the payment
        setLoadingState(true, 'Processing your payment...');
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
                billing_details: {
                    name: nameInput.value,
                    email: emailInput.value
                }
            }
        });
        
        if (error) {
            throw new Error(error.message);
        }
        
        // Step 3: Handle payment result
        if (paymentIntent.status === 'succeeded') {
            setLoadingState(true, 'Payment successful! Creating your booking...');
            
            // Payment successful, create the booking data
            const bookingData = {
                customer: {
                    name: nameInput.value,
                    email: emailInput.value,
                    phone: phoneInput.value,
                    address: addressInput.value
                },
                event: {
                    date: dateInput.value,
                    time: timeInput.value
                },
                items: cart,
                notes: notesInput.value,
                payment: {
                    amount: subtotal + deliveryFee,
                    paymentIntentId: paymentIntent.id,
                    status: paymentIntent.status,
                    card: {
                        brand: paymentIntent.payment_method_details?.card?.brand || 'card',
                        last4: paymentIntent.payment_method_details?.card?.last4 || '****'
                    },
                    timestamp: new Date().toISOString()
                },
                terms: {
                    agreed: true,
                    timestamp: new Date().toISOString(),
                    signature: signatureInput.value,
                    ipAddress: userIpAddress
                }
            };
            
            // For demo purposes, we'll just log the booking data
            console.log('Booking data:', bookingData);
            
            // Save booking data to session storage for confirmation page
            saveBookingToSession(bookingData);
            
            // In a real application, you would send this data to your server
            // const bookingResponse = await fetch('/api/bookings', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json'
            //     },
            //     body: JSON.stringify(bookingData)
            // });
            
            // Redirect to confirmation page
            setLoadingState(true, 'Payment successful! Redirecting to confirmation page...');
            window.location.href = '/confirmation.html';
        } else if (paymentIntent.status === 'requires_action') {
            // Handle authentication required
            setLoadingState(true, 'Additional authentication required...');
            const { error } = await stripe.confirmCardPayment(clientSecret);
            if (error) {
                throw new Error('Authentication failed: ' + error.message);
            }
            // If authentication succeeds, handle success case again
            setLoadingState(true, 'Authentication successful! Creating your booking...');
            // Redirect to confirmation page similar to success case
            window.location.href = '/confirmation.html';
        } else {
            throw new Error(`Unexpected payment status: ${paymentIntent.status}`);
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        setLoadingState(false);
        showPaymentError(error.message);
    }
});

// Add event listeners for the date and time inputs
dateInput.addEventListener('change', checkDateAvailability);
timeInput.addEventListener('change', checkDateAvailability);

// Step navigation event listeners
step1NextBtn.addEventListener('click', function() {
    if (validateStep1()) {
        checkDateAvailability().then(isAvailable => {
            if (isAvailable) {
                goToStep(2);
            } else {
                // If not available, keep the user on step 1
                dateInput.focus();
            }
        });
    } else {
        // Show validation errors
        if (!dateInput.value) {
            dateInput.classList.add('invalid');
        }
        if (!timeInput.value) {
            timeInput.classList.add('invalid');
        }
    }
});

step2PrevBtn.addEventListener('click', function() {
    goToStep(1);
});

step2NextBtn.addEventListener('click', function() {
    if (validateStep2()) {
        goToStep(3);
    } else {
        // Show error message for no products selected
        const errorElement = document.getElementById('card-errors');
        errorElement.innerHTML = `
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span class="block sm:inline">Please select at least one product</span>
            </div>
        `;
        setTimeout(() => {
            errorElement.innerHTML = '';
        }, 3000);
    }
});

step3PrevBtn.addEventListener('click', function() {
    goToStep(2);
});

step3NextBtn.addEventListener('click', function() {
    if (validateStep3()) {
        goToStep(4);
    } else {
        // Show validation errors in Step 3
        // (The CSS will automatically show error messages for invalid fields)
    }
});

step4PrevBtn.addEventListener('click', function() {
    goToStep(3);
});

// Add form validation listeners
// Name input validation
nameInput.addEventListener('input', function() {
    if (this.value.trim()) {
        this.classList.add('valid');
        this.classList.remove('invalid');
    } else {
        this.classList.remove('valid');
        this.classList.add('invalid');
    }
});

// Email input validation
emailInput.addEventListener('input', function() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(this.value.trim())) {
        this.classList.add('valid');
        this.classList.remove('invalid');
    } else {
        this.classList.remove('valid');
        this.classList.add('invalid');
    }
});

// Phone input validation
phoneInput.addEventListener('input', function() {
    const phoneRegex = /^[0-9]{3}[\-\s]?[0-9]{3}[\-\s]?[0-9]{4}$/;
    if (phoneRegex.test(this.value.trim())) {
        this.classList.add('valid');
        this.classList.remove('invalid');
    } else {
        this.classList.remove('valid');
        this.classList.add('invalid');
    }
});

// Address input validation
addressInput.addEventListener('input', function() {
    if (this.value.trim()) {
        this.classList.add('valid');
        this.classList.remove('invalid');
    } else {
        this.classList.remove('valid');
        this.classList.add('invalid');
    }
});

// Set min date for date picker to today
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const formattedToday = `${yyyy}-${mm}-${dd}`;
dateInput.setAttribute('min', formattedToday);

// Initialize the address autocomplete
loadGoogleMapsScript();

// Initialize the booking summary
updateBookingSummary();

// Initialize the step progress bar
stepProgressBar.style.width = '0%';

// Update date/time summary when form loads
updateDateTimeSummary();
