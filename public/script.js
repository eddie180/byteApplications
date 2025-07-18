// document.addEventListener('DOMContentLoaded', () => {
//     const applicationForm = document.getElementById('application-form');
//     const applicationTypeSelect = document.getElementById('application-type');
//     const questionsContainer = document.getElementById('questions-container');
//     const usernameSpan = document.getElementById('username');
//     const userAvatarImg = document.getElementById('user-avatar');
//     const messageBox = document.getElementById('message-box');
//     const logoutButton = document.getElementById('logout-button');
//     const adminPanelLink = document.getElementById('admin-panel-link');
//     const submitButton = applicationForm.querySelector('button[type="submit"]');

//     let availableApplicationTypes = {}; 

//     function showMessage(message, type = 'info') {
//         messageBox.textContent = message;
//         messageBox.className = `mt-6 p-4 rounded-lg text-center ${type}`; 
//         messageBox.style.display = 'block';

//         setTimeout(() => {
//             messageBox.style.display = 'none';
//         }, 5000);
//     }

//     async function fetchSessionInfo() {
//         try {
//             const response = await fetch('/api/session');
//             if (!response.ok) {
//                 console.error('Session not found or expired. Redirecting to login.');
//                 window.location.href = '/';
//                 return;
//             }
//             const data = await response.json();
//             if (data.success && data.user) {
//                 usernameSpan.textContent = data.user.username;
//                 if (data.user.avatar) {
//                     userAvatarImg.src = data.user.avatar;
//                     userAvatarImg.style.display = 'block';
//                 }
//                 if (data.user.isAdmin) {
//                     adminPanelLink.style.display = 'block';
//                 }
//             } else {
//                 showMessage('Failed to load user information. Please try logging in again.', 'error');
//                 setTimeout(() => { window.location.href = '/'; }, 2000);
//             }
//         } catch (error) {
//             console.error('Error fetching session info:', error);
//             showMessage('Network error or session issue. Please try logging in again.', 'error');
//             setTimeout(() => { window.location.href = '/'; }, 2000);
//         }
//     }

//     async function fetchApplicationTypes() {
//         try {
//             const response = await fetch('/api/application-types');
//             if (!response.ok) {
//                 throw new Error('Failed to fetch application types.');
//             }
//             availableApplicationTypes = await response.json();

//             for (const key in availableApplicationTypes) {
//                 const option = document.createElement('option');
//                 option.value = key;
//                 option.textContent = availableApplicationTypes[key].name;
//                 applicationTypeSelect.appendChild(option);
//             }
//         } catch (error) {
//             console.error('Error fetching application types:', error);
//             showMessage('Could not load application types. Please refresh the page.', 'error');
//         }
//     }

//     function renderQuestions(selectedType) {
//         questionsContainer.innerHTML = ''; 
//         if (!selectedType || !availableApplicationTypes[selectedType]) {
//             return;
//         }

//         const questions = availableApplicationTypes[selectedType].questions;

//         questions.forEach(question => {
//             const div = document.createElement('div');
//             div.className = 'mb-4'; 

//             const label = document.createElement('label');
//             label.htmlFor = question.id;
//             label.className = 'block text-lg font-medium text-gray-300 mb-2';
//             label.textContent = question.label;
//             div.appendChild(label);

//             let inputElement;
//             if (question.type === 'textarea') {
//                 inputElement = document.createElement('textarea');
//                 inputElement.rows = 5;
//                 inputElement.placeholder = `Enter your answer here.`;
//             } else {
//                 inputElement = document.createElement('input');
//                 inputElement.type = question.type;
//                 inputElement.placeholder = `Enter your answer here.`;
//             }

//             inputElement.id = question.id;
//             inputElement.name = question.id; 
//             inputElement.className = 'w-full p-4 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400';
//             inputElement.required = true; 

//             div.appendChild(inputElement);
//             questionsContainer.appendChild(div);
//         });
//     }

//     applicationTypeSelect.addEventListener('change', (event) => {
//         renderQuestions(event.target.value);
//     });

//     if (applicationForm) {
//         applicationForm.addEventListener('submit', async (event) => {
//             event.preventDefault(); 

//             const selectedType = applicationTypeSelect.value;
//             if (!selectedType) {
//                 showMessage('Please select an application type.', 'error');
//                 return;
//             }

//             const answers = {};
//             const questions = availableApplicationTypes[selectedType].questions;
//             let allFieldsFilled = true;

//             questions.forEach(question => {
//                 const inputElement = document.getElementById(question.id);
//                 if (inputElement) {
//                     answers[question.id] = inputElement.value.trim();
//                     if (!answers[question.id]) {
//                         allFieldsFilled = false;
//                     }
//                 }
//             });

//             if (!allFieldsFilled) {
//                 showMessage('Please fill out all required fields.', 'error');
//                 return;
//             }

//             submitButton.disabled = true; 
//             submitButton.textContent = 'Submitting...';

//             try {
//                 const response = await fetch('/api/apply', {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                     },
//                     body: JSON.stringify({
//                         applicationType: selectedType,
//                         answers: answers,
//                     }),
//                 });

//                 const result = await response.json();

//                 if (result.success) {
//                     showMessage('Application submitted successfully! We will review it soon.', 'success');
//                     applicationForm.reset(); 
//                     questionsContainer.innerHTML = ''; 
//                     applicationTypeSelect.value = ''; 
//                 } else {
//                     showMessage(`Application submission failed: ${result.message || 'Unknown error.'}`, 'error');
//                 }
//             } catch (error) {
//                 console.error('Error submitting application:', error);
//                 showMessage('An error occurred while submitting your application. Please try again.', 'error');
//             } finally {
//                 submitButton.disabled = false; 
//                 submitButton.textContent = 'Submit Application';
//             }
//         });
//     }

//     logoutButton.addEventListener('click', async () => {
//         try {
//             const response = await fetch('/auth/logout');
//             if (response.ok) {
//                 window.location.href = '/'; 
//             } else {
//                 showMessage('Failed to log out. Please try again.', 'error');
//             }
//         } catch (error) {
//             console.error('Error during logout:', error);
//             showMessage('Network error during logout. Please try again.', 'error');
//         }
//     });

//     fetchSessionInfo();
//     fetchApplicationTypes();
// });


// public/script.js

document.addEventListener('DOMContentLoaded', () => {
    const userInfoDiv = document.getElementById('user-info');
    const usernameSpan = document.getElementById('username');
    const userAvatarImg = document.getElementById('user-avatar');
    const logoutButton = document.getElementById('logout-button');
    const adminPanelLink = document.getElementById('admin-panel-link');
    const applicationForm = document.getElementById('application-form');
    const applicationTypeSelect = document.getElementById('application-type');
    const questionsContainer = document.getElementById('questions-container');
    const messageBox = document.getElementById('message-box');

    // Function to display messages to the user
    function showMessage(message, type = 'info') {
        messageBox.textContent = message;
        messageBox.className = `mt-6 p-4 rounded-lg text-center ${type}`; // Apply Tailwind classes
        messageBox.style.display = 'block';

        // Automatically hide after 5 seconds for info/success, longer for errors
        const displayDuration = (type === 'error') ? 8000 : 5000;
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, displayDuration);
    }

    // Function to fetch session info and update UI
    async function fetchSession() {
        try {
            const response = await fetch('/api/session');
            if (!response.ok) {
                // If session is not found or unauthorized, redirect to login
                if (response.status === 401) {
                    window.location.href = '/auth/discord';
                } else {
                    showMessage('Failed to fetch session. Please try logging in again.', 'error');
                }
                return;
            }
            const data = await response.json();
            if (data.success && data.user) {
                usernameSpan.textContent = data.user.username;
                if (data.user.avatar) {
                    userAvatarImg.src = data.user.avatar;
                    userAvatarImg.style.display = 'block';
                } else {
                    userAvatarImg.style.display = 'none';
                }
                userInfoDiv.style.display = 'flex'; // Show user info

                // Show admin panel link if user is admin
                if (data.user.isAdmin) {
                    adminPanelLink.style.display = 'block';
                } else {
                    adminPanelLink.style.display = 'none';
                }
            } else {
                // If session is technically successful but no user data, redirect
                window.location.href = '/auth/discord';
            }
        } catch (error) {
            console.error('Error fetching session:', error);
            showMessage('Network error. Please try again.', 'error');
            // Redirect if critical session info cannot be fetched
            setTimeout(() => { window.location.href = '/auth/discord'; }, 3000);
        }
    }

    // Function to fetch application types and populate the select dropdown
    async function fetchApplicationTypes() {
        try {
            const response = await fetch('/api/application-types');
            if (!response.ok) {
                throw new Error('Failed to fetch application types.');
            }
            const types = await response.json();
            for (const key in types) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = types[key].name;
                applicationTypeSelect.appendChild(option);
            }
        } catch (error) {
            console.error('Error fetching application types:', error);
            showMessage('Failed to load application types. Please try again.', 'error');
        }
    }

    // Function to dynamically generate questions based on selected application type
    function generateQuestions(selectedType) {
        questionsContainer.innerHTML = ''; // Clear previous questions
        if (!selectedType) return;

        fetch('/api/application-types')
            .then(response => response.json())
            .then(types => {
                const typeData = types[selectedType];
                if (typeData && typeData.questions) {
                    typeData.questions.forEach(q => {
                        const div = document.createElement('div');
                        div.className = 'mb-4'; // Tailwind margin-bottom
                        const label = document.createElement('label');
                        label.htmlFor = q.id;
                        label.className = 'block text-lg font-medium text-gray-300 mb-2';
                        label.textContent = q.label;
                        div.appendChild(label);

                        let inputElement;
                        if (q.type === 'textarea') {
                            inputElement = document.createElement('textarea');
                            inputElement.rows = 4;
                            inputElement.className = 'w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white';
                        } else {
                            inputElement = document.createElement('input');
                            inputElement.type = q.type;
                            inputElement.className = 'w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white';
                        }
                        inputElement.id = q.id;
                        inputElement.name = q.id;
                        inputElement.required = true; // Make all questions required for now
                        div.appendChild(inputElement);
                        questionsContainer.appendChild(div);
                    });
                }
            })
            .catch(error => {
                console.error('Error generating questions:', error);
                showMessage('Could not load questions for this application type.', 'error');
            });
    }

    // Event listener for application type selection change
    applicationTypeSelect.addEventListener('change', (event) => {
        generateQuestions(event.target.value);
    });

    // Event listener for form submission
    applicationForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        const submitButton = applicationForm.querySelector('.submit-button');
        submitButton.disabled = true;
        showMessage('Submitting application...', 'info');

        const applicationType = applicationTypeSelect.value;
        const answers = {};
        // Collect answers from dynamically generated inputs
        const questionInputs = questionsContainer.querySelectorAll('input, textarea');
        questionInputs.forEach(input => {
            answers[input.id] = input.value;
        });

        if (!applicationType) {
            showMessage('Please select an application type.', 'error');
            submitButton.disabled = false;
            return;
        }

        // Basic validation for answers (ensure no empty required fields)
        for (const key in answers) {
            if (answers[key].trim() === '') {
                showMessage(`Please fill out the "${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}" field.`, 'error');
                submitButton.disabled = false;
                return;
            }
        }

        try {
            const response = await fetch('/api/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ applicationType, answers }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showMessage('Application submitted successfully! You can view its status on "My Applications" page.', 'success');
                applicationForm.reset(); // Clear the form
                questionsContainer.innerHTML = ''; // Clear dynamic questions
            } else if (response.status === 409) { // Conflict: User already has a pending application
                showMessage(result.message || 'You already have a pending application.', 'error');
            } else if (response.status === 403) { // Forbidden: User is blacklisted
                showMessage(result.message || 'You are blacklisted from submitting applications.', 'error');
            } else {
                showMessage(`Failed to submit application: ${result.message || 'Unknown error.'}`, 'error');
            }
        } catch (error) {
            console.error('Error submitting application:', error);
            showMessage('Network error. Failed to submit application. Please try again.', 'error');
        } finally {
            submitButton.disabled = false;
        }
    });

    // Handle logout
    logoutButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/auth/logout');
            if (response.ok) {
                window.location.href = '/';
            } else {
                showMessage('Failed to log out. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            showMessage('Network error during logout. Please try again.', 'error');
        }
    });

    // Initial calls on page load
    fetchSession();
    fetchApplicationTypes();
});
