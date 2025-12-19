/**
 * Accommodation Admin Test Script
 * Simple test to verify JavaScript functionality
 */

console.log('Accommodation admin test script loaded');

// Test basic functionality
function testAccommodationAdmin() {
    console.log('Testing accommodation admin functionality...');
    
    // Test 1: Check if main functions exist
    const functions = [
        'initializeAccommodationAdmin',
        'addDynamicField',
        'removeDynamicField',
        'validateForm',
        'showAlert',
        'confirmDelete',
        'showImageModal'
    ];
    
    let passedTests = 0;
    let totalTests = functions.length;
    
    functions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            console.log(`✓ Function ${funcName} exists`);
            passedTests++;
        } else {
            console.log(`✗ Function ${funcName} missing`);
        }
    });
    
    // Test 2: Check if accommodationAdmin object exists
    if (window.accommodationAdmin && typeof window.accommodationAdmin === 'object') {
        console.log('✓ accommodationAdmin object exists');
        passedTests++;
    } else {
        console.log('✗ accommodationAdmin object missing');
    }
    totalTests++;
    
    // Test 3: Test utility functions
    try {
        const testSlug = generateSlug('Test Accommodation Name');
        if (testSlug === 'test-accommodation-name') {
            console.log('✓ generateSlug function works');
            passedTests++;
        } else {
            console.log('✗ generateSlug function failed');
        }
    } catch (error) {
        console.log('✗ generateSlug function error:', error);
    }
    totalTests++;
    
    // Test 4: Test price formatting
    try {
        const testEvent = { target: { value: '2000000' } };
        formatPrice(testEvent);
        if (testEvent.target.value === '2.000.000') {
            console.log('✓ formatPrice function works');
            passedTests++;
        } else {
            console.log('✗ formatPrice function failed');
        }
    } catch (error) {
        console.log('✗ formatPrice function error:', error);
    }
    totalTests++;
    
    // Results
    console.log(`\nTest Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Accommodation admin is working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Please check the implementation.');
    }
    
    return passedTests === totalTests;
}

// Run tests when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, running accommodation admin tests...');
    
    // Wait a bit for other scripts to load
    setTimeout(() => {
        testAccommodationAdmin();
    }, 1000);
});

// Export for manual testing
window.testAccommodationAdmin = testAccommodationAdmin;
