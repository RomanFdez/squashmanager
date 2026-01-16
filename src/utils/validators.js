export const validateDNI = (dni) => {
    const validChars = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const nifRegex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
    const nieRegex = /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;

    if (!nifRegex.test(dni) && !nieRegex.test(dni)) return false;

    let formattedDNI = dni.toUpperCase();
    let number = formattedDNI.slice(0, -1);
    const letter = formattedDNI.slice(-1);

    // For NIE
    if (formattedDNI.startsWith('X')) number = '0' + number.slice(1);
    if (formattedDNI.startsWith('Y')) number = '1' + number.slice(1);
    if (formattedDNI.startsWith('Z')) number = '2' + number.slice(1);

    return validChars[parseInt(number) % 23] === letter;
};

export const validatePhone = (phone) => {
    return /^[0-9]{9}$/.test(phone);
};

export const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && hasUpperCase && hasNumber && hasSymbol;
};

export const formatMemberNumber = (num) => {
    return String(num).padStart(3, '0');
};

export const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
};
