/**
 * Reusable date utility functions for the RESQR platform.
 */

/**
 * Calculates the age from a given Date of Birth (DOB) string.
 * @param {string} dobString - Date of birth in YYYY-MM-DD or standard date format
 * @returns {number|string} Calculated age as integer, or empty string if invalid
 */
export const calculateAge = (dobString) => {
    if (!dobString) return '';
    
    try {
        const birthDate = new Date(dobString);
        if (isNaN(birthDate.getTime())) return '';
        
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();
        
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age >= 0 ? age : '';
    } catch (e) {
        console.error("Age calculation error:", e);
        return '';
    }
};
