import '@babel/polyfill';
import { login, logout, signUp } from './login';
import { updateSettings } from './updateSettings';
import { displayMap } from './mapbox';
import { bookTour } from './stripe';
import { showAlert } from './alert';

//DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const signupForm = document.querySelector('.form--signup');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');
const alertMessage = document.querySelector('body').dataset.alert;

// DELEGATION
if (mapBox) {
    const locations = JSON.parse(mapBox.dataset.locations);
    displayMap(locations);
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email');
        const password = document.getElementById('password');
        const loginBtn = document.getElementById('login');
        loginBtn.textContent = 'Logging In...';
        await login(email.value, password.value);
        if (loginBtn) loginBtn.textContent = 'Log in';
    });
}

if (logOutBtn) {
    logOutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await logout();
    });
}

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password').value;
        const signupBtn = document.getElementById('signUp');
        signupBtn.textContent = 'Signing Up...';
        await signUp(name, email, password, passwordConfirm);
        if (signupBtn) signupBtn.textContent = 'Sign Up';
    });
}

if (userDataForm) {
    userDataForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        document.querySelector('.btn--save-settings').textContent = 'UPDATING...';
        const form = new FormData();
        form.append('name', document.getElementById('name').value);
        form.append('email', document.getElementById('email').value);
        form.append('photo', document.getElementById('photo').files[0]);

        await updateSettings(form, 'data');
        document.querySelector('.btn--save-settings').textContent = 'SAVE SETTINGS ';
    });
}

if (userPasswordForm) {
    userPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        document.querySelector('.btn--save-password').textContent = 'UPDATING...';
        const passwordCurrent = document.getElementById('password-current');
        const password = document.getElementById('password');
        const passwordConfirm = document.getElementById('password-confirm');
        await updateSettings(
            {
                passwordCurrent: passwordCurrent.value,
                password: password.value,
                passwordConfirm: passwordConfirm.value
            },
            'password'
        );
        document.querySelector('.btn--save-password').textContent = 'SAVE PASSWORD ';
        passwordCurrent.value = '';
        password.value = '';
        passwordConfirm.value = '';
    });
}

if (bookBtn) {
    bookBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const { tourId } = e.target.dataset;
        e.target.textContent = 'Processing...';
        await bookTour(tourId);
        //e.target.textContent = 'Book tour now!';
    });
}

if (alertMessage.length > 0) showAlert('success', alertMessage, 15);
