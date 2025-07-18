document.addEventListener('DOMContentLoaded', () => {
    const userInfoDiv = document.getElementById('user-info');
    const usernameSpan = document.getElementById('username');
    const userAvatarImg = document.getElementById('user-avatar');
    const logoutButton = document.getElementById('logout-button');
    const adminPanelLink = document.getElementById('admin-panel-link');
    const adminPanelButton = document.getElementById('admin-panel-button'); 
    const applicationForm = document.getElementById('application-form');
    const applicationTypeSelect = document.getElementById('application-type');
    const questionsContainer = document.getElementById('questions-container');
    const messageBox = document.getElementById('message-box');

    function showMessage(message, type = 'info') {
        messageBox.textContent = message;
        messageBox.className = `mt-6 p-4 rounded-lg text-center ${type}`; 
        messageBox.style.display = 'block';

        const displayDuration = (type === 'error') ? 8000 : 5000;
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, displayDuration);
    }

    async function fetchSession() {
        try {
            const response = await fetch('/api/session');
            if (!response.ok) {
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
                userInfoDiv.style.display = 'flex'; 

                if (data.user.isAdmin || data.user.isModerator) {
                    adminPanelLink.style.display = 'block';
                    if (data.user.isModerator && !data.user.isAdmin) { 
                        adminPanelButton.textContent = 'Moderator Panel';
                    } else { 
                        adminPanelButton.textContent = 'Admin Panel';
                    }
                } else {
                    adminPanelLink.style.display = 'none';
                }
            } else {
                window.location.href = '/auth/discord';
            }
        } catch (error) {
            console.error('Error fetching session:', error);
            showMessage('Network error. Please try again.', 'error');
            setTimeout(() => { window.location.href = '/auth/discord'; }, 3000);
        }
    }

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

    function generateQuestions(selectedType) {
        questionsContainer.innerHTML = ''; 
        if (!selectedType) return;

        fetch('/api/application-types')
            .then(response => response.json())
            .then(types => {
                const typeData = types[selectedType];
                if (typeData && typeData.questions) {
                    typeData.questions.forEach(q => {
                        const div = document.createElement('div');
                        div.className = 'mb-4'; 
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
                        inputElement.required = true; 
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

    applicationTypeSelect.addEventListener('change', (event) => {
        generateQuestions(event.target.value);
    });

    applicationForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 

        const submitButton = applicationForm.querySelector('.submit-button');
        submitButton.disabled = true;
        showMessage('Submitting application...', 'info');

        const applicationType = applicationTypeSelect.value;
        const answers = {};
        const questionInputs = questionsContainer.querySelectorAll('input, textarea');
        questionInputs.forEach(input => {
            answers[input.id] = input.value;
        });

        if (!applicationType) {
            showMessage('Please select an application type.', 'error');
            submitButton.disabled = false;
            return;
        }

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
                applicationForm.reset();
                questionsContainer.innerHTML = ''; 
            } else if (response.status === 409) { 
                showMessage(result.message || 'You already have a pending application.', 'error');
            } else if (response.status === 403) {
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

    fetchSession();
    fetchApplicationTypes();
});
