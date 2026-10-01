/**
 * RESQR Agent Customer Categories & Bulk Plans Configuration
 * -------------------------------------------------------------
 * Extensible category registry supporting Family Plans, Schools, Colleges,
 * Corporate/Offices, Individual Customers, and future enterprise categories.
 *
 * Configurable pricing, commission rules, and role-based privacy safeguards.
 */

export const CUSTOMER_CATEGORY_TYPES = {
    FAMILY: 'family',
    SCHOOL: 'school',
    COLLEGE: 'college',
    CORPORATE: 'corporate',
    INDIVIDUAL: 'individual',
};

/**
 * Extensible Category Registry
 * Adding new categories only requires registering a new entry here.
 */
export const CUSTOMER_CATEGORIES = {
    [CUSTOMER_CATEGORY_TYPES.FAMILY]: {
        id: CUSTOMER_CATEGORY_TYPES.FAMILY,
        name: 'Family Plan',
        label: 'Family Plan',
        shortDesc: 'Multi-member household safety bundle with individual QR cards & delegated emergency contacts.',
        icon: 'Users',
        idPrefix: 'RESQR-FAM',
        hierarchyLevels: ['Family', 'Members'],
        allowBulkUpload: true,
        memberNoun: 'Family Member',
        containerNoun: 'Family Group',
        defaultSizes: [4, 6, 8],
        fields: [
            { key: 'familyName', label: 'Family / Household Name', type: 'text', required: true, placeholder: 'e.g. Sharma Family' },
            { key: 'primaryContactName', label: 'Primary Account Holder', type: 'text', required: true, placeholder: 'Full Name' },
            { key: 'primaryPhone', label: 'Primary Contact Mobile', type: 'tel', required: true, placeholder: '10-digit mobile number' },
            { key: 'primaryEmail', label: 'Contact Email', type: 'email', required: false, placeholder: 'email@domain.com' },
            { key: 'address', label: 'Residential Address', type: 'text', required: false, placeholder: 'House/Street, Area' },
            { key: 'city', label: 'City', type: 'text', required: true, placeholder: 'e.g. Mumbai, Bengaluru' },
            { key: 'pincode', label: 'Pincode', type: 'text', required: true, placeholder: '6-digit PIN' },
            { key: 'familyEmergencyContact', label: 'Family Shared Emergency Contact', type: 'tel', required: true, placeholder: 'Backup emergency number' },
        ],
        memberFields: [
            { key: 'name', label: 'Member Name', type: 'text', required: true },
            { key: 'relationship', label: 'Relationship', type: 'select', options: ['Self / Head', 'Spouse', 'Child', 'Parent', 'Sibling', 'Grandparent', 'Other'], required: true },
            { key: 'phone', label: 'Mobile (if applicable)', type: 'tel', required: false },
            { key: 'age', label: 'Age / DOB', type: 'text', required: false },
            { key: 'bloodGroup', label: 'Blood Group (Voluntary)', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown / Disclose Later'], required: false },
        ],
        defaultPlans: [
            { id: 'family_4', name: 'Family Plan (4 Members)', memberCount: 4, basePrice: 499, durationMonths: 12, commissionAmount: 150, discountPercent: 15 },
            { id: 'family_6', name: 'Family Plan (6 Members)', memberCount: 6, basePrice: 699, durationMonths: 12, commissionAmount: 220, discountPercent: 20 },
            { id: 'family_8', name: 'Family Plan (8 Members)', memberCount: 8, basePrice: 899, durationMonths: 12, commissionAmount: 300, discountPercent: 25 },
            { id: 'family_custom', name: 'Family Plan (Custom Size)', memberCount: 10, basePrice: 1099, durationMonths: 12, commissionAmount: 350, discountPercent: 30 },
        ],
    },

    [CUSTOMER_CATEGORY_TYPES.SCHOOL]: {
        id: CUSTOMER_CATEGORY_TYPES.SCHOOL,
        name: 'School',
        label: 'Educational Institution (School)',
        shortDesc: 'Campus-wide child safety, Grade 1–12 classroom management & parent emergency alert relay.',
        icon: 'GraduationCap',
        idPrefix: 'RESQR-SCH',
        hierarchyLevels: ['School', 'Classes / Grades', 'Students'],
        allowBulkUpload: true,
        memberNoun: 'Student / Staff',
        containerNoun: 'Class / Grade',
        classesList: ['Nursery', 'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Teaching Staff', 'Admin Staff'],
        fields: [
            { key: 'institutionName', label: 'School Name', type: 'text', required: true, placeholder: 'e.g. St. Xavier High School' },
            { key: 'institutionId', label: 'School Affiliation / Registration ID', type: 'text', required: true, placeholder: 'CBSE / ICSE / State Code' },
            { key: 'principalName', label: 'Principal / Head Administrator Name', type: 'text', required: true, placeholder: 'Full Name' },
            { key: 'contactPhone', label: 'Admin Phone Number', type: 'tel', required: true, placeholder: '10-digit phone' },
            { key: 'contactEmail', label: 'Official School Email', type: 'email', required: true, placeholder: 'admin@school.edu.in' },
            { key: 'address', label: 'Campus Address', type: 'text', required: true, placeholder: 'Street / Landmark' },
            { key: 'city', label: 'City', type: 'text', required: true, placeholder: 'City' },
            { key: 'pincode', label: 'Pincode', type: 'text', required: true, placeholder: '6-digit PIN' },
            { key: 'studentCount', label: 'Estimated Number of Students', type: 'number', required: true, placeholder: 'e.g. 500' },
            { key: 'staffCount', label: 'Estimated Number of Staff', type: 'number', required: false, placeholder: 'e.g. 40' },
            { key: 'campusEmergencyContact', label: 'Campus Medical / Emergency Desk', type: 'tel', required: true, placeholder: 'Emergency Hotline' },
        ],
        memberFields: [
            { key: 'name', label: 'Student / Staff Name', type: 'text', required: true },
            { key: 'division', label: 'Class / Grade / Section', type: 'text', required: true, placeholder: 'e.g. Grade 7-B' },
            { key: 'rollNo', label: 'Roll No / Student ID', type: 'text', required: false },
            { key: 'parentName', label: 'Parent / Guardian Name', type: 'text', required: true },
            { key: 'parentPhone', label: 'Parent Emergency Contact', type: 'tel', required: true },
            { key: 'optionalMedical', label: 'Emergency Medical Notes (Optional)', type: 'text', required: false },
        ],
        defaultPlans: [
            { id: 'school_tier1', name: 'School Campus Bulk (Up to 250)', memberCount: 250, basePrice: 19999, durationMonths: 12, commissionAmount: 3000, perUserRate: 80 },
            { id: 'school_tier2', name: 'School Campus Bulk (Up to 500)', memberCount: 500, basePrice: 34999, durationMonths: 12, commissionAmount: 6000, perUserRate: 70 },
            { id: 'school_tier3', name: 'School Campus Bulk (Up to 1000)', memberCount: 1000, basePrice: 59999, durationMonths: 12, commissionAmount: 12000, perUserRate: 60 },
            { id: 'school_custom', name: 'School Enterprise Custom Tier', memberCount: 2000, basePrice: 99999, durationMonths: 12, commissionAmount: 20000, perUserRate: 50 },
        ],
    },

    [CUSTOMER_CATEGORY_TYPES.COLLEGE]: {
        id: CUSTOMER_CATEGORY_TYPES.COLLEGE,
        name: 'College',
        label: 'Educational Institution (College / University)',
        shortDesc: 'Higher education multi-department campus safety network with campus first-responder routing.',
        icon: 'BookOpen',
        idPrefix: 'RESQR-COL',
        hierarchyLevels: ['College', 'Departments', 'Students & Faculty'],
        allowBulkUpload: true,
        memberNoun: 'Student / Faculty',
        containerNoun: 'Department',
        departmentsList: ['Computer Science', 'Information Tech', 'Electronics', 'Mechanical', 'Civil', 'Biotechnology', 'Management / MBA', 'Commerce', 'Medicine / Nursing', 'Pharmacy', 'Law', 'Humanities', 'Faculty & Admin'],
        fields: [
            { key: 'institutionName', label: 'College / University Name', type: 'text', required: true, placeholder: 'e.g. National Institute of Technology' },
            { key: 'institutionId', label: 'AISHE / UGC / AICTE Code', type: 'text', required: true, placeholder: 'College Code' },
            { key: 'administratorName', label: 'Dean / Registrar / Admin Head', type: 'text', required: true, placeholder: 'Full Name' },
            { key: 'contactPhone', label: 'Official Phone', type: 'tel', required: true, placeholder: '10-digit number' },
            { key: 'contactEmail', label: 'Official Institutional Email', type: 'email', required: true, placeholder: 'registrar@college.ac.in' },
            { key: 'address', label: 'Campus Address', type: 'text', required: true, placeholder: 'Address / Campus' },
            { key: 'city', label: 'City', type: 'text', required: true, placeholder: 'City' },
            { key: 'pincode', label: 'Pincode', type: 'text', required: true, placeholder: '6-digit PIN' },
            { key: 'studentCount', label: 'Total Enrolled Students', type: 'number', required: true, placeholder: 'e.g. 1200' },
            { key: 'staffCount', label: 'Total Faculty & Staff', type: 'number', required: false, placeholder: 'e.g. 120' },
            { key: 'campusEmergencyContact', label: 'Campus Security / Health Center Contact', type: 'tel', required: true, placeholder: 'Campus Emergency Line' },
        ],
        memberFields: [
            { key: 'name', label: 'Student / Faculty Name', type: 'text', required: true },
            { key: 'department', label: 'Department / Branch', type: 'text', required: true, placeholder: 'e.g. Computer Science' },
            { key: 'enrollmentId', label: 'Roll Number / Employee ID', type: 'text', required: true },
            { key: 'phone', label: 'Personal Mobile', type: 'tel', required: true },
            { key: 'email', label: 'Campus / Personal Email', type: 'email', required: false },
            { key: 'emergencyContact', label: 'Emergency Contact Number', type: 'tel', required: true },
        ],
        defaultPlans: [
            { id: 'college_tier1', name: 'College Campus Plan (Up to 500)', memberCount: 500, basePrice: 39999, durationMonths: 12, commissionAmount: 7000, perUserRate: 80 },
            { id: 'college_tier2', name: 'College Campus Plan (Up to 1500)', memberCount: 1500, basePrice: 99999, durationMonths: 12, commissionAmount: 18000, perUserRate: 67 },
            { id: 'college_tier3', name: 'University Campus Plan (Up to 3000)', memberCount: 3000, basePrice: 169999, durationMonths: 12, commissionAmount: 32000, perUserRate: 57 },
        ],
    },

    [CUSTOMER_CATEGORY_TYPES.CORPORATE]: {
        id: CUSTOMER_CATEGORY_TYPES.CORPORATE,
        name: 'Corporate',
        label: 'IT / Office / Corporate Enterprise',
        shortDesc: 'Workplace safety, multi-branch office employee emergency cards & corporate wellness compliance.',
        icon: 'Building2',
        idPrefix: 'RESQR-CORP',
        hierarchyLevels: ['Company', 'Office Location', 'Department', 'Employees'],
        allowBulkUpload: true,
        memberNoun: 'Employee',
        containerNoun: 'Department / Office',
        fields: [
            { key: 'companyName', label: 'Company / Organization Name', type: 'text', required: true, placeholder: 'e.g. Infotech Solutions Pvt Ltd' },
            { key: 'companyId', label: 'Corporate CIN / GSTIN / Reg No', type: 'text', required: true, placeholder: 'Corporate Identifier' },
            { key: 'hrAdminName', label: 'HR Director / Safety Officer Name', type: 'text', required: true, placeholder: 'Full Name' },
            { key: 'contactPhone', label: 'HR / Contact Phone', type: 'tel', required: true, placeholder: '10-digit number' },
            { key: 'contactEmail', label: 'Corporate Work Email', type: 'email', required: true, placeholder: 'hr@company.com' },
            { key: 'officeLocations', label: 'Office Locations (Comma-separated)', type: 'text', required: true, placeholder: 'e.g. Bengaluru HQ, Hyderabad Branch, Pune Hub' },
            { key: 'city', label: 'Primary City', type: 'text', required: true, placeholder: 'City' },
            { key: 'employeeCount', label: 'Total Employee Headcount', type: 'number', required: true, placeholder: 'e.g. 350' },
            { key: 'corporateEmergencyContact', label: 'Corporate 24/7 Security Hotline', type: 'tel', required: true, placeholder: 'Security Desk Number' },
        ],
        memberFields: [
            { key: 'name', label: 'Employee Name', type: 'text', required: true },
            { key: 'employeeId', label: 'Employee ID', type: 'text', required: true },
            { key: 'department', label: 'Department', type: 'text', required: true, placeholder: 'e.g. Engineering' },
            { key: 'officeLocation', label: 'Office Branch / Location', type: 'text', required: false, placeholder: 'e.g. Bengaluru HQ' },
            { key: 'phone', label: 'Employee Mobile', type: 'tel', required: true },
            { key: 'email', label: 'Work Email', type: 'email', required: false },
            { key: 'emergencyContact', label: 'Emergency Contact Number', type: 'tel', required: true },
        ],
        defaultPlans: [
            { id: 'corp_small', name: 'Corporate Starter (Up to 50 Employees)', memberCount: 50, basePrice: 6999, durationMonths: 12, commissionAmount: 1400, perUserRate: 140 },
            { id: 'corp_mid', name: 'Corporate Growth (Up to 200 Employees)', memberCount: 200, basePrice: 21999, durationMonths: 12, commissionAmount: 4500, perUserRate: 110 },
            { id: 'corp_large', name: 'Corporate Enterprise (Up to 500 Employees)', memberCount: 500, basePrice: 44999, durationMonths: 12, commissionAmount: 9000, perUserRate: 90 },
            { id: 'corp_custom', name: 'Corporate Unlimited Enterprise', memberCount: 1000, basePrice: 79999, durationMonths: 12, commissionAmount: 16000, perUserRate: 80 },
        ],
    },

    [CUSTOMER_CATEGORY_TYPES.INDIVIDUAL]: {
        id: CUSTOMER_CATEGORY_TYPES.INDIVIDUAL,
        name: 'Individual Customer',
        label: 'Individual Customer',
        shortDesc: 'Single citizen emergency QR registration & life safety profile.',
        icon: 'User',
        idPrefix: 'RESQR-USER',
        hierarchyLevels: ['Individual'],
        allowBulkUpload: false,
        memberNoun: 'Citizen',
        containerNoun: 'Individual Profile',
        fields: [
            { key: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Full Name' },
            { key: 'phone', label: 'Mobile Number', type: 'tel', required: true, placeholder: '10-digit mobile number' },
            { key: 'email', label: 'Email Address', type: 'email', required: false, placeholder: 'email@domain.com' },
            { key: 'emergencyContact', label: 'Primary Emergency Contact', type: 'tel', required: false, placeholder: 'Emergency Phone' },
            { key: 'city', label: 'City', type: 'text', required: false, placeholder: 'City' },
            { key: 'notes', label: 'Agent Notes / Reference', type: 'text', required: false, placeholder: 'Optional notes' },
        ],
        defaultPlans: [
            { id: 'individual_digital', name: 'Digital RESQR (Single)', memberCount: 1, basePrice: 149, durationMonths: 12, commissionAmount: 40 },
            { id: 'individual_3m', name: 'RESQR QR + 3-Month Validity', memberCount: 1, basePrice: 199, durationMonths: 3, commissionAmount: 50 },
            { id: 'individual_annual', name: 'RESQR Annual (12 Months)', memberCount: 1, basePrice: 399, durationMonths: 12, commissionAmount: 100 },
        ],
    },
};

/**
 * Normalizes phone numbers to standard 10-digit format for validation
 */
export function normalizePhoneNumber(raw) {
    if (!raw) return '';
    const digits = String(raw).replace(/[^0-9]/g, '');
    return digits.slice(-10);
}

/**
 * Validates a CSV row according to category requirements
 */
export function validateCsvRow(row, categoryType) {
    const errors = [];
    const name = (row.name || row.Name || row['Full Name'] || '').trim();
    const phone = (row.phone || row.Phone || row['Mobile'] || row['Phone Number'] || '').trim();
    const emergencyContact = (row.emergencyContact || row['Emergency Contact'] || row['Parent Emergency Contact'] || row['Emergency Phone'] || '').trim();

    if (!name || name.length < 2) {
        errors.push('Name is required (min 2 chars)');
    }

    const cleanPhone = normalizePhoneNumber(phone);
    if (phone && cleanPhone.length !== 10) {
        errors.push('Invalid personal phone number (must be 10 digits)');
    }

    const cleanEmergency = normalizePhoneNumber(emergencyContact);
    if (emergencyContact && cleanEmergency.length !== 10) {
        errors.push('Invalid emergency contact phone (must be 10 digits)');
    }

    if (categoryType === CUSTOMER_CATEGORY_TYPES.SCHOOL) {
        const division = (row.division || row.Division || row.Class || row.Grade || row['Class / Grade'] || '').trim();
        const parentName = (row.parentName || row['Parent Name'] || row['Guardian Name'] || '').trim();
        if (!division) errors.push('Class / Grade is required');
        if (!parentName && !cleanEmergency) errors.push('Parent or emergency contact is required');
    } else if (categoryType === CUSTOMER_CATEGORY_TYPES.COLLEGE) {
        const department = (row.department || row.Department || row.Branch || '').trim();
        if (!department) errors.push('Department is required');
    } else if (categoryType === CUSTOMER_CATEGORY_TYPES.CORPORATE) {
        const dept = (row.department || row.Department || '').trim();
        const empId = (row.employeeId || row['Employee ID'] || row.EmpId || '').trim();
        if (!dept && !empId) errors.push('Department or Employee ID is required');
    }

    return {
        isValid: errors.length === 0,
        errors,
        normalizedData: {
            name,
            phone: cleanPhone || phone,
            emergencyContact: cleanEmergency || emergencyContact,
            email: (row.email || row.Email || '').trim(),
            divisionOrDept: (row.division || row.Division || row.Class || row.Grade || row.department || row.Department || '').trim(),
            identifier: (row.rollNo || row.RollNo || row.employeeId || row['Employee ID'] || row.enrollmentId || '').trim(),
            parentName: (row.parentName || row['Parent Name'] || '').trim(),
            optionalMedical: (row.optionalMedical || row['Medical Notes'] || row['Blood Group'] || '').trim(),
        },
    };
}

/**
 * Generates sample CSV template content for any category
 */
export function generateSampleCsvContent(categoryType) {
    switch (categoryType) {
        case CUSTOMER_CATEGORY_TYPES.SCHOOL:
            return 'Name,Class,Roll Number,Parent Name,Emergency Contact,Medical Notes\nAarav Sharma,Grade 7-A,701,Rajesh Sharma,9876543210,Asthma inhaler required\nDiya Patel,Grade 8-B,814,Meena Patel,9876543211,No allergies\nVivaan Gupta,Grade 9-C,922,Suresh Gupta,9876543212,Allergic to peanuts\n';
        case CUSTOMER_CATEGORY_TYPES.COLLEGE:
            return 'Name,Department,Enrollment ID,Phone,Email,Emergency Contact\nRohan Verma,Computer Science,CS2026-042,9876543220,rohan@college.ac.in,9876543221\nAnanya Sen,Mechanical,ME2026-018,9876543222,ananya@college.ac.in,9876543223\nKavya Reddy,MBA,MBA2026-105,9876543224,kavya@college.ac.in,9876543225\n';
        case CUSTOMER_CATEGORY_TYPES.CORPORATE:
            return 'Name,Employee ID,Department,Office Location,Phone,Email,Emergency Contact\nVikram Malhotra,EMP-1049,Engineering,Bengaluru HQ,9876543230,vikram@corp.com,9876543231\nPooja Nair,EMP-1082,Human Resources,Hyderabad Branch,9876543232,pooja@corp.com,9876543233\nSiddharth Joshi,EMP-1105,Product,Pune Hub,9876543234,siddharth@corp.com,9876543235\n';
        case CUSTOMER_CATEGORY_TYPES.FAMILY:
            return 'Name,Relationship,Phone,Age,Blood Group\nRajesh Kumar,Head of Family,9876543240,42,O+\nPriya Kumar,Spouse,9876543241,39,B+\nAaryan Kumar,Child,9876543242,12,O+\nSushila Devi,Parent,9876543243,68,A+\n';
        default:
            return 'Name,Phone,Email,Emergency Contact,Notes\nRajesh Kumar,9876543210,rajesh@example.com,9876543211,Individual citizen registration\n';
    }
}
