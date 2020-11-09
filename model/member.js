let { log } = require('debug');
let bcrypt = require('bcryptjs');
let passwordValidator = require('password-validator');

// Member class
class memberClass {
    constructor(email, name, nohash_password, password = '', nickname = name, authtype = 'local') {
        this.email = email;
        this.name = name;
        this.nohash_password = nohash_password;
        this.password = password;
        this.nickname = nickname;
        this.authtype = authtype;
    }

    checkEmailValidation() {
        return isEmailValid(this.email);
    }

    checkPasswordValidation() {
        return pw_schema.validate(this.nohash_password);
    }

    encodePassword() {
        // Hash passwords
        const salt = bcrypt.genSaltSync(10);
        this.password = bcrypt.hashSync(this.nohash_password, salt);
    }

    comparePassword(compare_password) {
        return bcrypt.compareSync(compare_password, this.password);
    }
}

// Validation E-mail
let emailRegex = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

function isEmailValid(email) {
    if (!email)
        return false;

    if (email.length > 254)
        return false;

    let valid = emailRegex.test(email);
    if (!valid)
        return false;

    // Further checking of some things regex can't handle
    let parts = email.split("@");
    if (parts[0].length > 64)
        return false;

    let domainParts = parts[1].split(".");
    if (domainParts.some(function(part) { return part.length > 63; }))
        return false;

    return true;
}

// Password-validator schema
const pw_schema = new passwordValidator();
// Add properties to it
pw_schema
    .is().min(8) // Minimum length 8
    .is().max(10) // Maximum length 10
    .has().symbols() // Must Have symbols letters
    .has().uppercase() // Must have uppercase letters
    .has().lowercase() // Must have lowercase letters
    .has().digits(1) // Must have at least 1 digits
    .has().not().spaces() // Should not have spaces
    .is().not().oneOf(['Passw0rd1!', 'Password123!']); // Blacklist these values

module.exports = {
    memberClass,
    isEmailValid,
    pw_schema
};